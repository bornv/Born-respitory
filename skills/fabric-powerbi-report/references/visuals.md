# Visuals: sjablonen per type

Sjablonen voor de visuals die je in operationele rapporten het meest gebruikt. Plak ze in `visual.json`, vervang de `<…>`-delen en de voorbeeldvelden door je eigen tabel-, kolom- en measurenamen. Kopieer `$schema` uit een bestaand `visual.json` in hetzelfde rapport.

> De voorbeelden gebruiken verzonnen warehouse-namen (`Orders`, `Inventory`, `Deliveries`, measures als `Open Orders`). Het zijn **voorbeelden**: gebruik de namen uit jouw model.

## Inhoud

- [Kaart (cardVisual)](#kaart-cardvisual)
- [KPI (kpi)](#kpi-kpi)
- [Tabel (tableEx)](#tabel-tableex)
- [Matrix (pivotTable)](#matrix-pivottable)
- [Staaf-, kolom- en lijngrafieken](#staaf--kolom--en-lijngrafieken)
- [Kleur in grafieken](#kleur-in-grafieken)
- [Tekstvak (textbox)](#tekstvak-textbox)
- [Rolnamen in één tabel](#rolnamen-in-één-tabel)

## Kaart (cardVisual)

- Enige datarol: **`Data`** (niet `Fields` — dat is de rol van het oude `card`; gevolg is een lege kaart).
- **2–5 samenhangende KPI's = één `cardVisual`** met meerdere projecties in `Data`. Losse kaarten alleen als elke kaart een eigen accentkleur, achtergrond, voorwaardelijke opmaak, lettergrootte of klikgedrag nodig heeft.
- Bijna alle kaartobjecten hebben `"selector": { "id": "default" }` nodig: `value`, `label`, `accentBar`, `outline`, `padding`, `spacing`, `divider`, `fillCustom`, `layout`, `referenceLabelTitle/Value/Detail`. Zonder selector: valideert, maar geen effect. Zonder selector: `cardCalloutArea`, `referenceLabel`, `referenceLabelLayout`.

**Voorbeeld — KPI-strook met drie measures:**

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<20hex>",
  "position": { "x": 24, "y": 56, "z": 1000, "height": 82, "width": 900, "tabOrder": 1000 },
  "visual": {
    "visualType": "cardVisual",
    "query": {
      "queryState": {
        "Data": {
          "projections": [
            { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Open Orders" } }, "queryRef": "Orders.Open Orders", "nativeQueryRef": "Open Orders" },
            { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Late Orders" } }, "queryRef": "Orders.Late Orders", "nativeQueryRef": "Late Orders" },
            { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "OTIF %" } }, "queryRef": "Deliveries.OTIF %", "nativeQueryRef": "OTIF %" }
          ]
        }
      }
    },
    "objects": {
      "value":   [{ "properties": { "fontSize": { "expr": { "Literal": { "Value": "20D" } } } }, "selector": { "id": "default" } }],
      "label":   [{ "properties": { "fontSize": { "expr": { "Literal": { "Value": "11D" } } } }, "selector": { "id": "default" } }],
      "padding": [{ "properties": { "paddingUniform": { "expr": { "Literal": { "Value": "8D" } } } }, "selector": { "id": "default" } }],
      "layout":  [{ "properties": { "paddingUniform": { "expr": { "Literal": { "Value": "0D" } } } }, "selector": { "id": "default" } }],
      "outline": [{ "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } }, "selector": { "id": "default" } }]
    },
    "visualContainerObjects": {
      "padding": [{ "properties": {
        "top": { "expr": { "Literal": { "Value": "8D" } } }, "bottom": { "expr": { "Literal": { "Value": "8D" } } },
        "left": { "expr": { "Literal": { "Value": "8D" } } }, "right": { "expr": { "Literal": { "Value": "8D" } } }
      }, "selector": { "id": "default" } }],
      "spacing": [{ "properties": {
        "customizeSpacing": { "expr": { "Literal": { "Value": "true" } } },
        "verticalSpacing": { "expr": { "Literal": { "Value": "2D" } } }
      }, "selector": { "id": "default" } }]
    }
  }
}
```

Breedte: ± 250–300 px per waarde. Een enkele kaart is hetzelfde sjabloon met één projectie (breedte ± 296).

**Hoogte berekenen** (te laag = afgekapte waarde, te hoog = lege band):

```text
waarde_pt = min(28, max(12, floor(canvashoogte × 0,028)))
label_pt  = min(14, max(8,  floor(waarde_pt × 0,55)))
render(pt) = ceil(pt × 1,5)
hoogte = 2×8 (VCO-padding) + 2×8 (inner padding) + 2 (spacing)
       + render(waarde_pt) + render(max(label_pt, 12))
maximum = 15% van de canvashoogte
```

| Canvashoogte | Waarde | Label | Kaarthoogte |
|---|---|---|---|
| 600 | 16 pt | 8 pt | 76 |
| 720 | 20 pt | 11 pt | 82 |
| 1080 | 28 pt | 14 pt | 97 |

Met referentielabel (verschil t.o.v. doel/vorige periode) ± 16 px extra; met titel `render(titel_pt) + ruimte onder titel` extra. Breedte te klein geeft `...` → breder maken of kleinere waarde.

**Labeltekst overschrijven** (anders toont de kaart de ruwe measurenaam):

```json
"label": [{ "properties": {
  "show": { "expr": { "Literal": { "Value": "true" } } },
  "text": { "expr": { "Literal": { "Value": "'Open orders'" } } }
}, "selector": { "id": "default" } }]
```

**Accentbalk** (alleen per visual, erft niet uit het thema):

```json
"accentBar": [{ "properties": {
  "show": { "expr": { "Literal": { "Value": "true" } } },
  "position": { "expr": { "Literal": { "Value": "'Left'" } } },
  "width": { "expr": { "Literal": { "Value": "4D" } } },
  "color": { "solid": { "color": { "expr": { "Literal": { "Value": "'#0072B2'" } } } } }
}, "selector": { "id": "default" } }]
```

**Alleen bij 2+ waarden:** `cardCalloutArea` (tegelstijl per waarde, géén selector), `layout` met `style: 'Table'` + `customizeLines: true` + `gridline*` (scheidingslijnen), `divider` met `divider*`-eigenschappen. Op een kaart met één waarde hebben deze geen effect. Lettertype en kleur van `value`/`label` gelden voor alle waarden in één kaart.

Erft **niet** uit het thema (altijd per visual): `outline`, `accentBar`, `layout`, visual-`padding`, `value.fontColor`, `label.text`.

## KPI (kpi)

| Rol | Verplicht | Soort | Max |
|---|---|---|---|
| `Indicator` | ja | Measure of Aggregation | 1 |
| `TrendLine` | nee | Kolom (datum/numeriek) | 1 |
| `Goal` | nee | Measure of Aggregation | 2 |

Opmaakobjecten: `general`, `goals`, `indicator`, `lastDate`, `status`, `trendline` (zonder selector).

| Lege KPI — oorzaak | Oplossing |
|---|---|
| `Indicator` gebonden aan een kale kolom | Measure of `Aggregation` gebruiken |
| `Indicator` is `BLANK` op het laatste trendpunt (datumtabel loopt door in de toekomst) | Measure laten aanpassen, bijv. met `LASTNONBLANK` of `COALESCE` (`fabric-semantic-model`) |
| `TrendLine` op tekst/categorie | Datum-, datetime- of oplopende numerieke kolom |
| `Goal` op andere tijdkorrel dan `Indicator` | Doel-measure op dezelfde korrel laten evalueren |
| `Goal` op kale kolom | Measure of `Aggregation` |

```json
"visualType": "kpi",
"query": {
  "queryState": {
    "Indicator": { "projections": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "OTIF %" } }, "queryRef": "Deliveries.OTIF %", "nativeQueryRef": "OTIF %" } ] },
    "TrendLine": { "projections": [ { "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Date" } }, "Property": "Date" } }, "queryRef": "Date.Date", "nativeQueryRef": "Date" } ] },
    "Goal":      { "projections": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "OTIF Target" } }, "queryRef": "Deliveries.OTIF Target", "nativeQueryRef": "OTIF Target" } ] }
  }
}
```

## Tabel (tableEx)

Platte lijst; alle kolommen in `Values`. Standaard altijd **grow to fit**:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<20hex>",
  "position": { "x": 20, "y": 20, "z": 1000, "height": 400, "width": 700, "tabOrder": 1000 },
  "visual": {
    "visualType": "tableEx",
    "query": {
      "queryState": {
        "Values": {
          "projections": [
            { "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Order Number" } }, "queryRef": "Orders.Order Number", "nativeQueryRef": "Order Number" },
            { "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Customer" } }, "queryRef": "Orders.Customer", "nativeQueryRef": "Customer" },
            { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } }, "queryRef": "Orders.Days Late", "nativeQueryRef": "Days Late" }
          ]
        }
      },
      "sortDefinition": {
        "sort": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Days Late" } }, "direction": "Descending" } ],
        "isDefaultSort": false
      }
    },
    "objects": {
      "columnHeaders": [{ "properties": {
        "columnAdjustment": { "expr": { "Literal": { "Value": "'growToFit'" } } },
        "autoSizeColumnWidth": { "expr": { "Literal": { "Value": "true" } } }
      } }]
    }
  }
}
```

*(voorbeeld: uitzonderingenlijst late orders, ergste eerst)*

Krijg je alleen kolomkoppen zonder rijen terwijl de data bestaat, en staan er dimensies én measures in `Values`? Gebruik dan een `pivotTable`.

**Vaste kolombreedtes** alleen als je dat expliciet wilt: `columnAdjustment: 'fixedWidth'`, `autoSizeColumnWidth: false` en per kolom een `columnWidth`-entry (`"value": "180D"`, selector `{ "metadata": "<queryRef>" }`). Kolommen zonder entry worden dan 90 px. Kolombreedte kan niet afhangen van data; gebruik dan databalken.

**Rijkleuren (banding):**

| Eigenschap (in `values`) | Geldt voor |
|---|---|
| `backColorPrimary` / `fontColorPrimary` | Oneven rijen |
| `backColorSecondary` / `fontColorSecondary` | Even rijen |
| `backColor` / `fontColor` | Slot voor **voorwaardelijke** opmaak, niet voor vaste kleuren |

Eigen kleuren werken alleen met `stylePreset` op `'None'` (anders overschrijft de standaardpreset ze met wit):

```json
"visualContainerObjects": {
  "stylePreset": [{ "properties": { "name": { "expr": { "Literal": { "Value": "'None'" } } } } }]
}
```

Ingebouwde presets: `None`, `Minimal`, `BoldHeader`, `AlternatingRows`, `ContrastAlternatingRows`, `FlashyRows`, `BoldHeaderFlashyRows`, `Sparse`, `Condensed` (`tableEx` ook `Default`, `AlternatingRowsNew`).

Opmaakgebieden: `values` (cellen), `columnHeaders` (`fontColor`, `backColor`, `outline`, `outlineColor`), `rowHeaders` (matrix), `rowTotal`/`columnTotal` (matrixtotalen, met `applyToHeaders`), `subTotals`. Een donkere `visualContainerObjects.background` kleurt alleen de rand; celkleuren zet je in `values` en `columnHeaders`.

Een measure die tekst teruggeeft (bijv. `"Op tijd"`/`"Te laat"`) bind je gewoon als kolom in `Values`; dat is geen voorwaardelijke opmaak.

## Matrix (pivotTable)

| Rol | Doel |
|---|---|
| `Rows` | Rijgroepering (hiërarchieniveaus) |
| `Columns` | Kolomgroepering |
| `Values` | Measures |

```json
"visualType": "pivotTable",
"query": {
  "queryState": {
    "Rows":    { "projections": [ { "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Inventory" } }, "Property": "Warehouse" } }, "queryRef": "Inventory.Warehouse", "nativeQueryRef": "Warehouse" } ] },
    "Columns": { "projections": [ { "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Inventory" } }, "Property": "ABC Class" } }, "queryRef": "Inventory.ABC Class", "nativeQueryRef": "ABC Class" } ] },
    "Values":  { "projections": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Inventory" } }, "Property": "Stock Value" } }, "queryRef": "Inventory.Stock Value", "nativeQueryRef": "Stock Value" } ] }
  }
},
"objects": {
  "columnHeaders": [{ "properties": {
    "columnAdjustment": { "expr": { "Literal": { "Value": "'growToFit'" } } },
    "autoSizeColumnWidth": { "expr": { "Literal": { "Value": "true" } } }
  } }]
}
```

*(voorbeeld: voorraadwaarde per magazijn × ABC-klasse)*

- `expansionStates` alleen als er uitgeklapte hiërarchieknooppunten zijn (rol `["Rows"]`).
- Vaste totaalkleuren via `rowTotal`/`columnTotal`; `total.fontColor` is een CF-slot.
- Op `pivotTable` hebben `values.fontColor`/`total.fontColor` met een vaste kleur **geen** effect: gebruik `fontColorPrimary`/`Secondary`.
- `bandedRowHeaders` (bool) bandeert ook de rijkoppen.

## Staaf-, kolom- en lijngrafieken

| `visualType` | Richting | Stapeling |
|---|---|---|
| `columnChart` | Verticaal | Gestapeld |
| `barChart` | Horizontaal | Gestapeld |
| `clusteredColumnChart` | Verticaal | Naast elkaar |
| `clusteredBarChart` | Horizontaal | Naast elkaar |
| `lineChart` | Lijn | — |

Rollen `lineChart`: verplicht `Category` (As) en `Y` (Waarden); optioneel `Series` (Legenda, max 1), `Y2` (secundaire as), `Rows` (small multiples), `Tooltips`. Staaf/kolom heeft `Gradient` maar geen `Y2`.

**Voorbeeld — horizontale staaf, gesorteerd:**

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<20hex>",
  "position": { "x": 20, "y": 118, "z": 2000, "height": 400, "width": 600, "tabOrder": 2000 },
  "visual": {
    "visualType": "barChart",
    "query": {
      "queryState": {
        "Category": { "projections": [ { "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "Carrier" } }, "queryRef": "Deliveries.Carrier", "nativeQueryRef": "Carrier", "active": true } ] },
        "Y":        { "projections": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "Late Deliveries" } }, "queryRef": "Deliveries.Late Deliveries", "nativeQueryRef": "Late Deliveries" } ] }
      },
      "sortDefinition": {
        "sort": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Deliveries" } }, "Property": "Late Deliveries" } }, "direction": "Descending" } ],
        "isDefaultSort": false
      }
    },
    "objects": {
      "dataPoint": [{ "properties": { "defaultColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#0072B2'" } } } } } } }],
      "labels":    [{ "properties": { "show": { "expr": { "Literal": { "Value": "true" } } } } }]
    },
    "visualContainerObjects": {
      "title": [{ "properties": {
        "show": { "expr": { "Literal": { "Value": "true" } } },
        "text": { "expr": { "Literal": { "Value": "'Late deliveries per carrier'" } } }
      } }],
      "subTitle": [{ "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } }]
    }
  }
}
```

**`Y` met een kolom i.p.v. measure:** gebruik `Aggregation`, met `queryRef: "Sum(<Tabel>.<Kolom>)"` en `nativeQueryRef: "Sum of <Kolom>"` (anders lege visual zonder fout).

**Meerdere reeksen:** óf een groeperingskolom in `Series` (één measure, gesplitst per waarde), óf meerdere measures in `Y` (elke measure een reeks).

**Drill-hiërarchie:** meerdere velden in `Category` (bijv. jaar → maand). `active: true` op het eerste niveau laadt het bovenste niveau; `active: true` op meerdere niveaus laadt al ingezoomd.

**Automatische datumhiërarchie** (datumkolom met `variation` in het model):

```json
"field": {
  "HierarchyLevel": {
    "Expression": { "Hierarchy": {
      "Expression": { "PropertyVariationSource": { "Expression": { "SourceRef": { "Entity": "<Tabel>" } }, "Name": "Variation", "Property": "<Datumkolom>" } },
      "Hierarchy": "Date Hierarchy"
    } },
    "Level": "Year"
  }
},
"queryRef": "<Tabel>.<Datumkolom>.Variation.Date Hierarchy.Year",
"nativeQueryRef": "<Datumkolom> Year",
"active": true
```

Niveaus: `Year`, `Quarter`, `Month`, `Day`; diepere niveaus `active: false`.

**Veelgebruikte opmaak** (controleer eigenschapsnamen per type; ze verschillen, bijv. `fillTransparency` bij staaf vs. `transparency` bij lijn):

| Object | Voorbeeldeigenschappen |
|---|---|
| `categoryAxis` / `valueAxis` | `show`, `fontSize`, `titleText`, `start` (`"0D"`), `labelDisplayUnits`, `gridlineStyle` (`'dotted'`, `'dashed'`), `invertAxis` |
| `labels` | `show`, `fontSize`, `color`, `labelPosition` |
| `legend` | `position` (bijv. `'TopCenter'`), `titleText` |
| `y2Axis` (alleen lijn) | eigenschappen met prefix `sec`, bijv. `secLogAxisScale` |
| `smallMultiplesLayout` | `rowCount`, `columnCount` |

Legenda, assen en titels nemen **geen** selector. `logAxisScale` niet aanzetten bij nul- of negatieve waarden (Desktop valt terug op lineair).

## Kleur in grafieken

| Situatie | Aanpak |
|---|---|
| Eén measure, geen `Series` | `dataPoint.defaultColor` (zonder selector) |
| Meerdere measures of `Series` | `dataPoint.fill` met `"selector": { "metadata": "<queryRef>" }` per reeks — of laat het thema-palet kleuren |
| Hele palet in het rapport | `dataColors` in het thema |
| Dezelfde measure overal dezelfde kleur | Vaste measure→kleur-tabel, per visual expliciet toepassen |

- `fill` zónder selector op een 1-reeksgrafiek = onzichtbare staven.
- `defaultColor` op meerdere reeksen = alles één kleur.
- Bij `metadata`-selectors **`Literal`-hex** gebruiken; `ThemeDataColor` kan daar wit of zwart worden.
- Het thema kent kleuren toe op **volgorde** van projecties, niet op measure: daarom de vaste kleurtabel.
- Taart, donut, scatter, treemap, funnel negeren `metadata`-selectors; daar per categorie een `scopeId`-selector (zie [opmaak-en-thema.md](opmaak-en-thema.md#selectors)).
- Kies verzadigde, middeldonkere kleuren die contrasteren met de achtergrond.

```json
"dataPoint": [
  { "properties": { "fill": { "solid": { "color": { "expr": { "Literal": { "Value": "'#0072B2'" } } } } } }, "selector": { "metadata": "Orders.Open Orders" } },
  { "properties": { "fill": { "solid": { "color": { "expr": { "Literal": { "Value": "'#D55E00'" } } } } } }, "selector": { "metadata": "Orders.Late Orders" } }
]
```

## Tekstvak (textbox)

Voor paginatitels, kopjes en toelichting. `paragraphs` is een **echte JSON-array** direct onder `general[].properties` — niet als string, niet in een extra `{ "paragraphs": … }`-object (dan onzichtbare tekst).

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<20hex>",
  "position": { "x": 20, "y": 20, "z": 1000, "height": 40, "width": 520, "tabOrder": 0 },
  "visual": {
    "visualType": "textbox",
    "objects": {
      "general": [{ "properties": {
        "paragraphs": [
          { "textRuns": [ { "value": "12 orders te laat in hal 3", "textStyle": { "fontFamily": "Segoe UI Semibold", "fontSize": "24px", "color": "#252423" } } ],
            "horizontalTextAlignment": "left" }
        ]
      } }]
    },
    "visualContainerObjects": {
      "background": [{ "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } }],
      "border":     [{ "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } }],
      "padding":    [{ "properties": {
        "top": { "expr": { "Literal": { "Value": "0D" } } }, "bottom": { "expr": { "Literal": { "Value": "0D" } } },
        "left": { "expr": { "Literal": { "Value": "0D" } } }, "right": { "expr": { "Literal": { "Value": "0D" } } }
      } }]
    }
  }
}
```

- Hoogte zonder scrollbalk: `max(18, ⌈lettergrootte × 25/16⌉) + padding_boven + padding_onder`.
- Eenheden `"24px"` of `"12pt"`; bestaande eenheden behouden.
- Dynamische tekst (waarde uit het model) heeft een object als `value` plus een bijbehorende `values`-expressie; bouw die bij voorkeur in Desktop en kopieer. Voor een eenvoudige dynamische titel is een measure in `title.text` makkelijker (zie [voorwaardelijke-opmaak.md](voorwaardelijke-opmaak.md#titel-en-kleur-van-de-container)).
- Dunne lijnen of achtergrondvlakken: `shape` gebruiken, geen tekstvak.

## Rolnamen in één tabel

| `visualType` | Rollen |
|---|---|
| `cardVisual` | `Data` |
| `kpi` | `Indicator`, `TrendLine`, `Goal` |
| `tableEx` | `Values` |
| `pivotTable` | `Rows`, `Columns`, `Values` |
| `barChart`, `columnChart`, `clustered…`, `lineChart` | `Category`, `Y`, `Series`, `Tooltips` (+ `Y2`, `Rows` bij lijn) |
| `slicer` | `Values` |
| `listSlicer` | `Values`, `Tooltips` |
| `advancedSlicerVisual` | `Values` (1 kolom), `Label` (1 measure), `Tooltips` |
| `actionButton`, `textbox`, `shape` | geen datarollen |

Andere visualtypes (scatter, kaart, waterval, …): maak de visual eerst in Desktop en neem de rolnamen over uit het opgeslagen `visual.json`.
