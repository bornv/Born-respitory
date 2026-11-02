# DAX-code en user-defined functions

Codeconventies (pass 12) en UDF's (pass 13) uit de organiseer-aanpak. Voor algemene DAX-regels, query-syntaxis en performance-tuning: **fabric-semantic-model** (`dax-richtlijnen.md`, `dax-performance.md`, `dax-performance-patronen.md`).

## Inhoud

- [Codeconventies](#codeconventies)
- [Performance: wat deze bron extra benadrukt](#performance-wat-deze-bron-extra-benadrukt)
- [Wanneer een UDF](#wanneer-een-udf)
- [Vereisten](#vereisten)
- [Naamgeving van UDF's](#naamgeving-van-udfs)
- [Syntaxis](#syntaxis)
- [Documenteren](#documenteren)
- [Voorbeelden](#voorbeelden)

## Codeconventies

1. **Formatteer alles**: metingen, berekende kolommen, berekende tabellen, calculation items en functies. In een Tabular Editor-script formatteert `obj.FormatDax()` aan het eind van het script.
2. **Prefixen**:
   - Variabelen met `_`: `VAR _StartDate`.
   - Tijdelijke kolommen uit `ADDCOLUMNS`, `ROW`, `SELECTCOLUMNS` of `SUMMARIZECOLUMNS` met `@`: `"@BusinessDate"`, gebruikt als `[@BusinessDate]`.
   - Zo zie je nooit een variabele of tijdelijke kolom aan voor een modeltabel of -kolom.
3. **Code actions van Tabular Editor 3 nalopen.** De editor toont ze (DR001–DR014, RW001–RW003, zie docs.tabulareditor.com/en/features/code-actions.html). Controleer in elk geval:
   - scalaire predicaten in plaats van `FILTER` op één kolom;
   - aggregatoren in plaats van iteratoren over één kolom;
   - `VALUES` in plaats van `SUMMARIZE` op één kolom;
   - de twee prefixen hierboven;
   - constante aggregaties naar variabelen;
   - `DISTINCTCOUNT`, `COALESCE`, `ISBLANK` waar ze passen;
   - `IN` in plaats van een keten `||`-gelijkheden;
   - geen ongebruikte variabelen.
4. **Commentaar** alleen bij afwijkende logica, één korte `//`-regel: een bewuste `ALL` die een filter weghaalt dat gebruikers wel verwachten, een workaround voor een engine-eigenaardigheid, de betekenis van een magisch getal. Niet het voor de hand liggende uitleggen.

Voorbeeld (magazijn):

```dax
On Time Delivery (%) =
VAR _Delivered =
    CALCULATE ( COUNTROWS ( Leveringen ), Leveringen[Status] IN { "Geleverd", "Deels geleverd" } )
VAR _OnTime =
    CALCULATE (
        COUNTROWS ( Leveringen ),
        Leveringen[Status] IN { "Geleverd", "Deels geleverd" },
        Leveringen[Op Tijd] = TRUE ()
    )
RETURN
    DIVIDE ( _OnTime, _Delivered )
```

## Performance: wat deze bron extra benadrukt

De volledige aanpak staat in **fabric-semantic-model**. Kernpunten om in gedachten te houden:

| Tier | Wat | Autonomie |
|---|---|---|
| 1 — DAX-patronen | Alleen meting-/UDF-definities herschrijven | Vrij testen; `EVALUATE` en grouping identiek houden |
| 2 — Querystructuur | Grain, filters, visual-instellingen | Eerst uitleggen, wachten op akkoord |
| 3 — Model | Relaties, kolommen, aggregatietabellen, datatypes | Hoge voorzichtigheid; kopie van het model voorstellen; downstream-risico melden |
| 4 — Direct Lake | OneLake-layout, V-Order, rowgroups | Vraagt ETL-/pipelinewijzigingen buiten het model |

- Tier 2-wijzigingen moeten iets zijn wat de rapportbouwer in Desktop kan doen: as-veld wisselen (dag → maand), visualfilter weghalen, filterwaarde aanpassen, Top N-/drempelfilter op een meting verwijderen, aggregatietype wijzigen.
- Een wijziging telt pas als winst als hij buiten de ruisband van de baseline valt én exact hetzelfde resultaat geeft (zelfde rijen, kolommen, waarden). Anders terugdraaien.
- Veel korte SE-query's + hoge FE-tijd = DAX-probleem. Weinig SE-query's + lage FE-tijd + hoge SE-duur + lage parallelliteit = data-layoutprobleem; DAX herschrijven helpt dan niet.
- Hulpmiddelen die je zelf draait: **DAX Studio** (Server Timings), de Tabular Editor CLI `te query`, of een trace via ADOMD.NET/PowerShell.

## Wanneer een UDF

- Dezelfde logica komt in meerdere metingen terug, met alleen een andere meting of kolom: een tijdvenster, een filter "volledige maand" of "datums met data", een valutaconversie, een dynamische format string, een SVG-visual.
- Een bedrijfsregel moet op één plek staan, zodat één wijziging alle metingen raakt.
- **Niet** voor eenmalige logica van één meting; een UDF die één keer wordt aangeroepen is alleen extra indirectie.

Stel kandidaten voor met de metingen die ze vervangen. Omzetten verandert de expressies, dus laat voor en na zien en controleer met een DAX-query vóór en na dat de uitkomsten gelijk zijn.

## Vereisten

- Compatibility level **1702 of hoger**. Verhogen is eenrichtingsverkeer: vraag het eerst.
- In een Tabular Editor-script: `Model.AddFunction("Name", "( params ) => body")` geeft een `Function` met `Description`, `Expression`, `IsHidden` en annotaties; `Model.Functions` somt ze op.
- In TMDL staan functies in `definition/functions.tmdl`.

## Naamgeving van UDF's

Samengestelde namen met punten die zeggen waar de functie vandaan komt en wat hij doet: `TimeIntelligence.MonthToDate`, `FormatString.Component.DecimalPlaces`, `DaxLib.Convert.CelsiusToFahrenheit`.

- DAX heeft geen namespaces; de volledige naam typ je altijd bij de aanroep.
- De BPA-regel "Use compound names for user-defined functions" van Tabular Editor markeert namen van één woord.
- Tabular Editor 3 groepeert functies op die segmenten; de eigenschap `Namespace` verandert alleen de groepering, nooit de aanroepnaam.

## Syntaxis

```
FUNCTION <Name> = ( <param> [: [type] [subtype] [mode]] [= <default>], ... ) => <body>
```

| Onderdeel | Waarden |
|---|---|
| Waardetypes | `AnyVal` (standaard), `Scalar`, `Table` |
| Referentietypes | `AnyRef`, `ColumnRef`, `MeasureRef`, `TableRef`, `CalendarRef` |
| Scalar-subtypes | `Variant`, `Int64`, `Decimal`, `Double`, `String`, `DateTime`, `Boolean`, `Numeric` |
| Modi | `val`: argument één keer geëvalueerd in de context van de aanroeper (standaard voor waardetypes); `expr`: argument onge-evalueerd doorgegeven, de functie bepaalt de context (verplicht voor referentietypes) |
| Standaardwaarde | `= <default>` maakt een parameter optioneel; overslaan met een leeg argument (`F(1,,3)`) |

Een meting die als `val` wordt doorgegeven is al geëvalueerd en negeert elke `CALCULATE` binnen de functie. Dat is meestal de reden om `expr` te declareren. Schrijf type-hints altijd: aanroepen falen dan duidelijk en de bedoeling is gedocumenteerd.

## Documenteren

Twee lagen, allebei verwacht:

1. `///`-regels boven de functie (TMDL of DAX query view) worden de beschrijving: wat de functie teruggeeft, één regel per parameter.
2. `//`-commentaar in de parameterlijst per parameter: wat hij verwacht, geldige waarden, een voorbeeldargument. In de body alleen logica becommentariëren die een lezer niet verwacht.

Functies die uit DaxLib zijn geïnstalleerd hebben de annotaties `DAXLIB_PackageId` en `DAXLIB_PackageVersion`. Laat die staan: daaraan wordt het pakket herkend en bijgewerkt. Een pakketfunctie niet hernoemen of ter plekke bewerken; wikkel hem in een eigen modelfunctie.

## Voorbeelden

### Microsoft Learn (DAX query view)

```dax
DEFINE
    /// AddTax takes in amount and returns amount including tax
    FUNCTION AddTax = (
            amount : NUMERIC
        ) =>
        amount * 1.1

EVALUATE
{ AddTax ( 10 ) }
```

### Modelspecifieke tijdintelligentie (TMDL)

````tmdl
function 'TimeIntelligence.MonthToDate' = ```
		// Cumulate month-to-date only for dates with sales
		(
		    measureReference: EXPR
		)
		=>
		    CALCULATE (
		        measureReference,
		        CALCULATETABLE (
		            DATESMTD ( 'Date'[Date] ),
		            'Date'[IsDateInScope]
		        )
		    )
		```
````

`EXPR` is hier essentieel: de meting moet onder het month-to-date-filter geëvalueerd worden, niet ervoor.

### Bibliotheekcomponent met parametercommentaar (DaxLib.FormatString)

````tmdl
function 'FormatString.Component.DecimalPlaces' = ```
		// Returns a 0 string repeated a number of times equal to the number of decimal places
		(
		    // Base format string
		    // Expects a valid format string base, i.e. "#,##0"
		    base_format: STRING,

		    // Number of decimal places
		    // Expects an integer value from 0-9
		    decimal_places: INT64
		)
		=>
		    base_format
		    &
		    IF (
		        decimal_places > 0,
		        "."
		            & REPT ( "0", MIN ( decimal_places, 9 ) ),
		        ""
		    )
		```

	annotation DAXLIB_PackageId = DaxLib.FormatString

	annotation DAXLIB_PackageVersion = 1.0.0-beta
````

Bronnen: learn.microsoft.com/dax/best-practices/dax-user-defined-functions; learn.microsoft.com/dax/function-statement-dax; docs.tabulareditor.com/en/tutorials/udfs.html; docs.tabulareditor.com/en/kb/bpa-udf-use-compound-names.html
