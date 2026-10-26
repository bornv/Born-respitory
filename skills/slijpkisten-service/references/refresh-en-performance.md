# Refresh en performance

## Foutmeldingen

| Melding | Oorzaak (in dit project) | Oplossing |
|---|---|---|
| `ORA-12154` TNS could not resolve | Lokaal: `lcvpentabi.marel.net` is een alias die de pc niet kent | Regel uit `tnsnames.ora` van de gateway kopiëren of `host:poort/servicenaam` gebruiken (alleen lokaal; in de service de naam niet wijzigen) |
| `ORA-12570` packet reader failure | Te veel/te grote gelijktijdige queries over de gateway | Minder data per query, `maxParallelismPerRefresh` omlaag (2) |
| `ORA-01861` literal does not match format string (+ ORA-02063 PENTA8) | `DATUM >= DATE '…'`; Penta-datums zijn getallen JJJJMMDD | Vergelijk als getal: `DATUM >= 20250401` |
| `ORA-01013` user requested cancel | Een query liep tegen `CommandTimeout` (30 min) aan of werd gestopt na een andere fout | Trage query vinden (tests hieronder) |
| "The operation was canceled … IDbCommand" na ±5 u / "took too long" | Time-out van de service (Premium/PPU 5 u) | Herhaalde bronuitlezingen en db-link-scans wegnemen; dataflow |
| `maxJsonLength … string exceeds` | Ingebakken momentopname (Base64/GZip-blob, MB's) in een M-query; de gateway krijgt het M-script mee | Nooit data in M inbakken; lege `#table` als terugval |
| `Token ';' expected` | M-syntaxfout, bv. stap verwijst naar niet-bestaande stapnaam of komma vóór `in` | Stapnamen en komma's controleren |
| `Invalid identifier` (M Engine) | Kolomlijst met `[…]` i.p.v. `{…}` | Accolades |
| "Changing the partition type … Calculated is not supported" | Desktop-cache (`.pbi`) kent de tabel nog als M-partitie | Zip uitpakken in een **lege** map |
| `405 Method Not Allowed` / "dynamic data source" | Zie afsprakenlijst | Vaste site-parameter |
| DAX-fout "comparing values of type Text with True/False" | Kolom uit een record-stap zonder type laadt als tekst | `Table.TransformColumnTypes` aan het eind van de query |
| `403` bij parameters wijzigen in de service | Gebruiker is Viewer/geen eigenaar | Rol Lid/Inzender/Beheerder, model overnemen, of wijzigen in Desktop en publiceren |
| Formula.Firewall | Query gebruikt data van een andere query in een bronaanroep (SqlIn-lijsten) | Privacyniveaus negeren (`fastCombine`) aan in model én dataflow |

Altijd eerst Request ID en tijd vergelijken: dezelfde melding twee keer geplakt = geen nieuwe uitkomst.

## Waarom het traag was (geleerd)
1. **Elke tabel voert zijn hele M-keten opnieuw uit.** Verwijzen naar een query of een andere geladen tabel hergebruikt geen resultaat; `Table.Buffer`/`List.Buffer` werken alleen binnen één evaluatie. KistBasis werd tientallen keren uitgevoerd.
2. **Databaselink PENTA8**: subquery's en functies op kolommen in de WHERE (`LPAD(TRIM(TO_CHAR(x))) IN (SELECT …)`, `LTRIM(…)`) kunnen niet naar Penta worden doorgestuurd → hele tabellen over de link.
3. **Per groep/rij een andere query aanspreken** (TransportZendingen zocht per zending in AfleverbonKistregels, Kistorders, PKLPBron) → keten per zending opnieuw.
4. **Ingebakken momentopname** van 6 MB in Shipping_PKLK.

## Regels voor SQL en M in dit model
- Eén lichte root-query (KistBasis); alle andere SQL met **vaste lijsten**: `SqlIn("KOLOM", lijst)` → `(KOLOM IN ('a','b',…) OR …)` per 900 waarden; lege lijst → `1 = 0`. Geen subquery's, geen functies op kolommen in de WHERE. Klantorders zowel met als zonder voorloopnullen meegeven waar het type onbekend is (PKLK).
- Alleen benodigde kolommen selecteren (geen `SELECT *`); optionele kolommen alleen opnemen als ze bestaan (`Table.ColumnNames(LCV{[Name=…]}[Data])`).
- `Oracle.Database(OracleServer, [CommandTimeout = #duration(0, 3, 0, 0), Query = Sql])` (LCV-standaard 3 uur).
- Opzoeken in lange lijsten: `Opzoek(lijst)` (record) + `Bevat(record, waarde)` i.p.v. `List.Contains`.
- Opzoektabellen vóór een `Table.Group` één keer bufferen of vooraf groeperen (record per sleutel).
- Tabellen die alleen uit andere geladen tabellen volgen → **DAX** (berekende tabel/kolom), bv. Facturen en Kistorders[Afspraak].
- Hoofdafleverbonnen: stap 1 eigen bonnen, stap 2/3 alleen ontbrekende bonnummers (max. twee niveaus; dieper = "ontbreekt").
- `maxParallelismPerRefresh` 1 zolang er geen staginglaag is (één query tegelijk naar Penta); met dataflow/staging 2–4 proberen. Bij ORA-12570 omlaag.
- Realistische telling: een gedeelde query draait één keer **per afhankelijke tabel** (KistBasis ≈ 18×, Journaal_Kist ≈ 6×, KPTM_Contract ≈ 4×). Tel paden niet dubbel.
- Query **LCV** wordt nergens gebruikt; transport gebruikt PentaViews/PentaKolommen/PentaViewBestaat, zodat een navigatieklik in LCV niets breekt.
- Datumfilters pas naar Oracle als datatype en formaat vaststaan.

## Diagnose zonder logs
- **Test A (transport uit)**: parameter `TransportGegevensbron` ≠ `Oracle` (service: model → Instellingen → Parameters; vereist schrijfrechten, anders in Desktop). Slaagt de refresh → transportketen is de oorzaak.
- **Test B (Desktop)**: Modelweergave → rechtsklik tabel → Gegevens vernieuwen: Klanten (= KistBasis), KistKosten (KPTM_Kist), KistRegels (Journaal_Kist); duur noteren.
- **Losse SQL-test** in een leeg bestand (Oracle-database → Geavanceerd → SQL-instructie): KistBasis-SQL, `COUNT(*)` zonder `LIKE '%…'`, `SELECT DATUM FROM LCV_DATA.LCV_PAJL WHERE ROWNUM <= 5`.
- Geplande vernieuwing uitzetten tijdens het testen (anders 4 × 5 uur pogingen).

## Structurele oplossingen
| Optie | Wat | Voorwaarde |
|---|---|---|
| **Dataflow "Slijpkisten staging"** (voorbereid) | KistBasis, KPTM_Kist, KPTM_Contract, Journaal_Kist, Shipping_PKLK, PKLP_Regels één keer per refresh; model met `Bronmodus = Dataflow` leest de opgeslagen tabellen; refreshhistorie toont duur per tabel | Premium/PPU-werkruimte (berekende tabellen), rechten Lid+, gateway; dataflow ±1 uur vóór het model plannen |
| Staging in Oracle | Fysieke tabel of materialized view op lcvpentabi, 's nachts gevuld | DBA/LCV-beheer |
| KistBasis uit klantorderregels | Vermijdt `LIKE '%.990'` over KPTM | Viewnaam/kolommen bekend |
| Omzet uit factuurkop/-regel | Minder KPTM-data, betere factuurinfo | Aansluiting met finance opnieuw controleren |
| Incrementeel vernieuwen | Alleen recente perioden | Pas na bijwerkstrategie: wisselende orderlijsten, correcties achteraf, bewaartermijn mag geen historie wissen; filter moet in de bron-SQL komen |

## Meten en vergelijken (na elke wijziging, zelfde bronstand)
Totale duur en duur per tabel; rijen per tabel en ontbrekende/extra sleutels; kosten, omzet en facturen per order en periode; kisten, afleverbonnen, zendingen; serienummers, onbekende koppelingen en bundelstatussen.
