# SVG via DAX-measures

Een DAX-measure die SVG-markup teruggeeft, met gegevenscategorie `ImageUrl`, wordt in tabel, matrix, nieuwe kaart, image-visual en knop-slicer als afbeelding getoond. Geen custom visual nodig, geen rijlimiet, geen time-out, geen licentie- of regiodrempel, en het rendert ook bij publish to web.

## Inhoud

1. Werkwijze
2. Kies een patroon
3. Measurestructuur en conventies
4. Koppelen aan de host-visual
5. Sparkline en reeksen
6. Voorwaardelijke en responsieve SVG
7. Performance en de 32K-grens
8. Toegankelijkheid
9. Bibliotheken
10. Valkuilen

## 1. Werkwijze

1. **Bevraag eerst het model** (bijv. DAX Studio of Tabular Editor) met de bedoelde filtercontext; ontwerp met echte getallen, geen placeholders.
2. **Maak een statische SVG** in een los bestand, open hem in een browser en stem lay-out, kleuren en verhoudingen af. Itereren op statische SVG is veel makkelijker dan op DAX-stringconcatenatie.
3. **Start vanaf een template** (`examples/svg/` of de tabel hieronder); schrijf alleen met de hand voor een vorm die geen template dekt.
4. **Schrijf de measure** met de VAR-structuur (§3) en zet de gegevenscategorie op `ImageUrl`. De bron raadt aan SVG-measures als rapportmeasure (extension measure in `reportExtensions.json`) te bewaren, niet in het semantische model, in een weergavemap zoals `SVG Charts`.
5. **Koppel** aan de visual en stel de afbeeldingsgrootte in (§4).
6. **Controleer** de lengte in het slechtste geval (`LEN([Jouw SVG Measure])`) en de toegankelijkheid (§8).

Rapportmeasures in `reportExtensions.json` (voorbeeld uit de bron):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json",
  "name": "extension",
  "entities": [{
    "name": "ExistingTable",
    "measures": [{
      "name": "Sparkline SVG",
      "dataType": "Text",
      "dataCategory": "ImageUrl",
      "expression": "...",
      "displayFolder": "SVG Charts"
    }]
  }]
}
```

Een rapportmeasure wordt in een binding aangesproken met `"Schema": "extension"` in de `SourceRef`. Voor het bewerken van PBIR-bestanden zelf: zie de zus-skill `fabric-powerbi-report`.

## 2. Kies een patroon

| Patroon | Wat | Hosts | Template |
|---|---|---|---|
| bullet | Werkelijk-balk + doelstreepje (+ sentimentstip) | Cel, kaartafbeelding | `examples/svg/bullet-chart-measure.dax` |
| progress | Afgeronde baan gevuld tot werkelijk/doel, met % | Cel, kaart, knop-slicer | `examples/svg/progress-bar-measure.dax` |
| pill | Variantie of status in een gekleurde pil | Cel, kaart, knop-slicer | `examples/svg/status-pill-measure.dax` |
| sparkline | Werkelijk over een as (maand/datum), laatste punt gemarkeerd | Cel, kaart, knop-slicer | `examples/svg/sparkline-measure.dax` |
| dumbbell | Werkelijk en doel als twee stippen met lijn | Cel | – |
| diverging | Variantie % links/rechts van een middenlijn | Cel | – |
| delta | IBCS absolute variantie vanaf nullijn | Cel | – |
| pin | IBCS relatieve variantie: lijn met stip | Cel (beter dan dumbbell bij kleine % op groot bereik) | – |
| gauge | Dunne boog, doelstreepje, waarde | Image-visual | – |

Kies op de vraag die de lezer op die plek stelt:

- "Waar sta ik t.o.v. het doel?" per regel → bullet (grootte telt) of delta/pin (alleen het verschil telt)
- "Hoe ver ben ik richting het doel?" → progress
- "Beter of slechter, hoeveel?" op weinig ruimte → pill
- "Welke kant gaat het op?" → sparkline
- Eén kerngetal tegen één doel → gauge in een image-visual

Sentimentkleuren (groen/rood) alleen voor goed/slecht; gebruik verder de eigen kleur van de metric of neutraal grijs.

## 3. Measurestructuur en conventies

```dax
SVG Measure =
-- CONFIG: Input fields and visual parameters
VAR _Actual = [Sales Amount]
VAR _Target = [Sales Target]
VAR _Scope = ALLSELECTED ( 'Product'[Category] )

-- CONFIG: Colors
VAR _BarColor = "#5B8DBE"
VAR _TargetColor = "#333333"

-- NORMALIZATION: Scale values to SVG coordinate space
VAR _AxisMax = CALCULATE( MAXX( _Scope, [Sales Amount] ), REMOVEFILTERS( 'Product'[Category] ) ) * 1.1
VAR _AxisRange = 100
VAR _ActualNormalized = DIVIDE( _Actual, _AxisMax ) * _AxisRange

-- SVG ELEMENTS: One VAR per visual element
VAR _SvgPrefix = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 25'>"
VAR _Sort = "<desc>" & FORMAT( _Actual, "000000000000" ) & "</desc>"
VAR _Bar = "<rect x='0' y='5' width='" & _ActualNormalized & "' height='15' fill='" & _BarColor & "'/>"
VAR _TargetLine = "<rect x='" & DIVIDE( _Target, _AxisMax ) * _AxisRange & "' y='2' width='2' height='21' fill='" & _TargetColor & "'/>"
VAR _SvgSuffix = "</svg>"

-- ASSEMBLY: Combine in rendering order (back to front)
VAR _SVG = _SvgPrefix & _Sort & _Bar & _TargetLine & _SvgSuffix

RETURN _SVG
```

| Conventie | Toelichting |
|---|---|
| CONFIG eerst | Invoermeasures, scopekolom, kleuren, lettertype; gebruikers wijzigen alleen dit deel |
| NORMALIZATION | Schaal ruwe waarden naar het SVG-bereik |
| SVG ELEMENTS | Eén VAR per `<rect>`, `<circle>`, `<text>`, `<line>` |
| ASSEMBLY | Volgorde = tekenvolgorde (eerste = achterste laag) |
| `<desc>`-sorteertruc | `FORMAT(_Actual, "000000000000")` in `<desc>` zodat de kolom sorteerbaar is |

### Asnormalisatie

```dax
VAR _BarMin = 0       -- leftmost position (or offset for labels)
VAR _BarMax = 100     -- rightmost position
VAR _Scope = ALLSELECTED( 'Table'[GroupColumn] )
VAR _MaxInScope = CALCULATE( MAXX( _Scope, [Measure] ), REMOVEFILTERS( 'Table'[GroupColumn] ) )
VAR _AxisMax = _MaxInScope * 1.1   -- 10% padding
VAR _AxisRange = _BarMax - _BarMin
VAR _Normalized = DIVIDE( _Actual, _AxisMax ) * _AxisRange
```

- `ALLSELECTED` als de grafiek met slicers mee moet bewegen; `ALL` voor een vaste as.
- `* 1.1` voorkomt dat balken de rand raken.
- In een matrix met meerdere rijvelden: schaal tegen de grootste rij **op hetzelfde niveau**, anders maken subtotalen de detailbalken piepklein:

```dax
VAR _max =
    SWITCH ( TRUE (),
        ISINSCOPE ( 'Products'[Subtype] ), MAXX ( CROSSJOIN ( ALLSELECTED ( 'Products'[Type] ), ALLSELECTED ( 'Products'[Subtype] ) ), CALCULATE ( MAX ( [Actual], [Target] ) ) ),
        ISINSCOPE ( 'Products'[Type] ), MAXX ( ALLSELECTED ( 'Products'[Type] ), CALCULATE ( MAX ( [Actual], [Target] ) ) ),
        MAX ( [Actual], [Target] ) ) * 1.08
```

Omdat de schaal afhangt van de rijen van de host, schrijf je één measure per host en noem je hem naar het rijveld (bijv. `Actual bullet by Key Account`).

### Guard tegen totalen

```dax
IF( HASONEVALUE( 'Table'[GroupColumn] ),
    -- SVG code here
)
```

Gebruik `ISINSCOPE` voor geneste hiërarchieniveaus. Totaal- en subtotaalregels geven meestal beter `BLANK()` of een lege markup terug.

### Escaping en kleuren

- Enkele quotes voor SVG-attributen: `fill='#2196F3'` (dubbele quotes in DAX worden `""`).
- Kleuren altijd hex met `#`. **Nooit** `%23`: de service codeert de data-URI zelf, dus `%23` breekt elke kleur. Geen kleurnamen.
- `xmlns` op `<svg>` is verplicht; `viewBox` voor schaalbaarheid.
- Geen JavaScript; SVG moet puur declaratief zijn.
- Y=0 is **boven**: omkeren met `_Height - _Value`.

### Getalnotatie (adaptieve schaal)

```dax
VAR _Label = SWITCH(TRUE(),
    _Actual <= 1E3,  FORMAT(_Actual, "#,0"),
    _Actual <= 1E6,  FORMAT(_Actual, "#,0, K"),
    _Actual <= 1E9,  FORMAT(_Actual, "#,0,, M"),
    FORMAT(_Actual, "#,0,,, B")
)
```

### Eenvoudigste patroon: databalk

```dax
Data Bar =
VAR _Value = [Sales Amount]
VAR _Max = CALCULATE(MAX([Sales Amount]), REMOVEFILTERS('Product'[Category]))
VAR _Pct = DIVIDE(_Value, _Max)
VAR _W = _Pct * 100
VAR _Color = "#5B8DBE"

RETURN
"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 16'>" &
"<rect width='" & _W & "' height='16' fill='" & _Color & "' opacity='0.7' rx='2'/>" &
"<text x='" & (_W + 3) & "' y='12' font-size='10' fill='#333'>" &
FORMAT(_Value, "#,0") & "</text></svg>"
```

Varianten: afgeronde hoeken met `rx='4'`; voorwaardelijke kleur met `IF(_Value > _Threshold, "#4CAF50", "#F44336")`.

Voorbeeld (warehouse): `[Sales Amount]` → `[Openstaande orderregels]`, `'Product'[Category]` → `'Locatie'[Zone]` geeft een werkvoorraadbalk per zone.

## 4. Koppelen aan de host-visual

| Host | Instelling | Opmerking |
|---|---|---|
| Tabel (`tableEx`) / matrix (`pivotTable`) | `grid.imageHeight` / `grid.imageWidth` (standaard 25 x 100; 110 x 24 past bij de patronen hierboven) | Eén maat voor alle afbeeldingskolommen van de visual; breder rekt een sparkline plat |
| Image-visual (`image`) | `sourceType='imageData'` + `sourceField` = de measure | **Geen** `query`-blok; een lege `"query": {"queryState": {}}` geeft een leeg beeld |
| Nieuwe kaart (`cardVisual`) | Object `image` (afbeeldingsvlak, `imageType` `'imageUrl'`) of `cardImage` (callout-afbeelding) | Klassieke `card` werkt **niet** |
| Knop-slicer (`advancedSlicerVisual`) | Afbeelding "Select from data" per knop | Measure wordt per knop geëvalueerd |

Matrixafbeeldingsgrootte in PBIR:

```json
"grid": [{
  "properties": {
    "imageHeight": {"expr": {"Literal": {"Value": "25D"}}},
    "imageWidth": {"expr": {"Literal": {"Value": "100D"}}}
  }
}]
```

Image-visual:

```json
"image": [{
  "properties": {
    "sourceType": {"expr": {"Literal": {"Value": "'imageData'"}}},
    "sourceField": {"expr": {"Measure": {"Expression": {"SourceRef": {"Schema": "extension", "Entity": "Sales"}}, "Property": "Revenue gauge"}}},
    "transparency": {"expr": {"Literal": {"Value": "0D"}}}
  }
}]
```

Bij de knop-slicer moet de tweede selector `id` en `hierarchyMatching` hebben, anders negeert de service het slot:

```json
"image": [
  {"properties": {"show": {"expr": {"Literal": {"Value": "true"}}}, "sourceType": {"expr": {"Literal": {"Value": "'imageData'"}}}}, "selector": {"id": "default"}},
  {"properties": {"image": {"expr": {"Measure": {"Expression": {"SourceRef": {"Schema": "extension", "Entity": "Sales"}}, "Property": "Target pill"}}}},
   "selector": {"data": [{"dataViewWildcard": {"matchingOption": 1}}], "id": "default", "hierarchyMatching": 1}}
]
```

Aanbevolen `viewBox`-maten: kaart-indicator `0 0 20 20`, mini-gauge `0 0 100 60`, voortgangsbalk `0 0 100 20`; image-visual KPI `0 0 300 60`, sparkline `0 0 300 50`, tegel `0 0 200 80`, banner `0 0 600 40`.

## 5. Sparkline en reeksen

Bouw de puntenreeks met `CONCATENATEX` en één `<polyline>`:

```dax
VAR _Points = CONCATENATEX(
    _SparklineTable,
    [X] & "," & (100 - [Y]),
    " ",
    [Date], ASC
)
-- Produces: "0,80 10,60 20,40 30,20"
-- Use in: <polyline points='...'/>
```

Volledige template: `examples/svg/sparkline-measure.dax` (laatste 12 maanden, `HASONEVALUE`-guard). Let op: een grafiek met alleen measures laat lege toekomstige maanden weg, zelfs met "show items with no data"; geef 0 terug en een opmaak met lege nulsectie (`#,##0;-#,##0;""`).

## 6. Voorwaardelijke en responsieve SVG

- In image-visual en kaart: zet de root op `width='100%' height='100%'` met een `viewBox` en `preserveAspectRatio='xMidYMid meet'`; de host schaalt mee. Tabel- en matrixcellen negeren procentuele breedte en gebruiken `grid.imageWidth`.
- Een DAX-SVG kan de containerbreedte niet als getal lezen; moet de lay-out echt meeschalen (balken herverdelen), gebruik dan Deneb.
- Wil je per context een andere vorm (leeg / één waarde / trend): bepaal een modus met `SWITCH(TRUE(), ISBLANK(...), "empty", HASONEVALUE(...), "single", "trend")`, zet prefix en `</svg>` één keer buiten de `SWITCH`, en heb altijd een lege-staat-tak. Wissel niet per regel van grafiekvorm.

## 7. Performance en de 32K-grens

Een SVG-measure wordt per zichtbare cel geëvalueerd (per rij in een tabel; per rij x kolom in een matrix), in de single-threaded formula engine.

| Maatregel | Waarom |
|---|---|
| Pre-aggregeer in modelmeasures | De storage-engine-cache doet het werk; de SVG-measure mapt alleen getallen naar coördinaten |
| Eén `<polyline>` i.p.v. N vormen | Eén iteratie en één element |
| Rond coördinaten af (`INT`) | Kortere strings, goedkopere `FORMAT` |
| Guard met `HASONEVALUE`/`ISINSCOPE` | Geen dure, zinloze SVG op totalen |
| Houd `imageHeight`/`imageWidth` proportioneel | Grote afbeeldingen kosten render- en tekenwerk |

De **32K-tekengrens geldt per gerenderde cel**, niet voor de DAX-expressie. Bij overschrijding wordt de cel stil leeg. Controleer `LEN([Jouw SVG Measure])` voor het zwaarste lid. Oplossingen: korter tijdvenster (12 i.p.v. 24 maanden), splitsen over twee kolommen, of naar Deneb.

## 8. Toegankelijkheid

Een SVG-cel draagt niets bij voor schermlezers ("Show data" toont de ruwe markup) en er is geen alt-tekst per cel.

1. **Zet de getallen in aangrenzende kolommen** (werkelijk, doel, variantie, min/max/laatste) in dezelfde tabel/matrix, zodat "Show data" echte getallen heeft.
2. **Zet alt-tekst op de visual** (kort, < ~250 tekens), bijv. "Trend en huidige waarde; gebruik Show data voor exacte getallen." Zie de zus-skill `pbip-accessibility`.
3. **Niet alleen kleur:** combineer statuskleur met vorm, tekstlabel of een `<title>` in de SVG. De statuspil doet dit al; bullet en dumbbell niet.
4. **Contrast:** tekst ≥ 4,5:1 (≥ 3:1 bij ≥ 18pt), grafische elementen ≥ 3:1. Themakleuren komen niet vanzelf in de SVG; controleer handmatig.
5. Puur decoratieve SVG: uit de tabvolgorde halen.

## 9. Bibliotheken

Controleer eerst of er al een functie is (namen beginnend met `PowerofBI.IBCS.`, `Viz.`, `Compound.` of `Element.`).

| Bibliotheek | Auteur | Wat |
|---|---|---|
| DaxLib.SVG | Jake Duddy | UDF's: sparklines, balken, boxplot, heatmap, jitter, violin, voortgangsbalken, pillen — https://daxlib.org/package/DaxLib.SVG/ |
| PowerofBI.IBCS | Andrzej Leszkiewicz | IBCS-balken, kolommen, waterval, pin, small multiples, P&L (AC/PY/BU/FC) — https://daxlib.org/package/PowerofBI.IBCS/ |
| PowerBI MacGuyver Toolbox | Stepan Resl / Data Goblins | C#-scripts voor Tabular Editor die SVG-measures genereren |
| PBI-Core-Visuals-SVG-HTML | David Bacci | Chips, tornado, gradient matrix, bar-UDF |
| Kerry Kolosko Templates | Kerry Kolosko | Sparklines, databalken, KPI-kaarten |

UDF-bibliotheken installeer je in het semantische model (bijv. met Tabular Editor), niet in het rapport; zie `fabric-semantic-model`.

## 10. Valkuilen

- `%23` in plaats van `#` → kleuren breken.
- Measurenamen zijn uniek over het hele model, hoofdletterongevoelig: "Turnover vs budget color" botst met "Turnover vs Budget color".
- Klassieke kaart toont tekst of niets → gebruik `cardVisual`.
- Image-visual met lege `query` → leeg beeld.
- Geen guard → onzinnige SVG op totaalregel.
- Sparkline te lang → stil lege cel (32K).
