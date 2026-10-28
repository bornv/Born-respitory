# Werkwijze: PBIP maken, wijzigen en opleveren

## Project
`Slijpkisten_Service.pbip` + `Slijpkisten_Service.SemanticModel/definition` (TMDL: `model.tmdl`, `expressions.tmdl`, `relationships.tmdl`, `tables/*.tmdl`) + `Slijpkisten_Service.Report/definition` (PBIR: `pages/<pagina>/visuals/<id>/visual.json`, `pages.json`), `LEESMIJ.txt` (wijzigingen per versie), `Slijpkisten_afspraken.xlsx` (sjabloon), `Dataflow_Slijpkisten_staging.txt`.

Modelinstellingen: `maxParallelismPerRefresh: 1` (Penta-belasting), compatibiliteit 1606, cultuur nl-NL, `maxParallelismPerRefresh`, `dataAccessOptions` met `fastCombine`, `__PBI_TimeIntelligenceEnabled = 0`. Bestanden UTF-8; regeleinden consequent houden (CRLF zoals de geleverde versie).

## Wijzigen
1. Ga uit van de **laatste geleverde versie**. Krijg je een versie van elders (bv. met transportwerk), vergelijk dan eerst met de lijst vaste afspraken in SKILL.md: een versie op een oude basis mist correcties (revisie, WaardeSlijpservice, OmzetKlant, Status = Actief). Samenvoegen = nieuwste basis nemen en de ontbrekende onderdelen gericht terugzetten.
2. Wijzig met kleine, controleerbare tekstvervangingen (script met `assert count == 1`), niet met handmatig plakken in grote bestanden.
3. Nieuwe meting/kolom: eigen `lineageTag` (GUID), `formatString`, `displayFolder`, `///`-beschrijving.
4. Nieuwe query: ook in `annotation PBI_QueryOrder` en `ref table` in `model.tmdl`.
5. M-partitie → berekende tabel: `partition X = calculated`, kolommen `sourceColumn: [Naam]`; gebruiker moet in een lege map uitpakken.
6. **Query's schoon opbouwen vanaf de bron, nooit achteraf repareren.** Geen stappen als `Opgeschoond = Table.RemoveColumns(...)`, geen `MissingField.Ignore`/`Table.HasColumns`-vangnetten en geen kolommen aanmaken die later weer weg moeten. Concreet:
   - SQL selecteert alleen de velden die gebruikt worden (filtervelden alleen in `WHERE`);
   - naam en type direct bij het inlezen (`Table.TransformRows` naar records met een `type table [...]`, of `Table.SelectColumns` + `TransformColumns` als eerste stap bij Excel);
   - tussenresultaten alleen als een latere stap ze nodig heeft;
   - de query eindigt met één `Table.SelectColumns` met exact de kolommen uit de TMDL.
   Moet een query anders, herschrijf hem dan als geheel in plaats van er een stap achteraan te plakken.
   **Geen functies (fx) in Transform data**: geen hulpfuncties zoals NaarDatum/KPTM_Lees/Opzoek. Penta-datum in de query zelf: `if d = null or d = 0 then null else #date(Number.IntegerDivide(d, 10000), Number.Mod(Number.IntegerDivide(d, 100), 100), Number.Mod(d, 100))`; datumfilter blijft als getal in de SQL. Lidmaatschap (staat deze orderregel in de kistregels?) via `Table.NestedJoin`, niet via opzoekfuncties.
   Let op bij hernoemen tijdens het inlezen: links staat de nieuwe naam (`Datum = ...`), maar `r[...]` blijft de Oracle-naam (`r[DATUM]`). Controleer na elke herschrijving dat elk `r[VELD]` in de SELECT staat (fout in v23: "The field 'Datum' of the record wasn't found").

## Valideren (lokaal, vóór opleveren)
| Controle | Hoe |
|---|---|
| TMDL laadt | .NET `TmdlSerializer` (Microsoft.AnalysisServices.Tabular) |
| DAX-verwijzingen | Alle `Tabel[Kolom]` en `[Meting]` bestaan (virtuele kolommen als `[@Netto]`, `[Value]` zijn schijnmeldingen) |
| Rapport | JSON-schema's PBIR + elke `Entity/Property` in visuals bestaat in het model (`''` in TMDL-namen = apostrof) |
| M | Grove controle op haakjes en let/in (één-regel-`let … in` en geneste lets geven schijnmeldingen); geen blobs; geen `KistOrdersSQL`-subquery's |
| Afhankelijkheden | Tel per tabel hoe vaak Oracle-bronnen in de keten zitten (zonder cache) — doel: zo laag mogelijk |
| Grootte | Model hoort enkele honderden kB te zijn, niet MB's |
| Ongebruikt | Metingen/kolommen zonder gebruik in visuals, DAX, relaties, sortering of andere query's opsporen en verwijderen (kolommen via eindstap `Table.RemoveColumns`) |

Niet lokaal te testen: Oracle-SQL, refresh, DAX-uitvoering, service. Dat altijd zo melden.

## Opleveren
- Zip met projectmap + Excel + LEESMIJ + dataflowscript; versienummer ophogen en wijzigingen bovenaan of onderaan LEESMIJ ("WIJZIGINGEN (versie N)").
- Instructie: uitpakken naar een **lege** map, `.pbip` openen (Preview-functies PBIP/TMDL aan), eerst in Desktop vernieuwen, native queries goedkeuren (Uitvoeren), dan publiceren.
- Geen klantdata of .pbix in Git; deze skill bevat alleen regels en structuur.

## Versiehistorie (kort)
| Versie | Kern |
|---|---|
| t/m 8 | Redesign, serienummers PAJL, GOB/GVR, robots, marge-fixes, dynamische kalender, Excel op SharePoint, auto-contracten, finance-review |
| 9 (extern) | Transport/PKLK/PKLP, native SQL — op oude basis |
| 10 | Financecorrecties teruggezet (revisie, WaardeSlijpservice, OmzetKlant, Actief) |
| 11 | 6 MB momentopname eruit (maxJsonLength); KPTM gesplitst |
| 12 | ORA-01861: datumfilter Journaal_Kist naar M |
| 13–14 | Geen db-link-subquery's (SqlIn); buffers transport; parallelisme 4 |
| 15 | Opzoek/Bevat, geen SELECT *, dataflow-schakelaar + script |
| 16 | Facturen en Kistorders[Afspraak] in DAX; CommandTimeout 30 min; alleen ontbrekende hoofdbonnen |
| 17 | Datatypes TransportZendingen (Compleet/Gemengd als tekst gaf DAX-fout); titels transportpagina's |
| 18 | Transportquery's los van query LCV (PentaViews/PentaKolommen/PentaViewBestaat) |
| 19 | maxParallelismPerRefresh 1 (serverbelasting) |
| 20 | LCV-werkwijze: F/D-tabelnamen, Calculations, Last refresh date + kaart, timeout 3 uur, datumfilter PAJL als getal |
| 22 | Broncontroles verwijderd (PentaViews/PKLPBron/TransportGegevensbron, controletabellen en -pagina's); kolommen PKLK/PKLP vast in SQL; alleen 8 dataquery's, geen metadataquery's |
| 21 | Eén query per Penta-bron (8 dataquery's), afgeleide tabellen in DAX, dataflow-schakelaar en query LCV vervallen; opgeschoond (22 metingen, 46 kolommen) |
| 23 | Alle query's schoon herschreven: geen Opgeschoond/RemoveColumns/MissingField-stappen, SQL alleen benodigde velden, Excel-tabellen met vaste kolomlijst; BundelbronBeschikbaar en "Bonnen zonder bundelbron" vervallen |
| 24 | F Afkeur: r[DATUM]/r[MENGE]/r[ARTIKEL_NR] hersteld; tblContracten in de afsprakenlijst t/m kolom H |
| 25 | Alle 5 functies (fx) verwijderd en in de query's zelf opgenomen; StartPeriode 202410 (2 jaar, vast); KistKosten-lidmaatschap via joins; Betaaltermijnen herschreven |
| 26 | Pagina Controle kisten: kistregels zonder serienummer + D Kisthistorie (alle kistserienummers, alle jaren, in Oracle per serienummer samengevat; status In rapport / Beweging zonder kistregel / Niet langs sinds StartPeriode); 9 Oracle-query's |
| 27 | Opnieuw opgebouwd met standaardstappen (navigatie → Kolommen kiezen → filters → stap Kistorders → join → typen → eindselectie), geen eigen SQL; namen viewnaam + omschrijving; periode vast 202401 (journaal 20230701); Journaal 1 rij per kistregel; PKLK = kistbonnen + bonnen vanaf 20231201; Kisthistorie via Group By |
| 28 | Parameter OracleServer vervallen; server "lcvpentabi.marel.net" direct in de bronstap (zoals Borns handgemaakte BI) |
| 29 | MesRobotLijst met bronvermelding (Grinding service calculation – Operational costs: messen + transportbakken; afkeuranalyse LCV_PAJL WAM + LCV_PART) |
| 30 | Elke tabel een `///`-omschrijving met bron (Oracle-view, Excel-tabel, DAX op welke tabellen, of vaste lijst + herkomst) |
| 31 | Geen parameters meer: SharePoint-site en bestandsnaam direct in AfsprakenWerkboek (zoals Borns handgemaakte BI) |
| 32 | AfsprakenWerkboek via `Web.Contents` op het directe bestandsadres (…/Shared%20Documents/General/Slijpkisten_afspraken.xlsx) i.p.v. `SharePoint.Files` (doorzocht de hele site per Excel-tabel: tergend traag) |
| 33 | LCV_PKLK Afleverbonnen: dubbele stapnaam `Bron` (Oracle-bron én Table.Combine) → "Duplicate initializer"; combine-stap heet nu "Alle bonnen" |
| 34 | LCV_PKLK.VERSAND_TERMIN is **tekst** ("20231201", "00000000" = leeg): filter als tekst; datumomzetting overal via `Text.From` (werkt voor tekst én getal) |
| 35 | LCV_PKLP: geen Distinct tussen de joins (beter te folden); fout 0x80040E4E = geannuleerd (timeout of andere tabel faalde) |
| 36 | LCV_PAJL.DATUM is ook **tekst**: filters `>= "20230701"` / `>= "19000101"` |
| 37 | LCV_KPTM Omzet: `Text.StartsWith([KOSTENART], "951000")` i.p.v. `Text.Trim(...) =`; kistorder via uitgeklapte left join i.p.v. `Table.IsEmpty([nested])` |
| 38 | Filter "ordernummer gevuld" = `Text.StartsWith([KD_VORGANGS_NR], "0")` (LIKE '0%'); Kisthistorie: klant alleen van orders met kistbeweging, vanaf 2018 (las eerst >1 mln rijen) |
| 39 | Kisthistorie: LCV_PAJL direct gefilterd met `List.Contains(Kistartikelen, [ARTIKEL_NR])` (Kisttypenlijst + .990/.000 → IN-lijst in Oracle), geen KPTM-join voor artikelen (idee Born) |
| 40 | Journaal gefilterd op kistartikelen; kistartikellijst = Kisttypenlijst ∪ kisttypen uit LCV_KPTM (+ .990/.000) |
| 41 | Kisthistorie: "laatste per kist" in Oracle via `Table.Group` (List.Max datum) + join terug op (serienummer, datum); alleen laatste bewegingen komen binnen |
| 42 | Afkeur: Group By (som MENGE per kistregel/artikel/datum) in Oracle vóór de joins met STATPRIJS en PART |
| 43 | Stap `Kistordernummers` (lijst) + `List.Contains(Kistordernummers, [KD_VORGANGS_NR])` in de filterstap van PAJL/PEKP/PKLK/PKLP (idee Born): IN-lijst in Oracle als vangnet naast de joins |
| 44 | KPTM-query's ook met vaste lijsten: Kistkosten → Kistordernummers, Omzet en Slijpservice → Kistklantnummers; joins daar vervallen |
| 45 | Journaal: Group By in Oracle (min/max datum, aantal per kistregel/artikel/code/serienummer) vóór de lokale stappen; serienummer = meeste regels |
| 46 | Kisthistorie: kistartikellijst alleen uit Kisttypenlijst (bronloos) — een lijst die (deels) uit Oracle komt, ging vermoedelijk niet als IN naar Oracle (2+ mln rijen); kaart "Kisttypes niet in Kisttypenlijst" op Controle kisten |
| 47 | Kisthistorie als enige query met eigen SQL (filter + KEEP DENSE_RANK LAST + klant uit KPTM in één query): met standaardstappen bleef het 2+ mln rijen (v38-46) |
| 48 | Geen andere query (Kisttypenlijst) meer in een Oracle-filter: tweede bron → Power BI stuurt het filter niet naar Oracle (ⓘ bij de stappen, gezien door Born). Kisttypen uit LCV_KPTM (subquery / lijst uit dezelfde bron) |
| 49 | MesRobotLijst in LCV_PAJL Afkeur zelf gezet (record mes → robot); geen Oracle-query verwijst nog naar een andere query |
| 50 | Betaaltermijnen: geneste tabel met type (datums bleven anders tekst na uitklappen); NC-metingen: kolom met tabelnaam omdat een meting dezelfde naam heeft |
| 51 | Servicecontracten alleen uit tblContracten (wens Born: geen oude/automatische contractorders); Slijpservice-metingen met TREATAS op tblContracten[ContractId]; signaal nieuwe contracten = boekingen vanaf 202401 niet in Excel |
| 52 | Metingen op Kistregels krijgen `'LCV_KPTM Kistkosten'` of TREATAS naar Kistregels[OrderRegel] als filter (filter op Kistkosten bereikt Kistregels niet: Unieke kisten = 267 bij elke klant); "Verwacht per jaar" → "Afspraak per jaar" |
| 53 | Periodes t/m december van het huidige jaar (wens Born; was t/m einde langste afspraak = 2029) |
| 54 | Filtercontrole over alle visuals; Servicecontracten krijgt KUNDEN_NR (uit Slijpservice), relatie Servicecontracten → Klanten (i.p.v. Slijpservice → Klanten) zodat de klantslicer de contractlijst filtert |
| 55 | Kalender weer t/m einde afspraken; kolom Periodes[TotHuidigJaar] als visualfilter op de jaar/maandslicers (niet op Betalingen); slicers multi-select (selection.singleSelect = false); labels "verwacht" → "volgens afspraak" |
| 56 | Pagina "Contract van start tot eind": contractslicer (enkele keuze, Servicecontracten[Contract]); metingen map "Contract van start tot eind" (looptijd, t/m nu, verwacht einde = kostentempo × looptijd, marge volgens plan) |
| 57 | Info-tooltip (visualHeaderTooltip + visualHeader.showTooltipButton) bij elke visual, opgebouwd uit de ///-omschrijvingen (berekening + "Waarom"); contractpagina: afkeur, kosten = Kosten contract, plan-marge uit PLW |
| 58 | Boekhoudkundige controle per meting: Nog te ontvangen vs "Gefactureerd op afspraken" (zelfde scope), vooruit gefactureerd (klant en contract), termijnfacturen FIFO t/m vandaag, contractfacturering tegen hele contractwaarde, kistverkoop in contractomzet, prognose op afgesloten maanden en maandtelling dagen/30,4375, Kostengroep "Omzet" op contractorders (geen kostenvermindering), kisten: betaald deel direct / rest afschrijven, Transportbudget op Transportrondes, NC meerprijs met commissie |
| 59 | Kisten afschrijven over 36 maanden (tabel Kistafschrijving, ook kistomzet verdeeld) in Kosten contract; pagina Controle kosten (negatieve Overige kosten per order/kostensoort, kolom Kostensoort); Maandnaam "(niet afgesloten)"/"(toekomst)" + melding open maand per pagina; contractpagina alleen slijpmarge |

## Opbouw sinds versie 27 (zoals Born het zelf bouwt)
1. `Oracle.Database("lcvpentabi.marel.net", [HierarchicalNavigation = true, CommandTimeout = 3 uur])` → `LCV_DATA` → view.
2. `Removed Other Columns` (Kolommen kiezen) als eerste stap; daarna filters (Penta-datums in het type van de view: LCV_PAJL.DATUM is tekst `>= "20230701"`, LCV_PKLK.VERSAND_TERMIN is tekst `>= "20231201"`; `Text.StartsWith([KD_VORGANGS_NR], "0")` voor "ordernummer gevuld" (Penta-ordernummers zijn 10 tekens en beginnen met 0); geen `Text.Length(Text.Trim())` en geen `<> ""`).
3. Stap `Kistorders` uit dezelfde bron (LCV_KPTM, KIST .990/.000, ISW, vanaf 202401) en `Table.NestedJoin(..., JoinKind.Inner)`; join-kolom en filterkolommen daarna weg.
4. Pas daarna typen (`Table.TransformColumns`), berekende kolommen en één eindselectie/hernoeming.
5. Geen eigen SQL, behalve LCV_PAJL Kisthistorie (zie v47: filter + laatste per kist + opzoeking in een tweede view foldt niet betrouwbaar). Voor de rest: haal iets ruimer op met een gewoon filter (PKLK vanaf 20231201) of laat de server joinen en groepeer in Power Query.
6. Na elke wijziging: View Native Query op de stap na de join. Grijs = folding gebroken = te veel data.
7. **Elke tabel en expressie** een `///`-omschrijving met de bron (Oracle-view, Excel-tabel, DAX op welke tabellen); vaste lijsten (#table) ook waar de waarden vandaan komen, en per groep een `//`-regel.
8. Excel op SharePoint: altijd `Web.Contents("<direct bestandsadres>")` + `Excel.Workbook`, nooit `SharePoint.Files` (die somt alle bestanden van de site op, per query). Deellink omzetten: `/:x:/r/` en alles na `?` weghalen.
9. Controleer vóór opleveren elke query op **dubbele stapnamen** (fout "Duplicate initializer named …"): de vaste navigatiestappen heten `Bron` en `LCV_DATA`, gebruik die namen nergens anders.
10. Folding-vriendelijk: geen `Text.Trim`/`Text.Length` in filters; hulptabellen (zoals klant per order) altijd eerst inperken met een join op de rijen die je nodig hebt; geen `Text.Trim(...) = ` in filters (gebruik `Text.StartsWith`), geen `Table.IsEmpty([geneste kolom])` (klap de join-kolom uit en test op `null`).
11. "Niets missen" (Born): niet filteren op `WERT_MENGE <> 0` (kistregels met alleen nulboekingen vallen dan weg uit Kistregels), niet op `MENGE <> 0` (Afkeur), niet op periode bij Slijpservice (PLW kan vóór de contractstart geboekt zijn). Een filter heet pas "veilig" als je hebt nagegaan dat geen meting, telling of lijst verandert.
12. "Laatste per X" nooit door alle detailregels binnen te halen: eerst `Table.Group` met `List.Max` (wordt GROUP BY in Oracle), dan inner join terug op sleutel + datum.
13. Filter op kistorders altijd ook als vaste lijst: `Kistordernummers = List.Buffer(List.Distinct(KPTMKistregels[KD_VORGANGS_NR]))` en `List.Contains(...)` in de eerste filterstap → `IN (...)` in Oracle. Let op: Oracle staat max. 1000 waarden per IN-lijst toe (nu ±90 kistorders).
14. **Nooit een andere query (ook geen bronloze #table zoals Kisttypenlijst) gebruiken in een filter van een Oracle-query.** Power BI scheidt dan de bronnen en voert alles erna zelf uit (ⓘ-icoon bij de stappen). Lijsten voor filters komen uit dezelfde Oracle-bron (bijv. Kistordernummers uit LCV_KPTM). Meerdere views uit LCV_DATA in één query is wél één bron.
15. Werkt een query na twee pogingen nog niet in Oracle: eerst View Native Query per stap laten opsturen (eerste grijze stap = oorzaak), niet blijven gokken.
16. Een kolom die via `Table.AddColumn(..., each <tabel>)` + `ExpandTableColumn` ontstaat, krijgt geen type mee: geef `Table.AddColumn` een `type table [...]` mee, anders zet Desktop de kolom bij de refresh om naar tekst ("Schema synchronized").
17. Verwijs in DAX altijd met tabelnaam naar een kolom (`'NC Varkens'[Varkens per week]`): bestaat er een meting met dezelfde naam, dan pakt `[naam]` de meting.
18. Telt een meting in een dimensie (Kistregels) terwijl de filters op de feitentabel (Kistkosten) staan: geef de feitentabel als filter mee (`CALCULATE(..., 'LCV_KPTM Kistkosten')`) of `TREATAS` naar de sleutel van de dimensie. Controleer per klant of het getal verschilt.
19. **Filtercontrole vóór opleveren:** per visual nagaan of de rij-/kolomvelden en de slicers op de pagina via de relaties (één → veel) de tabellen bereiken waarin elke meting telt. Melding = fout, tenzij bewust (REMOVEFILTERS, afspraak per jaar, tarieven). Expanded-table-filters (`CALCULATE(..., 'Feitentabel')`) en TREATAS tellen als bereikt.
20. Elke meting een `///`-omschrijving: wat (berekening) + "Waarom: …". De info-knop van elke visual wordt hieruit gegenereerd (script b57t): na elke wijziging opnieuw draaien.
21. Omzet en kosten in één marge moeten bij hetzelfde contractonderdeel horen (slijpservicedeel ↔ kosten kistorders zonder extra messen); plan met plan, werkelijk met werkelijk.
22. Facturering vergelijken met de scope die gefactureerd wordt (hele contractwaarde, termijnen), marge met de scope van de dienst (slijpdeel). Altijd beide kanten tonen: nog niet gefactureerd én vooruit gefactureerd.
23. Kosten en omzet uit SAP scheiden op kostensoort/kostengroep, nooit op het teken (creditboekingen op kosten en omzet op dezelfde order lopen anders door elkaar).
24. Prognoses en jaartempo alleen op afgesloten maanden; maandtelling gelijk aan de omzetplanning.
25. `ref table` in model.tmdl moet exact zo geschreven zijn als de tabelnaam in de tabel (zonder aanhalingstekens als de naam die niet heeft), anders TomInternalException bij het openen.
26. Een filter op een kolom van LCV_KPTM Kistkosten werkt niet door naar Kistafschrijving: bij contractfilters ook `Kistafschrijving[AankoopPeriode] >= p0` zetten; afschrijving niet in [Kosten] stoppen (die wordt met categoriefilters aangeroepen) maar in [Kosten contract].
