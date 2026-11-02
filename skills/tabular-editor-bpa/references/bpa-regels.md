# BPA-regels: naslag

Detail bij [SKILL.md](../SKILL.md). Bronnen: `bpa-rules` (quick-reference, rule-schema, expression-syntax, tmdl-annotations, te-compatibility).

## Inhoud

1. [Velden](#velden)
2. [Scopes](#scopes)
3. [Severity en CompatibilityLevel](#severity-en-compatibilitylevel)
4. [Expressiesyntax](#expressiesyntax)
5. [Eigenschappen per objecttype](#eigenschappen-per-objecttype)
6. [Veelgebruikte patronen](#veelgebruikte-patronen)
7. [FixExpression](#fixexpression)
8. [Tokenize, DependsOn, ReferencedBy, outerIt](#tokenize-dependson-referencedby-outerit)
9. [BPA in TMDL en model.bim](#bpa-in-tmdl-en-modelbim)
10. [Locaties en volgorde](#locaties-en-volgorde)
11. [Ingebouwde TE3-regels](#ingebouwde-te3-regels)
12. [Bestaande regelsets](#bestaande-regelsets)

## Velden

| Veld | Type | Toelichting |
|---|---|---|
| `ID` | string | Uniek. Conventie `PREFIX_BESCHRIJVENDE_NAAM` in SCREAMING_SNAKE_CASE |
| `Name` | string | Kort en beschrijvend, techniek hoort in `Description` |
| `Category` | string | Standaard: `DAX Expressions`, `Metadata`, `Performance`, `Naming Conventions`, `Model Layout`, `Formatting`; eigen categorieën mogen |
| `Description` | string | Leg het *waarom* uit; geef herstelinstructie als er geen fix is; houd het onder ~200 tekens. Placeholders: `%object%`, `%objectname%`, `%objecttype%` |
| `Severity` | int | 1, 2 of 3 |
| `Scope` | string | Kommagescheiden objecttypen |
| `Expression` | string | Dynamic LINQ; `true` = overtreding |
| `FixExpression` | string of null | Toewijzing of methodeaanroep |
| `CompatibilityLevel` | int | Standaard 1200 |
| `Source` | string | Herkomst, bijv. "Internal: Data Team" |
| `Remarks` | string | Bekende false positives, beperkingen |

Een regelbestand is een JSON-array: `[ { "ID": "RULE_1", ... }, { "ID": "RULE_2", ... } ]`.

ID-prefixen per categorie:

| Prefix | Categorie |
|---|---|
| `DAX_` | DAX Expressions |
| `META_` | Metadata |
| `PERF_` | Performance |
| `NAME_` | Naming Conventions |
| `LAYOUT_` | Model Layout |
| `FORMAT_` | Formatting |
| `ERR_` | Error Prevention |
| `GOV_` | Governance |
| `MAINT_` | Maintenance |

## Scopes

| Scope | Objecten |
|---|---|
| `Model` | Het hele model |
| `Table` | Gewone tabellen (niet berekend) |
| `CalculatedTable` | Tabellen gedefinieerd met DAX |
| `Measure` | Measures |
| `DataColumn` | Kolommen uit de bron |
| `CalculatedColumn` | Berekende kolommen |
| `CalculatedTableColumn` | Kolommen in berekende tabellen |
| `Hierarchy`, `Level` | Hiërarchieën en niveaus |
| `Relationship` | Relaties (SingleColumnRelationship) |
| `Partition` | Partities |
| `Perspective`, `Culture` | Perspectieven, vertalingen |
| `KPI` | KPI's |
| `CalculationGroup`, `CalculationItem` | Calculation groups en items |
| `ProviderDataSource`, `StructuredDataSource` | Databronnen (legacy / M) |
| `NamedExpression` | Gedeelde M-expressies |
| `ModelRole`, `ModelRoleMember`, `TablePermission` | Beveiliging |
| `Variation`, `Calendar`, `UserDefinedFunction` | Variaties, kalenders, DAX-UDF's |

Achterwaarts compatibel: `Column` = `DataColumn, CalculatedColumn, CalculatedTableColumn`; `DataSource` = `ProviderDataSource`.

Veelgemaakte fouten: `Role` → `ModelRole`, `Member` → `ModelRoleMember`, `Expression` → `NamedExpression`.

## Severity en CompatibilityLevel

| Severity | Niveau | Gebruik |
|---|---|---|
| 1 | Low / informatief | Suggestie, stijl |
| 2 | Medium / waarschuwing | Moet je oplossen voor kwaliteit |
| 3 | High / fout | Moet opgelost; correctheid |

Een regel geldt alleen als het compatibiliteitsniveau van het model ≥ `CompatibilityLevel`.

| Niveau | Platform | Nieuw |
|---|---|---|
| 1200 | AAS/SSAS 2016 | JSON-metadata, basis-TOM |
| 1400 | AAS/SSAS 2017 | Detail rows, OLS, ragged hierarchies |
| 1500 | AAS/SSAS 2019 | Calculation groups |
| 1560+ | Power BI | Power BI-specifieke features |
| 1600 | SQL Server 2022 | Uitbreidingen AS |
| 1702 | Power BI / Fabric | Dynamische format strings, veldparameters, DAX-UDF's |

In een expressie lees je het niveau met `Model.Database.CompatibilityLevel`.

## Expressiesyntax

BPA-expressies zijn Dynamic LINQ op het TOM.

```csharp
// Tekst
string.IsNullOrWhitespace(Description)
string.IsNullOrEmpty(Expression)
Expression.Contains("CALCULATE")
Name.StartsWith("_")
Name.EndsWith("ID")
Expression.IndexOf("TODO", StringComparison.OrdinalIgnoreCase) >= 0
RegEx.IsMatch(Name, "^[A-Z][a-z]+")

// Booleans (and / or / not)
IsHidden
not IsHidden
IsHidden and ReferencedBy.Count = 0
(IsHidden or Table.IsHidden) and ReferencedBy.Count = 0

// Getallen
ReferencedBy.Count = 0
Columns.Count >= 10 and Columns.Count <= 50

// Collecties
DependsOn.Any()
Columns.Any(IsHidden)
Columns.All(IsHidden)
Columns.Count(IsHidden) > 5
Columns.Where(not IsHidden).Count() > 100

// Ouder/kind
Table.Name
Table.IsHidden
Table.Measures.Any()
```

**Regex in TE:** schrijf `"FILTER\\s*\\(\\s*ALL"` (gewone escaping, geen `@`), en hoofdletterongevoelig met `(?i)` in het patroon, niet met `RegexOptions.IgnoreCase`.

Tips uit de bron:

1. Bouw complexe expressies stapsgewijs op.
2. Zet haakjes expliciet.
3. Gebruik `string.IsNullOrWhitespace()` voor strings die null kunnen zijn.
4. Kolomregels gelden voor alle kolomtypen.
5. Complexe expressies maken de BPA-scan trager.
6. Gebruik `Tokenize()` voor DAX-analyse; dat is preciezer dan zoeken op tekst.
7. Gebruik liever `DependsOn` dan zoeken op tekst.

## Eigenschappen per objecttype

| Object | Eigenschappen |
|---|---|
| Model | `Name`, `Tables`, `Relationships`, `Perspectives`, `Cultures`, `Roles`, `DataSources` |
| Table | `Name`, `Description`, `IsHidden`, `IsPrivate`, `Columns`, `Measures`, `Hierarchies`, `Partitions`, `CalculationGroup`, `ObjectType` |
| Column | `Name`, `Description`, `DataType`, `SourceColumn`, `Expression`, `FormatString`, `DisplayFolder`, `IsHidden`, `IsKey`, `IsNullable`, `IsAvailableInMDX`, `SummarizeBy`, `SortByColumn`, `Table`, `ReferencedBy`, `DependsOn`, `UsedInRelationships`, `UsedInSortBy`, `UsedInHierarchies`, `ObjectType` |
| Measure | `Name`, `Description`, `Expression`, `FormatString`, `DisplayFolder`, `IsHidden`, `IsSimpleMeasure`, `Table`, `ReferencedBy`, `DependsOn`, `KPI`, `ObjectType` |
| Hierarchy | `Name`, `Description`, `DisplayFolder`, `IsHidden`, `Levels`, `Table` |
| Relationship | `FromTable`, `FromColumn`, `ToTable`, `ToColumn`, `FromCardinality`, `ToCardinality`, `CrossFilteringBehavior`, `IsActive`, `SecurityFilteringBehavior` |
| Partition | `Name`, `Description`, `Expression`, `SourceType`, `Table`, `Mode` |
| CalculationItem | `Name`, `Description`, `Expression`, `FormatStringExpression`, `Ordinal`, `CalculationGroup` |

`IsVisible` is ook beschikbaar (de voorbeeldregels gebruiken het naast `IsHidden`).

## Veelgebruikte patronen

```csharp
// Ongebruikte verborgen kolom
IsHidden and ReferencedBy.Count = 0 and not UsedInRelationships.Any()

// Zichtbaar zonder display folder
not IsHidden and string.IsNullOrWhitespace(DisplayFolder)

// Deling zonder DIVIDE (grof; Tokenize-versie is preciezer)
Expression.Contains("/") and not Expression.Contains("DIVIDE")

// Naam begint met cijfer / bevat speciale tekens
RegEx.IsMatch(Name, "^[0-9]")
RegEx.IsMatch(Name, "[^a-zA-Z0-9 _-]")

// Te brede tabel / veel berekende kolommen
Columns.Count > 100
Columns.Count(ObjectType = "CalculatedColumn") > 10

// Bidirectionele relatie
CrossFilteringBehavior = CrossFilteringBehavior.BothDirections
```

## FixExpression

```csharp
Description = "TODO: Add description"
DisplayFolder = "Measures\\Calculated"
IsHidden = true
IsAvailableInMDX = false
DataType = DataType.Decimal
SummarizeBy = AggregateFunction.None
CrossFilteringBehavior = CrossFilteringBehavior.OneDirection
FormatString = "#,##0"
Delete()          // voorzichtig!
```

Enumwaarden:

| Enum | Waarden |
|---|---|
| `DataType` | `Unknown`, `String`, `Int64`, `Double`, `DateTime`, `Decimal`, `Boolean`, `Binary`, `Variant` |
| `AggregateFunction` | `Default`, `None`, `Sum`, `Min`, `Max`, `Count`, `Average`, `DistinctCount` |
| `CrossFilteringBehavior` | `OneDirection`, `BothDirections`, `Automatic` |

Laat `FixExpression` leeg (`null` of weglaten) als de fix oordeel vraagt, er meerdere goede oplossingen zijn of dataverlies dreigt.

## Tokenize, DependsOn, ReferencedBy, outerIt

### `Tokenize()`

```csharp
// Deling door iets anders dan een constante
Tokenize().Any(Type = DIV and Next.Type <> INTEGER_LITERAL and Next.Type <> REAL_LITERAL)
// Functie gebruikt
Tokenize().Any(Type = FUNCTION and Text = "SUMX")
// FILTER(ALL(...))
Tokenize().Any(Type = FUNCTION and Text = "FILTER" and Next.Next.Type = FUNCTION and Next.Next.Text = "ALL")
// Geneste CALCULATE
Tokenize().Count(Type = FUNCTION and Text = "CALCULATE") > 1
```

Tokentypen: `FUNCTION`, `COLUMN_OR_MEASURE`, `TABLE`, `INTEGER_LITERAL`, `REAL_LITERAL`, `STRING_LITERAL`, `DIV`, `MULT`, `PLUS`, `MINUS`, `EQ`, `OPEN_PARENS`, `CLOSE_PARENS`, `COMMA`. Eigenschappen: `Type`, `Text`, `Next`, `Previous`.

### `DependsOn`

```csharp
DependsOn.Any(Key.ObjectType = "Column")
DependsOn.Any(Key.ObjectType = "Column" and Value.Any(not FullyQualified))   // kolom zonder tabelnaam
DependsOn.Any(Key.ObjectType = "Measure" and Value.Any(FullyQualified))      // measure mét tabelnaam
```

### `ReferencedBy`

```csharp
ReferencedBy.Count = 0
ReferencedBy.AllMeasures.Any(not IsHidden)
ReferencedBy.Roles.Any()
(IsHidden or Table.IsHidden) and
not ReferencedBy.AllMeasures.Any(not IsHidden) and
not ReferencedBy.AllColumns.Any(not IsHidden)
```

Subcollecties: `AllMeasures`, `AllColumns`, `AllTables`, `Roles`.

### `outerIt`

Verwijst in een geneste expressie naar het buitenste object:

```csharp
Model.Relationships.Any(FromColumn = outerIt)
Model.Relationships.Count(FromTable = OuterIt.FromTable and ToTable = OuterIt.ToTable) > 1
```

## BPA in TMDL en model.bim

Drie annotaties op modelniveau in `definition/model.tmdl`:

| Annotatie | Inhoud |
|---|---|
| `BestPracticeAnalyzer` | JSON-array met inline-regels (zelfde schema als een regelbestand) |
| `BestPracticeAnalyzer_IgnoreRules` | `{"RuleIDs":[...]}` – regels die voor dit model niet gelden |
| `BestPracticeAnalyzer_ExternalRuleFiles` | JSON-array met URL's naar regelbestanden |

```tmdl
annotation BestPracticeAnalyzer_IgnoreRules = {"RuleIDs":["DAX_DIVISION_COLUMNS","META_AVOID_FLOAT"]}

annotation BestPracticeAnalyzer_ExternalRuleFiles = ["https://raw.githubusercontent.com/TabularEditor/BestPracticeRules/master/BPARules-standard-lax.json"]

annotation BestPracticeAnalyzer =
        [
          {
            "ID": "CUSTOM_RULE_1",
            "Name": "Custom rule name",
            "Category": "Custom",
            "Severity": 1,
            "Scope": "Measure",
            "Expression": "string.IsNullOrWhitespace(Description)"
          }
        ]
```

Op objectniveau (alleen dat object wordt uitgezonderd):

```tmdl
    measure 'Customer Count' =
            COUNTROWS(Customers)
        formatString: #,##0
        annotation BestPracticeAnalyzer_Ignore = {"RuleIDs":["META_MEASURE_NO_DESCRIPTION"]}
```

In `model.bim` staan inline-regels in `model.annotations` als `{ "name": "BestPracticeAnalyzer", "value": "[{...}]" }`.

Bekende externe bestanden: `BPARules-standard.json` (streng) en `BPARules-standard-lax.json` (soepeler).

Advies uit de bron: standaardregels via externe bestanden, modelspecifieke regels inline, genegeerde regels documenteren, annotaties in versiebeheer, JSON valideren voor opslaan.

## Locaties en volgorde

| Locatie | Pad / bron |
|---|---|
| Ingebouwd (TE3) | In de applicatie |
| URL | Elke geldige URL |
| In het model | Annotaties (zie hierboven) |
| Lokale gebruiker | `%LocalAppData%\TabularEditor3\BPARules.json` |
| Lokale machine | `%ProgramData%\TabularEditor3\BPARules.json` |

Bij dezelfde ID op meerdere plekken winnen lokale regels van remote/ingebouwde. Werk je op macOS met Windows in Parallels: de bestanden staan onder `<ParallelsRoot>/Users/<WinUser>/AppData/Local/TabularEditor3/BPARules.json`; in WSL onder `/mnt/c/Users/<username>/AppData/Local/TabularEditor3/`. De VM moet daarvoor draaien.

## Ingebouwde TE3-regels

Instellen in `%LocalAppData%\TabularEditor3\Preferences.json`: `BuiltInBpaRules` (`"Enable"`, `"Disable"`, `"EnableWithWarnings"`) en `DisabledBuiltInRuleIds` (array).

| ID | Onderwerp |
|---|---|
| `TE3_BUILT_IN_DATA_COLUMN_SOURCE` | Datakolom heeft bronkolom |
| `TE3_BUILT_IN_EXPRESSION_REQUIRED` | Berekend object heeft expressie |
| `TE3_BUILT_IN_AVOID_PROVIDER_PARTITIONS_STRUCTURED` | Geen provider-partities bij structured sources |
| `TE3_BUILT_IN_SET_ISAVAILABLEINMDX_FALSE` | `IsAvailableInMdx` uit waar niet nodig |
| `TE3_BUILT_IN_DATE_TABLE_EXISTS` | Datumtabel aanwezig |
| `TE3_BUILT_IN_MANY_TO_MANY_SINGLE_DIRECTION` | Many-to-many in één richting |
| `TE3_BUILT_IN_RELATIONSHIP_SAME_DATATYPE` | Relatiekolommen zelfde datatype |
| `TE3_BUILT_IN_AVOID_INVALID_CHARACTERS_NAMES` | Geen ongeldige tekens in namen |
| `TE3_BUILT_IN_AVOID_INVALID_CHARACTERS_DESCRIPTIONS` | Geen ongeldige tekens in descriptions |
| `TE3_BUILT_IN_SET_ISAVAILABLEINMDX_TRUE_NECESSARY` | `IsAvailableInMdx` aan alleen waar nodig |
| `TE3_BUILT_IN_REMOVE_UNUSED_DATA_SOURCES` | Ongebruikte databronnen weg |
| `TE3_BUILT_IN_VISIBLE_TABLES_NO_DESCRIPTION` | Zichtbare tabellen hebben description |
| `TE3_BUILT_IN_VISIBLE_COLUMNS_NO_DESCRIPTION` | Zichtbare kolommen hebben description |
| `TE3_BUILT_IN_VISIBLE_MEASURES_NO_DESCRIPTION` | Zichtbare measures hebben description |
| `TE3_BUILT_IN_VISIBLE_CALCULATION_GROUPS_NO_DESCRIPTION` | Zichtbare calculation groups hebben description |
| `TE3_BUILT_IN_VISIBLE_UDF_NO_DESCRIPTION` | Zichtbare UDF's hebben description |
| `TE3_BUILT_IN_PERSPECTIVES_NO_OBJECTS` | Perspectieven bevatten objecten |
| `TE3_BUILT_IN_CALCULATION_GROUPS_NO_ITEMS` | Calculation groups hebben items |
| `TE3_BUILT_IN_TRIM_OBJECT_NAMES` | Namen zonder spaties aan begin/eind |
| `TE3_BUILT_IN_FORMAT_STRING_COLUMNS` | Kolommen hebben format string |
| `TE3_BUILT_IN_TRANSLATE_DISPLAY_FOLDERS` | Display folders vertaald |
| `TE3_BUILT_IN_TRANSLATE_DESCRIPTIONS` | Descriptions vertaald |
| `TE3_BUILT_IN_TRANSLATE_VISIBLE_NAMES` | Zichtbare namen vertaald |
| `TE3_BUILT_IN_TRANSLATE_HIERARCHY_LEVELS` | Hiërarchieniveaus vertaald |
| `TE3_BUILT_IN_TRANSLATE_PERSPECTIVES` | Perspectieven vertaald |
| `TE3_BUILT_IN_SPECIFY_APPLICATION_NAME` | Application name opgegeven |
| `TE3_BUILT_IN_POWERBI_LATEST_COMPATIBILITY` | Nieuwste Power BI-compatibiliteitsniveau |

Gebruik je geen vertalingen, dan zijn de `TRANSLATE_*`-regels kandidaten om uit te zetten.

## Bestaande regelsets

| Set | Inhoud |
|---|---|
| `examples/bpa/comprehensive-rules.json` (in deze skill) | 31 regels in DAX, Metadata, Performance, Layout, Naming, Formatting, Governance |
| Microsoft Analysis Services BPA-regels | 71 regels in het voorbeeldbestand van de bron (de README noemt 77), onderhouden door Michael Kovalsky (Fabric CAT); bron: https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules. Rechtstreeks te laden via `https://raw.githubusercontent.com/microsoft/Analysis-Services/master/BestPracticeRules/BPARules.json` |
| TabularEditor/BestPracticeRules | `BPARules-standard.json`, `BPARules-standard-lax.json` |

Uit de Microsoft-set, met een FixExpression:

| ID | Fix |
|---|---|
| `AVOID_FLOATING_POINT_DATA_TYPES` | `DataType = DataType.Decimal` |
| `ISAVAILABLEINMDX_FALSE_NONATTRIBUTE_COLUMNS` | `IsAvailableInMDX = false` |
| `NUMERIC_COLUMN_SUMMARIZE_BY` | `SummarizeBy = AggregateFunction.None` |
| `HIDE_FOREIGN_KEYS` | `IsHidden = true` |
| `MARK_PRIMARY_KEYS` | `IsKey = true` |
| `INTEGER_FORMATTING` | `FormatString = "#,0"` |
| `UNNECESSARY_COLUMNS` / `UNNECESSARY_MEASURES` | `Delete()` |
| `REMOVE_ROLES_WITH_NO_MEMBERS` | `Delete()` |

Let op: sommige Microsoft-regels gebruiken VertiPaq Analyzer-annotaties (cardinaliteit). Zonder die statistieken leveren ze niets op. In de `te`-CLI geef je die mee met `--vpax <file>`.
