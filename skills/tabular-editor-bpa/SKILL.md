---
name: tabular-editor-bpa
description: "Werken met Tabular Editor (TE2, TE3 en de nieuwe te-CLI) voor Power BI semantische modellen: Best Practice Analyzer (BPA)-regels begrijpen, schrijven, laden, negeren en automatisch laten fixen; C#-scripts (.csx) en macro's voor bulkwijzigingen (measures aanmaken, format strings, display folders, descriptions, sleutelkolommen verbergen, DAX formatteren); Tabular Editor CLI (TabularEditor.exe vs te) voor BPA-gates, scripts en deploy in CI/CD; documentatie en configbestanden (.tmuo, Preferences.json). Gebruik bij: Tabular Editor, TE2, TE3, BPA, Best Practice Analyzer, BPARules.json, FixExpression, C# script, .csx, macro, MacroActions.json, bulk wijzigen measures, model regels, modelcontrole, te bpa run, TabularEditor.exe -A. Niet voor algemene modelleer- en DAX-adviezen, TMDL of PBIP: gebruik fabric-semantic-model. Workspaces/auth: fabric-basis."
---

# Tabular Editor: BPA, C#-scripts en CLI

> Bewerking van [data-goblin/power-bi-agentic-development](https://github.com/data-goblin/power-bi-agentic-development) (© Kurt Buhler, GPL-3.0), skills `bpa-rules`, `c-sharp-scripting`, `te-cli`, `te2-cli` en `te-docs`, commit 4936264. Vertaald, ingekort en aangepast. Deze skill valt daardoor ook onder GPL-3.0; zie `LICENSE` in deze map.

Met Tabular Editor bewerk je de metadata van een semantisch model (measures, kolommen, relaties, rollen) buiten Power BI Desktop om. Deze skill gaat over drie onderdelen die de bron uitwerkt: **Best Practice Analyzer**-regels (automatische kwaliteitscontrole), **C#-scripts** (bulkwijzigingen) en de **command line**.

| Product | Wat de bron erover zegt |
|---|---|
| **Tabular Editor 2** (`TabularEditor.exe`) | Gratis, alleen Windows. Download: https://github.com/TabularEditor/TabularEditor/releases of `choco install tabulareditor2`. Heeft een GUI en een CLI. Nog ondersteund en stabiel, maar verouderd ten opzichte van de nieuwe `te`-CLI. |
| **Tabular Editor 3** | Apart product (desktop-IDE) met ingebouwde BPA-regels, macro's (`MacroActions.json`) en C# tot versie 12 (Roslyn). De bron noemt geen prijs of licentievorm; kijk daarvoor op https://docs.tabulareditor.com/. |
| **`te`-CLI** | Nieuwe cross-platform CLI (Windows, macOS, Linux), gebouwd op dezelfde TOMWrapper als TE3. **Limited public preview: previewbuilds werken niet meer na 2026-10-31.** Tijdens de preview is geen licentie nodig. |

Algemene modelleeradviezen (sterschema, DAX-patronen, naamgeving, TMDL/PBIP) staan in **fabric-semantic-model**. Deze skill gaat over het gereedschap en de regels in Tabular Editor zelf.

## Werkwijze

| Je vraag | Doe dit | Laad |
|---|---|---|
| "Wat is BPA, hoe draai ik het?" | [BPA draaien](#bpa-draaien-in-te2-te3-en-cli) | – |
| Een regel schrijven of verbeteren | [Een regel schrijven](#een-bpa-regel-schrijven): eerst vragen naar doel, team en model | [references/bpa-regels.md](references/bpa-regels.md) |
| Startset regels voor een team | [Kernregels](#kernregels-en-fixes) + `examples/bpa/comprehensive-rules.json` | [references/bpa-regels.md](references/bpa-regels.md) |
| Regel negeren voor één model of object | [Regels negeren](#regels-negeren-en-in-het-model-opslaan) | [references/bpa-regels.md](references/bpa-regels.md) |
| Regelbestand laadt niet of blijft leeg | [Valkuilen bij regelbestanden](#valkuilen-bij-regelbestanden) | – |
| Iets in bulk wijzigen (measures, folders, opmaak) | [C#-scripts](#c-scripts) + een passend voorbeeld uit `examples/csx/` | [references/csharp-scripting.md](references/csharp-scripting.md) |
| Macro maken in TE3 | [Macro's](#macros-te3) | [references/csharp-scripting.md](references/csharp-scripting.md) |
| BPA of script vanaf de command line / in CI | [CLI](#command-line-te2-vs-te) | [references/cli.md](references/cli.md) |
| Pipeline overzetten van `TabularEditor.exe` naar `te` | [CLI](#command-line-te2-vs-te) | [references/cli.md](references/cli.md) |
| Documentatie zoeken, `.tmuo` of `Preferences.json` | [Documentatie](#documentatie) | [references/documentatie.md](references/documentatie.md) |

## Wat BPA is

- BPA-regels zijn **automatische tests** voor semantische modellen (QA/QC). Ze werken in TE2, TE3, de CLI en Fabric-notebooks.
- In Tabular Editor is een regel een **Dynamic LINQ-expressie** (C#-achtige syntax op het Tabular Object Model, TOM). In Fabric-notebooks schrijf je regels in Python.
- Een regel geeft `true` voor objecten die de regel **overtreden**.
- In Tabular Editor zijn regels direct bruikbaar: je kunt een overtreding negeren of laten fixen, en ze zijn in de IDE ingebouwd. Daarom raadt de bron Tabular Editor aan boven notebooks.

### Regelstructuur (JSON)

```json
{
  "ID": "META_MEASURE_NO_DESCRIPTION",
  "Name": "Measure has no description",
  "Category": "Metadata",
  "Description": "All measures should have descriptions for documentation.",
  "Severity": 2,
  "Scope": "Measure",
  "Expression": "string.IsNullOrWhitespace(Description)"
}
```

| Veld | Verplicht | Betekenis |
|---|---|---|
| `ID` | ja | Unieke ID, conventie `PREFIX_NAAM` (bijv. `DAX_`, `META_`, `PERF_`, `NAME_`, `LAYOUT_`, `FORMAT_`, `GOV_`) |
| `Name` | ja | Naam in de UI |
| `Category` | aanbevolen | Groepering, bijv. `Performance`, `Metadata`, `DAX Expressions` |
| `Description` | nee | Waarom de regel bestaat; placeholders `%object%`, `%objectname%`, `%objecttype%` |
| `Severity` | ja | `1` laag (info), `2` middel (waarschuwing), `3` hoog (fout) |
| `Scope` | ja | Objecttypen, kommagescheiden: `Measure`, `DataColumn`, `CalculatedColumn`, `Table`, `Relationship`, `ModelRole`, … |
| `Expression` | ja | Dynamic LINQ; `true` = overtreding |
| `FixExpression` | nee | Automatische fix, bijv. `IsHidden = true` of `Delete()` |
| `CompatibilityLevel` | nee | Minimale compatibiliteitsniveau van het model |
| `Source`, `Remarks` | nee | Herkomst, bekende false positives |

Volledige scopelijst, expressiesyntax (`Tokenize()`, `DependsOn`, `ReferencedBy`, `outerIt`) en enumwaarden: [references/bpa-regels.md](references/bpa-regels.md).

## Kernregels en fixes

Een selectie uit `examples/bpa/comprehensive-rules.json` (31 regels) en de Microsoft-regelset. Kopieer de regel uit het voorbeeldbestand; deze tabel is een samenvatting.

| ID | Wat het vindt | Expression (kern) | Fix |
|---|---|---|---|
| `META_MEASURE_NO_DESCRIPTION` | Measure zonder beschrijving | `string.IsNullOrWhitespace(Description)` | handmatig of script |
| `FORMAT_NUMERIC_MEASURES` | Zichtbare numerieke measure zonder format string | `IsVisible and string.IsNullOrWhitespace(FormatString) and (DataType = "Int64" or …)` | handmatig/script |
| `LAYOUT_VISIBLE_MEASURE_NO_FOLDER` | Zichtbare measure niet in een display folder | `IsVisible and string.IsNullOrEmpty(DisplayFolder)` | script |
| `LAYOUT_HIDE_FK_COLUMNS` | Zichtbare foreign-key-kolom | `IsVisible and Model.Relationships.Any(FromColumn = outerIt)` | `IsHidden = true` |
| `META_SUMMARIZE_NONE` | Zichtbare numerieke kolom die standaard optelt | `IsVisible and SummarizeBy <> "None" and (…)` | `SummarizeBy = AggregateFunction.None` |
| `META_AVOID_FLOAT` | Kolom met `Double` (floating point) | `DataType = "Double"` | `DataType = DataType.Decimal` |
| `META_DISABLE_ATTRIBUTE_HIERARCHIES` | Verborgen kolom die onnodig in MDX beschikbaar is | `not IsVisible and IsAvailableInMDX and …` | `IsAvailableInMDX = false` |
| `PERF_UNUSED_COLUMNS` | Verborgen kolom die nergens gebruikt wordt | `not IsVisible and ReferencedBy.Count = 0 and …` | `Delete()` (let op!) |
| `PERF_AVOID_BIDIR_RELATIONSHIPS` | Relatie in beide richtingen | `CrossFilteringBehavior = CrossFilteringBehavior.BothDirections` | handmatig |
| `DAX_DIVISION_COLUMNS` | `/` in plaats van `DIVIDE` | `Tokenize().Any(Type = DIV and Next.Type <> INTEGER_LITERAL and Next.Type <> REAL_LITERAL)` | handmatig |
| `DAX_AVOID_IFERROR` | `IFERROR` maskeert fouten | `Expression.IndexOf("IFERROR", StringComparison.OrdinalIgnoreCase) >= 0` | handmatig |
| `DAX_COLUMNS_FULLY_QUALIFIED` | Kolomverwijzing zonder tabelnaam | `DependsOn.Any(Key.ObjectType = "Column" and Value.Any(not FullyQualified))` | handmatig |
| `DAX_MEASURES_UNQUALIFIED` | Measureverwijzing mét tabelnaam | `DependsOn.Any(Key.ObjectType = "Measure" and Value.Any(FullyQualified))` | handmatig |

**Wees voorzichtig met `Delete()` als FixExpression.** Gebruik `FixExpression: null` (of laat het veld weg) als de fix menselijk oordeel vraagt, er meerdere goede oplossingen zijn of er dataverlies dreigt. De bron merkt bij ongebruikte kolommen op: de regel ziet geen verwijzingen vanuit externe tools of rapporten. Controleer dus eerst of een rapport de kolom gebruikt.

## BPA draaien in TE2, TE3 en CLI

| Waar | Hoe |
|---|---|
| **TE2/TE3 (GUI)** | Regelbestand toevoegen: **Tools -> Manage BPA Rules** → **Add...** → **absoluut pad** of URL → **OK**. |
| **TE3** | Heeft daarnaast 27 ingebouwde regels (`TE3_BUILT_IN_*`). Aan/uit via `BuiltInBpaRules` en `DisabledBuiltInRuleIds` in `%LocalAppData%\TabularEditor3\Preferences.json`. |
| **TE2 CLI** | `TabularEditor.exe Model.bim -A rules.json` (met `-V` voor Azure DevOps- of `-G` voor GitHub Actions-uitvoer; `-AX` slaat regels in het model over). |
| **`te`-CLI** | `te bpa run --model ./model --rules rules.json --fail-on warning`; met `--fix` worden fixes in het geheugen toegepast, met `--save` worden ze opgeslagen. |

Regels kunnen uit meerdere bronnen komen: de ingebouwde regels (TE3), een URL (bijv. `https://raw.githubusercontent.com/TabularEditor/BestPracticeRules/master/BPARules-standard.json`), het model zelf (annotatie), de gebruiker (`%LocalAppData%\TabularEditor3\BPARules.json`) en de machine (`%ProgramData%\TabularEditor3\BPARules.json`). Bij dezelfde ID winnen lokale regels van remote/ingebouwde regels.

### Valkuilen bij regelbestanden

1. **CRLF-regeleinden.** TE op Windows verwacht `\r\n`. Met alleen LF laadt het bestand niet of blijft de collectie leeg. Het voorbeeldbestand in deze skill is LF; converteer het eerst (`sed -i 's/$/\r/' rules.json`, of sla het in een editor op met Windows-regeleinden).
2. **Absolute paden** (`C:\BPARules\my-rules.json`) of URL's; relatieve paden met `..\..\` worden vaak niet gevonden.
3. **Alleen toegestane velden:** `ID`, `Name`, `Category`, `Description`, `Severity`, `Scope`, `Expression`, `FixExpression`, `CompatibilityLevel`, `Source`, `Remarks`. Geen `_comment` en geen runtimevelden (`ObjectCount`, `ErrorMessage`).
4. **Regex:** geen `@"..."`-prefix (gebruik `"FILTER\\s*\\("`) en geen `RegexOptions`-parameter (gebruik `(?i)` in het patroon).
5. **Juiste scopenamen:** `ModelRole` (niet `Role`), `ModelRoleMember`, `NamedExpression`, `ProviderDataSource`/`StructuredDataSource`. `Column` mag als alias voor alle kolomtypen.

## Een BPA-regel schrijven

De bron werkt in twee fasen: eerst requirements, dan regels. **Genereer niet meteen een hele regelset.**

1. **Context ophalen** (2–4 vragen per ronde): doel (team-standaard, één model verbeteren, governance), wie de regels gebruikt (solo, klein team, organisatie), welke tool (TE2, TE3, CLI in CI/CD, notebooks), bestaande naamgeving en regels, belangrijkste categorieën.
2. **Model bekijken** als dat beschikbaar is: aantal tabellen/measures, opslagmodus, ontbrekende descriptions/folders/format strings, DAX-patronen, bidirectionele relaties, RLS, bestaande BPA-annotaties. Heeft je gebruiker alleen een `.pbix`: laat hem opslaan als **File > Save as > Power BI Project (*.pbip)** zodat de TMDL-bestanden leesbaar zijn.
3. **Prioriteren**: stel categorieën voor op volgorde van relevantie en laat de gebruiker bevestigen (en kiezen of FixExpressions gewenst zijn).
4. **Regels schrijven**: per regel uitleggen waarom hij voor dít model telt; severity volgens de prioriteiten; FixExpression alleen als die veilig is.
5. **Testen**: bouw complexe expressies stap voor stap op, test op de juiste scope en controleer dat een FixExpression geen schade doet. Let op `CompatibilityLevel` bij nieuwere TOM-eigenschappen.

Sla de vragenronde over als de vraag al concreet is ("regel voor measures zonder description") of als je een bestaande expressie moet debuggen.

**Voorbeeld (magazijnmodel):** een regel die zichtbare measures in de tabel `Voorraad` zonder format string meldt.

```json
{
  "ID": "FORMAT_VOORRAAD_MEASURES",
  "Name": "Voorraad-measures hebben een format string",
  "Category": "Formatting",
  "Description": "Measure '%objectname%' in Voorraad heeft geen format string.",
  "Severity": 2,
  "Scope": "Measure",
  "Expression": "Table.Name = \"Voorraad\" and IsVisible and string.IsNullOrWhitespace(FormatString)"
}
```

### Regels negeren en in het model opslaan

In TMDL (`model.tmdl`) staan BPA-instellingen als annotaties op het model:

```tmdl
annotation BestPracticeAnalyzer_IgnoreRules = {"RuleIDs":["DAX_DIVISION_COLUMNS","PERF_UNUSED_COLUMNS"]}
annotation BestPracticeAnalyzer_ExternalRuleFiles = ["https://raw.githubusercontent.com/TabularEditor/BestPracticeRules/master/BPARules-standard-lax.json"]
```

Op één object: `annotation BestPracticeAnalyzer_Ignore = {"RuleIDs":["META_MEASURE_NO_DESCRIPTION"]}`. Leg vast **waarom** je een regel negeert. Inline-regels (`annotation BestPracticeAnalyzer = [...]`): zie [references/bpa-regels.md](references/bpa-regels.md).

## C#-scripts

Met een C#-script wijzig je veel objecten tegelijk. Je draait het in de IDE van TE2/TE3 of via de CLI (zie de docs-links onder [Documentatie](#documentatie) voor de stappen in de IDE).

### Basis

```csharp
Model                       // het hele model
Model.Tables["Orders"]      // één tabel
Model.AllMeasures           // alle measures
Model.AllColumns            // alle kolommen
Selected.Measures           // geselecteerde measures in de TOM Explorer (alleen IDE)
Selected.Measure            // precies één geselecteerde measure, anders fout
```

- Elke statement eindigt op `;`. Strings tussen `"..."`; voor meerregelige DAX `@"..."`.
- `Info()`, `Warning()`, `Error()` (stopt het script), `Output()` (objectinspector).
- Display folders met `/` schrijven; dat wordt automatisch `\`.
- Standaard geïmporteerd: `System`, `System.Linq`, `System.Collections.Generic`, `Newtonsoft.Json`, `TabularEditor.TOMWrapper`, `TabularEditor.TOMWrapper.Utils`, `TabularEditor.UI`.

**Voorbeeld (magazijnmodel):** basismeasures voor een orderregeltabel.

```csharp
var t = Model.Tables["Orders"];
var m = t.AddMeasure("Aantal orderregels", "COUNTROWS(Orders)");
m.FormatString = "#,0";
m.DisplayFolder = "Orders/Basis";
m.Description = "Aantal orderregels in de huidige filtercontext";
Info("Toegevoegd: " + m.Name);
```

### Veilig werken

1. **Maak eerst een back-up** (kopie van `.bim`/TMDL-map of commit in Git). Test op een kopie, nooit eerst op productie.
2. **Filter eerst, wijzig daarna**: bekijk de doelset met `Output(Model.AllMeasures.Where(...))` voordat je hem aanpast.
3. **Controleer of objecten bestaan** (`Model.Tables.Contains("Orders")` of `FirstOrDefault` + null-check).
4. **Zet `Info()`-checkpoints** zodat je ziet waar een script stopt; rapporteer aantallen.
5. In de TE-GUI kun je terug met **Ctrl+Z**. In de `te`-CLI is elke wijziging een **dry run tot `--save`**: draai eerst zonder `--save` en bekijk de diff.
6. Script voor TE2 én TE3? Gebruik `#if TE3 … #else … #endif`. In de `te`-CLI is `TECLI` gedefinieerd en werken `SelectMeasure()`/`SelectTable()` niet.

### Voorbeeldscripts in deze skill

21 scripts, ongewijzigd overgenomen uit de bron (met de oorspronkelijke auteurs in de header). Pas tabel- en kolomnamen aan voordat je ze draait. De CLI-regel in sommige headers (`te "workspace/model" script.csx --file`) is verouderd; gebruik `te script --file <script>.csx --model ./model --save`.

| Doel | Script |
|---|---|
| SUM-measure per geselecteerde kolom (+ kolom verbergen) | `examples/csx/measures/create_sum_measures.csx` |
| COUNTROWS-measure per geselecteerde tabel | `examples/csx/measures/create_countrows_measures.csx` |
| YTD/PY/YoY/YoY%/QTD/MTD per geselecteerde measure | `examples/csx/measures/create_time_intelligence.csx` |
| Meerdere measures in één keer met format/folder/description | `examples/csx/measures/add_measures.csx` |
| Alle measures opsommen (audit) | `examples/csx/measures/list-measures.csx` |
| Measures naar een andere tabel verplaatsen | `examples/csx/measures/move-measures-to-table.csx` |
| Alle measures van één tabel verbergen | `examples/csx/measures/hide-measures.csx` |
| Measuretabel `_Measures` aanmaken | `examples/csx/tables/add-measure-table.csx` |
| Format strings op basis van measurenaam | `examples/csx/format-strings/apply_format_by_name.csx` |
| Measures in folders op basis van naam (YTD, %, Count…) | `examples/csx/display-folders/organize_measures_by_type.csx` |
| Display folder hernoemen (exact of met submappen) | `examples/csx/display-folders/rename-display-folder.csx` |
| DAX-expressie in description zetten | `examples/csx/bulk-operations/add_expression_to_descriptions.csx` |
| Description uit eerste `//`-commentaarregel | `examples/csx/bulk-operations/update_descriptions_from_comments.csx` |
| CamelCase-namen → leesbare namen | `examples/csx/bulk-operations/clean_object_names.csx` |
| Snelle fix: format string + sleutels verbergen | `examples/csx/bulk-operations/validate_and_fix_issues.csx` |
| Key/ID-kolommen verbergen en niet optellen | `examples/csx/columns/hide_key_columns.csx` |
| Summarization overal uitzetten | `examples/csx/columns/disable_summarization.csx` |
| `IsAvailableInMDX = false` op hulpkolommen | `examples/csx/columns/disable-available-in-mdx.csx` |
| Alle measures DAX-formatteren | `examples/csx/format-dax/format-measures.csx` |
| Impliciete measures ontmoedigen | `examples/csx/model/set-discourage-implicit-measures.csx` |
| Ongebruikte/complexe measures vinden | `examples/csx/model/analyze-dependencies.csx` |

Meer patronen (LINQ, helpermethoden, DAX uitvoeren, dialoogvensters): [references/csharp-scripting.md](references/csharp-scripting.md).

### Macro's (TE3)

Een macro is een opgeslagen C#-script met een naam, tooltip en context (bijv. `Measure`, `Column`, `Model`). TE3 bewaart ze in `%LocalAppData%\TabularEditor3\MacroActions.json` (`Actions`-array met `Id`, `Name`, `Enabled`, `Execute`, `Tooltip`, `ValidContexts`). Vanuit een script roep je een macro aan met `CustomAction("Naam")`. Structuur en voorbeeld: [references/csharp-scripting.md](references/csharp-scripting.md#macros).

## Command line: TE2 vs `te`

| | TE2 CLI (`TabularEditor.exe`) | `te`-CLI |
|---|---|---|
| Platform | Windows | Windows, macOS, Linux |
| Status | Stabiel, ondersteund, verouderd | Preview; **stopt na 2026-10-31** |
| BPA | `-A rules.json` / `-AX` | `te bpa run --rules …` (+ `--fail-on`, `--fix`, `--trx`) |
| Script | `-S script.csx` | `te script --file script.csx --save` |
| Opslaan | `-B out.bim`, `-TMDL map/` | `te save-as -o map --serialization tmdl` |
| Deploy | `-D "server" "db" -O -C …` | `te deploy … --execute` (anders dry run) |
| Model opgeven | positioneel pad | altijd `--model` of `-s`/`-d` |
| BPA bij deploy | nee | standaard aan (`--skip-bpa` / `--fix-bpa`) |

Belangrijk bij `te`: wijzigingen zijn een dry run tot `--save`, `deploy`/`refresh` doen niets zonder `--execute`, en zet geen secrets op de command line (gebruik `--auth env`). Gebruik `--output-format json` als je de uitvoer in een script verwerkt. Flags, migratietabel en CI-voorbeelden: [references/cli.md](references/cli.md).

## Documentatie

- Officiële docs: https://docs.tabulareditor.com/ (BPA: `/getting-started/bpa.html`, `/features/views/bpa-view.html`, `/features/using-bpa-sample-rules-expressions.html`; scripting: `/te2/Advanced-Scripting.html`, `/features/CSharpScripts/csharp-script-library.html`).
- Regelsets: https://github.com/TabularEditor/BestPracticeRules en https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules.
- Na een reorganisatie geven oude doc-URL's 404; zie de redirecttabel en de uitleg van `.tmuo` en `Preferences.json` in [references/documentatie.md](references/documentatie.md).

## Controle voor oplevering

- [ ] Product klopt: TE2-flags (`-A`, `-S`, `-D`) niet gemengd met `te`-subcommando's; bij `te` gewaarschuwd voor het einde van de preview op 2026-10-31.
- [ ] TE2 alleen "gratis" genoemd; geen prijs of licentie voor TE3 verzonnen.
- [ ] BPA-regel heeft `ID`, `Name`, `Severity` (1–3), geldige `Scope` en een `Expression` die `true` geeft bij overtreding.
- [ ] Alleen toegestane velden; regex zonder `@` en zonder `RegexOptions`; scopenamen gecontroleerd.
- [ ] Gebruiker gewezen op CRLF en absolute paden bij het laden in TE.
- [ ] `FixExpression` alleen waar veilig; `Delete()` expliciet benoemd als risico.
- [ ] Genegeerde regels hebben een reden.
- [ ] C#-script: back-up/test op kopie genoemd, objectbestaan gecontroleerd, `Info()` met aantallen, tabel-/kolomnamen aangepast aan het model van de gebruiker.
- [ ] Bij `te`: eerst zonder `--save` gedraaid en de diff bekeken; deploy/refresh pas met `--execute`.
- [ ] Geen dubbel werk met fabric-semantic-model (algemene DAX/modelleeradviezen daarheen verwezen).
