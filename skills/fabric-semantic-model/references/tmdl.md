# TMDL-richtlijnen

TMDL (Tabular Model Definition Language) is de tekstvorm van een semantisch model: syntaxis, objecttypen en goede gewoonten. Je vindt TMDL in een PBIP-project (`<Naam>.SemanticModel/definition/`), in TMDL view in Power BI Desktop en in de uitvoer van `getDefinition`.

## Syntaxisregels

- **Consistente inspringing per niveau**; tabs aanbevolen (zoals Power BI-tools). In PowerShell-strings: `` `t ``; in Bash: `$'\t'` of letterlijke tabs.
- Een object declareer je met het TOM-objecttype en de naam: `table Customer`, `column ProductId`, `measure 'Total Sales'`.
- Objecten als partition en measure hebben een standaardeigenschap na `=`: de Power Query- respectievelijk DAX-expressie.
- Namen met spaties of speciale tekens (`.`, `=`, `:`, `'`) tussen **enkele aanhalingstekens**: `column 'Order Date'`.
- Beschrijvingen met `///` **boven** het object, niet met de eigenschap `description`:

  ```tmdl
  /// Revenue by product category
  measure 'Total Sales' = SUM(Sales[Amount])
  ```

- `//`-commentaar wordt **niet** ondersteund in TMDL; commentaar mag wel binnen M- of DAX-expressies.
- Voeg bij nieuwe objecten **geen** `lineageTag` toe; de engine kent die bij de eerste keer opslaan toe.
- DAX over meerdere regels tussen drie backticks:

  ```tmdl
  measure 'Profit Margin' = ```
          DIVIDE(
              [Total Revenue] - [Total Cost],
              [Total Revenue]
          )
          ```
      formatString: 0.00%
  ```

- **Metingen vóór kolommen** in een tabeldefinitie.
- `formatString` is verplicht op elke meting.
- Leer van bestaande voorbeelden in de code (naamgeving, stijl).

## Bestandsindeling

```
definition.pbism                        <- Instellingen semantisch model
definition/database.tmdl                <- Database-eigenschappen (compatibility level)
definition/model.tmdl                   <- Modeleigenschappen, ref's naar tabellen/rollen/culturen
definition/relationships.tmdl           <- Relaties
definition/functions.tmdl               <- DAX-functies (UDF's)
definition/tables/<TableName>.tmdl      <- Tabellen: kolommen, metingen, partities, hiërarchieën, calc groups
definition/roles/<RoleName>.tmdl        <- Beveiligingsrollen
definition/cultures/<locale>.tmdl       <- Vertalingen
definition/perspectives/<Name>.tmdl     <- Perspectives
```

### database.tmdl

Moet beginnen met een `database`-declaratie (GUID of naam), niet met een losse eigenschap:

```tmdl
database 7124f8d8-6199-44fe-b35d-7f7f06b3e1c6
	compatibilityLevel: 1702
	compatibilityMode: powerBI
	language: 1033
```

Een losse `compatibilityLevel:` zonder `database` geeft `InvalidLineType: Property!`.

### model.tmdl

Modeleigenschappen plus `ref`-declaraties zodat de engine de andere bestanden vindt:

```tmdl
model Model
	culture: en-US
	defaultPowerBIDataSourceVersion: powerBI_V3
	sourceQueryCulture: en-US

ref table Sales
ref table Date

ref role RegionalManager

ref perspective 'Internet Sales'

ref cultureInfo en-US
ref cultureInfo fr-FR
```

`defaultPowerBIDataSourceVersion: powerBI_V3` is verplicht voor Import-modellen; zonder geeft de API `Import from JSON supported for V3 models only`.

---

## Tabellen per opslagmodus

### Import

```tmdl
table Customer

	/// Total number of customers
	measure '# Customers' = COUNTROWS(Customer)
		formatString: #,##0

	column CustomerId
		dataType: int64
		isHidden
		summarizeBy: none
		sourceColumn: CustomerId

	column 'Customer Name'
		dataType: string
		sourceColumn: CustomerName

	partition Customer = m
		mode: import
		source =
			let
				Source = Sql.Database(#"Server", #"Database"),
				Customer = Source{[Schema="dbo", Item="Customer"]}[Data]
			in
				Customer
```

### Direct Lake

```tmdl
expression DL_Lakehouse =
	let
		Source = AzureStorage.DataLake("https://onelake.dfs.fabric.microsoft.com/<WorkspaceId>/<LakehouseId>", [HierarchicalNavigation=true])
	in
		Source

table Sales

	/// Total revenue
	measure 'Total Sales' = ```
			SUMX(
				Sales,
				Sales[Quantity] * Sales[UnitPrice]
			)
			```
		formatString: $ #,##0.00

	column SalesKey
		dataType: int64
		isHidden
		summarizeBy: none
		sourceColumn: sales_key

	column Quantity
		dataType: int64
		sourceColumn: quantity

	partition Sales = entity
		mode: directLake
		source
			entityName: Sales
			schemaName: dbo
			expressionSource: DL_Lakehouse
```

### Veldparameter (berekende tabel)

Zie [veldparameters.md](veldparameters.md) voor de vorm, regels en escaping.

---

## Relaties

In `relationships.tmdl` of inline in tabelbestanden.

```tmdl
relationship 'Sales to Date'
	fromColumn: Sales.'Order Date'
	toColumn: Date.Date

/// Inactive - use with USERELATIONSHIP() in DAX
relationship 'Sales - Ship Date to Date'
	isActive: false
	fromColumn: Sales.'Ship Date'
	toColumn: Date.Date
```

- Relaties **vóór** de metingen die ervan afhangen.
- `fromColumn:` = veel-kant (feit); `toColumn:` = één-kant (dimensie).
- Standaard `crossFilteringBehavior: oneDirection`; `bothDirections` alleen als nodig.
- `isActive: false` voor rollenspelende dimensies (bijv. orderdatum/leverdatum); activeren met `USERELATIONSHIP()`.
- Gehele sleutels, hetzelfde `dataType` aan beide kanten, vreemde sleutels verborgen, geen samengestelde sleutels.

## Hiërarchieën

Binnen de tabeldefinitie; elk niveau verwijst naar een kolom in dezelfde tabel.

```tmdl
table Geography

	column Continent
		dataType: string
		sourceColumn: Continent

	column Country
		dataType: string
		sourceColumn: Country

	hierarchy 'Geography Hierarchy'

		level Continent
			column: Continent

		level Country
			column: Country
```

- Niveaus van grof naar fijn; niveaunamen mogen afwijken van kolomnamen.
- `///`-beschrijvingen boven een niveau; geen hiërarchie met één niveau.

## Calculation groups

```tmdl
table 'Time Intelligence'

	calculationGroup

		calculationItem Current = SELECTEDMEASURE()

		calculationItem YTD = CALCULATE(SELECTEDMEASURE(), DATESYTD('Date'[Date]))

		calculationItem PY = CALCULATE(SELECTEDMEASURE(), SAMEPERIODLASTYEAR('Date'[Date]))

	column 'Time Intelligence'
		dataType: string

	partition 'Partition_Time Intelligence' = calculationGroup
```

- `calculationGroup` zonder naam, ingesprongen onder de tabel; items daaronder.
- `formatStringDefinition` (niet `formatString`) voor items die de opmaak van de meting overschrijven.
- De kolomnaam is meestal gelijk aan de tabelnaam; partitie `= calculationGroup`.

## Beveiligingsrollen (RLS)

Elke rol is een eigen bestand in `roles/`.

```tmdl
/// Access restricted to East region
role RegionalManager
	modelPermission: read

	tablePermission Sales = [Region] = "East"
```

- `modelPermission:` is verplicht: `read` (meestal) of `readRefresh`.
- `tablePermission <Tabel> = <DAX-filter>`; één per tabel, meerdere tabellen per rol mag.
- In `model.tmdl`: `ref role <Naam>` per rol.
- Bij nieuwe rollen nooit de annotatie `PBI_Id` toevoegen. Bekijk eerst de bestaande rollen.
- **Rolleden** (gebruikers/groepen) staan niet in TMDL en beheer je in de Power BI-portal.

## Vertalingen (cultures)

```tmdl
cultureInfo fr-FR
	translations
		model Model
			table Sales
				caption: Ventes
				column Amount
					caption: Montant
```

- `caption:` voor de weergavenaam, `description:` voor tooltips; `ref cultureInfo <locale>` in `model.tmdl`.

## Perspectives

```tmdl
perspective 'Internet Sales'

	perspectiveTable 'Internet Sales'
		includeAll

	perspectiveTable Customer
		perspectiveColumn 'Marital Status'
		perspectiveColumn Education
```

`includeAll` neemt alles op; anders `perspectiveColumn` / `perspectiveMeasure` opsommen. `ref perspective <Naam>` in `model.tmdl`.

## DAX user-defined functions

In `definition/functions.tmdl` (los bestand, niet in een tabel):

```tmdl
/// Returns double the input value
function DoubleValue = DoubleValue(Value) = Value * 2

/// Year-to-date cumulative total
function YTDTotal = ```
		YTDTotal(Measure) =
		CALCULATE(
		    Measure,
		    DATESYTD('Date'[Date])
		)
		```
```

Zie [dax-richtlijnen.md](dax-richtlijnen.md#dax-user-defined-functions-udfs) voor types en modi.

## Berekende tabellen

```tmdl
table _Measures

	measure 'Total Sales' = SUM(Sales[Amount])
		formatString: $#,##0.00

	column Dummy
		isHidden
		sourceColumn: [Dummy]

	partition _Measures = calculated
		mode: import
		source = ROW("Dummy", BLANK())
```

`partition <Naam> = calculated` met `source = <DAX>` en `mode: import`. Bruikbaar voor berekende datumtabellen. (Let op: de modelleerrichtlijnen raden één aparte metingentabel af; verdeel metingen liever over de feittabellen.)

## Datumtabel

Bestaande brontabel boven gegenereerd; aaneengesloten bereik; `dataCategory: Time`; maandnaam sorteren op maandnummer; auto date/time uit; DAX-datumtabel alleen als er geen brontabel is.

## Parameters

```tmdl
expression Server = "myserver.database.windows.net" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

expression Database = "MyDatabase" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]
```

In de partitie-M gebruik je `#"Server"` en `#"Database"`.

## Annotaties

`annotation <Sleutel> = <Waarde>`, ingesprongen onder het object. Automatisch gegenereerde annotaties zoals `PBI_FormatHint` en `PBI_ResultType` zijn interne Power BI-metadata: **niet zelf toevoegen**. Eigen annotaties mogen voor documentatie of tooling.

## Calendar-objecten

Optionele metadata voor time intelligence, binnen de datumtabel na de hiërarchieën:

```tmdl
table Date

	calendar 'Gregorian Calendar'

		calendarColumnGroup = year
			primaryColumn: Year

		calendarColumnGroup = month
			primaryColumn: 'Year Month Number'
			associatedColumn: Month

		calendarColumnGroup = date
			primaryColumn: Date
			associatedColumn: Day
```

Granulariteiten: year, quarter, month, week, date, monthOfYear, dayOfWeek. `primaryColumn:` = sorteer-/numerieke kolom; `associatedColumn:` = weergavekolom.

## TMDL-scripts

TMDL view in Power BI Desktop maakt scripts, normaal in de map `TMDLScripts` van het model. Een script begint met een commando, gevolgd door één of meer ingesprongen objecten. Alleen het commando `createOrReplace` wordt ondersteund.

```tmdl
createOrReplace

    table Product

        measure '# Products' = COUNTROWS('Product')
            formatString: #,##0

        column 'Product Name'
            dataType: string

        ...
```

Handig als je in Desktop werkt zonder PBIP: Claude levert een `createOrReplace`-script dat je in TMDL view toepast.

---

## Taak: beschrijvingen toevoegen

- `/// Beschrijving` direct boven `table`, `column` of `measure`; meerdere regels mogen.
- Duidelijk en beknopt; bestaande beschrijvingen als basis gebruiken en verbeteren.
- Niet de eigenschap `description` gebruiken en **geen andere eigenschappen wijzigen**.

## Taak: metingen maken

- Altijd `formatString` en een `///`-beschrijving.
- Geen metingen voor niet-optelbare kolommen (sleutels, omschrijvingen), tenzij die een `summarizeBy` anders dan `none` hebben.
- DAX over meerdere regels tussen drie backticks; één regel direct na `=`.
- Metingen bovenaan de tabel, vóór de kolommen.

| Soort | Format | Uitvoer |
|---|---|---|
| Valuta | `$#,##0.00` | $1,234.56 |
| Percentage | `0.00%` | 45.67% |
| Geheel getal | `#,##0` | 1,234 |
| Decimaal | `#,##0.00` | 1,234.56 |
| Duizendtallen | `#,##0,K` | 1,234K |
| Miljoenen | `#,##0,,M` | 1M |

## Taak: Power Query/M-code documenteren

- Commentaar boven het codeblok dat uitlegt wat het doet; niet beginnen met "Step" of een nummer; geen code kopiëren; max. 225 tekens.
- Stapnamen beschrijvend maken: tussen dubbele aanhalingstekens met `#` ervoor, beginnend met een werkwoord in de verleden tijd, met spaties, max. 50 tekens (bijv. `#"Filtered open orders"` of `#"Gefilterde open orders"`).
