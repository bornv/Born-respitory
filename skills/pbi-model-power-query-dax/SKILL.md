---
name: pbi-model-power-query-dax
description: "Praktijkregels voor Power BI semantische modellen: Power Query M in importpartities (query folding, stapvolgorde, parameters, RangeStart/RangeEnd, valideren, debuggen), DAX-codeconventies en UDF's, een model opruimen/organiseren (display folders, naamgeving, beschrijvingen, verbergen, sortering, format strings), lineage/impactanalyse vóór wijzigingen en refreshstrategie plus troubleshooting. Gebruik bij Power Query, M, query folding, View Native Query, DAX, meting, measure optimaliseren, model opruimen, model organiseren, display folders, naamgeving, lineage, impactanalyse, downstream rapporten, refresh mislukt, vernieuwen mislukt, incremental refresh, dataOnly/calculate. Niet voor: DAX-performance met traces en patronencatalogus, TMDL en refresh via REST (fabric-semantic-model); Dataflow Gen2 en algemene M-taal (fabric-dataflows); rapportvisuals (fabric-powerbi-report)."
---

# Power BI-model: Power Query, DAX, organiseren en refresh

> Bewerking van [data-goblin/power-bi-agentic-development](https://github.com/data-goblin/power-bi-agentic-development) (auteur Kurt Buhler, GPL-3.0), skills `power-query`, `dax`, `organize-semantic-model`, `lineage-analysis`, `refresh-semantic-model`, commit 4936264. Vertaald, ingekort en aangepast. Deze skill valt daardoor ook onder GPL-3.0; zie `LICENSE` in deze map.
> De DAX-optimalisatieskill van de bron is bijgedragen door [Justin Martin](https://daxnoob.blog).

Deze skill bundelt de praktijkregels die je nodig hebt rond een bestaand semantisch model: de M-code in de importpartities, nette DAX, een model dat klaar is voor rapportbouwers, Excel en Copilot, weten wat er stukgaat vóór je iets wijzigt, en een refresh die slaagt. Claude levert M, DAX, C#-scripts voor Tabular Editor en commando's; **jij** voert ze uit in Power BI Desktop, Tabular Editor of een terminal.

Typische context: een ordermodel met `Orders`, `Orderregels`, `Leveringen`, `Voorraad` en SQDC-KPI's, gevoed uit SQL, SharePoint, Excel of een Lakehouse.

## Werkwijze

| Je vraag | Ga naar | Laad |
|---|---|---|
| M-code schrijven of verbeteren voor een modeltabel, query folding, trage refresh door M | [Power Query in partities](#power-query-in-partities) | [power-query-m.md](references/power-query-m.md) |
| M-expressie testen of een stap debuggen | [Valideren](#m-valideren-en-debuggen) | [power-query-m.md](references/power-query-m.md#valideren) |
| M-taal zelf (`each`, `try`, fouten per cel), Dataflow Gen2 | → **fabric-dataflows** | — |
| DAX netjes schrijven, codeconventies, UDF voorstellen | [DAX](#dax) | [dax-code-en-udfs.md](references/dax-code-en-udfs.md) |
| Trage meting of query versnellen (server timings, DAX001–DAX021) | → **fabric-semantic-model**, sectie DAX-performance | — |
| Model opruimen, organiseren, "report-ready" maken, display folders, beschrijvingen | [Model organiseren](#model-organiseren) | [model-organiseren.md](references/model-organiseren.md) |
| Namen hernoemen, naamgevingsconventie kiezen | [Model organiseren](#model-organiseren) | [naamgeving.md](references/naamgeving.md) |
| Wat hangt er aan dit model, kan ik dit wijzigen of verwijderen? | [Lineage en impactanalyse](#lineage-en-impactanalyse) | — |
| Refresh kiezen, plannen, splitsen of een mislukte refresh oplossen | [Refresh](#refresh) | [refresh.md](references/refresh.md) |

Regels voor de keuze:

- Wijzigt de vraag namen, kolommen of tabellen: doe eerst [lineage](#lineage-en-impactanalyse).
- Spant de vraag meerdere onderdelen (bijv. "refresh faalt na mijn M-wijziging"): begin bij [Refresh](#refresh), daarna M.
- Gok geen bronnamen, kolomnamen of bedrijfstermen. Vraag ze of lees ze uit het model.

## Power Query in partities

Elke importtabel heeft een partitie met een M-expressie die bepaalt wat er bij refresh geladen wordt. In PBIP/TMDL staat die in `definition/tables/<Tabel>.tmdl` (blok `partition`); gedeelde parameters staan als `expression` in `definition/expressions.tmdl`.

```m
let
    Source = Sql.Database(#"SqlEndpoint", #"Database"),
    Data = Source{[Schema="dbo", Item="Orders"]}[Data],
    #"Removed Columns" = Table.RemoveColumns(Data, {"InternalId"}),
    #"Changed Type" = Table.TransformColumnTypes(#"Removed Columns", {{"Amount", Currency.Type}})
in
    #"Changed Type"
```

### Kernregels

1. **Query folding is het belangrijkste prestatiebegrip.** Foldbare stappen worden SQL; na de eerste niet-foldbare stap draait alles daarna lokaal in de mashup-engine, op alle rijen.
2. **Vaste volgorde**: rijen filteren → kolommen selecteren → types zetten → eventueel sorteren → pas dan niet-foldbare stappen (custom kolommen, tekstbewerkingen).
3. **Kolommen en rijen zo vroeg mogelijk weg**, direct na de navigatiestap. Elke kolom reist anders mee door elke stap.
4. **Expliciete types** (`Int64.Type`, `type date`, `Currency.Type`, `type logical` …). Geen automatische typedetectie op grote tabellen. Let op: `Table.TransformColumnTypes` breekt op SQL Server vaak folding bij tekst→getal/datum; `Table.TransformColumns` met `Number.From` foldt betrouwbaarder.
5. **`Table.Buffer` alleen** als dezelfde tabel meerdere keren gebruikt wordt en herberekenen duur is. Wil je folding bewust stoppen zonder geheugenkosten: `Table.StopFolding`.
6. **Niet naar andere queries verwijzen** voor kolommen; dat breekt folding en kan trapsgewijs vertragen.
7. **Te complex voor M?** Gebruik `Value.NativeQuery(..., null, [EnableFolding=true])`, dan kunnen latere stappen erop doorfolden.
8. **Incremental refresh**: de filter op `RangeStart`/`RangeEnd` moet folden, anders laadt elke partitie alle data. Gebruik `>=` op `RangeStart` en `<` op `RangeEnd`.
9. **Fouten niet stil inslikken.** Een mislukte refresh is beter dan stil verkeerde data. Gebruik `try ... otherwise` alleen smal en expliciet.
10. **Beschrijvende stapnamen** (`#"Filtered Active Orders"`, niet `#"Custom1"`); parameters in `PascalCase` zonder spaties (`SqlEndpoint`); hernoemen in één `Table.RenameColumns`-stap.

Folding controleren in Desktop: rechtsklik op een stap → **View Native Query**. Grijs = deze stap foldt niet. Volledige lijsten (wat foldt, wat soms foldt, wat altijd breekt, omgevingsfactoren zoals privacyniveaus en platte bestanden): [power-query-m.md](references/power-query-m.md#query-folding).

Voorbeeldpartitie met de veilige volgorde: [examples/orders-partitie.m](examples/orders-partitie.m).

### M valideren en debuggen

| Behoefte | Aanpak |
|---|---|
| Volledige controle (kolommen, types, waarden) | Expressie uitvoeren tegen echte data, met `Table.FirstN(..., 100)` |
| Snelle syntaxcontrole | Partitie opslaan in het model (Desktop, Tabular Editor of TMDL deployen); Analysis Services weigert kapotte M |
| Eén stap bekijken | De `in`-regel tijdelijk naar die stap laten wijzen |
| Folding testen | Op volledige data uitvoeren en de duur bekijken; in Desktop **View Native Query** |

Opslaan in het model vangt syntaxfouten (`let`/`in`, onbekende stapnaam, ongeldige functie of type), maar **niet** verkeerde kolomnamen, bronproblemen of runtimefouten. Details, het `executeQuery`-alternatief via een Fabric-dataflow en een foutentabel: [power-query-m.md](references/power-query-m.md#valideren).

## DAX

Voor DAX-regels in het algemeen en voor performance-tuning met server timings (baseline, tiers, patronen DAX001–DAX021, QRY, MDL, DL) is **fabric-semantic-model** leidend (`dax-richtlijnen.md`, `dax-performance.md`, `dax-performance-patronen.md`). Daar staat dezelfde catalogus (tiers en patroon-ID's) die ook de `dax`-skill van de bron gebruikt; herhaal hem hier niet.

Wat deze skill toevoegt (details in [dax-code-en-udfs.md](references/dax-code-en-udfs.md)):

| Onderwerp | Regel in het kort |
|---|---|
| Opmaak | Formatteer elke meting, berekende kolom/tabel, calculation item en functie |
| Variabelen | Prefix `_` (`VAR _StartDate`) |
| Tijdelijke kolommen | Prefix `@` bij `ADDCOLUMNS`, `ROW`, `SELECTCOLUMNS`, `SUMMARIZECOLUMNS` (`"@BusinessDate"`, gebruikt als `[@BusinessDate]`) |
| Code actions van Tabular Editor 3 | Handmatig nalopen: scalaire predicaten i.p.v. `FILTER` op één kolom, `VALUES` i.p.v. `SUMMARIZE` op één kolom, `IN` i.p.v. `||`-ketens, constante aggregaties naar variabelen, geen ongebruikte variabelen |
| Commentaar | Eén korte `//`-regel bij afwijkende logica (bewuste `ALL`, workaround, magisch getal); niet bij het voor de hand liggende |
| UDF's | Alleen bij herhaalde logica; samengestelde namen (`TimeIntelligence.MonthToDate`), type-hints, `///` + parametercommentaar; compatibility level ≥ 1702 is eenrichtingsverkeer |
| Optimaliseren zonder trace-tool | Werk met DAX Studio (Server Timings) of Tabular Editor; houd een herschrijving alleen als hij sneller is **én** exact hetzelfde resultaat geeft |

Prestatie-escalatie (uit de bron): DAX-herschrijvingen mag je vrij testen; wijzigingen aan de query/visual (grain, filters) en aan het model (relaties, kolommen, aggregaties) pas na jouw akkoord, bij voorkeur op een kopie van het model.

## Model organiseren

Organiseren bestaat uit een reeks passes over dezelfde objecten. Doe ze **allemaal**, tenzij je de scope bewust beperkt; anders lijkt het model af terwijl namen, beschrijvingen en formats nog rauw zijn. Meld welke passes zijn overgeslagen en waarom.

| Pass | Wat | Kern |
|---|---|---|
| 0 | Inventaris en lineage | Startsituatie vastleggen; afnemers zoeken ([lineage](#lineage-en-impactanalyse)); culturen noteren |
| 1 | Tabelgroepen en display folders | Elk zichtbaar object in een folder; 3–5 topfolders per tabel; nesten met `/` |
| 2 | Namen | Title Case-bedrijfsnamen, geen prefixen of afkortingen; eerst terminologie afstemmen ([naamgeving.md](references/naamgeving.md)) |
| 3 | Hiërarchieën | Kalender, geografie, product, organisatie; alleen als niveaus echt genest zijn |
| 4 | Sortering | `SortByColumn` voor maandnamen, weekdagen, statussen; precies één sorteerwaarde per waarde |
| 5 | Verbergen | Sleutels, sorteerkolommen, technische kolommen, numerieke feitkolommen die via een meting lopen |
| 6 | Analyze in Excel | `IsAvailableInMDX = false` op verborgen, ongebruikte kolommen; eerst Excel-gebruik nagaan |
| 7 | Beschrijvingen | Alleen wat de naam niet zegt; korte zinnen, één feit per zin |
| 8 | Format strings | Elke zichtbare meting en numerieke kolom; `yyyy-MM-dd` (hoofdletter `MM`) |
| 9 | Data categories | Geografie, `WebUrl`, `ImageUrl`, `Barcode`; datumtabel `DataCategory = "Time"` |
| 10 | `context`-annotatie | Voor objecten waarvan het doel niet zichtbaar is (RLS-kolom, hulptabel) |
| 11 | Berekende tabellen/kolommen | Moeten zich rechtvaardigen; anders naar de bron verplaatsen |
| 12 | DAX-code | Opmaak, prefixen, code actions, commentaar ([dax-code-en-udfs.md](references/dax-code-en-udfs.md)) |
| 13 | UDF's | Herhaalde logica voorstellen als functie |
| 14 | Duplicaten | Alleen verwijderen als niets het gebruikt (model, RLS, rapport, Excel) |
| 15 | Perspectieven, vertalingen, rollen | Bewust lidmaatschap, volledige culturen, rollen consistent met pass 5 |

Werkwijze per pass in Tabular Editor 3: **één C#-script per pass**, zodat elke pass apart te controleren en met één Ctrl+Z terug te draaien is. Sluit eerst DAX-editortabbladen van objecten die een script wijzigt (een script op een open, parsend object heeft TE3 laten crashen). Laat het opslaan aan jezelf. In Power BI Desktop zonder Tabular Editor voer je dezelfde passes handmatig uit; Claude levert per object naam, folder, beschrijving en format string. Volledige uitleg en voorbeelden: [model-organiseren.md](references/model-organiseren.md).

**Hernoemen breekt rapporten.** Visuals, filters, bladwijzers en veldparameters die aan de oude naam hangen, gaan stuk. Laat eerst de oud→nieuw-lijst zien en wacht op akkoord als er rapporten aan het model hangen.

## Lineage en impactanalyse

Doe dit vóór je een model, tabel, kolom of meting hernoemt, verwijdert of van type verandert.

1. **Rapporten zoeken.** Zonder beheerrechten: gebruik de lineage view in de Power BI Service. Je ziet alleen workspaces waar je toegang toe hebt.
2. **Script als alternatief.** De bron levert het Python-script `get-downstream-reports.py` (skill `lineage-analysis`) dat je zelf kunt draaien: het loopt alle workspaces af waar jij toegang toe hebt en zoekt rapporten met dit `datasetId`. Vereist `pip install azure-identity requests` en `az login`; Contributor op een workspace is genoeg. Draai het niet in een lus over tientallen modellen (throttling).
   ```bash
   python3 get-downstream-reports.py "Workspace Name" "Model Name"
   python3 get-downstream-reports.py --dataset-id <guid> --json
   ```
3. **Andere afnemers niet vergeten.** Rapporten zijn niet de enige: ook Analyze in Excel-werkmappen, composite models (andere modellen via DirectQuery), explorations, paginated reports (`.rdl`), dataflows, Fabric-notebooks, data agents en externe XMLA-tools. Vraag bij twijfel naar Excel-gebruik; dat staat niet als gekoppeld rapport in de lineage.
4. **Resultaat lezen.**

| Bevinding | Betekenis |
|---|---|
| Rapportformaat `PBIR` | Modern formaat, als JSON te bewerken |
| Rapportformaat `PBIRLegacy` | Oud formaat; eerst naar PBIR omzetten voor directe bewerking |
| Rapporten in onverwachte workspaces | Kopieën, forks of thin reports op een gedeeld model |
| Veel afnemers | Model met grote impact; wijzigingen afstemmen |

5. **Binnen het model**: controleer afhankelijkheden van het object zelf (in Tabular Editor `ReferencedBy`), RLS-rollen en perspectieven.

Volledige tenant-dekking (adminscan, `admin/groups/{id}/lineage`) vraagt Fabric-beheerrechten; zie **fabric-basis**.

## Refresh

| Type | Laadt data | Herberekent | Gebruik |
|---|:-:|:-:|---|
| `full` | ja | ja | Alles opnieuw; na schemawijziging of bij foutstatus |
| `automatic` | waar nodig | waar nodig | Standaard; slaat objecten in `Ready` over |
| `dataOnly` | ja | nee | Eerste fase van een tweefasen-refresh; **leegt** berekende kolommen/tabellen |
| `calculate` | nee | ja | Na `dataOnly`, of als alleen DAX is gewijzigd |
| `clearValues` | nee | nee | Object en afhankelijken leegmaken |
| `defragment` | nee | nee | Ongebruikte dictionary-waarden opruimen |
| `add` | toevoegen | ja | Alleen via TMSL/XMLA, alleen partities |

Belangrijk voor jouw licentie:

- **Pro**: 8 refreshes per dag, timeout 2 uur, alleen volledige standaard-refresh van het hele model.
- **Premium Per User / Premium / Fabric**: 48 per dag, timeout 5 uur, plus enhanced refresh (per tabel/partitie, `commitMode`, `maxParallelism`, `retryCount`, annuleren).

Stappenplan voor een betrouwbare refresh:

1. **Baseline** vastleggen met een DAX-query, bijvoorbeeld `EVALUATE ROW("RowCount", COUNTROWS(Orders), "MaxDate", MAX(Orders[Orderdatum]))`.
2. **Refresh** starten (Desktop, Service of API; REST-commando's: **fabric-semantic-model** en [refresh.md](references/refresh.md)).
3. **Status** volgen: `Unknown`, `InProgress`, `Completed`, `Failed`, `Disabled`, `Cancelled`.
4. **Zelfde query opnieuw.** Geslaagd maar geen nieuwe data? Dan is de bron niet bijgewerkt: eerst de ETL/dataflow laten lopen, dan opnieuw.

Snelle foutentabel (volledig in [refresh.md](references/refresh.md#troubleshooting)):

| Symptoom | Waarschijnlijke oorzaak | Oplossing |
|---|---|---|
| Credentialfout (`DatasourceHasNoCredentialError`) | Referenties verlopen of niet meegekomen na kopiëren | Referenties instellen in de modelinstellingen in de Service |
| `GatewayNotReachable` | Gateway offline of verouderd | Gateway bijwerken en status controleren |
| Type mismatch | Brontype ≠ modeltype | `Table.TransformColumnTypes` in de partitie of modeltype aanpassen |
| Kolom bestaat niet in rowset | Bronkolom hernoemd/verwijderd/andere hoofdletters | Bronschema controleren; `Table.RenameColumns` |
| Dubbele waarde op sleutelkolom | Duplicaten aan de één-kant van een relatie | `Table.Distinct` of bron opschonen |
| `TRUE/FALSE` wordt -1/0 in de Service | Kolom van type `ANY` | Expliciete types in Power Query vóór publiceren |
| Timeout (2u/5u) | Model te groot voor één run | Incremental refresh; partities los verversen; model verkleinen |
| Berekende tabellen leeg | Na `dataOnly` | `calculate` erachteraan |
| Gedrosseld | Te veel gelijktijdige refreshes | Schema's spreiden, buiten piekuren |

Isoleer een falende tabel door tabellen één voor één te verversen: eerst dimensies, dan feiten, dan `calculate`.

Groot model (Premium/Fabric)? Splits in twee fasen: `dataOnly` met `partialBatch` ([examples/refresh-fase1-dataonly.json](examples/refresh-fase1-dataonly.json)), daarna `calculate` met `transactional` ([examples/refresh-fase2-calculate.json](examples/refresh-fase2-calculate.json)). Bij `partialBatch` moet `applyRefreshPolicy` op `false`.

## Controle voor oplevering

- [ ] M: filters en kolomselectie direct na navigatie; niet-foldbare stappen achteraan; folding gecontroleerd (View Native Query of duur).
- [ ] M: expliciete types, geen stil ingeslikte fouten, beschrijvende stapnamen, parameters in `PascalCase`.
- [ ] M: getest met `Table.FirstN` op echte data; kolommen, types, nulls en rijtelling gecontroleerd.
- [ ] Incremental refresh: filter op `RangeStart`/`RangeEnd` foldt en types passen bij de bronkolom.
- [ ] DAX: opgemaakt, `_`-variabelen, `@`-tijdelijke kolommen, geen ongebruikte variabelen; performancewijziging alleen met gelijk resultaat.
- [ ] Organiseren: alle passes gedaan of het overslaan gemotiveerd; elk zichtbaar object heeft folder, format string en (waar nodig) beschrijving.
- [ ] Hernoemen/verwijderen: lineage gedaan, oud→nieuw-lijst gedeeld, akkoord gekregen; ook Excel en composite models nagevraagd.
- [ ] Refresh: baseline en na-meting vergeleken; bij `dataOnly` een `calculate` gepland; licentiegrenzen (Pro vs Premium) gerespecteerd.
- [ ] Niets opgeslagen of gepubliceerd namens jou; jij slaat op en deployt.
