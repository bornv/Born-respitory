# Filters en slicers

Filters op rapport-, pagina- en visualniveau, en slicers met hun selectie, grootte en synchronisatie.

## Inhoud

- [Filters: waar ze staan](#filters-waar-ze-staan)
- [Categorisch filter](#categorisch-filter)
- [Uitsluiten](#uitsluiten)
- [Bereik en geavanceerd](#bereik-en-geavanceerd)
- [Top N](#top-n)
- [Relatieve datum of tijd](#relatieve-datum-of-tijd)
- [Slicertypes](#slicertypes)
- [Slicersjabloon](#slicersjabloon)
- [Slicerhoogte](#slicerhoogte)
- [Datumslicers](#datumslicers)
- [Vooraf geselecteerde waarden](#vooraf-geselecteerde-waarden)
- [Slicers synchroniseren](#slicers-synchroniseren)

## Filters: waar ze staan

Alle drie de niveaus gebruiken dezelfde array `filterConfig.filters`:

| Niveau | Bestand |
|---|---|
| Rapport | `report.json` |
| Pagina | `page.json` |
| Visual | `visual.json` |

| `type` | Betekenis |
|---|---|
| `Categorical` | Waarden uit een lijst |
| `Range` | Numeriek of datumbereik |
| `Advanced` | Eigen voorwaarden (en/of) |
| `TopN` | Top/bottom N op een measure |
| `RelativeDate` | Bijv. "laatste 30 dagen" |
| `RelativeTime` | Uren/minuten/seconden |
| `Exclude` / `Include` | Specifiek datapunt uit-/insluiten |

**Belangrijkste valkuil:** binnen `filter.Where` gebruik je `"SourceRef": { "Source": "<alias>" }` met de alias uit `From`. Alleen het bovenste `field` gebruikt `"Entity"`. `Entity` in `Where` = filter werkt stil niet. `"howCreated": "User"` is verplicht. `From[].Type` `0` = tabel.

Filternamen (`Filter` + 24 hex) zijn uniek in het hele rapport.

## Categorisch filter

**Voorbeeld — paginafilter op status Open en Picking:**

```json
{
  "name": "Filter<24hex>",
  "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Status" } },
  "type": "Categorical",
  "filter": {
    "Version": 2,
    "From": [ { "Name": "o", "Entity": "Orders", "Type": 0 } ],
    "Where": [
      {
        "Condition": {
          "In": {
            "Expressions": [ { "Column": { "Expression": { "SourceRef": { "Source": "o" } }, "Property": "Status" } } ],
            "Values": [
              [ { "Literal": { "Value": "'Open'" } } ],
              [ { "Literal": { "Value": "'Picking'" } } ]
            ]
          }
        }
      }
    ]
  },
  "howCreated": "User"
}
```

Plaats dit in `page.json` als:

```json
"filterConfig": { "filters": [ { } ] }
```

## Uitsluiten

Om waarden uit te sluiten: `In` in een `Not` zetten.

```json
"Where": [ { "Condition": { "Not": { "Expression": { "In": {
  "Expressions": [ { "Column": { "Expression": { "SourceRef": { "Source": "o" } }, "Property": "Status" } } ],
  "Values": [ [ { "Literal": { "Value": "'Cancelled'" } } ] ]
} } } } } ]
```

Hoort dit bij een slicer, zet dan ook in de slicer `objects.data` → `isInvertedSelectionMode: true`, zodat Desktop klikken als "aftrekken van alles" behandelt:

```json
"data": [{ "properties": { "isInvertedSelectionMode": { "expr": { "Literal": { "Value": "true" } } } } }]
```

`Include`/`Exclude`-filters (`"type": "Include"` of `"Exclude"`, met `"howCreated"` gelijk aan het type) hebben dezelfde `In`-structuur zonder bovenste `field`.

## Bereik en geavanceerd

**Bereik** (type `Advanced` met `Between`):

```json
{
  "name": "Filter<24hex>",
  "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Inventory" } }, "Property": "Days On Hand" } },
  "type": "Advanced",
  "filter": {
    "Version": 2,
    "From": [ { "Name": "i", "Entity": "Inventory", "Type": 0 } ],
    "Where": [ { "Condition": { "Between": {
      "Expression": { "Column": { "Expression": { "SourceRef": { "Source": "i" } }, "Property": "Days On Hand" } },
      "LowerBound": { "Literal": { "Value": "30D" } },
      "UpperBound": { "Literal": { "Value": "180D" } }
    } } } ]
  },
  "howCreated": "User"
}
```

**Geavanceerd:** `Condition` met `And` of `Or`, met links en rechts een `Comparison`, `Not`, `Contains` of `StartsWith`:

```json
"Condition": { "And": { "Left": { "Comparison": { } }, "Right": { "Comparison": { } } } }
```

## Top N

- **Alleen op visualniveau**, niet op pagina of rapport.
- `OrderBy.Expression` moet een **`Aggregation`** zijn, geen `Measure` (anders Desktop-fout `Cannot read properties of undefined (reading 'accept')`).
- `Direction`: `1` = bottom, `2` = top.

```json
{
  "name": "Filter<24hex>",
  "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Inventory" } }, "Property": "Item" } },
  "type": "TopN",
  "filter": {
    "Version": 2,
    "From": [
      {
        "Name": "subquery",
        "Expression": { "Subquery": { "Query": {
          "Version": 2,
          "From": [ { "Name": "i", "Entity": "Inventory", "Type": 0 } ],
          "Select": [ { "Column": { "Expression": { "SourceRef": { "Source": "i" } }, "Property": "Item" }, "Name": "field" } ],
          "OrderBy": [ { "Direction": 2, "Expression": { "Aggregation": {
            "Expression": { "Column": { "Expression": { "SourceRef": { "Source": "i" } }, "Property": "Stock Value" } },
            "Function": 0
          } } } ],
          "Top": 10
        } } },
        "Type": 2
      },
      { "Name": "i", "Entity": "Inventory", "Type": 0 }
    ],
    "Where": [ { "Condition": { "In": {
      "Expressions": [ { "Column": { "Expression": { "SourceRef": { "Source": "i" } }, "Property": "Item" } } ],
      "Table": { "SourceRef": { "Source": "subquery" } }
    } } } ]
  },
  "howCreated": "User"
}
```

*(voorbeeld: top 10 artikelen op voorraadwaarde)*

## Relatieve datum of tijd

`"type": "RelativeDate"` (of `"RelativeTime"` voor uren/minuten). Ondergrens = vandaag + 1 dag, dan N eenheden terug; bovengrens = nu.

```json
"Where": [ { "Condition": { "Between": {
  "Expression": { "Column": { "Expression": { "SourceRef": { "Source": "d" } }, "Property": "Date" } },
  "LowerBound": { "DateSpan": { "Expression": { "DateAdd": {
    "Expression": { "DateAdd": { "Expression": { "Now": {} }, "Amount": 1, "TimeUnit": 0 } },
    "Amount": -30, "TimeUnit": 0
  } }, "TimeUnit": 0 } },
  "UpperBound": { "DateSpan": { "Expression": { "Now": {} }, "TimeUnit": 0 } }
} } } ]
```

`TimeUnit`: `0` dag, `1` week, `2` maand, `3` jaar, `4` decennium, `5` seconde, `6` minuut, `7` uur.

## Slicertypes

| Type | `visualType` | Rollen | `data.mode` | Gebruik |
|---|---|---|---|---|
| Dropdown | `slicer` | `Values` (kolom/hiërarchie) | `'Dropdown'` | Elke kardinaliteit; standaard voor jaar/periode |
| Lijst (klassiek) | `slicer` | `Values` | `'Basic'` | Korte lijsten |
| Enkele keuze | `slicer` | `Values` | `'Single'` | Eén waarde |
| Datumkiezer | `slicer` | `Values` (Date/DateTime) | `'RelativeDatePicker'` | Kalender; handmatig of relatief |
| Compact datumbereik | `slicer` | `Values` (Date/DateTime) | `'Between'` | Van–tot zonder kalender |
| Voor / na | `slicer` | `Values` (datum/getal) | `'Before'` / `'After'` | Eén grens |
| Relatieve datum | `slicer` | `Values` (datum) | `'Relative'` | "Laatste N dagen/maanden" |
| Relatieve tijd | `slicer` | `Values` (DateTime) | `'RelativeTime'` | "Laatste N uur" |
| Scrollbare lijst | `listSlicer` | `Values` (kolom/hiërarchie), `Tooltips` (measure/aggregatie) | — | Standaard voor "lijstslicer" |
| Tegels/knoppen | `advancedSlicerVisual` | `Values` (1 kolom), `Label` (1 measure), `Tooltips` | — | ≤ 10 waarden |

- `data.mode` bestaat alleen bij `slicer`.
- Meerdere velden in `Values` (hiërarchieslicer) alleen bij `slicer` (Basic/Dropdown) en `listSlicer`; overige slicers precies één veld.
- Tooltips tonen bij `listSlicer`/`advancedSlicerVisual`: veld in `Tooltips` **én** `visualContainerObjects.visualTooltip.show = true`.
- Velden met veel waarden (artikelnummers, ordernummers): dropdown met zoekvak, geen tegels.

## Slicersjabloon

**Voorbeeld — dropdown op magazijn:**

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<20hex>",
  "position": { "x": 1040, "y": 8, "z": 1000, "height": 80, "width": 160, "tabOrder": 1000 },
  "visual": {
    "visualType": "slicer",
    "query": {
      "queryState": {
        "Values": { "projections": [ {
          "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Inventory" } }, "Property": "Warehouse" } },
          "queryRef": "Inventory.Warehouse",
          "nativeQueryRef": "Warehouse"
        } ] }
      }
    },
    "objects": {
      "data":   [{ "properties": { "mode": { "expr": { "Literal": { "Value": "'Dropdown'" } } } } }],
      "header": [{ "properties": {
        "show": { "expr": { "Literal": { "Value": "true" } } },
        "text": { "expr": { "Literal": { "Value": "'Magazijn'" } } }
      } }]
    },
    "visualContainerObjects": {
      "padding": [{ "properties": {
        "top": { "expr": { "Literal": { "Value": "8D" } } }, "bottom": { "expr": { "Literal": { "Value": "8D" } } },
        "left": { "expr": { "Literal": { "Value": "8D" } } }, "right": { "expr": { "Literal": { "Value": "8D" } } }
      } }]
    }
  }
}
```

- **Zet altijd `padding` expliciet.** Zodra een slicer één `visualContainerObjects`-item heeft (achtergrond, rand, titel, header), vervalt de padding uit het thema en wordt die 0: de inhoud plakt tegen de rand en de onderste rij kan wegvallen.
- `header.text` per slicer instellen als de modelnaam niet leesbaar is (erft niet zinvol uit het thema).
- **Gevulde variant** (witte kaart): voeg toe `background` (`show: true`, `color` `'#FFFFFF'`, `transparency` `0D`) en zet `padding` op `0D` rondom; hoogte dan 64.

## Slicerhoogte

Power BI vergroot een slicer niet zelf en toont geen halve rijen: te laag = laatste waarde verdwijnt stil.

| Modus / type | Hoogte |
|---|---|
| `Dropdown` | `60 + padding_boven + padding_onder`, naar boven afgerond op 8 → padding 0: **64**, padding 8/8: **80**, padding 10/10: **80** |
| `Between` (breedte 216, data onder elkaar) | `84 + boven + onder` → bij 8/8: **104** |
| `Before` / `After` | `60 + boven + onder` |
| `RelativeDatePicker` | breedte ≥ 280, hoogte ≥ 240 |
| `Basic` / `Single` / `listSlicer` | formule hieronder |
| `advancedSlicerVisual` | ≥ 56 px per tegelrij + padding |

```text
hoogte = padding_boven + padding_onder
       + 32 (kop, als zichtbaar bij 10 pt)
       + 32 (zoekvak, als zichtbaar)
       + aantal_zichtbare_waarden × 24 (bij items 9 pt, padding 2)
       + 8 (marge)
→ naar boven afronden op 8
```

Voorbeeld: 5 waarden, padding 10/10, kop en zoekvak zichtbaar → `20 + 32 + 32 + 120 + 8 = 212` → **216**.

Breedte: 160 standaard, 120 voor korte labels (Jaar), 216 voor compact `Between`. Oplossen van afkappen = slicer en band groter maken, niet de lettergrootte onder 9 pt of de hoogte naar 48. Wissel je `Dropdown` → `Basic`, dan altijd de hoogte opnieuw berekenen.

## Datumslicers

| Signaal | Gebruik |
|---|---|
| Managementpagina, jaarkorrel, ≤ 10 jaar | Jaar-dropdown of jaartegels |
| Maand/kwartaal, 12–36 perioden | Periode-dropdown of relatieve datum |
| Dagen/weken verkennen op een Date/DateTime-kolom | `RelativeDatePicker` |
| Compacte van–tot-grenzen | `Between` |
| Datumsleutel als getal/tekst, of datumkiezer rendert niet | Jaar/periode-dropdown |

**Datumkiezer, relatief voorgeselecteerd (laatste 30 dagen):** `mode` blijft `'RelativeDatePicker'`; `relativeDuration` en de negatieve `DateAdd.Amount` gelijk houden; beide `DateSpan.TimeUnit` op `0`.

```json
"data": [{ "properties": {
  "mode": { "expr": { "Literal": { "Value": "'RelativeDatePicker'" } } },
  "relativeRange": { "expr": { "Literal": { "Value": "'Last'" } } },
  "relativePeriod": { "expr": { "Literal": { "Value": "'Days'" } } },
  "relativeDuration": { "expr": { "Literal": { "Value": "30D" } } }
} }],
"dateRange": [{ "properties": { "includeToday": { "expr": { "Literal": { "Value": "true" } } } } }],
"general": [{ "properties": { "filter": { "filter": {
  "Version": 2,
  "From": [ { "Name": "d", "Entity": "<tabel>", "Type": 0 } ],
  "Where": [ { "Condition": { "Between": {
    "Expression": { "Column": { "Expression": { "SourceRef": { "Source": "d" } }, "Property": "<datumkolom>" } },
    "LowerBound": { "DateSpan": { "Expression": { "DateAdd": {
      "Expression": { "DateAdd": { "Expression": { "Now": {} }, "Amount": 1, "TimeUnit": 0 } },
      "Amount": -30, "TimeUnit": 0
    } }, "TimeUnit": 0 } },
    "UpperBound": { "DateSpan": { "Expression": { "Now": {} }, "TimeUnit": 0 } }
  } } } ]
} } } }]
```

`relativePeriod` `Days`/`Weeks`/`Months`/`Years` hoort bij `DateAdd.TimeUnit` `0`/`1`/`2`/`3`.

**Datumkiezer, handmatig:** zonder voorselectie laat je `general.filter`, `startDate` en `endDate` weg. Met een vaste periode zet je `startDate`/`endDate` (`"datetime'2026-01-01T00:00:00'"`) in `data` en een `general.filter` met `And` van `ComparisonKind 2` (≥ start) en `ComparisonKind 3` (< dag ná einddatum).

## Vooraf geselecteerde waarden

Selecties staan **alleen in de slicer zelf**: `objects.general[].properties.filter`. Laat dit weg voor "Alles".

```json
"general": [{ "properties": { "filter": { "filter": {
  "Version": 2,
  "From": [ { "Name": "i", "Entity": "Inventory", "Type": 0 } ],
  "Where": [ { "Condition": { "In": {
    "Expressions": [ { "Column": { "Expression": { "SourceRef": { "Source": "i" } }, "Property": "Warehouse" } } ],
    "Values": [ [ { "Literal": { "Value": "'WH-Nijmegen'" } } ] ]
  } } } ]
} } } }]
```

*(voorbeeld)* Desktop schrijft bij hiërarchieslicers extra `Annotations.filterExpressionMetadata` (`decomposedIdentities`, `valueMap`) en `expansionStates`; laat die staan als ze er al zijn, en maak complexe hiërarchieselecties bij voorkeur in Desktop.

## Slicers synchroniseren

Zelfde selectie over meerdere pagina's: `syncGroup` binnen `visual` (naast `visualType`):

```json
"visual": {
  "visualType": "slicer",
  "syncGroup": { "groupName": "DateSync", "fieldChanges": true, "filterChanges": true },
  "query": { },
  "objects": { }
}
```

Alle slicers in één groep hebben hetzelfde `visualType` en dezelfde kolom. De gepubliceerde schema's noemen `syncGroup` niet, maar Desktop leest en schrijft het wel.
