# Power Query M in Dataflow Gen2

Structuur van `mashup.pq`, parameters en de M-valkuilen die bij Dataflow Gen2 het vaakst misgaan. De gedragsbeschrijvingen komen uit de bron, waar ze live via `executeQuery` zijn geverifieerd. Basis-syntax (`let`/`in`, functies definiëren) valt buiten dit bestand.

## Inhoud

| Sectie | Wanneer laden |
|---|---|
| [Section document](#section-document) | Opbouw van `mashup.pq`, meerdere queries, Fast Copy |
| [Parameters](#parameters) | Parameterqueries declareren en bij refresh overschrijven |
| [`try` en `try ... otherwise`](#try-en-try--otherwise) | Foutafhandeling |
| [Fouten per cel](#fouten-per-cel) | Lege waarden na typeconversie, "We couldn't convert to Number." |
| [`each`-scope](#each-scope) | Rare resultaten in `Table.Group` |
| [Optionele velden](#optionele-velden) | "The field 'x' of the record wasn't found." |
| [Geciteerde namen](#geciteerde-namen) | Kolommen met spaties of gereserveerde woorden |
| [Eigen fouten maken](#eigen-fouten-maken) | `error`-records met eigen `Reason` |
| [Niet bruikbare functies](#niet-bruikbare-functies) | `File.Contents`, `Web.Page`, `Web.BrowserContents` |
| [Voorbeelden magazijn](#voorbeelden-magazijn) | SharePoint-lijst opschonen, orders en leveringen koppelen |

## Section document

`mashup.pq` is altijd een section document:

```m
section Section1;

shared Klanten = let
    Source = Sql.Database("server.database.windows.net", "mydb"),
    Data = Source{[Schema = "dbo", Item = "Customers"]}[Data]
in
    Data;

shared Orders = let
    Source = Sql.Database("server.database.windows.net", "mydb"),
    Data = Source{[Schema = "dbo", Item = "Orders"]}[Data],
    Filtered = Table.SelectRows(Data, each [Status] = "Active")
in
    Filtered;

shared KlantOrders = let
    Merged = Table.NestedJoin(Klanten, {"CustomerID"}, Orders, {"CustomerID"}, "OrderData", JoinKind.Inner),
    Expanded = Table.ExpandTableColumn(Merged, "OrderData", {"OrderID", "Amount"})
in
    Expanded;
```

| Regel | Toelichting |
|---|---|
| `section Section1;` bovenaan | Verplicht |
| Elke query: `shared Naam = ...;` | Afsluiten met `;` |
| Queries mogen elkaar bij naam aanroepen | Zoals `KlantOrders` hierboven |
| `[StagingDefinition = [Kind = "FastCopy"]]` vóór `section` | Zet de Fast Copy-engine aan voor snelle bulkinname; zonder deze annotatie gebruikt de query de standaard mashup-engine |
| `[AllowCombine = true]` vóór `section` | Nodig als het document meerdere bronnen met credentials combineert |

Elke query in `mashup.pq` hoort ook een entry in `queriesMetadata` van `queryMetadata.json` te hebben, met `queryName` (zonder `queryName` geeft `updateDefinition` de fout `Required property 'queryName' not found`).

## Parameters

Parameters zijn `shared`-waarden met een `meta`-annotatie:

```m
section Section1;

shared ServerName = "myserver.database.windows.net" meta [IsParameterQuery = true, Type = "Text"];

shared DatabaseName = "mydb" meta [IsParameterQuery = true, Type = "Text"];

shared StartDate = #date(2025, 1, 1) meta [IsParameterQuery = true, Type = "Date"];

shared MyQuery = let
    Source = Sql.Database(ServerName, DatabaseName),
    Data = Source{[Schema = "dbo", Item = "Sales"]}[Data],
    Filtered = Table.SelectRows(Data, each [SaleDate] >= StartDate)
in
    Filtered;
```

In opgeslagen dataflows zie je ook de vorm met een type-waarde en verplicht-vlag:

```m
shared SourceServer = "sql-prod.database.windows.net" meta [IsParameterQuery = true, Type = type text, IsParameterQueryRequired = true];
shared FilterDate = #datetime(2025, 1, 1, 0, 0, 0) meta [IsParameterQuery = true, Type = type datetime, IsParameterQueryRequired = false];
```

- Parametertypes in M: `Text`, `True/False`, `Decimal Number`, `Date/Time`, `Date`, `Time`, `Date/Time/Timezone`, `Duration`, `Binary`, `Any`.
- Parameters moeten ook in `queriesMetadata` staan; zet `"parametric": true` in `queryMetadata.json` als de dataflow parameters aanbiedt.
- Bij een refresh kun je parameters overschrijven (zie [rest-api.md](rest-api.md#refresh-starten)); gebruik dan type `"Automatic"` zodat de engine het type afleidt.

## `try` en `try ... otherwise`

`try EXPR` geeft altijd een **record** terug:

| Uitkomst | Record |
|---|---|
| Gelukt | `[HasError = false, Value = <resultaat>]` |
| Mislukt | `[HasError = true, Error = [Reason, Message, Detail]]` |

```m
let
    r = try (1 + "a")
    // r[Error][Reason]  = "Expression.Error"
    // r[Error][Message] = "We cannot apply operator + to types Number and Text."
in
    r
```

`try EXPR otherwise TERUGVAL` geeft direct de terugvalwaarde, zonder record:

```m
let
    n = try Number.FromText("abc") otherwise 0
in
    n        // 0
```

## Fouten per cel

`Table.TransformColumnTypes(t, {{"A", Int64.Type}})` en `Table.TransformColumns(t, {{"A", Number.FromText}})` gedragen zich gelijk: een cel die niet te converteren is wordt een **foutwaarde** (`"We couldn't convert to Number."`), geen `null`.

Let op: in Arrow-/previewuitvoer verschijnen foutcellen als `null`. Dat lijkt op stil dataverlies.

```m
let
    t       = #table(type table [A = text], {{"1"}, {"abc"}, {"3"}}),
    Conv    = Table.TransformColumnTypes(t, {{"A", Int64.Type}}),
    Row0    = try Conv{0}[A],      // [HasError = false, Value = 1]
    Row1    = try Conv{1}[A]       // [HasError = true, Error[Message] = "We couldn't convert to Number."]
in
    {Row0, Row1}
```

Gevolgen verderop in de query:

- `Table.RowCount(Conv)` werkt (leest geen celwaarden).
- `Conv{1}[A]` gooit de celfout op.
- `Table.SelectRows(Conv, each [A] > 0)` faalt op rij 1.
- `List.Sum(Conv[A])` faalt op de eerste foutcel.

Herstelpatronen:

| Doel | Patroon |
|---|---|
| Foutcellen → `null` | `Table.ReplaceErrorValues(Conv, {{"A", null}})` |
| Foutcellen → vaste waarde | `Table.ReplaceErrorValues(Conv, {{"A", -1}})` |
| Rijen met fout weglaten | `Table.SelectRows(Conv, each not (try [A])[HasError])` |
| Afvangen per cel | `Table.TransformColumns(Conv, {{"A", each try _ otherwise null}})` |

## `each`-scope

`each EXPR` is een verkorte schrijfwijze voor `(_) => EXPR`. Wat `_` is, hangt af van de functie:

| Context | `_` is | `[Kol]` betekent |
|---|---|---|
| `Table.SelectRows(t, each ...)` | één **rij-record** | celwaarde |
| `Table.AddColumn(t, "X", each ...)` | één **rij-record** | celwaarde |
| `Table.Group(t, sleutels, {{"agg", each ..., type}})` | de **subtabel** van de groep | de **hele kolom als lijst** |
| `List.Transform(lijst, each ...)` | het huidige lijstelement | alleen geldig als het element een record is |

`[Kol]` is altijd hetzelfde als `_[Kol]`. Wat misgaat is het **type**: binnen `Table.Group` is het een lijst. Voor één cel indexeer je eerst de subtabel: `_{0}[Kol]` (niet `{0}[Kol]`, dat is een lijst-literal).

```m
let
    t = #table(type table [G = text, V = Int64.Type],
               {{"a", 1}, {"a", 2}, {"a", 3}, {"b", 10}, {"b", 20}}),
    G = Table.Group(t, {"G"}, {
        {"RowCount", each Table.RowCount(_), Int64.Type},
        {"SumV",     each List.Sum(_[V]),    Int64.Type},
        {"FirstV",   each _{0}[V],           Int64.Type}
    })
    // "a": RowCount=3, SumV=6,  FirstV=1
    // "b": RowCount=2, SumV=30, FirstV=10
in
    G
```

## Optionele velden

| Syntax | Ontbrekend veld |
|---|---|
| `r[key]` | Fout: `Expression.Error: "The field 'c' of the record wasn't found."` |
| `r[key]?` | `null` |
| `Record.FieldOrDefault(r, "key", terugval)` | `terugval` |

```m
let
    r     = [a = 1, b = 2],
    safe1 = r[c]?,                              // null
    safe2 = Record.FieldOrDefault(r, "c", -1)   // -1
in
    {safe1, safe2}
```

Gebruik `[?]` bij JSON of navigatietabellen waarin sleutels kunnen ontbreken.

## Geciteerde namen

Namen met spaties, leestekens of gereserveerde woorden (`type`, `section`, `error`, `let`, `if`, …) schrijf je als `#"..."`:

```m
let
    r = [#"weird name" = 1, #"type" = "x", normal = 2],
    a = r[#"weird name"],
    b = r[#"type"]
in
    {a, b}    // {1, "x"}
```

Dit geldt ook voor querynamen: `shared #"Sales Query" = ...;` hoort bij `"QueryName": "Sales Query"` in `executeQuery`.

## Eigen fouten maken

```m
// Kort: alleen tekst, Reason wordt "Expression.Error"
let r = try (error "boom!") in r
```

```m
// Recordvorm: eigen Reason en Detail
let r = try (error [Reason  = "MyReason",
                    Message = "MyMessage",
                    Detail  = [extra = "data", n = 99]]) in r
```

Ingebouwde fouten en `error "tekst"` hebben allebei `Reason = "Expression.Error"`. Wil je later op `Reason` filteren, gebruik dan de recordvorm.

## Niet bruikbare functies

| Functie | Wat er gebeurt | Alternatief |
|---|---|---|
| `File.Contents` | `Credentials are required to connect to the File source.` Er is geen File-credentialtype voor cloud-refresh van Dataflow Gen2 | Lakehouse (Files), Warehouse, OData of `Web.Contents` |
| `Web.BrowserContents` | In directe `executeQuery`: `The module named 'WebBrowserContents' has been disabled in this context.` | `Web.Contents` + `Html.Table`; browserweergave alleen via een gateway-verbinding |
| `Web.Page` | In directe `executeQuery`: `The module named 'Html' has been disabled in this context.` | Idem |

Een lokaal netwerkpad of een Excel-bestand op je eigen schijf werkt dus niet in een cloud-refresh. Zet het bestand in SharePoint of in Lakehouse Files.

## Voorbeelden magazijn

> **Voorbeeld.** Deze queries gebruiken `#table`-testdata zodat je ze zonder verbinding met `executeQuery` kunt proberen. Vervang de stap `Bron` door je echte bronstap (bijvoorbeeld de navigatie die de Power Query-editor voor je SharePoint-lijst of Excel-bestand genereert). Functienamen van de bronstap staan in [connectoren-en-verbindingen.md](connectoren-en-verbindingen.md).

### SharePoint-lijst opschonen

Lijstkolommen van het type keuze/opzoeken komen vaak binnen als record. Haal de waarde er null-veilig uit, hernoem en typ.

```m
section Section1;

shared PalletLocaties = let
    Bron = #table(
        type table [Title = text, Locatie = record, Aangemaakt = text],
        {
            {"Pallet 001", [Value = "Hal A"], "2026-10-01T08:15:00"},
            {"Pallet 002", null, "2026-10-01T09:40:00"}
        }),
    LocatieTekst = Table.TransformColumns(Bron,
        {{"Locatie", each if _ = null then null else Record.FieldOrDefault(_, "Value", null), type text}}),
    Hernoemd = Table.RenameColumns(LocatieTekst, {{"Title", "Palletnummer"}}),
    Getypt = Table.TransformColumnTypes(Hernoemd, {{"Aangemaakt", type datetime}})
in
    Getypt;
```

### ERP-export opschonen en typen

Artikelcodes trimmen en in hoofdletters zetten, aantallen en datums typen, conversiefouten naar `null`.

```m
section Section1;

shared Orders = let
    Bron = #table(
        type table [Ordernummer = text, Artikel = text, Aantal = text, Leverdatum = text],
        {
            {"SO-1001", " MX-200 ", "5", "2026-10-01"},
            {"SO-1002", "MX-310", "abc", "2026-10-03"},
            {"SO-1003", "mx-200", "12", "2026-10-07"}
        }),
    Opgeschoond = Table.TransformColumns(Bron, {{"Artikel", each Text.Upper(Text.Trim(_)), type text}}),
    Getypt = Table.TransformColumnTypes(Opgeschoond, {{"Aantal", Int64.Type}, {"Leverdatum", type date}}),
    FoutenNaarNull = Table.ReplaceErrorValues(Getypt, {{"Aantal", null}})
in
    FoutenNaarNull;
```

### Orders koppelen aan leveringen

Leveringen per order optellen (`Table.Group`, hier is `[Geleverd]` een lijst), links samenvoegen met de orders, openstaand aantal en op-tijd-vlag berekenen. Na `Table.ExpandTableColumn` zijn de nieuwe kolommen ongetypt; typ ze opnieuw als het resultaat naar een bestemming gaat.

```m
section Section1;

shared Orders = let
    Bron = #table(
        type table [Ordernummer = text, Aantal = Int64.Type, Leverdatum = date],
        {
            {"SO-1001", 5, #date(2026, 10, 1)},
            {"SO-1002", 8, #date(2026, 10, 3)},
            {"SO-1003", 12, #date(2026, 10, 7)}
        })
in
    Bron;

shared Leveringen = let
    Bron = #table(
        type table [Ordernummer = text, Geleverd = Int64.Type, Ontvangstdatum = date],
        {
            {"SO-1001", 5, #date(2026, 10, 2)},
            {"SO-1003", 4, #date(2026, 10, 6)},
            {"SO-1003", 6, #date(2026, 10, 9)}
        })
in
    Bron;

shared LeverStatus = let
    PerOrder = Table.Group(Leveringen, {"Ordernummer"}, {
        {"TotaalGeleverd", each List.Sum([Geleverd]), Int64.Type},
        {"LaatsteOntvangst", each List.Max([Ontvangstdatum]), type date}
    }),
    Samengevoegd = Table.NestedJoin(Orders, {"Ordernummer"}, PerOrder, {"Ordernummer"}, "Lev", JoinKind.LeftOuter),
    Uitgevouwen = Table.ExpandTableColumn(Samengevoegd, "Lev", {"TotaalGeleverd", "LaatsteOntvangst"}),
    Getypt = Table.TransformColumnTypes(Uitgevouwen, {{"TotaalGeleverd", Int64.Type}, {"LaatsteOntvangst", type date}}),
    Openstaand = Table.AddColumn(Getypt, "Openstaand",
        each [Aantal] - (if [TotaalGeleverd] = null then 0 else [TotaalGeleverd]), Int64.Type),
    OpTijd = Table.AddColumn(Openstaand, "OpTijd",
        each if [LaatsteOntvangst] = null then false else [LaatsteOntvangst] <= [Leverdatum], type logical)
in
    OpTijd;
```

Combineer je echte bronnen (bijvoorbeeld SharePoint en SQL) in één document, zet dan `[AllowCombine = true]` vóór `section Section1;` en koppel beide verbindingen in `connections[]`.

## Checklist M

- Elke expressie die een celfout kan geven: `try` vóór je de waarde leest.
- Optionele velden: `[?]` of `Record.FieldOrDefault`.
- Namen met spaties of gereserveerde woorden: `#"..."`.
- `Table.Group`: `[Kol]` is een lijst; één cel = `_{0}[Kol]`.
- Een `null` in de preview kan een foutcel zijn; test met `try Stap{i}[Kol]`.
- Kolommen die naar een bestemming gaan: expliciet typen.
