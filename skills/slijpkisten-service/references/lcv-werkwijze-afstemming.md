# Afstemming op de LCV-werkwijze (skill penta-powerbi-lcv)

De vaste werkwijze van de LCV-analist (afgeleid uit 004 Procurement en 011 CLIP) staat in de skill
**penta-powerbi-lcv**. Laad die skill bij elke wijziging aan dit rapport. Vanaf versie 20 volgt Slijpkisten Service die
werkwijze, met de bewuste afwijkingen hieronder.

## Wat overeenkomt (versie 20)

| LCV-regel | In Slijpkisten Service |
|---|---|
| Bron Oracle `lcvpentabi.marel.net`, schema `LCV_DATA`, import, gateway | Ja |
| `CommandTimeout` 3 uur | Ja, op alle Oracle-query's |
| Alleen benodigde kolommen | Ja, expliciete kolomlijsten in de SQL (geen `SELECT *`) |
| Feiten `F `, dimensies `D `, hulptabellen zonder prefix | Ja (zie tabel hieronder) |
| Metingen in lege tabel `Calculations` | Ja; alleen de waardemetingen van what-if-parameters blijven bij hun parameter |
| Tabel `Last refresh date` + kaart "Refresh date" op elke pagina | Ja (rechtsboven, x 1075, y 10) |
| Sterschema, veel-op-één, enkele richting, geen veel-op-veel | Ja (gecontroleerd in relationships.tmdl) |
| Auto date/time uit | Ja (`__PBI_TimeIntelligenceEnabled = 0`) |
| Geen testqueries of dubbele pagina's | Ja |
| SharePoint op `jbtmarel.sharepoint.com` met `SharePoint.Files(..., [ApiVersion = 15])` | Ja (geen oude tenant mymarel) |
| Penta-datum = getal JJJJMMDD (0 = leeg) | Ja; filter in Oracle als getal, omzetting naar datum in Power Query |

## Bronlaag: één query per Penta-bron (vanaf versie 21)

Regel: **een query die Oracle leest, verwijst nooit naar een andere query die Oracle leest.** Combineren van bronnen gebeurt
in DAX (berekende tabellen/kolommen) of op de server (subquery/JOIN in dezelfde SQL). Zo wordt elke bron per refresh één
keer gelezen. Gedeelde SQL-stukken zijn alleen tekst (`KistOrdersSQL`, `KistKlantenSQL`, `KistRegelsSQL`, `VanafJournaal`).

| Tabel | Penta-bron | Selectie |
|---|---|---|
| F KistKosten | LCV_KPTM | ISW, PERIODE >= StartPeriode, KD in kistorders (subquery); kolom IsKistregel |
| F Slijpservice | LCV_KPTM | PLW/ISW, KD LIKE '00____0000', KUNDEN_NR in slijpklanten |
| F OmzetKlant | LCV_KPTM | 951000, slijpklanten; ORDERTYPE via CASE op de server |
| F Journaal (verborgen) | LCV_PAJL | DATUM >= JJJJMMDD, KD in kistorders; IS_KISTARTIKEL op de server; per kistregel serienummer/GOB/GVR |
| F Afkeur | LCV_PAJL + STATPRIJS + PART (één SQL met JOIN) | WAM op .990-kistregels |
| F PO_BM | LCV_PEKP | Maschinenmesser, KD in kistorders |
| D Shipping_PKLK | LCV_PKLK | WITH-query: bonnen van kistorders + 2 niveaus hoofdbonnen; bundeling/zending per bon in M |
| F AfleverbonKistregels | LCV_PKLP | bonnen van kistorders (subquery op PKLK) |

DAX-laag (uit geladen tabellen): D Kistorders, D Klanten, D KistRegels, D Kisttypen, D Servicecontracten,
D ContractKistorder, F Omzetplanning, F TransportAfleverbonnen, F TransportZendingen, F SerienummerControle, F Facturen.
Excel/lijsten (verborgen M): Contractenlijst, Contractkistorderlijst, Kisttypenlijst, Instellingen (StartPeriode voor DAX).

DAX-regels om circulaire afhankelijkheden te voorkomen: berekende tabellen lezen feitentabellen met `FILTER('F ...')`/`GROUPBY`;
dimensies met een relatie terug via `ALLNOBLANKROW(...)` of `LOOKUPVALUE`; geen `CALCULATE`/`VALUES` in berekende tabellen.

## Bewuste afwijkingen

| LCV-regel | Afwijking | Reden |
|---|---|---|
| Navigatie + query folding, geen native SQL | Native SQL per bron met subquery's/JOIN op de server | Views lopen via databaselink PENTA8; de kistorderselectie moet zeker op de server gebeuren en mag geen M-lijst uit een andere query zijn (dan wordt die query opnieuw uitgevoerd). |
| Engelse kolomnamen en labels | Nog Nederlands | Keuze van Born (open) |
| Paginanummering per rapport ("x.y Pagina") | Nog niet | Rapportnummer nog niet bepaald |
| JBT Marel-thema + logo | Eigen kleuren (#1B2A41) | Themabestand niet beschikbaar |
| `LOOKUPVALUE` vermijden | Eén keer in de berekende tabel F Facturen (Klantorder) | In een berekende tabel geen RELATED mogelijk; alternatief is een kolom in KistKosten |
| Kalender `LCV_CALENDER` | Eigen maandtabel `Periodes` (DAX) | Rapport werkt op maandniveau (jjjjmm); LCV_CALENDER kan later voor dagniveau |

## Tabelnamen (oud → nieuw, versie 20)

| Oud | Nieuw | | Oud | Nieuw |
|---|---|---|---|---|
| KistKosten | F KistKosten | | Klanten | D Klanten |
| Afkeur | F Afkeur | | Kistorders | D Kistorders |
| PO_BM | F PO_BM | | KistRegels | D KistRegels |
| Facturen | F Facturen | | Kisttypen | D Kisttypen |
| Slijpservice | F Slijpservice | | Robots | D Robots |
| Omzetplanning | F Omzetplanning | | Servicecontracten | D Servicecontracten |
| Betaaltermijnen | F Betaaltermijnen | | Betaalafspraken | D Betaalafspraken |
| OmzetKlant | F OmzetKlant | | ContractKistorder | D ContractKistorder |
| TransportAfleverbonnen | F TransportAfleverbonnen | | KlantLand, TransporttariefLand, VerwachteKisten, Productie, NC Robots | D … |
| AfleverbonKistregels | F AfleverbonKistregels | | Shipping_PKLK | D Shipping_PKLK |
| TransportZendingen | F TransportZendingen | | Periodes, Calculations, Last refresh date, what-if-tabellen, TransportBroncontrole, PKLPControle | zonder prefix |
| SerienummerControle | F SerienummerControle | | | |

M-verwijzingen gebruiken `#"F KistKosten"`, DAX `'F KistKosten'`. M-expressies (KistBasis, KPTM_Kist, KPTM_Contract,
Opzoek, Bevat, PentaViews, …) zijn geen tabellen en hebben geen prefix.

## Hernoemen: hoe (voor volgende keren)
- Vervang tabelnamen alleen buiten tekstliterals en buiten `[...]` (kolomnamen); in M als `#"..."`, in DAX als `'...'`.
- Pas ook aan: `table`-kop, partitienaam, bestandsnaam `tables/<naam>.tmdl`, `ref table` en `PBI_QueryOrder` in model.tmdl,
  `fromColumn`/`toColumn` in relationships.tmdl, `"Entity"` en `queryRef` in alle visual.json.
- Metingen verplaatsen: `"Entity"` van metingvelden in visuals naar `Calculations`; gekwalificeerde verwijzingen
  `Tabel[Meting]` worden `[Meting]`.
- Controleer daarna: TMDL laadt, alle DAX- en visualverwijzingen bestaan, M bevat geen oude namen buiten tekst.
