# C#-scripting in Tabular Editor: naslag

Detail bij [SKILL.md](../SKILL.md). Bron: `c-sharp-scripting` (SKILL.md, references, object-types, examples).

## Inhoud

1. [Omgeving en C#-versie](#omgeving-en-c-versie)
2. [Scripts uitvoeren](#scripts-uitvoeren)
3. [Objectmodel](#objectmodel)
4. [LINQ](#linq)
5. [Helpermethoden](#helpermethoden)
6. [Patronen](#patronen)
7. [Annotaties](#annotaties)
8. [Macros](#macros)
9. [Dialoogvensters (WinForms)](#dialoogvensters-winforms)
10. [Debuggen](#debuggen)
11. [TE2/TE3-compatibiliteit](#te2te3-compatibiliteit)
12. [Goede gewoonten](#goede-gewoonten)

## Omgeving en C#-versie

| Omgeving | C#-versie |
|---|---|
| Tabular Editor 2 | Standaardcompiler, oudere syntax |
| Tabular Editor 3 | Roslyn, tot C# 12 (VS2022) |
| TE2 met Roslyn | Instelbaar via **File > Preferences > General** (pad naar Roslyn-compiler) |

Automatisch geïmporteerd:

```csharp
using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using TabularEditor.TOMWrapper;
using TabularEditor.TOMWrapper.Utils;
using TabularEditor.UI;
```

Standaard geladen assemblies: `System.Dll`, `System.Core.Dll`, `System.Data.Dll`, `System.Windows.Forms.Dll`, `Microsoft.Csharp.Dll`, `Newtonsoft.Json.Dll`, `TomWrapper.Dll`, `TabularEditor.Exe`, `Microsoft.AnalysisServices.Tabular.Dll`.

Extra assemblies helemaal bovenaan het bestand, daarna pas `using`:

```csharp
#r "System.IO.Compression"
#r "System.Drawing"

using System.IO.Compression;
using System.Drawing;
```

In de `te`-CLI moet je `using System.Data/IO/Text/Text.RegularExpressions;` zelf toevoegen.

## Scripts uitvoeren

| Waar | Hoe |
|---|---|
| TE2/TE3 IDE | Script openen/plakken en uitvoeren; werkt op het geladen model en op `Selected` |
| TE2 CLI | `TabularEditor.exe Model.bim -S script.csx -B Model.bim` (opslaan met `-B` of `-TMDL`) |
| `te`-CLI | `te script --file script.csx --model ./model` (dry run), daarna met `--save` |

Bronnen waarmee je kunt verbinden:

| Type | Voorbeeld |
|---|---|
| XMLA (workspace/model) | `"Sales WS/Sales Model"` of `"powerbi://api.powerbi.com/v1.0/myorg/Workspace" "Model"` |
| Lokale BIM | `./model.bim` |
| Lokale TMDL | `./MyModel.SemanticModel/definition/` |
| Power BI Desktop | `localhost:PORT` (alleen Windows) |

Voor XMLA naar de service moet XMLA read/write op de capaciteit (Premium/Fabric) aanstaan; in automatisering gebruik je een service principal (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`). Als je geen tenantbeheerder bent, regel je dat met je beheerder; zie ook fabric-basis.

## Objectmodel

```csharp
Model                           // root
Model.Tables / Model.Tables["Sales"]
Model.AllMeasures / Model.AllColumns
Model.Relationships / Model.Roles
Model.CalculationGroups / Model.Perspectives / Model.Cultures
Model.Expressions               // gedeelde M-queries
Model.DataSources
```

`Selected` (alleen in de IDE):

```csharp
Selected.Tables / Selected.Measures / Selected.Columns / Selected.Hierarchies   // meervoud: veilig, ook als leeg
Selected.Table / Selected.Measure / Selected.Column                              // enkelvoud: fout als niet precies één
Selected.Measures.DisplayFolder = "Test";      // eigenschap op alle geselecteerde objecten
Selected.Columns.IsHidden = true;
Selected.Measures.Rename("Amount", "Value");   // naam-patroon vervangen
```

Selecteer je een display folder, dan horen alle onderliggende objecten bij de selectie.

| Object | Toegang | Belangrijke eigenschappen |
|---|---|---|
| Model | `Model` | `.Tables`, `.AllMeasures`, `.Relationships`, `.DiscourageImplicitMeasures` |
| Table | `Model.Tables["Name"]` | `.Measures`, `.Columns`, `.Partitions`, `.IsHidden`, `.Description` |
| Measure | `Table.Measures["Name"]` | `.Expression`, `.FormatString`, `.DisplayFolder`, `.Description`, `.IsHidden`, `.DetailRowsExpression`, `.DaxObjectFullName`, `.DaxObjectName` |
| Column | `Table.Columns["Name"]` | `.DataType`, `.FormatString`, `.IsHidden`, `.IsKey`, `.SummarizeBy`, `.SortByColumn`, `.DataCategory`, `.IsAvailableInMDX`, `.SourceColumn`, `.Type` |
| Relationship | `Model.Relationships` | `.FromTable`, `.ToTable`, `.IsActive`, `.CrossFilteringBehavior` |
| Role | `Model.Roles["Name"]` | `.Members`, `.TablePermissions` |
| Hierarchy | `Table.Hierarchies` | `.Levels`, `.DisplayFolder`, `.IsHidden` |
| Partition | `Table.Partitions` | `.Expression`, `.SourceType`, `.DataSource` |
| Perspective | `Model.Perspectives` | objecten hebben `.InPerspective["Naam"]` |
| Culture | `Model.Cultures` | objecten hebben `.TranslatedNames["cultuur"]` |

Methoden die je vaak nodig hebt:

| Methode | Doel |
|---|---|
| `Table.AddMeasure(naam)` / `Table.AddMeasure(naam, expressie)` / `(naam, expressie, displayFolder)` | Measure maken |
| `Table.AddCalculatedColumn(naam, expressie)` | Berekende kolom |
| `Measure.Delete()` / `Column.Delete()` | Verwijderen |
| `Measure.FormatDax()` | DAX formatteren |
| `Measure.Clone(...)` | Kopie maken (zie `move-measures-to-table.csx`) |
| `Model.AddCalculationGroup(naam)` / `cg.AddCalculationItem(naam, expressie)` | Calculation group |
| `Model.AddRole(naam)` / `role.AddTablePermission(tabel)` | Rol en RLS-filter |

Kolomtypen: `ColumnType.Data`, `ColumnType.Calculated`, `ColumnType.RowNumber` (sla die laatste over: `table.Columns.Where(c => c.Type != ColumnType.RowNumber)`).

## LINQ

| Methode | Voorbeeld |
|---|---|
| `Where` | `.Where(m => m.Name.Contains("YTD"))` |
| `First` / `FirstOrDefault` | `.FirstOrDefault(t => t.Name == "Sales")` |
| `Any` / `All` | `.Any(m => m.IsHidden)` |
| `Count` | `.Count(m => !m.IsHidden)` |
| `Select` | `.Select(m => m.Name)` |
| `OrderBy` / `OrderByDescending` | `.OrderBy(m => m.Name)` |
| `ToList` | `.Where(...).ToList()` – nodig als je in de lus objecten verwijdert of verplaatst |
| `ForEach` | `.ForEach(m => m.IsHidden = true)` |

```csharp
Model.AllMeasures
    .Where(m => m.Name.Contains("Revenue"))
    .Where(m => string.IsNullOrEmpty(m.FormatString))
    .ForEach(m => m.FormatString = "$#,0");

var dateTable = Model.Tables.FirstOrDefault(t => t.DataCategory == "Time");
```

## Helpermethoden

| Methode | Doel |
|---|---|
| `Info(msg)` / `Warning(msg)` / `Error(msg)` | Melding; `Error` stopt het script. In de CLI naar de console; `Info` verwacht een string |
| `Output(obj)` | Inspector: scalar, één object (bewerkbaar property grid), collectie of `DataTable` |
| `SaveFile(pad, inhoud)` / `ReadFile(pad)` | Bestanden |
| `ExportProperties(objecten, "Name,Expression,FormatString")` / `ImportProperties(tsv)` | Eigenschappen naar/van TSV (handig om in Excel te bewerken) |
| `SelectMeasure()`, `SelectTable(...)`, `SelectColumn(...)`, `SelectObject(...)`, `SelectObjects(...)` | Keuzedialoog (alleen IDE; werkt niet in de CLI) |
| `measure.FormatDax()` / `Model.AllMeasures.FormatDax()` / `CallDaxFormatter()` | DAX formatteren (in de wachtrij of direct) |
| `ConvertDax(dax, useSemicolons: true)` | Komma- ↔ puntkomma-notatie |
| `EvaluateDax(...)`, `ExecuteDax(...)`, `ExecuteReader(...)` | DAX uitvoeren (alleen met verbinding naar een draaiend model) |
| `ExecuteCommand(tmsl)` / `ExecuteCommand(xmla, isXmla: true)` | TMSL/XMLA uitvoeren |
| `CustomAction("Naam")` / `CustomAction(Selected.Measures, "Naam")` | Macro aanroepen |

Eigenschappen exporteren en terugzetten:

```csharp
var tsv = ExportProperties(Model.AllMeasures, "Name,Expression,FormatString");
SaveFile("measures.tsv", tsv);
// ... bewerken ...
ImportProperties(ReadFile("measures.tsv"));
```

Overzicht als tabel:

```csharp
var dt = new System.Data.DataTable();
dt.Columns.Add("Name");
dt.Columns.Add("Expression");
foreach(var m in Model.AllMeasures) {
    dt.Rows.Add(m.Name, m.Expression);
}
Output(dt);
```

## Patronen

### Format strings in bulk

```csharp
foreach(var m in Model.AllMeasures) {
    if(m.Name.Contains("Revenue")) m.FormatString = "$#,0";
    if(m.Name.Contains("Rate")) m.FormatString = "0.00%";
}
```

**Voorbeeld (magazijn):** percentages en aantallen op basis van de naam.

```csharp
var n = 0;
foreach(var m in Model.AllMeasures.Where(m => string.IsNullOrEmpty(m.FormatString))) {
    if(m.Name.EndsWith("%")) { m.FormatString = "0.0%"; n++; }
    else if(m.Name.StartsWith("Aantal")) { m.FormatString = "#,0"; n++; }
}
Info("Format string gezet op " + n + " measures");
```

### Display folders en hulpmeasures

```csharp
foreach(var m in Model.AllMeasures) {
    if(m.Name.Contains("YTD")) m.DisplayFolder = "Time Intelligence";
    else if(m.Name.StartsWith("_")) m.DisplayFolder = "_Supporting";
}
foreach(var m in Model.AllMeasures.Where(m => m.Name.StartsWith("_"))) {
    m.IsHidden = true;
}
```

### Sleutelkolommen verbergen

```csharp
foreach(var t in Model.Tables) {
    foreach(var c in t.Columns.Where(c => c.Name.EndsWith("Key"))) {
        c.IsHidden = true;
    }
}
```

### Time intelligence van één basis-measure

```csharp
var baseMeasure = Model.Tables["Metrics"].Measures["Sales Amount"];
var table = baseMeasure.Table;
var ytd = table.AddMeasure(
    baseMeasure.Name + " YTD",
    "CALCULATE([" + baseMeasure.Name + "], DATESYTD('Date'[Date]))"
);
ytd.FormatString = baseMeasure.FormatString;
ytd.DisplayFolder = "Time Intelligence";
```

### Calculation group

```csharp
var cg = Model.AddCalculationGroup("Time Intelligence");
cg.Precedence = 10;
var ytd = cg.AddCalculationItem("YTD", "CALCULATE(SELECTEDMEASURE(), DATESYTD('Date'[Date]))");
var prior = cg.AddCalculationItem("Prior Year");
prior.Expression = @"
CALCULATE(
    SELECTEDMEASURE(),
    DATEADD('Date'[Date], -1, YEAR)
)
";
Info("Created calculation group");
```

### Verborgen objecten auditen

```csharp
var hidden = new System.Text.StringBuilder();
hidden.AppendLine("Hidden Objects Report:");
foreach(var t in Model.Tables.Where(t => t.IsHidden)) {
    hidden.AppendLine("  Table: " + t.Name);
}
foreach(var c in Model.AllColumns.Where(c => c.IsHidden && !c.Table.IsHidden)) {
    hidden.AppendLine("  Column: " + c.DaxObjectFullName);
}
foreach(var m in Model.AllMeasures.Where(m => m.IsHidden)) {
    hidden.AppendLine("  Measure: " + m.DaxObjectFullName);
}
Output(hidden.ToString());
```

### RLS-rol

```csharp
var role = Model.AddRole("Regional Access");
role.ModelPermission = ModelPermission.Read;
var salesPerm = role.TablePermissions.Find("Sales");
if(salesPerm == null) {
    salesPerm = role.AddTablePermission(Model.Tables["Sales"]);
}
salesPerm.FilterExpression = "[Region] = USERNAME()";
Info("Configured RLS for " + role.Name);
```

## Annotaties

Sleutel-waardeparen op modelobjecten, onzichtbaar voor rapportgebruikers en handig voor automatisering of documentatie.

```csharp
var value = measure.GetAnnotation("Owner");          // null als niet aanwezig
measure.SetAnnotation("Owner", "Finance Team");      // maakt of overschrijft
measure.SetAnnotation("LastReviewed", DateTime.Now.ToString("yyyy-MM-dd"));
measure.RemoveAnnotation("Owner");
```

## Macros

TE3 bewaart macro's in `%LocalAppData%\TabularEditor3\MacroActions.json`:

```json
{
  "Actions": [
    {
      "Id": 4,
      "Name": "Set model TMDL annotation for Fabric Git integration",
      "Enabled": "true",
      "Execute": "Model.SetAnnotation(\"__PBI_ServiceStoredInTmdl\", \"1\");",
      "Tooltip": "Sets annotation required for Fabric Git integration",
      "ValidContexts": "Model"
    }
  ]
}
```

| Veld | Betekenis |
|---|---|
| `Id` | Volgnummer |
| `Name` | Naam van de macro; kan een pad met `\` bevatten, zoals in `CustomAction("Time Intelligence\\Create YTD")` |
| `Enabled` | Voorwaarde als string, bijv. `"true"` of `"Selected.Measures.Any()"` |
| `Execute` | Het C#-script als string (escape `"` en `\n`) |
| `Tooltip` | Uitleg |
| `ValidContexts` | Waar de macro verschijnt: `Model`, `Measure`, `Column`, `"Measure, Column"`, … |

Met de `te`-CLI: `te macro list`, `te macro run "<naam>" --on "Sales/Revenue" --save`, `te macro add MyMacro -e "Info(Selected.Measure.Name);" --contexts Measure --tooltip "Print name"`. Het bestand wordt gezocht via `--macros <file>` → `TE_MACROS_PATH` → config `macros` → `./MacroActions.json`. De CLI leest geen TE3-installatiepad.

Docs: https://docs.tabulareditor.com/features/creating-macros.html

## Dialoogvensters (WinForms)

Voor invoer van de gebruiker in de IDE kun je `System.Windows.Forms` gebruiken. Begin met `#r "System.Drawing"`, `using System.Drawing; using System.Windows.Forms;` en verberg de spinner met `ScriptHelper.WaitFormVisible = false;`. Dit werkt niet in de CLI.

## Debuggen

| Symptoom | Aanpak |
|---|---|
| Script stopt halverwege | `Info("Stap 1")`, `Info("Stap 2")`, … tussen de stappen |
| Object niet gevonden | `if(Model.Tables.Contains("Sales")) { … } else { Error("Table 'Sales' not found"); }` of `FirstOrDefault` + null-check |
| Wijziging niet zichtbaar | XMLA kan 2–5 s nodig hebben; ververs de verbinding in Power BI Desktop; zet `Info()` na elke bewerking |
| Fout bij verwijderen/verplaatsen in een lus | Itereer over `.ToList()` |
| Script werkt in IDE maar niet in CLI | `Select…()`-dialogen en WinForms werken niet in de CLI; voeg extra `using` toe |

## TE2/TE3-compatibiliteit

```csharp
#if TE3
    Info("Running in Tabular Editor 3");
#else
    Info("Running in Tabular Editor 2");
#endif
```

Of tijdens runtime: `var majorVersion = Selected.GetType().Assembly.GetName().Version.Major;`. In de `te`-CLI is `TECLI` gedefinieerd.

## Goede gewoonten

1. **Back-up eerst**: sla een kopie op of commit in Git; test op een kopie van het model; gebruik versiebeheer.
2. **Filter eerst**: beperk met `Where()` en controleer de selectie voordat je wijzigt.
3. **Log**: `Info()` met aantallen; `Error()` bij problemen.
4. **Eén script met lussen** is sneller dan veel losse scripts; gebruik `Selected.*` waar mogelijk.
5. **Test nooit nieuwe scripts op productie.**
6. **`@"..."` voor DAX** over meerdere regels; daarna `FormatDax()`.
7. **Display folders met `/`**.
8. **Compatibility level ophogen is onomkeerbaar**: altijd eerst een back-up.

Bronnen: [Advanced Scripting](https://docs.tabulareditor.com/how-tos/Advanced-Scripting.html), [C# Scripts and Macros](https://docs.tabulareditor.com/getting-started/cs-scripts-and-macros.html), [Script Library](https://docs.tabulareditor.com/features/CSharpScripts/csharp-script-library.html), [TOM API](https://learn.microsoft.com/en-us/dotnet/api/microsoft.analysisservices.tabular). Meer community-scripts: https://github.com/TabularEditor/Scripts en https://github.com/PowerBI-tips/TabularEditor-Scripts.
