# Metadata ontdekken met DAX `INFO`-functies

Alleen-lezen DAX-query's om de metadata van een model te verkennen met de `INFO.VIEW.*`- en `INFO.*`-rowsets. Uitvoeren kan in DAX Studio, in DAX query view van Power BI Desktop of via `executeQueries` (zie [rest-api.md](rest-api.md#dax-query-uitvoeren)).

## Volgorde

1. Schat de omvang met de [telquery](#omvang-schatten) (aantal tabellen, kolommen, metingen, relaties).
2. Begin met `INFO.VIEW.TABLES()` voor een snel tabeloverzicht.
3. Ga verder met `INFO.VIEW.COLUMNS()` en `INFO.VIEW.MEASURES()` voor de details.
4. Gebruik `INFO.VIEW.RELATIONSHIPS()` om koppelingen en filterrichting te controleren.
5. Gebruik de diepere `INFO.*`-functies alleen als een object niet door `INFO.VIEW.*` wordt gedekt.

## Welk object, welke functie

| Metadata-object | `INFO`-functies |
|---|---|
| Model | `INFO.MODEL` |
| Tabellen | `INFO.VIEW.TABLES` |
| Kolommen | `INFO.VIEW.COLUMNS`, `INFO.GROUPBYCOLUMNS`, `INFO.RELATEDCOLUMNDETAILS` |
| Metingen | `INFO.VIEW.MEASURES`, `INFO.FORMATSTRINGDEFINITIONS`, `INFO.DETAILROWSDEFINITIONS` |
| Relaties | `INFO.VIEW.RELATIONSHIPS` |
| Partities | `INFO.PARTITIONS`, `INFO.EXPRESSIONS`, `INFO.QUERYGROUPS`, `INFO.REFRESHPOLICIES`, `INFO.DATACOVERAGEDEFINITIONS` |
| Expressions/parameters | `INFO.EXPRESSIONS` |
| Beveiligingsrollen en -rechten | `INFO.ROLES`, `INFO.TABLEPERMISSIONS`, `INFO.COLUMNPERMISSIONS` |
| Hiërarchieën | `INFO.HIERARCHIES`, `INFO.LEVELS`, `INFO.ATTRIBUTEHIERARCHIES`, `INFO.VARIATIONS` |
| Calculation groups/items | `INFO.CALCULATIONGROUPS`, `INFO.CALCULATIONITEMS` |
| Perspectives | `INFO.PERSPECTIVES`, `INFO.PERSPECTIVETABLES`, `INFO.PERSPECTIVECOLUMNS`, `INFO.PERSPECTIVEHIERARCHIES`, `INFO.PERSPECTIVEMEASURES` |
| Calendars | `INFO.CALENDARS`, `INFO.CALENDARCOLUMNGROUPS`, `INFO.CALENDARCOLUMNREFERENCES` |
| Cultures | `INFO.CULTURES` |
| Vertalingen van objecten | `INFO.OBJECTTRANSLATIONS` |
| Functies (UDF's) | `INFO.USERDEFINEDFUNCTIONS` |
| Afhankelijkheden / lineage | `INFO.DEPENDENCIES`, `INFO.CHANGEDPROPERTIES`, `INFO.EXCLUDEDARTIFACTS` |
| Opslag / grootte | `INFO.STORAGETABLES`, `INFO.STORAGETABLECOLUMNS`, `INFO.STORAGETABLECOLUMNSEGMENTS`, `INFO.COLUMNSTORAGES`, `INFO.PARTITIONSTORAGES`, `INFO.TABLESTORAGES` |

## Omvang schatten

```dax
// Aantallen objecten tellen vóór je dieper zoekt
EVALUATE
ROW(
    "TableCount", COUNTROWS(INFO.VIEW.TABLES()),
    "ColumnCount", COUNTROWS(INFO.VIEW.COLUMNS()),
    "MeasureCount", COUNTROWS(INFO.VIEW.MEASURES()),
    "RelationshipCount", COUNTROWS(INFO.VIEW.RELATIONSHIPS())
)
```

## Resultaten beperken (projectie en filter)

Haal alleen de kolommen en rijen op die je nodig hebt.

```dax
// Voorbeeld: alleen naam en datatype van de kolommen van één tabel
EVALUATE
SELECTCOLUMNS(
    FILTER(INFO.VIEW.COLUMNS(), [Table] = "Orderregels"),
    "Column Alias", [Name],
    "DataType", [DataType]
)
```

## Sorteren

`ORDER BY` verwijst naar de kolomnaam **zoals die in de uitvoer van de query staat**, niet naar de oorspronkelijke `INFO`-kolom:

| Query | `ORDER BY` op |
|---|---|
| Zonder `SELECTCOLUMNS` | De oorspronkelijke kolomnaam van de `INFO`-functie (bijv. `ORDER BY [Name]` op `INFO.VIEW.TABLES()`) |
| Met `SELECTCOLUMNS` | **De alias** die je in de projectie gaf; de oorspronkelijke naam bestaat dan niet meer in het resultaat |

```dax
// GOED: sorteren op de alias uit SELECTCOLUMNS
EVALUATE
SELECTCOLUMNS(
    FILTER(INFO.VIEW.COLUMNS(), [Table] = "YourTableName"),
    "Column Alias", [Name],
    "DataType", [DataType]
)
ORDER BY [Column Alias] ASC

// FOUT: [Name] bestaat niet in het geprojecteerde resultaat (hernoemd naar "Column Alias")
EVALUATE
SELECTCOLUMNS(
    FILTER(INFO.VIEW.COLUMNS(), [Table] = "YourTableName"),
    "Column Alias", [Name],
    "DataType", [DataType]
)
ORDER BY [Name] ASC
```

## Afhankelijkheden

### Afhankelijkheden van een DAX-query

```dax
// Geeft de afhankelijkheidsgraaf van de query-tekst
DEFINE
VAR _Query = "EVALUATE SUMMARIZECOLUMNS('Date'[Year], 'Product'[Color], ""Sales"", [Sales])"
EVALUATE
INFO.DEPENDENCIES("QUERY", _Query)
```

### Waar hangt een meting van af?

```dax
// Pas de namen aan op je eigen model
EVALUATE
FILTER(
    INFO.DEPENDENCIES(),
    [OBJECT_TYPE] = "MEASURE"
        && [TABLE] = "Sales"
        && [OBJECT] = "Total Sales"
)
```

### Wat verwijst naar een meting? (omgekeerd)

```dax
// Werkt als je engine deze afhankelijkheidskolommen toont
EVALUATE
FILTER(
    INFO.DEPENDENCIES(),
    [REFERENCED_OBJECT_TYPE] = "MEASURE"
        && [REFERENCED_TABLE] = "Sales"
        && [REFERENCED_OBJECT] = "Total Sales"
)
```

> De kolomnamen van de afhankelijkheids-rowset kunnen per engine/versie verschillen. Controleer de beschikbare velden eerst met een ongefilterde of `TOPN(0, ...)`-query.

## Overige query's

```dax
// Uitgebreide modelmetadata
EVALUATE
INFO.MODEL()
```

```dax
// Partitie van een tabel (vervang 123 door het ID van de tabel)
EVALUATE
FILTER(INFO.PARTITIONS(), [TableID] == 123)
```

```dax
// Uitvoerschema van een INFO-functie: kolomnamen en -types, nul rijen
EVALUATE
TOPN(0, INFO.VIEW.COLUMNS())
```

```dax
// Vertalingen van objecten
EVALUATE
INFO.OBJECTTRANSLATIONS()
```

## Alle `INFO`-functies opsommen

> Alleen gebruiken als het object niet via de gangbare functies hierboven te vinden is.

```dax
EVALUATE
SELECTCOLUMNS(
    FILTER(
        INFO.FUNCTIONS(),
        LEFT([FUNCTION_NAME], 5) = "INFO."
    ),
    [FUNCTION_NAME]
)
```

## Probleemoplossing

| Probleem | Oorzaak | Oplossing |
|---|---|---|
| Geavanceerde `INFO.*`-functies geven een rechtenfout | Veel `INFO.*`-functies vragen meer dan gewone leesrechten op het model | Begin met de `INFO.VIEW.*`-functies |
| Te veel uitvoer om gericht te analyseren | Onbeperkte `INFO.VIEW.*`/`INFO.*`-query's geven veel objecten en eigenschappen | Eerst [omvang schatten](#omvang-schatten) en het uitvoerschema bekijken (`TOPN(0, ...)`), dan [beperken](#resultaten-beperken-projectie-en-filter) |
| `INFO.ROLEMEMBERSHIPS()` leeg of onvolledig | Rolleden worden na deployen op serviceniveau (Entra ID) toegewezen, niet in de modeldefinitie | Gebruik `INFO` niet voor rollidmaatschap; zie [Manage role membership](https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security#manage-role-membership) |
