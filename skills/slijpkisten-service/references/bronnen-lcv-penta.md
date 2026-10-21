# Bronnen: Oracle LCV_DATA (Penta) en SharePoint

## Verbinding

| Onderdeel | Waarde / gedrag |
|---|---|
| Server (parameter `OracleServer`) | `lcvpentabi.marel.net` — waarschijnlijk een **TNS-alias**: het echte host/poort/servicenaam staat in `tnsnames.ora` op de gatewayserver. Lokaal ORA-12154 = alias onbekend op de pc. |
| Schema | `LCV_DATA` (views) |
| Databaselink | Foutmeldingen tonen `ORA-02063: preceding line from PENTA8`: de views halen (een deel van) hun data via databaselink **PENTA8** uit het ERP Penta. Controle: `SELECT DB_LINK, HOST FROM ALL_DB_LINKS WHERE DB_LINK LIKE 'PENTA8%'` en `SELECT TEXT FROM ALL_VIEWS WHERE OWNER='LCV_DATA' AND VIEW_NAME='LCV_KPTM'`. |
| Gateway | On-premises gateway; de verbinding is gekoppeld aan exact de servernaam `lcvpentabi.marel.net` (andere spelling = nieuwe bron zonder gateway). Verificatie Basic (Oracle-account, alleen SELECT nodig). |
| Rechten (gateway-account) | SELECT op LCV_KPTM, LCV_PAJL, LCV_PEKP, LCV_STATPRIJS, LCV_PART, LCV_PKLK, LCV_PKLP (+ metadata van LCV_DATA). |

## Views en kolommen die het model gebruikt

### LCV_KPTM — kosten/omzet per klantorderregel (controlling)
Kolommen: `PERIODE` (jjjjmm, vergelijkbaar als tekst), `WERTART` (`ISW` = werkelijk, `PLW` = plan), `KOSTENART`, `WERT_MENGE` (bedrag), `ZUORDNUNGSGRUPPE_4` (`Spares` = onderdelenorder), `KD_VORGANGS_NR` (klantorder, 10 posities met voorloopnullen), `POSITIONS_NR`, `ARTIKEL_NR`, `ARTIKEL_OMSCHRIJVING` (`KIST` voor kistregels), `KUNDEN_NR`, `KUNDEN_NAME`.

| Kostensoort | Categorie in het model |
|---|---|
| `951000` | Omzet (positief); bij revisie-artikel: "Revisie (omzet, niet in slijpmarge)" |
| `437100` | Slijpen B.M. (Maschinenmesser) |
| `2310100` | Artikel `.990` → Vervangmessen (afkeur); `.000` + omschrijving KIST → Nieuwe kist; anders Overig materiaal |
| `437450` | Verzendkosten (M46U) |
| `1009…` | Eigen uren |
| `437700` | Commissie IKP |
| overig | Overige kosten (negatieve bedragen niet in Kosten) |

Kistregels: `ARTIKEL_OMSCHRIJVING = 'KIST'` en artikel eindigt op `.990` (slijpronde) of `.000` (nieuwe kist). Orders met `ZUORDNUNGSGRUPPE_4 = 'Spares'` tellen alleen mee op hun kistregels.

Contractorders: `KD_VORGANGS_NR LIKE '00____0000'`; ContractId = teken 3–6 (bv. `00XX990000` → `XX99`). Posities 1000–8999, PLW en ISW. Kostengroep: kostensoort `23…` = Materiaal (over de looptijd verdelen), `1009…` = Eigen uren, rest Overig, revisie-artikel = "Revisie (niet in slijpmarge)".

### LCV_PAJL — artikeljournaal
`ARTIKEL_NR`, `DATUM` (**geen Oracle DATE**: `DATUM >= DATE '…'` gaf ORA-01861; omzetten in M, formaat nog vaststellen), `KD_VORGANGS_NR`, `POSITIONS_NR`, `MENGE`, `FUNKTIONS_KZ`, `BESTELL_NR`, `CHARGEN_SERIEN_NR` (serienummer; "S/N" eraf halen).

| FUNKTIONS_KZ | Betekenis |
|---|---|
| `WE` / `GOB` | Goederenontvangst (kist binnen) |
| `WA` / `GVR` | Goederenverzending (kist retour naar klant) |
| `WAM` | Materiaaluitgifte op de order (vervangmessen → afkeur) |

### LCV_PEKP — inkooporderregels
`VORGANGS_NR`, `VORGANGS_POS_NR`, `KD_VORGANGS_NR`, `POSITIONS_NR`, `LIEFERANTEN_NAME` (filter `MASCHINENMESSER` = B.M.), `BESTELLPREIS`, `MENGE_SOLL`, `MENGE_LAGER_IST`, `BESTELLPOSITIONS_STATUS`, `AUSSTELLUNGS_DATUM`, `ARTIKEL_NR`.

### LCV_STATPRIJS / LCV_PART
`ARTIKEL`, `ACTUEEL` (actuele kostprijs) / `ARTIKEL_NR`, `BEZEICHNUNG_1`, `BEZEICHNUNG_2`.

### LCV_PKLK — afleverbonkop (Shipping)
`LIEFERSCHEIN_NR`, `BEZ_VORGANGS_NR` (klantorder, soms zonder voorloopnullen), `VERSAND_TERMIN` (kan tekst `jjjjmmdd` of `00000000` zijn), `FRACHT_BETRAG`, `FRACHT_SOLL`, `SPEDITION`, `GESAMTGEWICHT_BRUTTO/NETTO`, `ANLIEFER_ADRESS_NR`, `LAENDER_GRUPPE`, `STAAT`, …, `FELD_3_X35` ("Send with pklk", bv. `Verz. met Afl.bon 267158`), `FELD_5_N8` (Main Slip id, heeft voorrang als > 0).

### LCV_PKLP — afleverbonregels (parameter `PKLPView`)
`LIEFERSCHEIN_NR`, `BEZ_VORGANGS_NR`, `BEZ_POSITIONS_NR` (bevestigd in Penta-schermen), artikelveld via parameter `PKLPArtikelveld` (standaard `ARTIKEL_NR`, nog bevestigen). Voorbeeld ter controle: bon 251609 heeft regels 960, 965, 970, 975, 980 = vijf kisten.

## Kan X uit een andere bron?

| Behoefte | KPTM nodig? | Alternatief |
|---|---|---|
| Omzet / facturen | Nee | Uitgaande factuurkop + -regel (factuurnummer, -datum, credits; vindt ook contractfacturen op andere orders). Let op: aansluiting met finance (KPTM boekt per controllingperiode) opnieuw controleren. |
| Kistorderlijst (KistBasis) | Nee | Klantorderregels (KIST, .990/.000) — waarschijnlijk sneller dan `LIKE '%.990'` over KPTM |
| Slijpkosten B.M. | Ja (geboekt) | PEKP geeft PO-waarde, niet de geboekte kosten |
| Materiaal/afkeur | Ja (geboekt) | PAJL WAM × STATPRIJS (benadering) |
| Eigen uren, verzendkosten, commissie, overige kosten | **Ja** | geen |
| Plan (PLW) contractorders | **Ja** | geen |

Viewnamen van order- en factuurtabellen in LCV_DATA zijn (nog) niet bekend: vraag ze op (Navigator) en verzin ze niet.

## SharePoint
`SharePoint.Files(AfsprakenSite, [ApiVersion = 15])` met parameter `AfsprakenSite = https://jbtmarel.sharepoint.com/sites/LCV-LCVRetouren` (alleen het site-adres, geen deellink) en `AfsprakenBestand = Slijpkisten_afspraken.xlsx`. Zie [afsprakenlijst-sharepoint.md](afsprakenlijst-sharepoint.md).

## Overige bron
Tarieven per kist en robot komen uit de "Grinding service calculation" (Operational costs 2025), vast in query `Robots`.
