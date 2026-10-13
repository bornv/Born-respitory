# Voorwaardelijke opmaak

Kleur, iconen, databalken en links die afhangen van de data. Ondersteuning verschilt per visual en per eigenschap: ga er niet van uit dat elke kleureigenschap een regel accepteert.

## Inhoud

- [Werkwijze](#werkwijze)
- [Aansturend veld: measure of kolom](#aansturend-veld-measure-of-kolom)
- [Selector per visual](#selector-per-visual)
- [Type 1: kleurverloop (FillRule)](#type-1-kleurverloop-fillrule)
- [Type 2: regels (Conditional.Cases)](#type-2-regels-conditionalcases)
- [Type 3: iconen](#type-3-iconen)
- [Type 4: databalken](#type-4-databalken)
- [Type 5: weblinks](#type-5-weblinks)
- [Type 6: kleur uit een veld](#type-6-kleur-uit-een-veld)
- [Kaart en KPI](#kaart-en-kpi)
- [Titel en kleur van de container](#titel-en-kleur-van-de-container)
- [Wat niet kan](#wat-niet-kan)
- [Problemen](#problemen)

## Werkwijze

1. Bepaal visualtype en doel-eigenschap (welke cel, welk datapunt, welke tekst).
2. Controleer of het aansturende veld bestaat en het juiste type teruggeeft (kleur = tekst met geldige kleur; URL = absolute `http(s)`-URL; icoon = exacte naam uit de catalogus). Klopt dat niet: eerst model aanpassen (`fabric-semantic-model`), geen ongeldige binding schrijven.
3. Bouw de expressie: aansturend veld → `FillRule` / `Conditional` → selector → doel-eigenschap. Aansturend veld en doelveld zijn los van elkaar: je kunt de cel **Open Orders** kleuren op basis van **Days Late**.
4. Kies de juiste selector (tabel hieronder). Verkeerde selector = opmaak valt stil weg.
5. Open in Desktop en controleer met waarden boven, onder en rond de drempels, plus lege waarden.

## Aansturend veld: measure of kolom

| Aansturend veld | Verwijzing | Aggregatie |
|---|---|---|
| Al aanwezig in de visual | `{ "SelectRef": { "ExpressionName": "<queryRef>" } }` | Niet extra verpakken |
| Measure | `Measure` direct | **Geen** `Aggregation` (fout) |
| Kolom | `Aggregation` rond de `Column` | **Verplicht**; kale `Column` breekt de visual |

`Function` voor kolommen: `0` Sum, `1` Average, `2` Count, `3` Min, `4` Max, `5` CountNonNull. Tekst-/kleur-/URL-kolommen: `3` of `4`.

## Selector per visual

| Visual | Soort | Object.eigenschap | Selector |
|---|---|---|---|
| Tabel/matrix | Achtergrond/tekstkleur | `values.backColor` / `values.fontColor` | `dataViewWildcard` (`matchingOption: 1`) **én** `metadata` |
| Tabel/matrix | Iconen | `values.icon` | `dataViewWildcard` + `metadata` |
| Tabel/matrix | Databalken | `columnFormatting.dataBars` | **alleen** `metadata` |
| Matrix | Weblink | `values.webURL` | `dataViewWildcard` + `metadata` (getoonde kolom) |
| Grafiek, één reeks | Kleur datapunt | `dataPoint.fill` | `{ "data": [{ "dataViewWildcard": { "matchingOption": 1 } }] }` |
| Grafiek, kleur per categorie | Kleur | `dataPoint.fill` | `{ "data": [{ "roles": ["Category"] }] }` |
| Grafiek, dynamische legenda | Kleur | `dataPoint.fill` | `{ "data": [{ "roles": ["Series"] }], "hierarchyMatching": 1 }` |
| Grafiek | Labelkleur | `labels.color` | `dataViewWildcard` (`matchingOption: 1`) |
| Lijn, één reeks | Segmentkleur | `lineStyles.strokeColor` | `{ "data": [{ "roles": ["Category"] }] }` |
| `cardVisual` | Waarde-/labelkleur | `value.fontColor` / `label.fontColor` | `{ "id": "default" }` |
| `kpi` | Tekstkleuren | zie [Kaart en KPI](#kaart-en-kpi) | geen |
| `actionButton` / `shape` | Vul-, tekst-, randkleur | bijv. `fill.fillColor`, `text.text` | `{ "id": "<state>" }` |

- Bij tabel/matrix is `metadata` de `queryRef` van de **opgemaakte** kolom (in een matrix altijd een veld uit `Values`, niet uit `Rows`/`Columns`).
- Bij waardegestuurde `dataPoint.fill` **nooit** `metadata` toevoegen (stille fout).

## Type 1: kleurverloop (FillRule)

| Betekenis van de measure | Gebruik | Kleuren |
|---|---|---|
| Hoeveelheid (meer/minder): voorraad, orders, regels | `linearGradient2` | Lichte tint → verzadigde basiskleur van één tint |
| Goed/slecht t.o.v. doel of nul: afwijking, OTIF vs doel | `linearGradient3` | Slecht → neutraal → goed |

Rood/groen niet gebruiken voor pure hoeveelheden.

**Voorbeeld — tabelcel kleurt op voorraadwaarde (één tint):** item in `objects.values`:

```json
{
  "properties": {
    "backColor": { "solid": { "color": { "expr": { "FillRule": {
      "Input": { "SelectRef": { "ExpressionName": "Inventory.Stock Value" } },
      "FillRule": { "linearGradient2": {
        "min": { "color": { "Literal": { "Value": "'#DEEFFF'" } } },
        "max": { "color": { "Literal": { "Value": "'#118DFF'" } } },
        "nullColoringStrategy": { "strategy": { "Literal": { "Value": "'noColor'" } } }
      } }
    } } } } }
  },
  "selector": {
    "data": [ { "dataViewWildcard": { "matchingOption": 1 } } ],
    "metadata": "Inventory.Stock Value"
  }
}
```

**Voorbeeld — staafgrafiek met één reeks, donkerste staaf = hoogste waarde:** item in `objects.dataPoint`:

```json
{
  "properties": { "fill": { "solid": { "color": { "expr": { "FillRule": {
    "Input": { "Measure": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "Late Deliveries" } },
    "FillRule": { "linearGradient2": {
      "min": { "color": { "Literal": { "Value": "'#D0E8F5'" } } },
      "max": { "color": { "Literal": { "Value": "'#56B4E9'" } } },
      "nullColoringStrategy": { "strategy": { "Literal": { "Value": "'noColor'" } } }
    } }
  } } } } } },
  "selector": { "data": [ { "dataViewWildcard": { "matchingOption": 1 } } ] }
}
```

**Driekleurig** (`linearGradient3`): altijd `min`, `mid` én `max` (zonder `mid` → renderfout of lege tabel). Elk stop kan een `value` hebben (`"0D"`); alleen `mid.value` invullen = twee aparte schalen rond een vast middelpunt (bijv. 0 of doel).

Regels:

- **Buitenste kleur heeft `expr`, de stopkleuren niet.** `"color": { "Literal": … }` in een stop, nooit `"color": { "expr": { "Literal": … } }` (kan Desktop laten crashen).
- Stopkleuren alleen `#RGB` of `#RRGGBB` als `Literal` (geen 8-cijferige hex, geen `ThemeDataColor` — wordt zwart).
- `nullColoringStrategy`: `'asZero'`, `'noColor'` of `'specificColor'` (dan met een `color`-node ernaast); of helemaal weglaten.
- Geen `FillRule` onder `columnFormatting` (behalve databalken horen daar wél).
- Werkt ook op `fontColor`.

## Type 2: regels (Conditional.Cases)

Er bestaat geen `backColorRule` of `fontColorRule`: regels staan in dezelfde kleureigenschap.

**Voorbeeld — dagen te laat: ≥ 3 rood, ≥ 1 amber, < 1 groen** (item in `objects.values` van een tabel):

```json
{
  "properties": { "backColor": { "solid": { "color": { "expr": { "Conditional": { "Cases": [
    { "Condition": { "Comparison": { "ComparisonKind": 2,
        "Left": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } },
        "Right": { "Literal": { "Value": "3D" } } } },
      "Value": { "Literal": { "Value": "'#D13438'" } } },
    { "Condition": { "Comparison": { "ComparisonKind": 2,
        "Left": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } },
        "Right": { "Literal": { "Value": "1D" } } } },
      "Value": { "Literal": { "Value": "'#FF8C00'" } } },
    { "Condition": { "Comparison": { "ComparisonKind": 3,
        "Left": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } },
        "Right": { "Literal": { "Value": "1D" } } } },
      "Value": { "Literal": { "Value": "'#107C10'" } } }
  ] } } } } } },
  "selector": {
    "data": [ { "dataViewWildcard": { "matchingOption": 1 } } ],
    "metadata": "Orders.Days Late"
  }
}
```

- Sleutels in PascalCase: `Conditional`, `Cases`, `Condition`, `Comparison`, `ComparisonKind`, `Value`, `DefaultValue`. Operator heet `Comparison` (niet `Compare`).
- `ComparisonKind`: `0` =, `1` >, `2` >=, `3` <, `4` <=. Eerste overeenkomende case wint.
- Maak elke band die je in Desktop wilt kunnen bewerken een eigen case; `DefaultValue` alleen als vangnet (Desktop toont die niet als bewerkbare regel).
- `Left` = measure of `Aggregation` rond een kolom.
- In grafieken: zelfde structuur in `dataPoint.fill`, `lineStyles.strokeColor` of `labels.color`, met de grafiekselector.
- Drempel als percentage van het bereik (in Desktop "Percent") gebruikt een `RangePercent`-codering; maak die in Desktop en kopieer. Percentiel wordt niet ondersteund.

## Type 3: iconen

Alleen tabel/matrix, in `values.icon`. Ongeldige iconnaam = Desktop-crash ("Unable to find resource").

```json
{
  "properties": { "icon": {
    "kind": "Icon",
    "layout": { "expr": { "Literal": { "Value": "'Before'" } } },
    "verticalAlignment": { "expr": { "Literal": { "Value": "'Middle'" } } },
    "value": { "expr": { "Conditional": { "Cases": [
      { "Condition": { "Comparison": { "ComparisonKind": 2,
          "Left": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } },
          "Right": { "Literal": { "Value": "3D" } } } },
        "Value": { "Literal": { "Value": "'TrafficLow'" } } },
      { "Condition": { "Comparison": { "ComparisonKind": 2,
          "Left": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } },
          "Right": { "Literal": { "Value": "1D" } } } },
        "Value": { "Literal": { "Value": "'TrafficMedium'" } } },
      { "Condition": { "Comparison": { "ComparisonKind": 3,
          "Left": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } },
          "Right": { "Literal": { "Value": "1D" } } } },
        "Value": { "Literal": { "Value": "'TrafficHigh'" } } }
    ] } } }
  } },
  "selector": { "data": [ { "dataViewWildcard": { "matchingOption": 1 } } ], "metadata": "Orders.Days Late" }
}
```

`layout`: `'Before'` (standaard), `'After'`, `'IconOnly'`. `verticalAlignment`: `'Top'`, `'Middle'`, `'Bottom'`. Geen `iconRule`/`iconDefinition`.

**Iconnamen (selectie uit de catalogus):**

| Familie | Namen (hoog → laag) |
|---|---|
| Cirkels | `CircleHigh` · `CircleMedium` · `CircleLow` |
| Symbolen (✓ ! ✗) | `SymbolHigh` · `SymbolMedium` · `SymbolLow` |
| Omcirkelde symbolen | `CircleSymbolHigh` · `CircleSymbolMedium` · `CircleSymbolLow` |
| Verkeerslichten | `TrafficHigh` · `TrafficMedium` · `TrafficLow` · `TrafficBlackRimmed` |
| Driehoeken | `TriangleHigh` · `TriangleMedium` · `TriangleLow` |
| Gekleurde pijlen | `ColoredArrowUp` · `ColoredArrowUpRight` · `ColoredArrowRight` · `ColoredArrowDownRight` · `ColoredArrowDown` |
| Grijze pijlen | `GreyArrowUp` · `GreyArrowUpRight` · `GreyArrowRight` · `GreyArrowDownRight` · `GreyArrowDown` |
| Vlaggen | `FlagHigh` · `FlagMedium` · `FlagLow` · `FlagBlack` |
| Sterren | `StarHigh` · `StarMedium` · `StarLow` |
| Signaalbalken | `SignalBarFull` · `SignalBarMedium2` · `SignalBarMedium` · `SignalBarLow` · `SignalBarEmpty` |
| Kwadranten | `QuadrantFull` · `Quadrant75` · `Quadrant50` · `Quadrant25` · `QuadrantEmpty` |

## Type 4: databalken

In `objects.columnFormatting` (niet `values`), selector **alleen** `metadata` (met `dataViewWildcard` verdwijnen de balken). Alleen numerieke kolommen.

```json
{
  "properties": { "dataBars": {
    "positiveColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#118DFF'" } } } } },
    "negativeColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#D64554'" } } } } },
    "axisColor":     { "solid": { "color": { "expr": { "Literal": { "Value": "'#999999'" } } } } },
    "reverseDirection": { "expr": { "Literal": { "Value": "false" } } },
    "hideText": { "expr": { "Literal": { "Value": "false" } } }
  } },
  "selector": { "metadata": "Inventory.Days On Hand" }
}
```

- Vaste schaal: `minValue` én `maxValue` (bijv. `"0D"` en `"365D"`).
- `hideText: true` = alleen de balk; niet combineren met een tekstkleurregel op dezelfde kolom.
- Balken ook op totaalrijen: `"totalMatchingOption": { "expr": { "Literal": { "Value": "0L" } } }` binnen `dataBars` (`1L` = alleen data, standaard; `2L` = alleen totalen).

## Type 5: weblinks

1. **Kolom met gegevenscategorie Web URL** (in het model, `dataCategory: WebUrl`): wordt automatisch een link, in tabel én matrix. `values.urlIcon: true` toont een 🔗-icoon i.p.v. de volledige URL. Geen extra regel toevoegen.
2. **Andere kolom tonen, link uit apart veld** (alleen `pivotTable`): `values.webURL` (hoofdletters `URL`), selector `dataViewWildcard` + `metadata` van de **getoonde** kolom; waarde = measure, of `Aggregation` met `Function: 3` rond een kolom.

```json
{
  "properties": { "webURL": { "expr": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Order Link" } } } },
  "selector": { "data": [ { "dataViewWildcard": { "matchingOption": 1 } } ], "metadata": "Orders.Order Number" }
}
```

*(voorbeeld: ordernummer klikbaar naar een SharePoint- of ERP-URL uit measure `Order Link`)*

## Type 6: kleur uit een veld

Measure of kolom die zelf een kleur teruggeeft (`#RRGGBB`, CSS-naam, `rgb()`, `hsl()`), direct in de kleureigenschap. Voorkeur: tekstmeasure.

```json
{
  "properties": { "backColor": { "solid": { "color": { "expr": {
    "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Status Color" } } } } } },
  "selector": { "data": [ { "dataViewWildcard": { "matchingOption": 1 } } ], "metadata": "Orders.Status" }
}
```

Een kleurkolom verpak je in `Aggregation` met `Function: 3` (Min) of `4` (Max). `matchingOption: 0` neemt ook totalen mee. Hex altijd met `#` en tussen enkele quotes als het een `Literal` is: `"'#118DFF'"`.

## Kaart en KPI

- `cardVisual`: `value.fontColor` en `label.fontColor` accepteren een vaste kleur of `Conditional.Cases`, met `{ "id": "default" }`. **Geen** `FillRule`.
- `kpi`: `indicator.fontColor` (alleen zonder `Goal`), `goals.goalFontColor`, `goals.distanceFontColor`, `lastDate.lastDateFontColor`; vaste kleur of regels, geen selector, geen `FillRule`.

## Titel en kleur van de container

In `visualContainerObjects`, zonder selector:

| Eigenschap | Mogelijk |
|---|---|
| `title.text`, `general.altText` | `Literal`, `Measure` (voorkeur, tekst), `Column` (één waarde), `Aggregation`, `NativeMeasure`, `Conditional` |
| `title.fontColor`, `title.background`, `background.color`, `border.color` | `Literal`, `ThemeDataColor`, `FillRule`, `Conditional`, kleur-measure |

**Voorbeeld — dynamische titel uit een measure:**

```json
"title": [{ "properties": {
  "show": { "expr": { "Literal": { "Value": "true" } } },
  "text": { "expr": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Title Open Orders" } } }
} }]
```

## Wat niet kan

- Canvas- en wallpaperkleur van een pagina.
- Kolombreedte in tabel/matrix (gebruik databalken).
- Iconnamen uit een veld; weblinks op grafiekdatapunten.
- Vorm, grootte en plaats van knopiconen; vormgeometrie.
- Lijn- en markerkleur-regels in combinatiegrafieken; per-label-kleur in scatter.

Vraag je toch zoiets, dan uitleggen dat het niet ondersteund wordt en een vaste kleur of ander doel voorstellen; niet naar een gelijknamige eigenschap verplaatsen.

## Problemen

| Symptoom | Betekenis | Actie |
|---|---|---|
| Grijze **See details**-overlay | Aansturend veld ontbreekt, geeft fout of verkeerd type | Veld/measure repareren of vervangen |
| Valideert, maar standaardopmaak blijft | Niet-ondersteund doel, verkeerde selector, of veld geeft geen waarde op dat niveau | Selector-tabel en doel nalopen |
| Gradiënt zwart | `ThemeDataColor` of 8-cijferige hex in stop | `Literal` `#RRGGBB` |
| Desktop crasht bij laden | Ongeldige iconnaam, of `expr` rond een stopkleur | Catalogusnaam gebruiken / `expr` weghalen |
| URL blijft tekst | `metadata` ontbreekt of wijst naar het URL-veld; kleine letters `webUrl` | `webURL`, `metadata` = getoonde kolom |
| Databalken weg | `dataViewWildcard` in de selector | Alleen `metadata` |
