# DAX-performance: patronencatalogus

Laad dit pas nadat [dax-performance.md](dax-performance.md) kandidaatpatronen heeft aangewezen. Elk patroon is een **hypothese**, geen garantie: kardinaliteit, datalayout, relaties, filters en opslagmodus bepalen of een herschrijving helpt, niets doet of juist vertraagt. Meet na elke stap tijd én semantische gelijkheid; houd wat helpt, draai terug wat niet helpt.

## Tier 1: DAX-patronen

> Mag direct worden toegepast. Wijzig alleen meting-/UDF-definities in het `DEFINE`-blok. `EVALUATE` en de `SUMMARIZECOLUMNS`-groepering blijven identiek.

> **Liever `SUMMARIZECOLUMNS`.** Wordt volledig ondersteund binnen metingen. Gebruik het in plaats van `ADDCOLUMNS`/`SUMMARIZE` (DAX002), om contextovergangen vooraf te materialiseren (DAX006) en om herhaalde evaluaties in één virtuele tabel te cachen (DAX003).

### DAX001: eenvoudige kolompredicaten als CALCULATE-filter

**Herkenning:** `FILTER(Table, ...)` als filterargument, of gecombineerde predicaten.
**Actie:** kolomgerichte filters; tabelfilters vervangen door booleaanse predicaten; `&&` splitsen in aparte filterargumenten.

```dax
-- Antipatroon: FILTER over een tabel gebruikt een iterator
CALCULATE( SUM('Sales'[Amount]), FILTER('Product', 'Product'[Category] = "Electronics") )

-- Beter: kolompredicaat
CALCULATE( SUM('Sales'[Amount]), KEEPFILTERS( 'Product'[Category] = "Electronics") )

-- Antipatroon: && in één argument
CALCULATETABLE( 'Sales', 'Sales'[Region] = "West" && 'Sales'[Amount] > 1000 )

-- Beter: aparte predicaten
CALCULATETABLE( 'Sales', 'Sales'[Region] = "West", 'Sales'[Amount] > 1000 )
```

### DAX002: SUMMARIZECOLUMNS voor gegroepeerde berekeningen

**Herkenning:** groepering + berekening met `ADDCOLUMNS`/`SUMMARIZE`.
**Actie:** `SUMMARIZECOLUMNS` als rijvorm en filtersemantiek gelijk blijven.

```dax
-- Antipatronen
SUMMARIZE ( 'Sales', 'Sales'[ProductKey], "Total Profit", [Profit] )
ADDCOLUMNS ( SUMMARIZE ( 'Sales', 'Sales'[ProductKey] ), "Total Profit", [Profit] )
ADDCOLUMNS ( 'Sales', "Total Profit", CALCULATE ( [Profit] ) )
ADDCOLUMNS ( VALUES('Sales'[ProductKey]), "Total Profit", [Profit] )

-- Beter
SUMMARIZECOLUMNS ( 'Sales'[ProductKey], "Total Profit", [Profit] )
```

### DAX003: herhaalde expressies in variabelen

**Herkenning:** dezelfde meting/expressie meermaals.
**Actie:** cachen in variabelen op de kleinst veilige scope.

```dax
-- Antipatroon
VAR TotalA = [Sales Amount] * 1.1
VAR TotalB = [Sales Amount] * 0.9
-- Beter
VAR _SalesAmount = [Sales Amount]
VAR TotalA = _SalesAmount * 1.1
VAR TotalB = _SalesAmount * 0.9

-- Antipatroon: twee keer itereren
VAR A = SUMX ( VALUES('Sales'[ProductKey]), [Total Sales] )
VAR B = AVERAGEX ( VALUES('Sales'[ProductKey]), [Total Sales] )
-- Beter: één keer materialiseren
VAR Base = SUMMARIZECOLUMNS ( 'Sales'[ProductKey], "@TotalSales", [Total Sales] )
VAR A = SUMX ( Base, [@TotalSales] )
VAR B = AVERAGEX ( Base, [@TotalSales] )

-- Antipatroon: contextonafhankelijke expressie in iterator
SUMX( 'Sales', 'Sales'[Quantity] * [Average Price] * 1.1 )
-- Beter
VAR _AvgPrice = [Average Price]
RETURN SUMX( 'Sales', 'Sales'[Quantity] * _AvgPrice * 1.1 )
```

### DAX004: overbodige filters weg

**Actie:** elk filter één keer; geen sleutelsets of variabelen die een actief predicaat herhalen.

```dax
-- Antipatroon
CALCULATE( SUM('Sales'[Amount]), 'Sales'[Year] = 2023, FILTER('Sales', 'Sales'[Year] = 2023) )
-- Beter
CALCULATE( SUM('Sales'[Amount]), 'Sales'[Year] = 2023 )
```

### DAX005: complexe SUMMARIZE-invoer naar CALCULATETABLE

```dax
-- Antipatroon
SUMMARIZE(
    CALCULATETABLE('Sales', 'Sales'[Year] = 2023, 'Customer'[Segment] = "Enterprise"),
    'Sales'[CustomerKey],
    "DistinctStores", DISTINCTCOUNT('Sales'[StoreKey])
)
-- Beter
CALCULATETABLE(
    SUMMARIZECOLUMNS( 'Sales'[CustomerKey], "DistinctStores", DISTINCTCOUNT('Sales'[StoreKey]) ),
    'Sales'[Year] = 2023,
    'Customer'[Segment] = "Enterprise"
)
```

### DAX006: iteratorinvoer vooraf berekenen met SUMMARIZECOLUMNS

```dax
-- Antipatroon
SUMX( VALUES('Product'[Attribute]), CALCULATE(SUM('Sales'[Amount])) )
-- Beter
SUMX(
    SUMMARIZECOLUMNS( 'Product'[Attribute], "@Amount", SUM('Sales'[Amount]) ),
    [@Amount]
)
```

### DAX007: booleaanse tests zonder IF

**Herkenning:** `IF`/`SWITCH` rij voor rij naar 1/0; trace kan `CallbackDataID` tonen.

```dax
-- Antipatroon
SUMX( 'Products', IF([Sales Amount] > 10000000, 1, 0) )
-- Beter
SUMX( 'Products', INT([Sales Amount] > 10000000) )

-- Rijen tellen: antipatroon (iterator + voorwaarde = callback)
SUMX( 'Sales', IF('Sales'[Amount] > 1000, 1, 0) )
-- Beter: native SE-aggregatie
CALCULATE( COUNTROWS('Sales'), 'Sales'[Amount] > 1000 )
```

### DAX008: contextovergang in een iterator

**Herkenning:** meting of `CALCULATE` binnen een iterator.

```dax
-- 1. Helemaal weghalen
-- In plaats van: SUMX( 'Sales', [Sales Amount] )
SUMX( 'Sales', 'Sales'[Unit Price] * 'Sales'[Quantity] )

-- 2. Over een smalle sleuteltabel itereren
-- In plaats van: SUMX( 'Customer', [Total Sales] )
SUMX( VALUES('Customer'[CustomerKey]), [Total Sales] )

-- 3. Kardinaliteit verlagen (alleen als groeperen op DiscountRate het resultaat behoudt)
SUMX( VALUES('Customer'[DiscountRate]), [Total Sales] * 'Customer'[DiscountRate] )
```

### DAX009: filters uit SUMMARIZECOLUMNS halen

```dax
-- Antipatroon
SUMMARIZECOLUMNS ( 'Table'[Column], TREATAS ( { "Value" }, 'Table'[FilterColumn] ), "@Calculation", [Measure] )
-- Beter
CALCULATETABLE (
    SUMMARIZECOLUMNS ( 'Table'[Column], "@Calculation", [Measure] ),
    'Table'[FilterColumn] = "Value"
)
```

### DAX010: tabelfilters met CALCULATETABLE

```dax
-- Antipatroon
FILTER( 'Sales', 'Sales'[Year] = 2023 )
-- Beter
CALCULATETABLE( 'Sales', 'Sales'[Year] = 2023 )
```

### DAX011: alternatieven voor DISTINCTCOUNT testen

**Herkenning:** `DCOUNT` in xmSQL. Vergelijk; houd alleen als gelijk én sneller voor de visual.

```dax
DISTINCTCOUNT('Sales'[CustomerKey])     -- SE-gebonden
SUMX(DISTINCT('Sales'[CustomerKey]), 1) -- FE-gebonden (soms sneller)
```

### DAX012: filters bewust behouden

```dax
-- ALLEXCEPT alleen als de behouden kolom zelf direct gefilterd is
CALCULATE( [Total Sales], ALLEXCEPT('Sales', 'Sales'[Region]) )
-- ALL/REMOVEFILTERS + VALUES als de waarde via een andere kolom kruisgefilterd kan zijn
CALCULATE( [Total Sales], REMOVEFILTERS('Sales'), VALUES('Sales'[Region]) )
```

### DAX013: vertakkende metingen SE-vriendelijk

Bij `SWITCH`/`IF` die tussen metingen kiest:
- Lees de selectorkolom die de slicer/query direct filtert; geen verborgen sorteersleutels tenzij die direct gefilterd zijn.
- Houd takken SE-native: één eenvoudige aggregatie of één feit-iterator met rij-rekenkunde.
- Eén numeriek type over alle takken; gemengde takken expliciet casten.
- Geen contextovergang in iterators; rij-onafhankelijke metingen naar variabelen.

Voor losse parametertabellen: liever veldparameters (zie [veldparameters.md](veldparameters.md)).

### DAX014: COUNTROWS voor herkende sleutels

`COUNTROWS` in plaats van `DISTINCTCOUNT` alleen als de kolom een herkende unieke sleutel is (tabelsleutel, of één-kant-sleutel van een gewone actieve relatie). Eerst testen bij inactieve relaties, `USERELATIONSHIP` of ongemarkeerde sleutels.

### DAX015: itereren op de benodigde grain

```dax
-- 100K klanten maar 5 kortingspercentages → 100K contextovergangen
SUMX( 'Customer', CALCULATE(SUM('Sales'[Amount])) * 'Customer'[DiscountRate] )
-- 5 iteraties
SUMX( VALUES('Customer'[DiscountRate]), CALCULATE(SUM('Sales'[Amount])) * 'Customer'[DiscountRate] )
```

Niet gebruiken voor eenvoudige SE-native kolomsommen.

### DAX016: relatie-overrides lokaal testen

Test een andere filterverspreiding in de meting vóór je het model wijzigt:

```dax
CALCULATE(
    SUM('Sales'[Amount]),
    CROSSFILTER('Customer'[CustomerKey], 'CustomerBridge'[CustomerKey], NONE),
    TREATAS(VALUES('CustomerBridge'[CustomerKey]), 'Customer'[CustomerKey])
)
```

### DAX017: scanvorm gelijktrekken met booleaanse vermenigvuldigers

**Herkenning:** broer/zus-metingen die alleen in filter verschillen; bijna identieke SE-scans.

```dax
-- Antipatroon: aparte SE-query per meting
CALCULATE( SUM('Sales'[Amount]), 'Product'[Category] = "Bikes" )
CALCULATE( SUM('Sales'[Amount]), 'Date'[Date] = _dateAnchor )

-- Oplossing: booleaanse vermenigvuldiger, zodat scans kunnen fuseren (controleer in trace)
SUMX( KEEPFILTERS(ALL('Product'[Category])), CALCULATE(SUM('Sales'[Amount])) * ('Product'[Category] = "Bikes") )
SUMX( KEEPFILTERS(ALL('Date'[Date])),        CALCULATE(SUM('Sales'[Amount])) * ('Date'[Date] = _dateAnchor) )
```

- Best voor optelbare (`SUM`-achtige) aggregaties; bij `MIN`/`MAX`/`AVERAGE` kunnen ingevoegde nullen het resultaat verstoren.
- Geeft 0 in plaats van BLANK als er geen data is; let op `ISBLANK()`-controles verderop.

### DAX018: deling in iterators SE-native

```dax
-- Antipatroon: DIVIDE in iterator
SUMX('Fact', 'Fact'[BaseAmount] * DIVIDE(RELATED('Items'[Discount]), RELATED('Items'[LocationAdjustment])))
-- Beter (alleen als de noemer nooit nul is; anders eerst nulnoemers wegfilteren)
SUMX('Fact', 'Fact'[BaseAmount] * (RELATED('Items'[Discount]) / RELATED('Items'[LocationAdjustment])))
```

### DAX019: tijdvensters buiten broer/zus-metingen

```dax
-- Antipatroon: elke meting past zelf TI toe (geen fusie)
MEASURE 'Sales'[Revenue YTD] = CALCULATE ( [Revenue], DATESYTD('Date'[Date]) )
MEASURE 'Sales'[Cost YTD]    = CALCULATE ( [Cost],   DATESYTD('Date'[Date]) )
MEASURE 'Sales'[Margin YTD]  = [Revenue YTD] - [Cost YTD]

-- Beter: basismetingen fuseren, TI één keer
MEASURE 'Sales'[Margin YTD] = CALCULATE ( [Revenue] - [Cost], DATESYTD ( 'Date'[Date] ) )
```

Eigen tijdpredicaten (`CALCULATE(expr, Column = _var)`) vallen onder DAX017.

### DAX020: slice-metingen fusievriendelijk

```dax
-- Antipatroon: TI in elke slice-meting
MEASURE 'Sales'[Bikes YTD]       = CALCULATE ( SUM('Sales'[Amount]), 'Product'[Category] = "Bikes",       DATESYTD('Date'[Date]) )
MEASURE 'Sales'[Accessories YTD] = CALCULATE ( SUM('Sales'[Amount]), 'Product'[Category] = "Accessories", DATESYTD('Date'[Date]) )

-- Beter
MEASURE 'Sales'[Bikes]        = CALCULATE ( SUM('Sales'[Amount]), 'Product'[Category] = "Bikes" )
MEASURE 'Sales'[Accessories]  = CALCULATE ( SUM('Sales'[Amount]), 'Product'[Category] = "Accessories" )
MEASURE 'Sales'[Combined YTD] = CALCULATE ( [Bikes] + [Accessories], DATESYTD('Date'[Date]) )
```

### DAX021: vooraf berekende sleutelsets in de FE joinen

**Herkenning:** een berekende sleutelset filtert hetzelfde feit opnieuw via `TREATAS`/`IN`; trace toont grote `IN`/`INB`.

```dax
-- Antipatroon
VAR _FilteredAgg = CALCULATETABLE ( ADDCOLUMNS ( VALUES ( 'Fact'[Key] ), "@Agg1", [Measure] ), 'Dim'[Filter] = "X" )
VAR _Qualifying = FILTER ( _FilteredAgg, [@Agg1] > 1000000 )
VAR _Result = CALCULATE ( [Measure], TREATAS ( SELECTCOLUMNS ( _Qualifying, "K", 'Fact'[Key] ), 'Fact'[Key] ) )

-- Beter: beide aggregaties vooraf, join in de FE
VAR _FilteredAgg = CALCULATETABLE ( ADDCOLUMNS ( VALUES ( 'Fact'[Key] ), "@Agg1", [Measure] ), 'Dim'[Filter] = "X" )
VAR _Qualifying = FILTER ( _FilteredAgg, [@Agg1] > 1000000 )
VAR _UnfilteredAgg = ADDCOLUMNS ( VALUES ( 'Fact'[Key] ), "@Agg2", [Measure] )
VAR _Joined = NATURALINNERJOIN ( _Qualifying, _UnfilteredAgg )
VAR _Result = SUMX ( _Joined, [@Agg2] )
```

Beide kanten moeten een gedeelde lineage-kolom hebben voor `NATURALINNERJOIN`.

---

## Tier 2: querystructuur (akkoord nodig)

> **Stop: eerst akkoord.** Elke aanbeveling moet iets zijn wat jij in Power BI Desktop in de UI kunt doen: as/groeperingsveld wisselen (bijv. Datum → Maand), visualfilters weghalen of toevoegen, filterwaarden aanpassen, meetwaardefilters (Top N, "> drempel") verwijderen, aggregatietype van een kolom wijzigen.

**QRY001: overbodige filters weg.** Elk filter voegt een `WHERE` en mogelijk een join toe. Haal filters één voor één weg; verandert het resultaat niet, dan was het overbodig.

```dax
-- Voor
SUMMARIZECOLUMNS ( 'Product'[Category], KEEPFILTERS ( TREATAS ( {"USD"}, 'Currency'[Code] ) ), "Revenue", [Total Revenue] )
-- Na
SUMMARIZECOLUMNS ( 'Product'[Category], "Revenue", [Total Revenue] )
```

**QRY002: meetwaardefilters in het rapport (`__ValueFilterDM`).** Een visualfilter op een meting ("Revenue > 1M") kan de meting twee keer laten rekenen. Zet de drempel in de meting:

```dax
MEASURE 'Sales'[Total Revenue Filtered] =
    VAR __Rev = [Total Revenue]
    RETURN IF ( __Rev > 1000000, __Rev )
```

**QRY003: grain verlagen.** Groeperen op `Calendar[Date]` (365 rijen) terwijl maanden (12) volstaan, kost ~30× meer SE-rijen.

```dax
-- A: grover groeperen
SUMMARIZECOLUMNS ( 'Calendar'[YearMonth], "Revenue", [Total Revenue] )

-- B: periode-einde-as + meting vastpinnen (vereist Calendar[MonthEndDate])
MEASURE 'Sales'[Active Customers] =
    CALCULATE ( DISTINCTCOUNT ( 'Sales'[CustomerID] ), 'Calendar'[Date] = MAX ( 'Calendar'[MonthEndDate] ) )

-- C: alleen op maandeinde rekenen
MEASURE 'Sales'[Revenue EOM] =
    IF ( MAX('Calendar'[Date]) = EOMONTH(MAX('Calendar'[Date]), 0), [Total Revenue] )

-- D: daggemiddelde op grover niveau
MEASURE 'Sales'[Daily Avg Revenue] = DIVIDE ( [Total Revenue], DAY ( EOMONTH ( MAX('Calendar'[Date]), 0 ) ) )
```

**QRY004: BLANK-onderdrukking weghalen (verandert de resultaatvorm).** `+ 0`, `IF(ISBLANK([M]), 0, [M])` of `COALESCE(..., 0)` dwingen evaluatie van elke combinatie af.

```dax
-- Antipatroon
MEASURE 'Sales'[Revenue] = SUM ( 'Sales'[SalesAmount] ) + 0
-- Beter
MEASURE 'Sales'[Revenue] = SUM ( 'Sales'[SalesAmount] )
-- Alleen nul waar zinvol
MEASURE 'Sales'[Revenue] =
    VAR _ForceZero = NOT ISEMPTY ( 'Sales' )
    RETURN [Sales Amount] + IF ( _ForceZero, 0 )
```

---

## Tier 3: modelwijzigingen (akkoord nodig)

> **Stop: eerst akkoord.** Waarschuw dat rapporten kunnen breken en stel een kopie van het model voor. Wijzigingen in de bron (Lakehouse, Warehouse, Power Query) stem je af met wie de pipelines beheert.

**Algemene datalayout** (Import en Direct Lake):
1. Ongebruikte kolommen verwijderen en rijen in de bron filteren.
2. Feitrijen die altijd leeg/nul zijn weglaten.
3. Tekstattributen met lage kardinaliteit van het feit naar een dimensie met gehele sleutel.
4. Partitioneren op veelgefilterde kolommen (DateKey, TenantKey); Z-order als partitioneren te veel kleine bestanden geeft.
5. Voorsorteren op de meest gefilterde/gegroepeerde kolom (bijv. DateKey, dan ProductKey) voor betere RLE-compressie.
6. Optimale datatypes (MDL003).

**MDL001: many-to-many optimaliseren.** Scenario `User` (beveiliging), `Customer`, bridge `UserCustomer`, `Fact`. Test elke variant:
- A, canoniek: `User 1──* UserCustomer *──bidir──1 Customer 1──* Fact`. Goed als User zelden samen met Customer filtert.
- B, M2M-bridge naar feit (geen bidir): beide dimensies filteren via de bridge. Voorspelbare querytijden.
- C, hybride: `User 1──* UserCustomer *──M2M──* Fact *──1 Customer`. Geen bidir; beste algemene keuze.
- D, vooraf berekende combinatiesleutel: ETL geeft gebruikers met dezelfde toegang één sleutel. Voor zeer grote bridges.

**MDL002: sterschema.** Sneeuwvlok `Sales ──* Product ──* Subcategory ──* Category` platslaan tot `Product [ProductKey, ProductName, Subcategory, Category]`.

**MDL003: kardinaliteit en datatypes.** Gehele sleutels in plaats van `"PROD-001234"`; `DateTime` → `Date` als je alleen per dag groepeert; continue waarden in klassen; hoge-kardinaliteitkolommen splitsen (`FullAddress` → `City`, `State`, `Zip`).

**MDL004: aggregatietabellen.** Voorgeaggregeerde Import-tabellen vangen query's af vóór ze grote DirectQuery-feiten raken: `GROUP BY [FKs], SUM([Metrics])` → Import → zelfde dimensies → mappen in Manage Aggregations als `SUM OF [FactTable[Column]]`. Feiten moeten DQ zijn. Variant: alleen recente data (bijv. 3 maanden) in Import.

**MDL005: periodevergelijking vooraf berekenen.**

```dax
-- Voor (twee scans)
YoY = SUM ( 'Fact'[Sales] ) - CALCULATE ( SUM ( 'Fact'[Sales] ), SAMEPERIODLASTYEAR ( 'Date'[Date] ) )
-- Na (één scan, kolom SalesLY in het feit)
YoY = SUM ( 'Fact'[Sales] ) - SUM ( 'Fact'[SalesLY] )
```

**MDL006: rijgebaseerde TI-tabel.** Tabel met `Period` (slicerlabel), `Date` (relatie naar feit) en `AxisDate`; via M2M naar het feit of bidir via de kalender. Alle periodemetingen fuseren dan in één scan.

**MDL007: referentiële integriteit.** Sleutels in het feit zonder dimensierij verhinderen optimalisaties. Opsporen:

```sql
SELECT [Dimension_Name], [RIVIOLATION_COUNT]
FROM $SYSTEM.DISCOVER_STORAGE_TABLES
WHERE [RIVIOLATION_COUNT] > 0
```

Oplossing: een "Unknown"-rij in de dimensie en ontbrekende sleutels daarop mappen.

**MDL008: SEARCH/FIND vervangen door booleaanse kolommen.** Bereken vaste tekstcontroles vooraf als booleaanse kolom.

**MDL009: historische waarden samenvoegen.** Oude sleutelwaarden buiten een bewaartermijn vervangen door één placeholder:

```sql
CASE WHEN SaleDate >= DATEADD(year, -1, GETDATE()) THEN SalesKey ELSE 'Historical Key' END
```

---

## Tier 4: Direct Lake (akkoord nodig)

> **Stop: eerst akkoord.** Vereist Spark/ETL-jobs of Fabric-resourceprofielen buiten het model.

**DL001: V-Order.** Direct Lake hangt af van de Delta/Parquet-layout. Twee routes:
- Spark: `spark.conf.set("spark.sql.parquet.vorder.default", "true")`, daarna `OPTIMIZE` op bestaande Delta-tabellen.
- Fabric-resourceprofiel [`readHeavyForPBI`](https://learn.microsoft.com/en-us/fabric/data-engineering/configure-resource-profile-configurations).

**DL002: segmentgrootte.** Doel: 1–16M rijen per rowgroup. Te weinig → single-threaded scans; te veel kleine → overhead. Onder 1M rijen maakt het zelden uit. Draai regelmatig `OPTIMIZE`.
