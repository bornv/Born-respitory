# Power Query M in modelpartities

Praktijkregels voor snelle, onderhoudbare M-expressies in importpartities van een semantisch model. Voor de M-taal zelf (`each`, `try`, fouten per cel, section documents) en Dataflow Gen2: zie **fabric-dataflows** (`references/m-taal.md`).

## Inhoud

- [Partitie en parameters terugvinden](#partitie-en-parameters-terugvinden)
- [Veilige volgorde](#veilige-volgorde)
- [Query folding](#query-folding)
- [Kolommen, rijen en types](#kolommen-rijen-en-types)
- [Anti-patronen](#anti-patronen)
- [Naamgeving en foutafhandeling](#naamgeving-en-foutafhandeling)
- [Veelgebruikte patronen](#veelgebruikte-patronen)
- [Valideren](#valideren)

## Partitie en parameters terugvinden

| Waar | Wat |
|---|---|
| Power BI Desktop | Transform data → query van de tabel → Advanced Editor |
| PBIP/TMDL | `definition/tables/<Tabel>.tmdl`, blok `partition` (`source =`) |
| Gedeelde parameters | `definition/expressions.tmdl`, `expression`-declaraties |
| Gepubliceerd model, met de Fabric CLI (`fab`) | zie hieronder |

```bash
# Partitie-expressie uit TMDL via fab
fab get "<Workspace>.Workspace/<Model>.SemanticModel" -f \
  -q "definition.parts[?path=='definition/tables/<Table>.tmdl'].payload"

# Gedeelde M-parameters
fab get "<Workspace>.Workspace/<Model>.SemanticModel" -f \
  -q "definition.parts[?path=='definition/expressions.tmdl'].payload"
```

Onderdelen van een partitie-expressie:

- **Parameters**: `#"SqlEndpoint"`, `#"Database"` zijn gedeelde M-parameters op modelniveau.
- **Navigatie**: `Source{[Schema="dbo", Item="Orders"]}[Data]` gaat naar één tabel.
- **Stappen**: elke stap is een benoemde variabele in de `let ... in`-keten.
- **Geciteerde namen**: stapnamen met spaties schrijf je als `#"Step Name"`.

## Veilige volgorde

Schrijf of genereer M voor importpartities in deze volgorde, dan blijft folding zo lang mogelijk intact:

```m
let
    Source = Sql.Database(SqlEndpoint, Database),
    Data = Source{[Schema="dbo", Item="MyTable"]}[Data],
    -- 1. Filter rows (folds to WHERE)
    Filtered = Table.SelectRows(Data, each [IsActive] = true),
    -- 2. Select columns (folds to SELECT)
    Selected = Table.SelectColumns(Filtered, {"Id", "Date", "Amount"}),
    -- 3. Set types (folds to CAST)
    Typed = Table.TransformColumnTypes(Selected, {{"Amount", Currency.Type}}),
    -- 4. Sort if needed (folds to ORDER BY)
    Sorted = Table.Sort(Typed, {{"Date", Order.Descending}}),
    -- 5. Non-foldable transforms LAST
    Added = Table.AddColumn(Sorted, "Category", each if [Amount] > 1000 then "High" else "Low")
in
    Added
```

Is de logica te complex voor M, geef dan native SQL door:

```m
let
    Source = Sql.Database(SqlEndpoint, Database),
    Data = Value.NativeQuery(Source,
        "SELECT Id, Date, Amount FROM dbo.MyTable WHERE IsActive = 1",
        null, [EnableFolding=true])
in
    Data
```

`EnableFolding=true` zorgt dat latere M-stappen bovenop het native resultaat kunnen folden.

## Query folding

Folding vertaalt M-stappen naar een query in de bron (SQL, OData …). Werkt het, dan doet de bron het zware werk. Breekt het, dan haalt de mashup-engine alle data binnen en verwerkt die lokaal.

Waarom het telt:

- Gefold tegen een tabel van 10 miljoen rijen: SQL Server krijgt `SELECT TOP 1000 ... WHERE ...`; snel.
- Niet gefold: alle 10 miljoen rijen naar de mashup-engine, daarna lokaal filteren; traag en geheugenintensief.
- Bij grote tabellen leidt gebroken folding vaak tot refresh-timeouts of out-of-memory.

### Stappen die folden (SQL-bronnen)

| M-functie | SQL |
|---|---|
| `Table.SelectColumns` | `SELECT col1, col2` |
| `Table.RemoveColumns` | `SELECT` (zonder die kolommen) |
| `Table.SelectRows` | `WHERE` |
| `Table.Sort` | `ORDER BY` |
| `Table.FirstN` | `TOP N` |
| `Table.Group` | `GROUP BY` |
| `Table.TransformColumnTypes` | `CAST` |
| `Table.RenameColumns` | `AS`-alias |
| `Table.ExpandTableColumn` | `JOIN` |
| `Table.NestedJoin` | `JOIN` |
| `Table.Distinct` | `DISTINCT` |
| `Table.Skip` | `OFFSET` |

### Bewerkingen die folding breken

Na een brekende stap draaien **alle** volgende stappen lokaal. De lijst geldt vooral voor SQL Server via `Sql.Database`; andere bronnen kunnen afwijken.

| Groep | Functies |
|---|---|
| Tabel opbouwen / materialiseren | `Table.Buffer`, `List.Buffer`, `Table.StopFolding`, `#table`, `Table.FromList`, `Table.FromRecords`, `Table.FromRows`, `Table.FromValue`, `Table.FromColumns` |
| Rijpositie / index | `Table.AddIndexColumn`, `Table.LastN`, `Table.RemoveLastN`, `Table.Range` (midden), `Table.Repeat`, `Table.AlternateRows`, `Table.InsertRows`, `Table.RemoveRows` (op positie), `Table.ReverseRows`, `Table.FindText` |
| Tekst (in `Table.TransformColumns`/`Table.AddColumn`) | `Text.Proper`, `Text.Combine`, `Text.Insert`, `Text.Remove`, `Text.RemoveRange`, `Text.Select`, `Text.Split`, `Text.SplitAny`, `Text.BeforeDelimiter`, `Text.AfterDelimiter`, `Text.BetweenDelimiters`, `Text.PadStart`, `Text.PadEnd`, `Text.Reverse`, `Text.Format`, `Text.ToList`, `Text.Clean`, `Text.From` met format/cultuur |
| Kolommen splitsen/samenvoegen | `Table.SplitColumn`, `Table.CombineColumns`, alle `Splitter.*` |
| Structuur | `Table.Transpose`, `Table.DemoteHeaders`, `Table.PromoteHeaders` |
| Opvullen | `Table.FillDown`, `Table.FillUp` |
| Foutafhandeling | `Table.RemoveRowsWithErrors`, `Table.SelectRowsWithErrors`, `try...otherwise` in rijcontext |
| Schema / metadata | `Table.Schema`, `Table.ColumnNames`, `Value.Type`, `Type.Is` |
| Eigen functies / iteratie | eigen `(x) => ...` in rijcontext, `Table.TransformRows`, `List.Generate`, `List.Accumulate`, `List.Transform` met complexe logica |
| Records / lijsten | `Table.ExpandListColumn`, `Table.ExpandRecordColumn` (behalve na een NestedJoin op dezelfde bron), `Record.*`, `Table.ToRecords`, `Table.ToRows`, `Table.ToList`, `Table.Column` |
| Datum/tijd in rijcontext | `Date.ToText`/`DateTime.ToText`/`Duration.ToText` met formaat, `Date.IsInCurrentMonth`, `Date.IsInCurrentWeek` e.d., `Date.DayOfWeekName`, `Date.MonthName` |
| Overig | `Table.Profile`, `Table.Max`/`Table.Min` (rij), `Table.Contains`, `Table.ContainsAll`, `Table.ContainsAny`, `Table.IsDistinct` |

### Soms foldbaar

| Functie | Foldt wel | Breekt |
|---|---|---|
| `Table.AddColumn` | alleen SQL-vertaalbare functies (rekenkunde, `Text.Upper`) | complexe M-logica |
| `Table.TransformColumns` | `Text.Upper`, `Text.Lower`, `Text.Trim`, `Number.Round` | `Text.Proper`, complexe lambda's |
| `Table.TransformColumnTypes` | compatibele casts (int → decimaal) | cultuurafhankelijke of M-only types |
| `Table.ReplaceValue` | eenvoudige letterlijke vervanging | patronen |
| `Table.Pivot` / `Table.Unpivot` | SQL Server (PIVOT/UNPIVOT) | andere bronnen |
| `Table.NestedJoin` | beide kanten dezelfde SQL-verbinding | verschillende bronnen |
| `Table.Combine` (append) | alle invoer dezelfde SQL-bron (UNION ALL) | gemengde bronnen |
| `Table.SelectRows` met `Text.Contains` | als `LIKE '%value%'` op SQL Server | — |
| `Table.Group` | standaardaggregaties (`List.Sum`, `List.Count`, `List.Average`) | eigen functies |
| `Value.NativeQuery` | latere stappen alleen met `EnableFolding=true` | zonder die optie |
| `Text.Start` / `Text.End` | vaak als `LEFT()`/`RIGHT()` | `Text.Middle` meestal niet |
| `Date.Year`, `Date.Month`, `Date.Day` | `YEAR()`, `MONTH()`, `DAY()` | — |
| `Date.AddDays` / `Date.AddMonths` | `DATEADD()` | — |

Let op: `Table.TransformColumnTypes` breekt op SQL Server vaak folding bij tekst→getal/datum. `Table.TransformColumns` met een expliciete conversie (bijv. `Number.From`) is een betrouwbaarder foldbaar alternatief. Folding over databases heen op dezelfde SQL Server kan met `EnableCrossDatabaseFolding`.

### Omgevingsfactoren die folding verhinderen

- Queries uit verschillende bronnen samenvoegen of toevoegen.
- Onverenigbare privacyniveaus tussen bronnen (de Data Privacy Firewall grijpt in).
- Platte bestanden (CSV, Excel, JSON, XML): geen query-engine. Denk aan SharePoint-Excelbestanden en ERP-exports.
- `Web.Contents` / API's: geen SQL-engine.
- Eigen SQL zonder `EnableFolding=true`.
- Elke stap na een brekende stap; de keten foldt daarna niet opnieuw.

### Folding controleren

- In Power Query (Desktop of Online): rechtsklik op een stap → **View Native Query**. Grijs = foldt niet.
- Bij de bron: SQL Profiler of querylogboeken; per partitie hoort één gefilterde query te verschijnen.
- Op tijd: een query op een grote tabel die ruim binnen de timeout klaar is, foldt waarschijnlijk. Traag of timeout: folding is waarschijnlijk gebroken.

## Kolommen, rijen en types

**Kolommen vroeg weg**, direct na de navigatie; dat foldt naar `SELECT` en scheelt overdracht:

```m
-- Goed: direct na navigatie
Data = Source{[Schema="dbo", Item="Orders"]}[Data],
#"Selected" = Table.SelectColumns(Data, {"OrderId", "Date", "Amount"}),

-- Fout: pas aan het eind na alle transformaties
#"Final" = Table.RemoveColumns(#"Transformed", {"Col1", "Col2", "Col3"})
```

**Rijen vroeg filteren**; een `Table.SelectRows` direct na de navigatie foldt naar `WHERE`. Extra belangrijk bij incremental refresh.

**Types vroeg zetten**, direct na de kolomselectie. Gebruik nooit `Table.TransformColumnTypes` met `Replacer.ReplaceValue` of cultuurafhankelijke conversies op grote datasets: dat foldt niet en kan onverwachte nulls opleveren.

| M-type | Voor |
|---|---|
| `Int64.Type` | Gehele sleutels, aantallen |
| `type text` | Tekst |
| `type date` | Alleen datum |
| `type datetime` | Datum en tijd |
| `type datetimezone` | Datum/tijd met tijdzone |
| `Currency.Type` | Bedragen (vaste decimalen) |
| `type logical` | Booleaanse vlaggen |
| `Percentage.Type` | Percentages |

## Anti-patronen

| Anti-patroon | Waarom fout | Beter |
|---|---|---|
| Eerst custom kolom, dan filteren | De custom kolom breekt folding; de filter draait lokaal op **alle** rijen | Filter vóór de custom kolom |
| `Table.Buffer` "voor de zekerheid" | Hele tabel in geheugen | Alleen bij meervoudig gebruik met dure herberekening |
| Kolom uit een andere query halen | Breekt folding, trapsgewijze vertraging | Join in de bron of `Table.NestedJoin` op dezelfde verbinding |
| Eén stap per hernoemde kolom | Overhead per stap | Eén `Table.RenameColumns` met alle paren |

```m
-- Goed: één stap voor alle hernoemingen
#"Renamed" = Table.RenameColumns(Data, {
    {"OldName1", "NewName1"},
    {"OldName2", "NewName2"}
})
```

## Naamgeving en foutafhandeling

- Beschrijvende stapnamen: `#"Filtered Active Orders"`, niet `#"Custom1"` of `#"Step1"`.
- `#"Quoted Identifiers"` voor stappen met spaties, zoals de Power Query-UI ze ook maakt.
- Parameters in `PascalCase` zonder spaties: `SqlEndpoint`, `DatabaseName`.
- Productiepartities: geen `try...otherwise` dat fouten stil inslikt. Is foutafhandeling nodig (bijv. optionele kolom), maak die smal en expliciet:

```m
#"Safe Amount" = Table.TransformColumns(Data, {
    {"Amount", each try Number.FromText(_) otherwise null, type number}
})
```

## Veelgebruikte patronen

### Incremental refresh

```m
let
    Source = Sql.Database(#"SqlEndpoint", #"Database"),
    Data = Source{[Schema="dbo", Item="Orders"]}[Data],
    #"Filtered" = Table.SelectRows(Data, each
        [OrderDate] >= #"RangeStart" and [OrderDate] < #"RangeEnd")
in
    #"Filtered"
```

- De filter moet folden; anders laadt elke partitie alles en filtert lokaal.
- `RangeStart`/`RangeEnd` zijn `DateTime` en moeten passen bij het type van de bronkolom. Gebruikt de bron gehele datumsleutels, maak dan een conversiefunctie.
- Bij testen vul je concrete datums in voor `RangeStart` en `RangeEnd`.

### Lakehouse-bron

```m
let
    Source = Lakehouse.Contents(null),
    Data = Source{[Id="lakehouse-guid"]}[Data],
    Table = Data{[Id="table-name", ItemKind="Table"]}[Data]
in
    Table
```

### Native SQL

```m
let
    Source = Sql.Database("server", "db"),
    Data = Value.NativeQuery(Source, "SELECT * FROM dbo.MyView WHERE Year = 2024", null, [EnableFolding=true])
in
    Data
```

## Valideren

Twee aanvullende manieren: uitvoeren tegen echte data (volledig) of opslaan in het model (snelle syntaxcontrole).

### 1. Uitvoeren tegen echte data

In Power BI Desktop is dit gewoon de preview in Power Query. Buiten Desktop beschrijft de bron een route via de Fabric `executeQuery`-API van een "runner"-dataflow in de workspace, met de verbinding gekoppeld aan die dataflow. Hoe je `executeQuery` aanroept en de Arrow-respons leest: **fabric-dataflows** (`references/rest-api.md`). Specifiek voor modelpartities:

1. Haal de partitie-expressie en de gedeelde parameters op (zie [boven](#partitie-en-parameters-terugvinden)).
2. Verpak de expressie in een section document en zet de parameters erin als `shared`-declaraties:

```m
section Section1;
shared SqlEndpoint = "myserver.database.windows.net";
shared Database = "MyDatabase";
shared Result = let
    Source = Sql.Database(SqlEndpoint, Database),
    Data = Source{[Schema="dbo",Item="Orders"]}[Data],
    #"Select Columns" = Table.SelectColumns(Data, {"OrderId", "Amount"}),
    Limited = Table.FirstN(#"Select Columns", 100)
in Limited;
```

- Vervang `#"SqlEndpoint"`-verwijzingen door `SqlEndpoint` (de `shared`-declaratie).
- De naam `shared Result` moet gelijk zijn aan `queryName` in de API-aanroep.
- Beperk grote tabellen met `Table.FirstN`.
- Vul bij incremental refresh concrete waarden in voor `RangeStart` en `RangeEnd`.

| Foutmelding | Oorzaak | Oplossing |
|---|---|---|
| `Credentials are required to connect to the SQL source` | Verbinding niet gekoppeld aan de runner-dataflow | Verbinding koppelen via `updateDefinition` |
| `Query name not found` | `queryName` ≠ `shared`-naam | Beide `Result` |
| `Expression.Error: The column '...' was not found` | Kolomnaam klopt niet | Bronschema controleren |
| `DataSource.Error: ... could not be reached` | Server onbereikbaar of verkeerd endpoint | Verbindingsgegevens controleren |
| Timeout (90 seconden) | Query te duur | `Table.FirstN` toevoegen |

### 2. Opslaan in het model

Analysis Services controleert de M-syntaxis bij het opslaan van een partitie: in Desktop, in Tabular Editor of door TMDL te deployen (`fab import "<Workspace>.Workspace/<Model>.SemanticModel" -i ./<Model>.SemanticModel -f`). Een kapotte expressie geeft fouten als:

```
Token Eof expected.
Expression.SyntaxError: Token Literal expected.
```

| Vangt wel | Vangt niet |
|---|---|
| Ontbrekende of scheve `let`/`in` | Verkeerde kolomnamen in de bron |
| Verwijzing naar een niet-bestaande stap | Verbindingsproblemen |
| Ongeldige functienamen | Runtimefouten (deling door nul, conversiefouten op echte data) |
| Syntaxfouten (komma's, haakjes) | Gebroken folding |
| Ongeldige typenamen in `TransformColumnTypes` | |

### Stap voor stap debuggen

Wijs de `in`-regel tijdelijk naar een tussenstap:

| `in`-doel | Toont |
|---|---|
| `in Source` | Tabellenlijst van de database |
| `in Data` | Alle kolommen van de brontabel |
| `in #"Filtered"` | Na het rijfilter |
| `in #"Selected"` | Na de kolomselectie (eindresultaat) |

Controleer per stap: kolomnamen en aantal, rijtelling (werkte het filter?), datatypes, aantal nulls en een paar voorbeeldwaarden.

### Checklist vóór je een partitie oplevert

1. **Syntaxis**: opslaan in het model om structurele fouten te vangen.
2. **Data**: uitvoeren met `Table.FirstN(_, 100)`; kloppen kolommen en waarden?
3. **Types**: komen ze overeen met de kolomtypes in het model?
4. **Nulls**: geen onverwachte nulls door typeconversie.
5. **Rijtelling**: zonder `Table.FirstN` (of met een ruime limiet) om de filterlogica te checken.
6. **Folding**: grote tabellen zijn ruim binnen de timeout klaar.
