# DAX-richtlijnen

Regels voor DAX in Power BI semantische modellen: variabelen, patronen, querysyntaxis en user-defined functions (UDF's). Voor performance zie [dax-performance.md](dax-performance.md).

## Goede gewoonten

- Gebruik betekenisvolle variabelenamen.
- Breek complexe DAX op met `VAR`; geef variabelen een `_`-prefix om naamconflicten te voorkomen.
- Gebruik standaard `DIVIDE()` in plaats van `/`: deling door nul geeft dan BLANK. **Uitzondering:** binnen rij-iterators liever `/`, maar alleen als de noemer gegarandeerd niet nul is of nulnoemers vooraf zijn weggefilterd.
- Gebruik `KEEPFILTERS()` of directe kolompredicaten als `CALCULATE`-filter, niet `FILTER` over een hele tabel.
- `TREATAS` in plaats van `INTERSECT` voor virtuele relaties (sneller).
- `REMOVEFILTERS()` in plaats van `ALL()` als je filters wilt verwijderen: duidelijker en minder valkuilen.
- Kolommen altijd mét tabelnaam: `'Tabelnaam'[Kolomnaam]`.
- Metingen altijd zónder tabelnaam: `[Naam meting]`.
- Geen diep geneste `CALCULATE`; splits op in variabelen.
- Vermijd `IFERROR` in iterators of scalaire-per-rij-contexten (dwingt callbacks af); als scalaire beveiliging mag het. Liever `DIVIDE`, voorwaardelijke logica of `COALESCE`.
- Nooit `EVALUATEANDLOG` in productiemodellen (alleen voor debuggen).
- Nooit `1-(x/y)` of `1+(x/y)`; reken de volledige expressie uit met `DIVIDE` en `VAR`:

  ```dax
  // Vermijd: 1 - SUM('Sales'[Cost]) / SUM('Sales'[Revenue])
  // Gebruik:
  VAR _revenue = SUM('Sales'[Revenue])
  RETURN DIVIDE(_revenue - SUM('Sales'[Cost]), _revenue)
  ```

---

## Querysyntaxis (DAX-query's)

### DEFINE-blok

- Gebruik `DEFINE` aan het begin als de query `VAR`, `MEASURE`, `COLUMN` of `TABLE` definieert.
- Eén `DEFINE`-blok per query; definities op nieuwe regels (geen komma's of puntkomma's).

### Metingen in een query

- Bij definiëren: altijd met hosttabel, die in het model moet bestaan: `DEFINE MEASURE 'Tabelnaam'[Meting] = ...`
- Bij gebruiken: alleen de naam: `CALCULATE([Meting], ...)`

### Sorteren

- Gebruik altijd `ORDER BY` als `EVALUATE` meerdere rijen teruggeeft.
- Gebruik niet de functie `ORDERBY` om het eindresultaat te sorteren.

### Booleaanse filters in CALCULATE / CALCULATETABLE

- Mogen niet direct een meting of een andere `CALCULATE` bevatten. Oplossing: resultaat eerst in een variabele, dan de variabele gebruiken.
- Mogen geen kolommen uit twee verschillende tabellen bevatten.
- Bij de `IN`-operator moet de tabeloperand een tabelvariabele zijn, geen tabelexpressie.
- Wijs een booleaans filter niet toe aan een `VAR`.

### SUMMARIZECOLUMNS

Bouwt samenvattingstabellen met groeperingskolommen en meting-achtige kolommen.

Volgorde van parameters (alle optioneel, maar in deze volgorde):
1. Groeperingskolommen (uit één of meer tabellen)
2. Filters
3. Metingen of meting-achtige berekeningen

- Standaardkeuze voor samenvattingen met metingen.
- Niet gebruiken zonder meting-achtige kolommen; dan `SUMMARIZE`.
- Geeft alleen rijen waar minstens één meting niet BLANK is.
- Geen booleaanse filters in `SUMMARIZECOLUMNS`.

### SUMMARIZE

Alleen om unieke combinaties van kolommen op te halen:

```dax
SUMMARIZE(<table expression>, <column1>, ..., <columnN>)
```

- Liever `SUMMARIZECOLUMNS` dan `SUMMARIZE` met extensiekolommen.
- `VALUES('Tabel'[Kolom])` is een verkorting van `SUMMARIZE('Tabel', 'Tabel'[Kolom])`.
- Kolom uit een tabelvariabele: `SUMMARIZE(_TableVar, [Column])`. `_TableVar[Column]` is ongeldige syntaxis.

### GROUPBY

- Alleen met een tabelvariabele als eerste argument.
- `CURRENTGROUP` is alleen geldig binnen `GROUPBY`.

### SELECTCOLUMNS

- Om dubbele rijen te behouden (in tegenstelling tot `SUMMARIZE`) of kolommen te hernoemen.
- Na hernoemen gebruiken latere expressies (`TOPN`, `ORDER BY`) de **nieuwe** namen.
- Neem alle kolommen op die later nodig zijn (voor `ORDER BY`, `FILTER`, ...).

### Setfuncties

`INTERSECT`, `UNION`, `EXCEPT`: beide tabellen moeten evenveel kolommen hebben.

### Time intelligence

- `DATESINPERIOD`-vensters: de negatieve offset is precies het aantal perioden. 12 maanden: `-12` (niet `-11`); 3 maanden: `-3`.
- Zorg altijd voor een geldige datumcontext: groeperingskolommen uit de datumtabel of filters op datumkolommen. Zonder datumcontext weet time intelligence niet wat "nu" is.
- Gebruik je `ROW` met time intelligence, geef externe filters mee via `CALCULATETABLE`.

---

## Queryvoorbeelden

YTD en voortschrijdend 14-daags gemiddelde voor rode producten:

```dax
EVALUATE
  CALCULATETABLE(
    ROW(
      "Total Sales Amount YTD", TOTALYTD([Total Amount], 'Calendar'[Date]),
      "Total Sales Amount 14-Day MA", AVERAGEX(DATESINPERIOD('Calendar'[Date], MAX('Calendar'[Date]), -14, DAY), [Total Amount])
    ),
    'Product'[Color] == "Red",
    TREATAS({ MAX('Sales'[OrderDate]) }, 'Calendar'[Date])
  )
```

Filteren op een meting via variabelen (producten > 1 miljoen, rood of zwart):

```dax
DEFINE
  VAR _Filter = TREATAS({ "Red", "Black" }, 'Product'[Color])
  VAR _SummaryTable = SUMMARIZECOLUMNS(
    'Product'[Name],
    _Filter,
    "Total Sales", [Total Amount]
  )
EVALUATE
  SELECTCOLUMNS(
    FILTER(_SummaryTable, [Total Sales] > 1000000),
    'Product'[Name]
  )
  ORDER BY 'Product'[Name] ASC
```

Meetresultaat in een variabele (producten met een lijstprijs boven de mediaan):

```dax
DEFINE
  VAR _MedianListPrice = [Median List Price]
EVALUATE
  CALCULATETABLE(
    VALUES('Product'[Name]),
    'Product'[List Price] > _MedianListPrice
  )
  ORDER BY 'Product'[Name] ASC
```

Meerdere niveaus met `GROUPBY` (gemiddelde, minimum en maximum maandhoeveelheid per jaar):

```dax
DEFINE
  VAR _SummaryTable = SUMMARIZECOLUMNS(
    'Calendar'[Year],
    'Calendar'[Month],
    'Calendar'[MonthNumberOfYear],
    "Monthly Quantity", [Total Quantity]
  )
EVALUATE
  GROUPBY(
    _SummaryTable,
    'Calendar'[Year],
    "Avg Monthly Quantity", AVERAGEX(CURRENTGROUP(), [Monthly Quantity]),
    "Min Monthly Quantity", MINX(CURRENTGROUP(), [Monthly Quantity]),
    "Max Monthly Quantity", MAXX(CURRENTGROUP(), [Monthly Quantity])
  )
  ORDER BY 'Calendar'[Year] ASC
```

---

## Voorbeelden voor warehouse en supply chain

> **Voorbeeld**, niet uit de bron. Tabel- en kolomnamen zijn aannames; pas ze aan je model aan. Veronderstelde opzet: feittabel `Orderregels` (één rij per orderregel) met een actieve relatie `'Orderregels'[Orderdatum]` → `'Datum'[Datum]` en een inactieve relatie `'Orderregels'[Leverdatum]` → `'Datum'[Datum]`; feittabel `Voorraad` met een dagelijkse stand per artikel en relatie `'Voorraad'[Snapshotdatum]` → `'Datum'[Datum]`. De vlaggen `Op tijd` en `Volledig` ("Ja"/"Nee") zijn in Power Query of de bron berekend, niet als berekende kolom.

Aantallen en hoeveelheden (`formatString: #,##0`):

```dax
# Orderregels = COUNTROWS('Orderregels')

Geleverde hoeveelheid (qty) = SUM('Orderregels'[Geleverde hoeveelheid])

Geleverde hoeveelheid (ytd) =
CALCULATE([Geleverde hoeveelheid (qty)], DATESYTD('Datum'[Datum]))
```

OTIF, aandeel orderregels dat op tijd én volledig is geleverd (`formatString: 0.0%`):

```dax
OTIF (%) =
VAR _regels = COUNTROWS('Orderregels')
VAR _otif =
    CALCULATE(
        COUNTROWS('Orderregels'),
        'Orderregels'[Op tijd] = "Ja",
        'Orderregels'[Volledig] = "Ja"
    )
RETURN
    DIVIDE(_otif, _regels)
```

Leveringen tellen op leverdatum in plaats van orderdatum, via de inactieve relatie:

```dax
# Orderregels (leverdatum) =
CALCULATE(
    COUNTROWS('Orderregels'),
    USERELATIONSHIP('Orderregels'[Leverdatum], 'Datum'[Datum])
)
```

Let op: `USERELATIONSHIP` niet gebruiken tegen een tabel met RLS (zie [modelleren.md](modelleren.md#relaties)).

Voorraadstand (semi-additief: niet optellen over dagen, maar de laatste stand in de periode tonen):

```dax
Voorraad (qty) =
VAR _laatsteDatum = MAX('Voorraad'[Snapshotdatum])
RETURN
    CALCULATE(
        SUM('Voorraad'[Aantal]),
        'Datum'[Datum] = _laatsteDatum
    )
```

Gemiddelde doorlooptijd van order tot levering, alleen voor geleverde regels (`formatString: #,##0.0`):

```dax
Doorlooptijd (dagen) =
AVERAGEX(
    CALCULATETABLE('Orderregels', NOT ISBLANK('Orderregels'[Leverdatum])),
    DATEDIFF('Orderregels'[Orderdatum], 'Orderregels'[Leverdatum], DAY)
)
```

Testquery voor OTIF per leverancier:

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Leverancier'[Leverancier],
    "# Orderregels", [# Orderregels],
    "OTIF (%)", [OTIF (%)]
)
ORDER BY [OTIF (%)] ASC
```

---

## DAX user-defined functions (UDF's)

Met UDF's definieer je herbruikbare functies in het model. Handig om herhaalde DAX-patronen in één benoemde functie onder te brengen. In TMDL staan ze in `definition/functions.tmdl` (zie [tmdl.md](tmdl.md#dax-user-defined-functions)).

### Syntaxis

```yaml
FunctionName: MyFunction
FunctionDefinition: |-
  (param1 [: Type [Scalar Subtype] [Val|Expr]],
   param2 [: Type [Scalar Subtype] [Val|Expr]]
  ) =>
      <Function body>
```

### Typesysteem

Parametertypes:

| Type | Betekenis |
|---|---|
| `AnyVal` | Scalair of tabel (standaard als je niets opgeeft) |
| `Scalar` | Eén waarde |
| `Table` | Een DAX-tabelexpressie |
| `AnyRef` | Directe verwijzing naar een modelobject (kolom, tabel, meting) zonder vooraf te evalueren; voor functies als `CALCULATE`, `TREATAS`, `SAMEPERIODLASTYEAR`. Toegestaan: `'Table'[Column]`, `'Table'`, `[Measure]`, `MyCalendar`. |
| `MeasureRef` | Verwijzing naar een meting |
| `ColumnRef` | Verwijzing naar een kolom |
| `TableRef` | Verwijzing naar een tabel |
| `CalendarRef` | Verwijzing naar een calendar |

Scalaire subtypes (optioneel): `Int64`, `Decimal`, `Double`, `String`, `DateTime`, `Boolean`, `Numeric`, `Variant`. `BLANK()` is geldig voor elk subtype.

Parametermodi:

- `Val` (standaard): het argument wordt bij de aanroep geëvalueerd en de waarde wordt ingevuld.
- `Expr`: de ruwe expressie wordt ingevuld en opnieuw geëvalueerd in binnenliggende contexten (binnen `CALCULATE`, `FILTER`, iterators). Gebruik dit als de expressie op contextovergangen in de functie moet reageren.

### Voorbeelden

Scalair met subtype:

```yaml
FunctionName: CircleArea
FunctionDefinition: |-
    (radius : Scalar Numeric) =>
        PI() * radius * radius
```

Kolomverwijzing (statistische modus van een kolom):

```yaml
FunctionName: Mode
FunctionDefinition: |-
    (col : ColumnRef) =>
        SUMMARIZE(
            TOPN(1,
                ADDCOLUMNS(VALUES(col), "Freq", CALCULATE(COUNTROWS(TABLEOF(col)))),
                [Freq], DESC),
            col
        )
```

Gebruik: `Mode('Sales'[ProductKey])`

`Expr`-modus (waarde in het vorige jaar):

```yaml
FunctionName: PriorYearValue
FunctionDefinition: |-
    (expression : Scalar Numeric Expr,
     dateColumn : ColumnRef
    ) =>
        CALCULATE(expression, SAMEPERIODLASTYEAR(dateColumn))
```

Gebruik: `PriorYearValue([Total Amount], 'Calendar'[Date])`. Door `Expr` wordt `[Total Amount]` onder het vorig-jaarfilter geëvalueerd.

Functie die een tabel teruggeeft (top 3 producten):

```yaml
FunctionName: Top3ProductsBySales
FunctionDefinition: |-
    () =>
        TOPN(3, VALUES('Product'[ProductKey]), [Sales], DESC)
```

Gebruik: `CALCULATE([Total Amount], Top3ProductsBySales())`.

### Goede gewoonten voor UDF's

- Geef parametertype (en waar nuttig subtype) op voor duidelijkheid en validatie.
- `Expr` alleen als de expressie in een binnenliggende context opnieuw moet worden geëvalueerd; anders `Val`.
- Eén doel per UDF; gebruik `VAR` in de body voor complexe logica.
- Houd rekening met `BLANK()` en lege tabellen.
