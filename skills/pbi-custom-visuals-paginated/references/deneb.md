# Deneb (Vega / Vega-Lite)

Deneb is een gecertificeerde custom visual waarmee je Vega- en Vega-Lite-specs (declaratieve JSON) direct in een rapport rendert. Kies Deneb voor afwijkende grafiektypen met interactie (cross-filter, tooltips, hover) en vectorweergave.

## Inhoud

1. Identiteit en limieten
2. Werkwijze
3. Spec-regels en escaping
4. Vega-Lite-patronen
5. Vega: wanneer en hoe
6. Themakleuren
7. Interactiviteit en runtimevelden
8. Objecteigenschappen en PBIR-codering
9. Performance
10. Community-templates importeren
11. Valkuilen

## 1. Identiteit en limieten

| Eigenschap | Waarde |
|---|---|
| `visualType` | `deneb7E15AEF80B9E4D4F8E12924291ECE89A` |
| Gebundelde runtime | Vega 6.2.0 / Vega-Lite 6.4.1 (sinds Deneb 1.8; gebruik `v6.json`-schema-URL's) |
| Datarol | Eén rol `dataset` ("Values"), `kind` `GroupingOrMeasure` |
| Rijlimiet | 10.000 standaard (`dataLimit.override` om te verhogen) |
| Provider | `vegaLite` (standaard) of `vega` |
| Rendermodus | `svg` (standaard, scherpe tekst) of `canvas` (beter bij veel data) |
| Externe data | Niet doen: AppSource-certificering verbiedt het laden van externe URL's |

De visual moet in het rapport geregistreerd zijn (AppSource-visual). Kopieer je een werkende Deneb-visual, dan gaat de registratie mee.

## 2. Werkwijze

1. Voeg de Deneb-visual toe (AppSource) en sleep alle velden (kolommen én measures) in de ene "Values"-bak.
2. Schrijf de spec in de Deneb-editor (of als los JSON-bestand). Begin bij `examples/deneb/` of een patroon hieronder.
3. Zet een aparte config (`examples/deneb/standard-config.json`): `autosize: fit`, `view.stroke: transparent`, `font: Segoe UI`.
4. Controleer dat elke veldnaam in de spec gelijk is aan de weergavenaam in de bak.
5. Zet interactiviteit bewust aan/uit (§7).
6. Test met echte filters, en bij veel rijen met `canvas`.

> De bron gebruikt de CLI `pbir` om Deneb-visuals in PBIR-bestanden toe te voegen en de spec te injecteren (`pbir visuals deneb ... --spec-file chart.vl.json --provider vegaLite`). Dat is een optionele tool die je zelf kunt installeren; in Desktop werk je gewoon in de Deneb-editor. Voor het bewerken van PBIR-bestanden zie `fabric-powerbi-report`.

## 3. Spec-regels en escaping

- Vega-Lite: `"data": {"name": "dataset"}` (object). Vega: `"data": [{"name": "dataset"}]` (array).
- Velden verwijzen naar de **weergavenaam** (`nativeQueryRef`, of `displayName` als hernoemd). De tekens `.`, `[`, `]`, `\`, `"` worden `_`. Spaties blijven: `"Order Lines"`.
- **Escaping hangt af van de context:**
  - Losse spec (bestand of Deneb-editor): `{"calculate": "datum[\"Order Lines\"] - datum[\"Order Lines (PY)\"]", "as": "diff"}`
  - In PBIR `visual.json` is de hele spec één DAX-literal tussen enkele quotes; veldnamen met spaties krijgen verdubbelde enkele quotes: `datum[''Order Lines''] - datum[''Order Lines (PY)'']`. Gewone stringliterals zoals `datum.Series == 'Actuals'` werken wel zo.
- Deneb parseert JSONC: commentaar in de spec mag.

Minimale Vega-Lite-spec:

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "mark": {"type": "bar", "tooltip": true},
  "encoding": {
    "y": {"field": "Category", "type": "nominal"},
    "x": {"field": "Value", "type": "quantitative"}
  }
}
```

> De voorbeeldbestanden `examples/deneb/bullet-chart.vl.json` en `kpi-card.vl.json` zijn letterlijk uit de bron overgenomen en verwijzen nog naar het `v5`-schema; gebruik voor nieuwe specs `v6.json`.

## 4. Vega-Lite-patronen

Alle patronen gaan uit van `"data": {"name": "dataset"}` en `"$schema": "https://vega.github.io/schema/vega-lite/v6.json"` (hieronder weggelaten waar het herhaling is).

### Horizontale staaf

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "mark": {"type": "bar", "tooltip": true, "cornerRadiusTopRight": 4, "cornerRadiusBottomRight": 4},
  "encoding": {
    "y": {"field": "Category", "type": "nominal", "sort": "-x"},
    "x": {"field": "Sales", "type": "quantitative"}
  }
}
```

### Staaf met cross-highlight

Achtergrondlaag met volledige waarde op lage dekking, voorgrond met de gemarkeerde waarde. Vereist `enableHighlight: true` en `enableSelection: true`.

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "layer": [
    {
      "mark": {"type": "bar", "opacity": 0.3, "tooltip": true},
      "encoding": {"x": {"field": "Sales"}}
    },
    {
      "mark": {"type": "bar", "tooltip": true},
      "encoding": {
        "x": {"field": "Sales__highlight"},
        "opacity": {
          "condition": {"test": {"field": "__selected__", "equal": "off"}, "value": 0},
          "value": 1
        }
      }
    }
  ],
  "encoding": {
    "y": {"field": "Category", "type": "nominal"},
    "x": {"type": "quantitative"}
  }
}
```

### Lijn met meerdere reeksen

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "mark": {"type": "line", "point": true, "tooltip": true, "strokeWidth": 2},
  "encoding": {
    "x": {"field": "Date", "type": "temporal"},
    "y": {"field": "Sales", "type": "quantitative"},
    "color": {"field": "Region", "type": "nominal", "scale": {"scheme": "pbiColorNominal"}}
  }
}
```

Variant met vlak: `"mark": {"type": "area", "opacity": 0.15, "line": {"strokeWidth": 2}, "tooltip": true}`.

### Heatmap

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "mark": {"type": "rect", "tooltip": true},
  "encoding": {
    "x": {"field": "Day", "type": "ordinal"},
    "y": {"field": "Hour", "type": "ordinal"},
    "color": {"field": "Value", "type": "quantitative", "scale": {"scheme": "pbiColorLinear"}}
  }
}
```

Voorbeeld (warehouse): `Day` = weekdag, `Hour` = uur, `Value` = gepickte orderregels geeft een drukte-heatmap van het magazijn.

### Bullet chart (gefacetteerd, top 10, met doel)

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "transform": [
    {"window": [{"op": "rank", "as": "rank"}], "sort": [{"field": "Value", "order": "descending"}]},
    {"filter": "datum.rank <= 10"}
  ],
  "facet": {
    "row": {
      "field": "Category", "type": "nominal",
      "sort": {"field": "Value", "order": "descending"},
      "header": {"labelAngle": 0, "title": "", "labelAlign": "left"}
    }
  },
  "spec": {
    "layer": [
      {"mark": {"type": "bar", "color": {"expr": "pbiColor(0, 0.7)"}, "size": 10}, "encoding": {"x": {"field": "Value", "type": "quantitative"}}},
      {"mark": {"type": "tick", "size": 25, "color": {"expr": "pbiColor(0, -0.5)"}}, "encoding": {"x": {"field": "Target", "type": "quantitative"}}},
      {"mark": {"type": "text", "align": "right", "dx": -5}, "encoding": {"x": {"value": -15}, "text": {"field": "Value", "format": ",.0f"}, "color": {"value": {"expr": "pbiColor(0, -0.3)"}}}}
    ]
  }
}
```

Voorbeeld (warehouse): hernoem in Power BI de velden naar `Category` (bijv. artikelgroep), `Value` (voorraaddekking in dagen) en `Target` (normdekking), of pas de veldnamen in de spec aan.

### Lollipop

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "encoding": {
    "y": {"field": "Category", "type": "nominal", "sort": "-x"},
    "x": {"field": "Value", "type": "quantitative"}
  },
  "layer": [
    {"mark": {"type": "rule", "strokeWidth": 2, "color": {"expr": "pbiColor(0)"}}},
    {"mark": {"type": "point", "filled": true, "size": 100, "color": {"expr": "pbiColor(0)"}}}
  ]
}
```

### Sparkline als small multiple

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"name": "dataset"},
  "facet": {"row": {"field": "Category", "type": "nominal", "header": {"labelAngle": 0, "title": ""}}},
  "spec": {
    "width": 200,
    "height": 30,
    "mark": {"type": "line", "strokeWidth": 1.5, "color": {"expr": "pbiColor(0)"}},
    "encoding": {
      "x": {"field": "Date", "type": "temporal", "axis": null},
      "y": {"field": "Value", "type": "quantitative", "axis": null, "scale": {"zero": false}}
    }
  }
}
```

### KPI-kaart

Zie `examples/deneb/kpi-card.vl.json`: drie tekstlagen (waarde, label, % verschil) met voorwaardelijke kleur via `"condition": {"test": "datum.change >= 0", ...}`.

Andere patronen in de bron (niet overgenomen): verticale staaf, scatter, donut, gestapelde staaf, waterval.

## 5. Vega: wanneer en hoe

Gebruik Vega alleen voor signals, event streams, eigen projecties, force/voronoi-lay-outs of geavanceerde cross-filter (brush/lasso).

```json
{
  "$schema": "https://vega.github.io/schema/vega/v6.json",
  "data": [{"name": "dataset"}],
  "width": {"signal": "pbiContainerWidth - 25"},
  "height": {"signal": "pbiContainerHeight - 27"},
  "padding": 5,
  "signals": [],
  "scales": [],
  "axes": [],
  "legends": [],
  "marks": []
}
```

- Schalen, assen en legenda's zijn expliciet; transforms staan in de data-items.
- `pbiContainerWidth`/`pbiContainerHeight` voor responsieve maat; voor absolute tekstposities `{"signal": "width"}`.
- Encode-sets: `enter` (eerste keer), `update` (elke render), `hover` (bij aanwijzen, terug naar `update` bij verlaten).

## 6. Themakleuren

| Functie/schema | Doel | Gebruik |
|---|---|---|
| `pbiColor(index)` | Themakleur op index (0-based) | `{"signal": "pbiColor(0)"}` / `{"expr": "pbiColor(0)"}` |
| `pbiColor(0, -0.3)` | 30% donkerder (-1 donker … 1 licht) | |
| `pbiColor("negative")` | Sentimentkleuren: `"min"`, `"middle"`, `"max"`, `"negative"`, `"positive"` | Aliassen `"bad"`, `"good"`, `"neutral"` |
| `pbiColorNominal` | Categorisch palet | `"scale": {"scheme": "pbiColorNominal"}` |
| `pbiColorOrdinal` | Geordende categorieën | |
| `pbiColorLinear` | Doorlopende gradiënt | |
| `pbiColorDivergent` | Divergerende gradiënt | |

## 7. Interactiviteit en runtimevelden

| Functie | Eigenschap | Standaard | Opmerking |
|---|---|---|---|
| Tooltips | `enableTooltips` | `true` | `"tooltip": true` (VL) of `"tooltip": {"signal": "datum"}` (Vega) |
| Contextmenu | `enableContextMenu` | `true` | Rechtsklik, drill-through |
| Cross-filter | `enableSelection` | `false` | Werk met `__selected__` |
| Cross-highlight | `enableHighlight` | `false` | Maakt `<veld>__highlight`-velden |

Selectiemodi: `simple` (automatisch, max 250 datapunten; schuifregelaar `selectionMaxDataPoints` 1–250, standaard 50) of `advanced` (alleen Vega; nodig voor brush/lasso; tot 2500 via `options.limit`; signalen `pbiCrossFilterApply(event, filter?, options?)` en `pbiCrossFilterClear()`).

Cross-filter in Vega, simpel patroon:

```json
"encode": {
  "update": {
    "fillOpacity": [
      {"test": "datum.__selected__ == 'off'", "value": 0.3},
      {"value": 1}
    ]
  }
}
```

Runtimevelden die Deneb aan elke rij toevoegt:

| Veld | Doel |
|---|---|
| `__row__` | Rij-index (0-based); vervangt `__identity__` (verwijderd in 1.9) |
| `__selected__` | `"on"`, `"off"` of `"neutral"` |
| `<veld>__highlight` | Gemarkeerde waarde per measure |
| `<veld>__highlightStatus` | `"on"`, `"off"`, `"neutral"` |
| `<veld>__highlightComparator` | `"eq"`, `"lt"`, `"gt"`, `"neq"` |
| `<veld>__formatted` | Waarde opgemaakt met de Power BI-opmaakstring |
| `<veld>__format` | De opmaakstring zelf (bijv. `"$#,0.00"`) |

## 8. Objecteigenschappen en PBIR-codering

Belangrijkste eigenschappen van het `vega`-object: `jsonSpec`, `jsonConfig`, `provider`, `renderMode`, `enableTooltips`, `enableContextMenu`, `enableHighlight`, `enableSelection`, `selectionMode`, `selectionMaxDataPoints`, `logLevel` (0–4, standaard 3). Daarnaast `dataLimit.override` en `editor.*` (thema, lettergrootte).

Literal-codering in PBIR (alleen relevant als je `visual.json` leest of diagnosticeert):

| Type | Codering | Voorbeeld |
|---|---|---|
| Boolean | Kaal | `"true"` |
| Getal | `D`-achtervoegsel | `"50D"` |
| String/enum | Enkele quotes | `"'vegaLite'"` |
| Spec/config | Gestringificeerde JSON in enkele quotes | `"'{\"data\":{\"name\":\"dataset\"},\"mark\":\"bar\"}'"` |

## 9. Performance

Deneb draait de hele Vega-dataflow opnieuw bij elke interactie. Volgorde van ingrepen, goedkoopste eerst:

1. **Aggregeer in DAX**, niet met `aggregate` in Vega (bijv. maandmeasure → ~12 rijen).
2. **`renderMode: canvas`** bij veel marks (let op: tekst niet selecteerbaar; controleer of tooltips nog werken).
3. **Minder marks**: decoratieve lagen eerst weg.
4. **Alleen gebruikte velden binden**: elke measure brengt ook `__formatted` en `__format` mee.
5. **`dataLimit.override`** als laatste, samen met canvas. Het model kan nog steeds stil afkappen; controleer het aantal rijen.

Een spec die in Desktop goed werkt kan in een bepaalde browser haperen; test in de browser van je publiek.

## 10. Community-templates importeren

Templates zijn Vega(-Lite)-JSON met een `usermeta`-object en placeholders als `__category__` (patroon `^__[a-zA-Z0-9]+__$`). De Deneb-GUI vraagt bij import om de koppeling. Handmatig:

1. Lees `usermeta.dataset`: per `key` de `kind` (`column`/`measure`) en `type`. Een verkeerde `kind` rendert leeg.
2. Haal `usermeta` en `$schema` uit de spec; laat geen `"data": {"values": [...]}`-voorbeeldrijen staan; de spec moet `{"name": "dataset"}` lezen.
3. Vervang elke placeholder door de echte veldnaam (met de juiste escaping).
4. Zet `provider` goed; een meegeleverd `config`-blok hoort in `jsonConfig`, niet in `jsonSpec`.
5. Vervang `datum.__identity__` door `datum.__row__`; vervang externe `data.url` door de `dataset`-binding.

Bronnen: https://deneb.guide, https://github.com/deneb-viz/deneb, Kerry Kolosko (https://kerrykolosko.com/portfolio/), `PBI-David/Deneb-Showcase`, `PBIQueryous/Deneb`, `avatorl/Deneb-Vega-Templates`, Vega-Lite-docs https://vega.github.io/vega-lite/.

## 11. Valkuilen

- Veldnaam in spec ≠ weergavenaam → lege visual.
- Vega-`data` als object of Vega-Lite-`data` als array → fout.
- Geen `autosize: fit` → visual past niet in de container.
- `__identity__` uit oude templates → kapot sinds 1.9.
- Simpele visual omzetten naar `advanced` zonder signals → cross-filter valt stil weg.
- In sommige versies filtert de visual andere visuals wel, maar toont hij een externe filter niet terug in `__selected__` (bekende beperking).
- Hardgecodeerde hex-kleuren i.p.v. `pbiColor` → visual volgt het thema niet.
