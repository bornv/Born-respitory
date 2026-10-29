# Modelleerrichtlijnen

Regels die je toepast bij het bouwen of wijzigen van een Power BI semantisch model. Voor naamgeving zie [naamgeving.md](naamgeving.md), voor DAX zie [dax-richtlijnen.md](dax-richtlijnen.md), voor de syntaxis zie [tmdl.md](tmdl.md).

## Kernprincipes

- **Consistentie boven perfectie.** Werk je in een bestaand model, bekijk dan eerst de patronen die er al zijn en sluit daarop aan.
- **Sterschema.** Standaard: feittabel(len) met gedenormaliseerde dimensietabellen, duidelijke sleutels van één kolom en één-op-veel-relaties. Wijk alleen af bij een harde, expliciete eis. Vermijd sneeuwvlokdimensies.
- **Expliciete metingen.** Gebruik altijd expliciete metingen, geen impliciete aggregaties. Telt een meting een basiskolom op (`SUM('T'[Kolom])`, `AVERAGE`, `COUNT`), zet die kolom dan op `isHidden = true`. Stel ook de modeleigenschap `discourageImplicitMeasures` voor.
- **Slank model.** Alleen kolommen en tabellen die nodig zijn voor analyse. Ongebruikte objecten weg.
- **Geheugenbewust.** Kolommen met hoge kardinaliteit (GUID's, transactie-ID's, samengestelde sleutels, niet-gesplitste DateTime) kosten het meeste geheugen. Elke kolom kost geheugen, ook als niemand hem gebruikt. Twijfel je, vraag dan of de kolom echt nodig is.

> **Warehousevoorbeeld.** Een SharePoint-lijst of ERP-export bevat vaak een tijdstempel per mutatie (`Gewijzigd`, `Boekingstijd`). Splits die in een datum- en een tijdkolom, of laat de tijd weg als je alleen per dag rapporteert.

## Tabellen

Een tabel bestaat uit kolommen, metingen en partities (de query naar de bron).

**Doen**
- Begin met de partitie en de bronquery. Voor Direct Lake: zie [Direct Lake](#direct-lake).
- Maak alle benodigde kolommen met het juiste datatype. `sourceColumn` moet overeenkomen met de kolomnaam uit de partitiequery.
- Standaard: M-partitie (Power Query) in Import-modus, behalve bij een Direct Lake-model.
- Geef tabellen een `description` met doel en grain (bijv. "één rij per orderregel").
- Elke tabel heeft minstens één relatie met een andere tabel (behalve hulptabellen).

**Niet doen**
- Power Query M gebruiken voor tabellen in Direct Lake-opslag.
- Gedeelde named expressions maken voor de tabelquery zelf.
- Losse tabellen zonder relatie laten staan zonder duidelijke reden.

### Partitietypes en opslagmodus

| Partitiebrontype | Opslagmodus | Gebruik |
|---|---|---|
| M (`MPartitionSource`) | Import/DirectQuery | Standaard. De query is Power Query (M). |
| Entity (`EntityPartitionSource`) | DirectLake | Geen M-expressie; koppelt de tabel aan een entiteit in de bron, zoals een Lakehouse-tabel. |
| Calculated (`CalculatedPartitionSource`) | Import | Berekende tabel; de query is een DAX-expressie. |

## Kolommen

**Doen**
- Elke gegevenskolom heeft een `sourceColumn` die overeenkomt met de partitiebron.
- `dataType` is altijd gedefinieerd (behalve bij berekende tabellen, waar het type uit de DAX volgt). Efficiënte types (hoofdlettergevoelig):

  | Type | Voor |
  |---|---|
  | `Int64` | Sleutels en identificaties |
  | `Decimal` | Bedragen en precieze getallen (max. 4 decimalen) |
  | `String` | Tekst |
  | `DateTime` | Datums en tijdstempels |
  | `Boolean` | Waar/onwaar |

- **Vermijd `Double`** (drijvende komma): afrondingsfouten en tragere prestaties. Gebruik `Decimal` of `Int64`.
- Verberg technische kolommen (`IsHidden = true`): ID's, vreemde sleutels, systeemkolommen (bij SharePoint bijvoorbeeld interne velden).
- Verberg kolommen die in metingen worden opgeteld; de meting is de ingang voor gebruikers.
- Splits gecombineerde DateTime-kolommen in Date en Time. Een DateTime met tijdprecisie is bijna uniek en blaast het dictionary op.
- Let op tekstkolommen met hoge kardinaliteit (GUID's, transactie-ID's, samengestelde tekstsleutels). Alleen nodig voor relaties? Overweeg gehele surrogaatsleutels in de bron.
- Zet `SummarizeBy = None` voor niet-optelbare getallen: ID's, telefoonnummers, postcodes, jaar, maandnummer, dag van de week (en bijvoorbeeld artikelnummers, ordernummers, locatiecodes).
- Zet `isAvailableInMdx = false` op verborgen kolommen die niet als `SortByColumn`, in een hiërarchie of in variaties worden gebruikt. Scheelt geheugen en verwerkingstijd.
- Zet `dataCategory` voor geografische kolommen (`City`, `Country`, `Continent` → `dataCategory: "City"`, `"Country"`, enz.) en voor breedte-/lengtegraad.
- Vlagkolommen (naam begint met "Is" of eindigt op "Flag"): bij voorkeur `String` met "Yes"/"No" (of "Ja"/"Nee") voor leesbaarheid, of `Boolean` laten.
- Stel `sortByColumn` in voor tekstkolommen die niet alfabetisch moeten sorteren (maandnamen op maandnummer). De sorteerkolom moet bestaan en mag niet `isAvailableInMdx = false` hebben.
- Verwijs altijd met tabelnaam naar kolommen: `'Tabelnaam'[Kolomnaam]`.

**Niet doen**
- Kolommen die in naam en datatype niet overeenkomen met de partitiebron.
- Zichtbare vreemde sleutels.
- Kolommen die door geen meting, relatie of visual worden gebruikt.
- Meer dan ~30 zichtbare kolommen per tabel; dat wijst meestal op een denormalisatieprobleem. Splits in echte dimensies.

## Berekende kolommen

Worden bij elke refresh per rij berekend. Spaarzaam gebruiken.

- Liever een meting als de logica een aggregatie is.
- Is een berekende kolom nodig, overweeg dan de berekening naar de bron (Power Query of warehouse) te verplaatsen.
- Geen berekende kolommen die alleen optellen of filteren (dat is een meting) of die moeten reageren op filtercontext.

## Metingen

> DAX-regels en -patronen: [dax-richtlijnen.md](dax-richtlijnen.md).

**Doen**
- Maak expliciete metingen voor optelbare getallenkolommen. Verberg de kolom en geef de meting een andere naam dan de kolom.
- Verdeel metingen over de relevante tabellen (geen enkele centrale "Measures"-tabel).
- Controleer dat verwezen kolommen en tabellen bestaan.
- Altijd een passende `formatString` (zie [Opmaakcodes](#opmaakcodes-formatstring)).
- `description` met de bedrijfslogica, zeker bij complexe berekeningen.
- `displayFolder` om metingen per tabel logisch te groeperen.
- Alleen met een live model: test elke nieuwe meting met een eenvoudige query en controleer op fouten met `EVALUATE INFO.MEASURES()` (kolom `ErrorMessage`).

**Niet doen**
- Alle metingen in één aparte tabel.
- Ongeteste metingen.
- `dataType` zetten op een meting; dat volgt uit de DAX.
- Dubbele metingen (dezelfde DAX-expressie twee keer).
- Metingen die alleen naar een andere meting verwijzen (`[Meting B] := [Meting A]`).

### Opmaakcodes (formatString)

| Soort | formatString | Voorbeeld |
|---|---|---|
| Valuta | `"$#,##0.00"` | $1,234.56 |
| Percentage | `"0.00%"` | 45.67% |
| Geheel getal | `"#,##0"` | 1,234 |
| Decimaal | `"#,##0.00"` | 1,234.56 |
| Duizendtallen | `"#,##0,K"` | 1,234K |
| Miljoenen | `"#,##0,,M"` | 1.23M |
| Zonder scheidingsteken | `"0"` | 1234 |
| Eén decimaal | `"#,##0.0"` | 1,234.5 |

Tekens: `#` = optioneel cijfer, `0` = verplicht cijfer, `,` = duizendtalscheiding, `.` = decimaalteken, `%` = vermenigvuldigt met 100.

Voor euro's kun je dezelfde opbouw met een euroteken gebruiken, bijv. `"€ #,##0.00"` (aanpassing op de bron, die alleen `$` toont).

**Elke zichtbare meting moet een `formatString` hebben.**

## Relaties

**Doen**
- Relaties vóór metingen maken (metingen kunnen erop steunen).
- Standaard één richting: `CrossFilteringBehavior = "OneDirection"`.
- Gehele sleutels boven tekstsleutels.
- Aan beide kanten hetzelfde `dataType`.
- Vreemde sleutels aan de veel-kant verbergen.

**Niet doen**
- Samengestelde sleutels: worden niet ondersteund. (Bijv. artikel + magazijn: maak één sleutel in de bron of Power Query.)
- Surrogaatsleutels op feittabellen (geheugenverspilling).
- Bidirectioneel filteren tenzij strikt nodig (ambiguïteit, prestaties). Bij many-to-many: controleer dat het één richting is.
- Many-to-many tenzij nodig. Houd bidirectioneel + many-to-many onder 30% van alle relaties.
- Inactieve relaties die door geen enkele meting met `USERELATIONSHIP` worden geactiveerd.
- `USERELATIONSHIP` tegen een tabel die ook RLS heeft (geeft fouten).
- Meerdere feittabellen via verschillende sleutelkolommen aan dezelfde dimensie zonder gedeelde (conformed) dimensie: een slicer op het ene feit filtert dan het andere niet.
- `isKey = true` zetten op de primaire sleutel van dimensietabellen.

> **Warehousevoorbeeld.** Orderregels hebben vaak een orderdatum, een gevraagde leverdatum en een werkelijke leverdatum. Maak één actieve relatie (bijv. orderdatum → `'Datum'[Datum]`) en inactieve relaties voor de andere datums, en activeer die in specifieke metingen met `USERELATIONSHIP`.

## Datumtabel

Nodig voor time intelligence (vorig jaar, year-to-date).

**Doen**
- Gebruik een bestaande datumtabel uit de bron (voorkeur), via Power Query/M in plaats van DAX.
- Alleen een DAX-datumtabel als er geen brontabel is.
- Aaneengesloten datumbereik (geen gaten).
- `dataCategory` = "Time" op de datumtabel.
- Basisattributen: jaar, kwartaal, maand, dag, week (optioneel dag van de week, maandnaam).
- `sortByColumn` voor tekstattributen zoals maandnaam (sorteren op maandnummer).
- Schakel automatische datumtabellen (auto date/time) uit als er een echte datumtabel is. Auto date/time maakt verborgen `LocalDateTable_*`-tabellen per datumkolom.

**Niet doen**
- Een eigen datumtabel maken als de bron er al een heeft.
- Maandnamen ongesorteerd laten (dan april, augustus, ...).

## Hiërarchieën

- Maak hiërarchieën voor gangbare drill-downpaden (Jaar > Kwartaal > Maand > Dag; Magazijn > Zone > Locatie).
- Elk niveau verwijst naar een bestaande kolom in dezelfde tabel; niveaunamen mogen afwijken van kolomnamen.
- Geen hiërarchie met één niveau; geen kolommen uit andere tabellen.

## Row-Level Security (RLS)

- Houd RLS-filterexpressies eenvoudig; complexe logica naar de bron.
- Enkele filterrichting op beveiligingstabellen.
- Test RLS-filters op juiste resultaten.
- Geen tekstfuncties (`RIGHT`, `LEFT`, `UPPER`, `LOWER`, `FIND`) in RLS-expressies; verplaats dat naar de bron.
- Rolleden beheren doe je in de Power BI-portal, niet via deze skill.

## Beschrijvingen en documentatie

- `description` op alle zichtbare tabellen, kolommen en metingen. Maak impliciete kennis expliciet; herhaal niet alleen de naam.
- Bij metingen met niet-voor-de-hand-liggende logica: de bedrijfsregel en wanneer je deze meting gebruikt in plaats van een vergelijkbare.
- Fout: `Total Sales` beschreven als "The total sales".

## Calculation groups

- Gebruik ze voor time-intelligencevarianten (YTD, LY, ...) om een explosie aan metingen te voorkomen.
- Minstens één calculation item; duidelijke namen (`Current`, `YTD`, `PY`, `PY YTD`).
- Niet gebruiken als een paar eenvoudige metingvarianten volstaan.

## Prestaties

**Doen**
- Sterschema boven sneeuwvlok; geen relaties tussen dimensies onderling.
- `Int64`-sleutels voor relaties.
- Weinig berekende kolommen; meer dan 5 is een reden voor review. Gebruiken ze `RELATED()`, verplaats de logica dan naar de bron.
- `isAvailableInMdx = false` op verborgen kolommen die niet voor sortering, hiërarchie of variaties dienen.
- DirectQuery: voorzichtig met time-intelligencefuncties (bekende prestatieproblemen); overweeg voorberekening in de bron. Met Power BI Premium: overweeg aggregatietabellen.
- Gedraaide (gepivoteerde) data, zoals maandkolommen jan/feb/mrt, unpivoteren naar rijen.

**Niet doen**
- `Double`; auto date/time aan laten met een echte datumtabel; onnodige bidirectionele of many-to-many-relaties; kolommen die niet nodig zijn.

## Onderhoud

- Verwijder verborgen kolommen die nergens gebruikt worden (DAX, relatie, hiërarchie, sort-by, RLS).
- Verwijder verborgen metingen waar geen DAX naar verwijst.
- Verwijder inactieve relaties zonder `USERELATIONSHIP`.
- Verwijder ongebruikte gegevensbronnen en lege perspectives.
- Herstel referentiële-integriteitsfouten (sleutels in feiten die niet in de dimensie staan), bijv. artikelnummers in orderregels die niet in de artikeltabel voorkomen.

## Parameters

Modelparameters centraliseren de bronlocatie (server, database, opslagaccount, SharePoint-site) en maken CI/CD mogelijk zonder elke tabel-M aan te passen.

- Een parameter is een named expression waarnaar M-code verwijst.
- Pas bestaande modellen niet om naar parameters tenzij je daarom vraagt.

```tmdl
expression Server = "Server01" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]
expression Database = "Server01" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

ref table TableName

		partition PartitionName = m
			mode: import
			source =
					let
					    Source = Sql.Database(#"Server", #"Database")
                        ...
```

---

## Direct Lake

Voor modellen op Fabric OneLake (Lakehouse). De gewone regels hierboven gelden ook.

- Maak vóór elke Direct Lake-tabel een named expression naar de OneLake-bron, met de connector `AzureStorage.DataLake`. Gebruik `Sql.Database` alleen als daar expliciet om gevraagd wordt.
- **Alle** Direct Lake-partities zijn `EntityPartitionSource` naar een entiteit in OneLake en gebruiken die gedeelde expression via `expressionSource`. Geen Power Query in entity-tabellen.
- Kolommen met `dataType` `binary` worden niet ondersteund; laat ze weg.
- Tabellen declareer je nog steeds, met `sourceColumn` direct naar de kolommen van de OneLake-tabel.

### Werkwijze

1. Named expression maken met `AzureStorage.DataLake`.
2. Het schema van de OneLake-tabellen analyseren.
3. Tabellen maken met kolommen en types gelijk aan de OneLake-tabellen en een `EntityPartitionSource`-partitie.
4. Is er een ontwikkelworkspace, deploy daar eerst om te testen.

### Partitie-instellingen

| Eigenschap | Waarde | Toelichting |
|---|---|---|
| Brontype | `EntityPartitionSource` | Niet `MPartitionSource` (geen M) |
| Mode | `DirectLake` | Verplicht |
| entityName | String | Tabelnaam in de bron |
| schemaName | String (optioneel) | Schemanaam, als de bron die kent |
| expressionSource | String | Verwijzing naar de gedeelde named expression |

Named expression (naam: `DirectLake - [Model Name]`):

```powerquery
let
    Source = AzureStorage.DataLake("https://onelake.dfs.fabric.microsoft.com/[WORKSPACE_ID]/[LAKEHOUSE_ID]", [HierarchicalNavigation=true])
in
    Source
```

TMDL-voorbeeld:

```tmdl
expression 'DL_Sales_Named_Expression' =
		let
		    Source = AzureStorage.DataLake("https://onelake.dfs.fabric.microsoft.com/[WORKSPACE_ID]/[LAKEHOUSE_ID]", [HierarchicalNavigation=true])
		in
		    Source

table Product

	column 'Product Key'
		dataType: int64
		formatString: 0
		sourceColumn: product_key

	column Product
		dataType: string
		sourceColumn: product

	column Category
		dataType: string
		summarizeBy: none
		sourceColumn: category

	partition partition_name = entity
		mode: directLake
		source
			entityName: Product
			schemaName: dbo
			expressionSource: DL_Sales_Named_Expression
```
