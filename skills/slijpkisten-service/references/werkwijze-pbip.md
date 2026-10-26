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
