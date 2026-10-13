# Opmaak en thema

Hoe Power BI bepaalt welke opmaak wint, hoe je waarden codeert, hoe selectors werken, en hoe je een eigen thema registreert.

## Inhoud

- [Cascade: wie wint](#cascade-wie-wint)
- [Codering: drie formaten](#codering-drie-formaten)
- [Structuur van opmaak in visual.json](#structuur-van-opmaak-in-visualjson)
- [Selectors](#selectors)
- [Containeropmaak (visualContainerObjects)](#containeropmaak-visualcontainerobjects)
- [Paginaopmaak](#paginaopmaak)
- [Eigen thema registreren](#eigen-thema-registreren)
- [Opbouw van theme.json](#opbouw-van-themejson)
- [Thema wisselen op een bestaand rapport](#thema-wisselen-op-een-bestaand-rapport)

## Cascade: wie wint

| Prioriteit | Laag | Plek |
|---|---|---|
| 1 (hoogst) | Voorwaardelijke opmaak | `visual.json` → `objects` |
| 2 | Visualobjecten (kleuren, labels, assen, rijen) | `visual.json` → `visual.objects` |
| 3 | Containerobjecten (titel, achtergrond, rand) | `visual.json` → `visual.visualContainerObjects` |
| 4 | Paginaobjecten (canvas, wallpaper, filterpaneel) | `page.json` → `objects` |
| 5 | Eigen thema, per visualtype | `theme.json` → `visualStyles[type]["*"]` |
| 6 | Eigen thema, wildcard | `theme.json` → `visualStyles["*"]["*"]` |
| 7 | Basisthema | `StaticResources/SharedResources/BaseThemes/` |
| 8 (laagst) | Standaard van Desktop | — |

Gevolg: een harde kleur in een visual (laag 2–3) of pagina (laag 4) wint van het thema. Een themawissel alleen werkt dus niet als visuals eigen kleuren hebben.

## Codering: drie formaten

| Waarde | `theme.json` | `visual.json` / `page.json` |
|---|---|---|
| Boolean | `true` | `{"expr":{"Literal":{"Value":"true"}}}` |
| Getal | `12` | `{"expr":{"Literal":{"Value":"12D"}}}` |
| Geheel getal | `3` | `{"expr":{"Literal":{"Value":"3L"}}}` |
| Tekst | `"dotted"` | `{"expr":{"Literal":{"Value":"'dotted'"}}}` |
| Kleur | `"#118DFF"` (in `visualStyles` soms `{"solid":{"color":"#118DFF"}}`) | `{"solid":{"color":{"expr":{"Literal":{"Value":"'#118DFF'"}}}}}` |
| Themakleur | — | `{"solid":{"color":{"expr":{"ThemeDataColor":{"ColorId":0,"Percent":0}}}}}` |

De verkeerde codering op de verkeerde plek is fout nummer één. `ThemeDataColor`: `ColorId` = index in `dataColors` (0-based), `Percent` = lichter (positief) of donkerder (negatief).

Kleurnamen zonder hex? Gebruik de standaard CSS-waarde: `green` = `#008000` (niet `#00FF00`, dat is `lime`), `red` `#FF0000`, `orange` `#FFA500`, `gray` `#808080`.

## Structuur van opmaak in visual.json

```text
visual
├── objects                  ← grafiekspecifiek (assen, kleuren, legenda, labels)
│   └── <object>: [ { "properties": { … }, "selector": … } ]
└── visualContainerObjects   ← container (titel, achtergrond, rand, padding)
    └── <object>: [ { "properties": { … } } ]
```

- Elk object is een **array**, ook met één item.
- `visualContainerObjects` staat **binnen** `visual`, naast `objects`.
- Eigenschapsnamen verschillen per visualtype. Neem ze over uit een werkend `visual.json` van hetzelfde type, of stel de opmaak één keer in Desktop in en kopieer.

## Selectors

| Prioriteit | Type | Syntax | Gebruik |
|---|---|---|---|
| 1 | data (scope) | `"data": [{"scopeId": {Comparison…}}]` | Eén categoriewaarde kleuren (alleen grafieken) |
| 2 | data (wildcard) | `"data": [{"dataViewWildcard": {"matchingOption": N}}]` | `0` alles incl. totalen, `1` alleen datapunten, `2` alleen totalen |
| 3 | metadata | `"metadata": "Tabel.Veld"` | Eén measure/kolom (= `queryRef`) |
| 4 | id | `"id": "default"` | Kaarten, knoppen, slicers, vormen, filterkaarten |
| 5 | geen | — | Basis; enige vorm voor assen, legenda en container |

Binnen dezelfde prioriteit wint het eerste item in de array.

**Scope-selector** (bijv. één categorie apart kleuren); alleen `ComparisonKind: 0` werkt:

```json
{
  "properties": { "fill": { "solid": { "color": { "expr": { "Literal": { "Value": "'#D13438'" } } } } } },
  "selector": { "data": [ { "scopeId": { "Comparison": {
    "ComparisonKind": 0,
    "Left": { "Column": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Status" } },
    "Right": { "Literal": { "Value": "'Blocked'" } }
  } } } ] }
}
```

**id-waarden per type:**

| Visualtype | id-waarden |
|---|---|
| `cardVisual` | `"default"` |
| `actionButton`, `pageNavigator`, `bookmarkNavigator` | `"default"`, `"hover"`, `"selected"`, `"disabled"` |
| `advancedSlicerVisual` | `"default"`, `"hover"`, `"press"`, `"selected"`, `"mixed"` |
| `pivotTable` (`subTotals`) | `"Row"`, `"Column"` |
| `filterCard` (pagina) | `"Available"`, `"Applied"` (met hoofdletter) |

**Dubbel-item-patroon** (knoppen en navigators): eerste item zonder selector met alleen `show`, tweede item met `{ "id": "<state>" }` en de styling. `show` en styling in één item met selector = opmaak valt stil weg. Bij `cardVisual` en `shape` volstaat het item met id-selector.

| Object | Selectors |
|---|---|
| `dataPoint` | `metadata`, `data` |
| `labels`, `values` | `data`, `metadata` |
| `columnFormatting` | `metadata` |
| `legend`, `categoryAxis`, `valueAxis` | geen |
| `title`, `background`, `border` (container) | geen |

## Containeropmaak (visualContainerObjects)

Gedeelde sleutels voor alle visuals: `title`, `subTitle`, `divider`, `spacing`, `background`, `padding`, `lockAspect`, `general`, `border`, `dropShadow`, `visualLink`, `visualTooltip`, `stylePreset`, `visualHeader`, `visualHeaderTooltip`.

- `border` (incl. `radius`), `background` en `padding` erven niet betrouwbaar uit het thema: per visual zetten.
- **Zet je één containerobject per visual, zet dan `background`, `border` (met `radius`), `padding` en `visualHeader` samen.** Een gedeeltelijke set laat Power BI de rest terugzetten naar de standaard.
- Een titel genereert vaak een automatische ondertitel met veldnamen ("Orders and Late Orders by Carrier"). Zet `subTitle.show` op `false`, of geef een nuttige ondertitel (periode, eenheid, filter).

```json
"visualContainerObjects": {
  "title":    [{ "properties": { "show": { "expr": { "Literal": { "Value": "true" } } }, "text": { "expr": { "Literal": { "Value": "'Voorraad per hal'" } } } } }],
  "subTitle": [{ "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } }]
}
```

`general.altText` (alt-tekst) staat ook hier; inhoud en controle via `pbip-accessibility`.

## Paginaopmaak

In `page.json` → `objects`:

| Object | Eigenschappen | Let op |
|---|---|---|
| `background` (canvas) | `color`, `image`, `transparency` | **Geen** `show` (schemafout) |
| `outspace` (wallpaper rond canvas) | `color`, `image`, `transparency` | — |
| `outspacePane` / `filterCard` | Filterpaneel en filterkaarten | `filterCard` met id `"Available"`/`"Applied"` |

```json
"objects": {
  "background": [{ "properties": {
    "color": { "solid": { "color": { "expr": { "Literal": { "Value": "'#F3F2F1'" } } } } },
    "transparency": { "expr": { "Literal": { "Value": "0D" } } }
  } }]
}
```

- Canvas- en wallpaperkleur kunnen **niet** afhangen van data (measure, `FillRule`, `Conditional`): valideert, maar toont de standaardkleur. Alleen `Literal`.
- Hoge transparantie op het canvas laat de wallpaper erdoor schijnen; bij donkere thema's beide dekkend.
- Achtergrondafbeelding: geneste structuur `image.image.name` / `image.image.url` / `image.image.scaling` (`'Fit'`, `'Stretch'`, `'Fill'`); afbeelding in `StaticResources/RegisteredResources/` en geregistreerd in `report.json`. Een platte `image.url` werkt niet.

## Eigen thema registreren

Twee items in `report.json`:

```json
"themeCollection": {
  "customTheme": {
    "name": "JBTWarehouse-a1b2c3d4.json",
    "reportVersionAtImport": { "visual": "...", "report": "...", "page": "..." },
    "type": "RegisteredResources"
  }
}
```

```json
"resourcePackages": [
  {
    "name": "RegisteredResources",
    "type": "RegisteredResources",
    "items": [ { "name": "JBTWarehouse-a1b2c3d4.json", "path": "JBTWarehouse-a1b2c3d4.json", "type": "CustomTheme" } ]
  }
]
```

*(voorbeeldnaam; `reportVersionAtImport` overnemen uit je bestaande `report.json`)*

Regels:

- `type` = `"RegisteredResources"`, niet `"SharedResources"` (anders werkt het thema stil niet).
- `customTheme.name`, `items[].name` en `items[].path` zijn **gelijk en eindigen op `.json`**. Zonder `.json` past de Service het thema verkeerd toe.
- `path` = alleen de bestandsnaam, zonder map (`RegisteredResources/…` wordt genegeerd).
- Het veld `name` **in** het themabestand is gelijk aan diezelfde naam, inclusief `.json`.
- Het bestand zelf staat in `StaticResources/RegisteredResources/`.

**Cache omzeilen:** Desktop onthoudt thema's op bestandsnaam. Gebruik `<Naam>-<korte-hex>.json` en geef bij **elke** themawijziging een nieuwe hex-suffix: bestand hernoemen, `name` in het bestand aanpassen, alle drie verwijzingen in `report.json` bijwerken. De `<Naam>` blijft gelijk, tenzij je expliciet om een nieuwe naam vraagt.

`$schema` van het thema: als een basisthema in `BaseThemes/` een `$schema` heeft, dezelfde versie; anders de nieuwste `reportThemeSchema-<versie>.json` uit de repo microsoft/powerbi-desktop-samples.

## Opbouw van theme.json

Alles in gewone JSON, zonder `expr`-wrappers:

```json
{
  "name": "JBTWarehouse-a1b2c3d4.json",
  "dataColors": ["#0072B2", "#D55E00", "#009E73", "#E69F00", "#56B4E9", "#CC79A7", "#F0E442", "#000000"],
  "good": "#107C10",
  "neutral": "#D9B300",
  "bad": "#D13438",
  "maximum": "#0072B2",
  "center": "#D9B300",
  "minimum": "#DEEFFF",
  "null": "#FF7F48",
  "foreground": "#252423",
  "background": "#FFFFFF",
  "tableAccent": "#0072B2",
  "textClasses": {
    "callout": { "fontSize": 28, "fontFace": "Segoe UI", "color": "#252423" },
    "title":   { "fontSize": 12, "fontFace": "Segoe UI Semibold", "color": "#252423" },
    "header":  { "fontSize": 12, "fontFace": "Segoe UI Semibold", "color": "#252423" },
    "label":   { "fontSize": 10, "fontFace": "Segoe UI", "color": "#252423" }
  },
  "visualStyles": { }
}
```

*(voorbeeld)*

| Sectie | Betekenis |
|---|---|
| `dataColors` | Categoriepalet; vervangt het basispalet volledig |
| `good` / `neutral` / `bad` | Sentimentkleuren (waterval, KPI) |
| `maximum` / `center` / `minimum` / `null` | Alleen startwaarden voor de kleurschaal-dialoog |
| `foreground`, `background`, `tableAccent`, … | Structuurkleuren; bij een donker thema **allemaal** samen aanpassen |
| `textClasses` | `label` (tabellen, slicers), `title` (astitels), `callout` (kaarten/KPI), `header` |
| `visualStyles` | `[visualtype][stijlpreset][object]` → eigenschappen; `"*"` = alles |

**Voorbeeld `visualStyles` — tabellen en matrixen altijd grow-to-fit** (gebruik hier niet `"*"` als type: `columnHeaders` bestaat alleen bij tabel/matrix):

```json
"visualStyles": {
  "tableEx":    { "*": { "columnHeaders": [ { "autoSizeColumnWidth": true, "columnAdjustment": "growToFit" } ] } },
  "pivotTable": { "*": { "columnHeaders": [ { "autoSizeColumnWidth": true, "columnAdjustment": "growToFit" } ] } }
}
```

**Slicerstijl via thema:**

```json
"slicer": { "*": {
  "header": [ { "fontFamily": "Segoe UI Semibold", "textSize": 10, "fontColor": { "solid": { "color": "#252423" } }, "outlineStyle": 0 } ],
  "items":  [ { "fontFamily": "Segoe UI Variable, Segoe UI, sans-serif", "textSize": 9, "fontColor": { "solid": { "color": "#252423" } }, "outlineStyle": 0, "padding": 2 } ]
} }
```

Let op: een wildcard `visualStyles["*"]["*"].padding` raakt ook kaarten, tekstvakken en slicers; reken hun hoogte daarop na of geef per type een uitzondering.

## Thema wisselen op een bestaand rapport

1. Maak een tabel oud → nieuw voor elke kleur (ook de oude `dataColors`).
2. Pas het thema aan (met nieuwe hex-suffix, zie boven).
3. Doorzoek **alle** bestanden onder `definition/` op de oude hex-waarden (visuals, pagina-achtergronden, vormen, knoppen, tekstvakken) en vervang ze. Doe dat per bestand via JSON-parse, niet met een blinde tekstvervanging over de hele map.
4. Vormen en knoppen met tekst: zet expliciet een `fontColor` als de nieuwe vulkleur dat vraagt.
5. Donker thema extra: `stylePreset: 'None'` op elke tabel/matrix met eigen kleuren; celkleuren in `values`/`columnHeaders` (niet alleen container-achtergrond); `outspacePane` en `filterCard` expliciet in het thema; contrast van alle tekst controleren.
6. Open het rapport in Desktop en bekijk **alle** pagina's.
