# Thema's: theme.json ontwerpen, auditen en wijzigen

Ontwerp- en compliancebeslissingen voor rapportthema's. Hoe je een thema in PBIR-bestanden opneemt of een basisthema toepast zonder extra tools: `fabric-powerbi-report`. Kleurprincipes en contrast: [ontwerp-principes.md](ontwerp-principes.md).

## Inhoud

1. Waarom een thema
2. Cascade
3. Structuur van theme.json
4. Auditen vóór je wijzigt
5. Ontwerpregels
6. Wijzigen met `pbir` (optioneel)
7. Stijlpresets
8. Valkuilen per visualtype
9. Valideren en bekijken

---

## 1. Waarom een thema

Een thema centraliseert opmaak die anders per visual uit elkaar loopt. Het thema hoort te bevatten:

- Datapalet en semantische kleuren `good`/`neutral`/`bad`
- Achtergrond-, voorgrond-, structuur-, verloop-, hyperlink- en null-kleuren
- Lettertypefamilie, -grootte, -gewicht en hiërarchie
- Wildcard-standaarden voor containers: titels, randen, padding, schaduwen
- Standaarden per visualtype: kaarten, slicers, grafieken, tabellen, tekstvakken, afbeeldingen

Overrides op visualniveau blijven alleen over voor inhoudelijke uitzonderingen of voorwaardelijke opmaak. Een rapport dat het thema volgt is makkelijker te rebranden, te vergelijken (diff) en te onderhouden.

| Wijziging | Waar |
|---|---|
| Alle visuals van een type moeten anders | Thema |
| Ontwerpstandaard vastleggen | Thema |
| Eén visual wijkt bewust af van een themaregel | Visual |
| Inhoudelijke nadruk (één callout, één referentielijn) | Visual |

## 2. Cascade

```text
Power BI defaults
  -> theme wildcard defaults        visualStyles."*"."*"
  -> theme visual-type defaults     visualStyles.<type>."*"
  -> selected style preset          visualStyles.<type>.<preset>
  -> visual instance overrides
```

De laatste laag wint. Ziet een visual er anders uit dan het thema zegt, controleer dan eerst of er een override op de visual zelf staat. Met `pbir` zie je per eigenschap de effectieve waarde en de bron:

```bash
pbir visuals format "Report.Report/Page.Page/Visual.Visual"
```

Volgorde bij het opmaken: eerst wildcard (`visualStyles["*"]["*"]`), dan per visualtype (bijv. `visualStyles.lineChart["*"]`), pas daarna een override in `visual.json` als het echt eenmalig is.

## 3. Structuur van theme.json

Het voorbeeldthema [DataGoblins2021.json](../examples/DataGoblins2021.json) laat de hoofdonderdelen zien:

| Sleutel | Inhoud | Voorbeeld uit DataGoblins2021 |
|---|---|---|
| `name` | Naam van het thema | `"Data-Goblins"` |
| `dataColors` | Volgorde van seriekleuren | Begint met `#C1B595`, `#9F574A`, ... |
| `foreground`, `background`, `backgroundNeutral`, `foregroundNeutralSecondary`, `tableAccent` | Structuurkleuren | `foreground` `#3B4244`, `background` `#E6DFCF` |
| `good`, `neutral`, `bad` | Sentimentkleuren (tokens voor CF-measures) | Alleen `good` is gedefinieerd (`#C1B595`) |
| `maximum`, `center`, `minimum` | Kleurverloop | `#026645` / `#D0D0D0` / `#B73A3A` |
| `textClasses` | Typografie per niveau: `title`, `callout`, `label`, `header` | `fontFace` Segoe UI, `fontSize` 14/28/10/14 |
| `visualStyles` | Opmaak per visualtype en preset | `"*"`, `slicer`, `page` |

In `visualStyles["*"]["*"]` van het voorbeeld staan o.a. `visualHeader`, `background`, `outspacePane`, `filterCard` en `visualTooltip`. `filterCard` gebruikt de `$id`-discriminator om de toestanden **Applied** en **Available** verschillend op te maken (zie filterdeelvenster in [layout-en-visuals.md](layout-en-visuals.md)):

```json
"filterCard": [
  { "$id": "Applied", "backgroundColor": { "solid": { "color": "#E6DFCF" } }, "foregroundColor": { "solid": { "color": "#3B4244" } }, "textSize": 10, "transparency": 0 },
  { "$id": "Available", "transparency": 100, "foregroundColor": { "solid": { "color": "#3B4244" } }, "textSize": 10 }
]
```

Elke container is een **array** van objecten; kleuren zijn objecten `{ "solid": { "color": "#hex" } }`, geen platte strings. Microsoft's eigen thema Fluent 2 bevat daarnaast o.a. `accent`, `hyperlink`, `visitedHyperlink`, `null`, `disabledText`, `shapeStroke` en `secondaryBackground`.

## 4. Auditen vóór het wijzigen

Zoek naar:

- Hardgecodeerde kleuren (hex) in visuals
- Herhaalde lettertype- of containeroverrides op visualniveau
- Inconsistente visualtypes voor hetzelfde doel
- Zwak contrast
- Een te groot palet
- Sentimentkleuren die per visual van betekenis wisselen

Met `pbir` (als je die hebt geïnstalleerd) kun je dit zelf inventariseren:

```bash
pbir theme colors "Report.Report"
pbir theme fonts "Report.Report"
pbir color list "Report.Report"
pbir fonts list "Report.Report"
pbir visuals format "Report.Report/Page.Page/Visual.Visual"
pbir bpa run "Report.Report"
```

## 5. Ontwerpregels

1. Beperk het datapalet tot het aantal categorieën dat het rapport echt nodig heeft.
2. Bewaar verzadigde accentkleuren voor focus, selectie, uitzonderingen en kernvergelijkingen.
3. Geef elke semantische kleur één vaste betekenis. Good, neutral, bad, selected, disabled en hyperlink wisselen niet van rol tussen pagina's.
4. Houd structuurkleuren rustig. Assen, randen, gridlijnen en achtergronden ondersteunen het lezen en concurreren niet met de data.
5. Eén draagbare lettertypefamilie en een kleine typeschaal. Hiërarchie via grootte en gewicht, niet via veel kleuren.
6. Liefst wildcard-standaarden, dan standaarden per visualtype, dan zelden een override op een visual.
7. Toegankelijk contrast; communiceer een status nooit alleen met kleurtint.

**Identiteit in het thema** (zie [ontwerp-principes.md](ontwerp-principes.md)): de single-accent-regel zit in de volgorde van `dataColors` (accent eerst, neutralen erna); gridlijngewicht, labeldichtheid en accentverzadiging in wildcards of per visualtype; sentimentkleuren als tokens, zodat measures `"good"`/`"bad"` teruggeven in plaats van hex.

**Themakleuren in visuals** in plaats van hex:

```json
// Goed - themakleur
"expr": {"ThemeDataColor": {"ColorId": 1, "Percent": 0}}

// Vermijden in visuals - alleen in measures die een kleur teruggeven
"expr": {"Literal": {"Value": "'#118DFF'"}}
```

Begin altijd vanaf een geldig sjabloon of het bestaande thema van het rapport; schrijf geen leeg thema. De bron raadt het **sqlbi**-thema aan als professionele basis wanneer er geen huisstijl is.

## 6. Wijzigen met `pbir` (optioneel)

De bron werkt uitsluitend via `pbir` en raadt af om `theme.json` of `visual.json` met de hand of met `jq`/zoek-vervang te bewerken. Gebruik je `pbir`, dan zijn dit commando's die je zelf draait:

```bash
# Basis toepassen op verzoek
pbir theme list-templates
pbir theme apply-template "Report.Report" sqlbi

# Palet en semantische kleuren
pbir theme set-colors "Report.Report" \
  --data-colors '["#1971C2","#F08C00","#2F9E44","#7048E8"]' \
  --good "#2E7D32" --neutral "#6B7280" --bad "#C62828" \
  --background "#FFFFFF" --foreground "#252525"

# Typografie per semantisch niveau
pbir theme set-fonts "Report.Report" title --font-face "Segoe UI Semibold" --font-size 14
pbir theme set-fonts "Report.Report" label --font-face "Segoe UI" --font-size 10
pbir theme set-fonts "Report.Report" callout --font-face "Segoe UI Semibold" --font-size 32

# Herhaalde opmaak op themaniveau
pbir theme set-formatting "Report.Report" "*.*.dropShadow.show" --value false
pbir theme set-formatting "Report.Report" "*.*.border.show" --value false
pbir theme set-formatting "Report.Report" "card.*.title.fontSize" --value 14
```

Onbekende eigenschap? Eerst `pbir schema describe <visualType> <object>`.

**Een goede visual tot thema promoveren** (bekijk eerst de dry run, zodat inhoudelijke opmaak niet meegaat):

```bash
pbir theme push-visual "Report.Report/Page.Page/BestCard.Visual" --dry-run
pbir theme push-visual "Report.Report/Page.Page/BestCard.Visual"
```

**Overrides opruimen** is destructief: alleen na akkoord, en behoud voorwaardelijke opmaak tenzij expliciet anders gevraagd:

```bash
pbir visuals clear-formatting "Report.Report/**/*.Visual" --keep-cf --dry-run -f
pbir visuals clear-formatting "Report.Report/**/*.Visual" --keep-cf -f
pbir theme colors "Report.Report" --normalize
pbir theme colors "Report.Report" --normalize --apply
```

**Thema kopiëren of vervangen:**

```bash
pbir cp "Source.Report/theme" "Target.Report/theme" -f
pbir theme validate "Target.Report"
```

Na een themawissel: verouderde visual-overrides opruimen, overgebleven kleurliterals normaliseren en de polariteit voorgrond/achtergrond controleren, zodat tekst niet onzichtbaar wordt.

## 7. Stijlpresets

Een stijlpreset is een benoemde opmaakbundel voor één visualtype, gedefinieerd in het thema. Makers kiezen hem via **Format visual > Style presets**. Handig als de organisatie een paar toegestane varianten wil (compacte vs. gestreepte tabellen, staafdiagram met of zonder datalabels) in plaats van één standaard plus overrides per visual.

Niet te verwarren met `pbir visuals preset` (`minimal`, `bold`, ...): die schrijven overrides op visuals; themapresets leven in het thema en elke visual die er één kiest, erft hem.

De tweede sleutel onder `visualStyles.<visualType>` is de presetnaam; `"*"` is de standaardstijl.

```json
{
  "name": "Contoso",
  "visualStyles": {
    "tableEx": {
      "*": {
        "stylePreset": [{ "name": "Compact" }],
        "columnHeaders": [{ "fontFamily": "Segoe UI Semibold", "fontSize": 10 }],
        "grid": [{ "gridHorizontal": true, "gridHorizontalColor": { "solid": { "color": "#E0E0E0" } } }]
      },
      "Compact": {
        "grid": [{ "rowPadding": 1, "textSize": 9 }]
      },
      "Banded": {
        "grid": [{ "gridHorizontal": false, "rowPadding": 4 }],
        "values": [{ "backColorSecondary": { "solid": { "color": "#F5F5F5" } } }]
      }
    }
  }
}
```

Regels (valideert tegen het Power BI report theme-schema 2.155 t/m 2.157):

- Een benoemde preset erft van `"*"` van dat type. Gedeelde opmaak in `"*"`, alleen de verschillen in de preset.
- `stylePreset` binnen `"*"` bepaalt met welke preset nieuwe visuals van dat type starten. Het schema weigert `stylePreset` binnen een benoemde preset.
- Een preset accepteert dezelfde kaarten en eigenschappen als `"*"`, inclusief `$id`-toestanden (`default`, `hover`, `selected`) bij knoppen en navigators.
- Waarden zijn gewone themawaarden (`1`, `true`, `{ "solid": { "color": "#E0E0E0" } }`), nooit PBIR-literals `{ "expr": { "Literal": ... } }`.
- Presets zijn per visualtype: `Compact` op `tableEx` doet niets voor `pivotTable`; definieer hem op beide als beide hem nodig hebben.
- Microsoft's Fluent 2-thema bevat eigen presets: `tableEx`/`pivotTable` `Minimal`, grafiek `Data labels`, `actionButton` `Outline`, `slicer` `Tile`.

Een visual slaat de presetnaam op in `visualContainerObjects.stylePreset`. Noemt een visual een preset die het thema niet meer kent (hernoemd, ander thema), dan toont Desktop een fout "style preset can't be found" (alleen voor makers). Houd presetnamen stabiel tussen themaversies en controleer na een themawissel welke presets nog gebruikt worden.

Met `pbir` (filter bulkselecties altijd op visualtype; een kale glob zet de naam op elk type):

```bash
pbir set "Report.Report/Page.Page/Table.Visual.stylePreset.name" --value "Compact"
pbir set "Report.Report/**/*.Visual.stylePreset.name" --value "Compact" --where visual_type=tableEx --dry-run
pbir set "Report.Report/**/*.Visual.stylePreset.name" --value "Compact" --where visual_type=tableEx -f

# Standaardpreset voor nieuwe visuals van een type
pbir theme set-formatting "Report.Report" "tableEx.*.stylePreset.name" --value "Compact"

# Visual promoveren tot benoemde preset
pbir theme push-visual "Report.Report/Page.Page/Table.Visual" --preset "Compact" --components grid,values --dry-run
pbir theme push-visual "Report.Report/Page.Page/Table.Visual" --preset "Compact" --components grid,values
pbir theme validate "Report.Report"
```

Versieverschil `pbir-cli`: in 1.0 schrijft `pbir theme set-formatting "Report.Report" "tableEx.Compact.grid.rowPadding" --value 2` de benoemde preset; in 0.9.x is het tweede padsegment een toestands-id en komt er een `{"$id": "Compact"}`-item in de standaardstijl. In 0.9.x kopieert `push-visual` ook `expr`-literals en `stylePreset`, wat `pbir theme validate` weigert; behandel dat als mislukt en bewerk het thema dan niet met de hand.

Herlaad het rapport in Desktop en controleer de dropdown **Style presets** op één visual van het type voordat je op de presets vertrouwt.

## 8. Valkuilen per visualtype

Verkeerde namen worden meestal **stil genegeerd**: geen fout, geen effect.

| Visualtype | Valkuil |
|---|---|
| `pivotTable` (Matrix) | De themasleutel is `pivotTable`, **niet** `matrix`; `matrix` heeft geen effect. Aparte `columnTotal` en `rowTotal` naast `total`. |
| `slicer` (klassiek) | `items` en `header` gebruiken `textSize`, **niet** `fontSize`. `fontColor` is een object. |
| `advancedSlicerVisual`, `listSlicer` | Hebben géén `items`/`header`; gebruiken `fontSize` (niet `textSize`) in `label` en `value`. |
| `kpi` | Container heet `trendline` (kleine l); `trendLine` wordt genegeerd. `status.direction` (`"Positive"`/`"Negative"`) expliciet zetten bij kosten-KPI's; `goals.direction` staat daar los van. |
| `card` (legacy) | `labels.color` en `categoryLabels.color` heten `color`, niet `fontColor`. `labelDisplayUnits`: `0` Auto, `1` None, `1000`, `1000000`, ... |
| `cardVisual` (New Card) | Gebruikt juist `fontColor`. Niet verwarren met `multiRowCard`. |
| `multiRowCard` | `cardTitle.color` en `dataLabels.color` heten `color`; accentbalk uit met `card.barShow` = `false`. |
| `tableEx` | `backColor` (niet `backgroundColor`) voor kolomkoppen en totalen; `backColorPrimary`/`backColorSecondary` voor banding; `outlineStyle` is een getal (`0` geen, `1` alleen onder, `2` rondom). |
| `barChart` / `columnChart` | Bij `barChart` is `categoryAxis` de Y-as, bij kolomdiagrammen de X-as. Aslabelkleur is `labelColor`, niet `fontColor`. |
| `lineClusteredColumnComboChart` | Secundaire as in dezelfde `valueAxis` met `sec`-prefix (`secShow`, `secFontSize`). |
| `stackedAreaChart` | `seriesLabels.textSize` (niet `fontSize`). |
| `scatterChart` | Geen `labels`-container; gebruik `categoryLabels`. |
| `gauge` | `calloutValue` heeft geen `fontSize`. |
| `waterfallChart` | Geen `dataPoint`; staafkleuren alleen via `sentimentColors` (los van de top-level `good`/`neutral`/`bad`). |
| `decompositionTreeVisual` | `levelHeader` gebruikt geprefixte namen (`levelTitleFontFamily`), geen kaal `fontFamily`. |
| `scorecard` | `foregroundColor`/`backgroundColor` in plaats van `fontColor`/`backColor`. |
| `textbox`, `shape`, `actionButton`, `lineChart`, `pieChart`, `treemap` | Kleuren zijn objecten `{ "solid": { "color": "#hex" } }`, geen strings. `actionButton`-toestanden: `*`, `hover`, `press`, `selected`, `disabled`. |
| `filter` | Is **niet** het filterdeelvenster; dat stijl je met `outspacePane` en `filterCard`. |
| `pythonVisual`, `scriptVisual`, `rdlVisual` | Inhoud van de plot/het paginated rapport volgt het thema niet; stijl in het script of de RDL. |

Voorbeeld (warehouse): een matrix "Te late orderregels per leverancier" krijgt geen gekleurde koppen als je de opmaak in het thema onder `matrix` zet in plaats van onder `pivotTable`.

## 9. Valideren en bekijken

1. Bewaar een kopie of versie van het oude thema.
2. Valideer na een samenhangende reeks wijzigingen (met `pbir`: `pbir theme validate "Report.Report"` en `pbir validate "Report.Report" --all`).
3. **Sluit het rapport en open het opnieuw in Desktop**: een refresh laadt themabronnen niet opnieuw.
4. Bekijk alle pagina's: voor- en achtergrond nog leesbaar, presets aanwezig, geen onverwachte overrides.
5. Geen Desktop beschikbaar? Vraag eerst toestemming voordat je naar een sandbox-werkruimte publiceert om het resultaat te bekijken.
