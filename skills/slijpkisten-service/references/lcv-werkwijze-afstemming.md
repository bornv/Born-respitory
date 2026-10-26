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

## Bewuste afwijkingen

| LCV-regel | Afwijking | Reden |
|---|---|---|
| Navigatie + query folding, geen native SQL | Native SQL (`Oracle.Database(..., [Query = ...])`) met `SqlIn`-lijsten | Views lopen via databaselink PENTA8; folding met `List.Contains` is niet gegarandeerd en Oracle staat max. 1000 waarden per `IN` toe (SqlIn splitst per 900). Een niet-gefolde stap haalt hele tabellen over de link. |
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
Journaal_Kist, SqlIn, Opzoek, Bevat, PentaViews, …) zijn geen tabellen en hebben geen prefix. Dataflow-entiteiten houden
hun naam (bv. `DataflowTabel("Shipping_PKLK")`).

## Hernoemen: hoe (voor volgende keren)
- Vervang tabelnamen alleen buiten tekstliterals en buiten `[...]` (kolomnamen); in M als `#"..."`, in DAX als `'...'`.
- Pas ook aan: `table`-kop, partitienaam, bestandsnaam `tables/<naam>.tmdl`, `ref table` en `PBI_QueryOrder` in model.tmdl,
  `fromColumn`/`toColumn` in relationships.tmdl, `"Entity"` en `queryRef` in alle visual.json.
- Metingen verplaatsen: `"Entity"` van metingvelden in visuals naar `Calculations`; gekwalificeerde verwijzingen
  `Tabel[Meting]` worden `[Meting]`.
- Controleer daarna: TMDL laadt, alle DAX- en visualverwijzingen bestaan, M bevat geen oude namen buiten tekst.
