# PBIR-structuur, binding en expressies

Hoe een PBIP-rapport op schijf is opgebouwd, hoe je pagina's en visuals toevoegt, hoe het rapport aan een model hangt en hoe je velden in een visual bindt.

## Inhoud

- [Mappen en bestanden](#mappen-en-bestanden)
- [Schema's](#schemas)
- [ID's genereren](#ids-genereren)
- [Pagina toevoegen](#pagina-toevoegen)
- [Visual toevoegen](#visual-toevoegen)
- [Koppeling met het model (definition.pbir)](#koppeling-met-het-model-definitionpbir)
- [Veldexpressies](#veldexpressies)
- [Projecties en sortering](#projecties-en-sortering)
- [Drillthrough-pagina](#drillthrough-pagina)
- [Visualinteracties](#visualinteracties)

## Mappen en bestanden

```text
<Rapport>.pbip
├── <Rapport>.Report/
│   ├── .platform
│   ├── definition.pbir
│   ├── definition/
│   │   ├── version.json
│   │   ├── report.json
│   │   ├── bookmarks/                    # optioneel
│   │   └── pages/
│   │       ├── pages.json
│   │       └── <pageId>/
│   │           ├── page.json
│   │           └── visuals/<visualId>/
│   │               ├── visual.json
│   │               └── mobile.json       # optioneel (mobiele indeling)
│   └── StaticResources/
│       ├── SharedResources/BaseThemes/   # ingebouwde basisthema's
│       └── RegisteredResources/          # eigen thema-JSON, afbeeldingen
└── <Rapport>.SemanticModel/              # niet in deze skill
```

| Bestand | Doel | Regel |
|---|---|---|
| `.platform` | Fabric-itemmetadata | Bij de `.Report`-map houden |
| `definition.pbir` | Koppeling rapport → model (`byPath` of `byConnection`) | Zie [koppeling](#koppeling-met-het-model-definitionpbir) |
| `version.json` | PBIR-formaatversie | Volledig laten staan, inclusief `$schema` |
| `report.json` | Thema's, instellingen, resources, rapportfilters | Wijzigen volgens [opmaak-en-thema.md](opmaak-en-thema.md) |
| `pages.json` | Paginavolgorde en actieve pagina | Elke nieuwe pagina in `pageOrder`; `activePageName` behouden |
| `page.json` | Paginanaam, grootte, filters | Afmetingen niet wijzigen zonder akkoord |
| `visual.json` | Type, positie, query, opmaak | Rollen en opmaak per type controleren |
| `localSettings.json` | Gebruikersinstellingen | Niet committen, niet op vertrouwen |

**Nieuw rapport:** schrijf de projectschil (`.pbip`, `.platform`, `definition.pbir`, `version.json`, `report.json`, `pages.json`, eerste `page.json`) niet uit het hoofd. Maak het lege rapport in Power BI Desktop en sla het op als PBIP; bouw daarna verder in de bestanden. (Het origineel gebruikt hiervoor `powerbi-report-author scaffold`; die kun je zelf draaien als je de CLI hebt.)

| Desktop-fout | Oorzaak |
|---|---|
| `UnrecognizedSchemaVersion` | Verkeerde schemafamilie, bijv. een `.pbip` met een `item/report/...`-URL |
| *"This version of Power BI does not support the version you have provided in `<file>`"* | Juiste familie, maar versienummer te nieuw voor jouw Desktop |

## Schema's

Elk bestandstype heeft een eigen schemafamilie onder `https://developer.microsoft.com/json-schemas/fabric/`:

| Bestand | Familie | Voorbeeld (versies veranderen per Desktop-release) |
|---|---|---|
| `<Rapport>.pbip` | `pbip/pbipProperties` | `pbip/pbipProperties/1.0.0/schema.json` |
| `definition.pbir` | `item/report/definitionProperties` | `.../definitionProperties/2.0.0/schema.json` |
| `version.json` | `item/report/definition/versionMetadata` | `.../versionMetadata/1.0.0/schema.json` |
| `pages.json` | `item/report/definition/pagesMetadata` | `.../pagesMetadata/1.1.0/schema.json` |
| `page.json` | `item/report/definition/page` | `.../page/2.1.0/schema.json` |
| `report.json` | `item/report/definition/report` | `.../report/3.3.0/schema.json` |
| `visual.json` | `item/report/definition/visualContainer` | `.../visualContainer/2.9.0/schema.json` |
| bladwijzer | `item/report/definition/bookmark` | `.../bookmark/2.1.0/schema.json` |
| `bookmarks.json` | `item/report/definition/bookmarksMetadata` | `.../bookmarksMetadata/1.0.0/schema.json` |

Regel: **bestaande `$schema` behouden; bij een nieuw bestand de URL kopiëren van een bestaand bestand van hetzelfde type in hetzelfde rapport.** Niet zelf ophogen.

Vaste inhoudsversies: `version.json` → `"version": "2.0.0"`; `definition.pbir` → `"version": "4.0"`.

## ID's genereren

| Element | Formaat | Uniek binnen |
|---|---|---|
| Visual `name` | 20 kleine hex-tekens, bijv. `f4214b297bb2c1e49dfe` | De pagina |
| Pagina `name` | Modern: 20 hex-tekens. Traditioneel: `ReportSection` + 24 hex | Het rapport |
| Filter `name` | `Filter` + 24 hex-tekens | Het hele rapport |

```powershell
# PowerShell: 20 hex-tekens voor een visual
-join ((1..10) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

```javascript
// Node.js
const crypto = require('crypto');
const visualId = crypto.randomBytes(10).toString('hex');
const pageId   = 'ReportSection' + crypto.randomBytes(12).toString('hex');
const filterId = 'Filter' + crypto.randomBytes(12).toString('hex');
```

De mapnaam van een pagina/visual is gelijk aan zijn `name`.

## Pagina toevoegen

1. Genereer een paginanaam.
2. Maak `definition/pages/<pageName>/` en daarin een (eventueel lege) map `visuals/`.
3. Schrijf `page.json` (`$schema` kopiëren van een bestaande pagina):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json",
  "name": "<pageName>",
  "displayName": "Voorraad per locatie",
  "displayOption": "FitToPage",
  "height": 720,
  "width": 1280
}
```

4. Voeg `<pageName>` toe aan `pages.json` → `pageOrder` op de gewenste plek.
5. Open het rapport in Desktop en controleer dat de pagina verschijnt.

## Visual toevoegen

1. Genereer een visualnaam.
2. Maak `definition/pages/<pageName>/visuals/<visualName>/visual.json`.
3. Vul het sjabloon in (per type: [visuals.md](visuals.md)):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<visualName>",
  "position": { "x": 0, "y": 0, "z": 1000, "height": 300, "width": 400, "tabOrder": 1000 },
  "visual": {
    "visualType": "<type>",
    "query": {
      "queryState": {
        "<RoleName>": {
          "projections": [
            {
              "field": { },
              "queryRef": "<Entity>.<Property>",
              "nativeQueryRef": "<Property>"
            }
          ]
        }
      }
    }
  }
}
```

- Alle rollen (`Values`, `Rows`, `Category`, `Y`, `Data`, …) **binnen** `queryState`.
- `z`: stapelvolgorde; per visual met 1000 ophogen. `tabOrder` volgt meestal `z` (volgorde voor toetsenbord: zie `pbip-accessibility`).
- Binnen het canvas blijven: `x + width ≤ paginabreedte`, `y + height ≤ paginahoogte`. Getallen ongequote.

## Koppeling met het model (definition.pbir)

Drie vormen, **niet uitwisselbaar**. De verkeerde vorm is de meest voorkomende oorzaak van een verbindingsfout in Desktop.

| Situatie | Vorm | Waarde |
|---|---|---|
| Lokaal PBIP met model ernaast (`../X.SemanticModel`) | `byPath` | `"path": "../<Project>.SemanticModel"` |
| Lokaal PBIP live gekoppeld aan een model in een werkruimte, geopend in Desktop | `byConnection` (volledig) | `Data Source=powerbi://api.powerbi.com/v1.0/myorg/<WorkspaceName>;Initial Catalog=<ModelName>;Integrated Security=ClaimsToken;semanticModelId=<ModelGuid>` |
| Publiceren via de Fabric REST API | `byConnection` (API) | `semanticmodelid=<SemanticModelId>` |

**byPath**

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": {
    "byPath": { "path": "../<Project>.SemanticModel" }
  }
}
```

Pad is relatief vanaf de `.Report`-map. Zet niet ook `"byConnection": null` erbij.

**byConnection (live, voor Desktop)**

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": {
    "byConnection": {
      "connectionString": "Data Source=powerbi://api.powerbi.com/v1.0/myorg/<WorkspaceName>;Initial Catalog=<ModelName>;Integrated Security=ClaimsToken;semanticModelId=<ModelGuid>"
    }
  }
}
```

Drie waarden van het model (werkruimtenaam, modelnaam, model-GUID; opzoeken via `fabric-basis`) + de vaste tekst `Integrated Security=ClaimsToken`. Geen andere eigenschappen naast `connectionString`.

**byConnection (alleen voor API-publicatie)** — opent níet in Desktop:

```json
{
  "datasetReference": {
    "byConnection": { "connectionString": "semanticmodelid=<SemanticModelId>" }
  }
}
```

`$schema` in `definition.pbir` laat je staan zoals hij is; een andere koppeling vraagt nooit om een ander schema.

| Melding in Desktop | Oorzaak | Oplossing |
|---|---|---|
| Schemafout over extra eigenschap (bijv. `pbiServiceModelId`) | `byConnection` heeft meer dan `connectionString` | Alleen `connectionString` laten staan |
| `missing required 'semanticModelId' parameter` | Server aanwezig, model-ID ontbreekt | `;semanticModelId=<ModelGuid>` toevoegen (volledige vorm) |
| `Non-empty assertion failure: serverName` | Model-ID aanwezig, server ontbreekt | `Data Source=powerbi://…/myorg/<Workspace>;Initial Catalog=<Model>` ervoor zetten |

De meldingen komen na elkaar: elke reparatie kan de volgende tonen. Voor lokaal live werken is het antwoord altijd de volledige vorm.

## Veldexpressies

Alle veldverwijzingen in `queryState`, `filterConfig` en `sortDefinition` gebruiken dezelfde boomstructuur.

**Kolom**

```json
{ "Column": { "Expression": { "SourceRef": { "Entity": "<Tabel>" } }, "Property": "<Kolom>" } }
```

**Measure**

```json
{ "Measure": { "Expression": { "SourceRef": { "Entity": "<Tabel>" } }, "Property": "<Measure>" } }
```

**Aggregatie van een kolom**

```json
{
  "Aggregation": {
    "Expression": { "Column": { "Expression": { "SourceRef": { "Entity": "<Tabel>" } }, "Property": "<Kolom>" } },
    "Function": 0
  }
}
```

`Function`: `0` Sum, `1` Avg, `2` Count, `3` Min, `4` Max, `5` CountNonNull, `6` Median, `7` StdDev, `8` Var.

**Hiërarchieniveau**

```json
{
  "HierarchyLevel": {
    "Expression": { "Hierarchy": { "Expression": { "SourceRef": { "Entity": "<Tabel>" } }, "Hierarchy": "<Hiërarchie>" } },
    "Level": "<Niveau>"
  }
}
```

**Visuele berekening** (DAX alleen binnen deze visual; zelfde rol als de invoer):

```json
{
  "field": { "NativeVisualCalculation": { "Language": "dax", "Expression": "RUNNINGSUM([Picked Lines])", "Name": "Cumulatief" } },
  "queryRef": "select",
  "nativeQueryRef": "Cumulatief"
}
```

Functies o.a. `RUNNINGSUM()`, `MOVINGAVERAGE()`, `PREVIOUS()`, `NEXT()`, `FIRST()`, `LAST()`, `RANGE()`, `EXPAND()`, `COLLAPSE()`. Alleen velden die al in dezelfde visual staan; geen `RELATED`/`RELATEDTABLE`/`USERELATIONSHIP`; `Name` = `nativeQueryRef`.

**Inline DAX (`NativeMeasure`)** — bijv. dynamische titeltekst; een model-measure is meestal veiliger:

```json
{ "NativeMeasure": { "Language": "dax", "Expression": "\"Orders op \" & FORMAT(TODAY(), \"dd-mm\")", "DataType": 1, "ProposedName": "Dynamic Title" } }
```

**Vergelijking** (voor filters en regels): `ComparisonKind` `0` =, `1` >, `2` >=, `3` <, `4` <=. "Niet gelijk" = `Not` rond `ComparisonKind: 0`.

```json
{ "Comparison": { "ComparisonKind": 0, "Left": { }, "Right": { "Literal": { "Value": "'Open'" } } } }
```

`Literal`-waarden: tekst `"'Open'"`, leeg `"null"`, lege tekst `"''"`, getallen met `D`/`L`. `Contains`/`StartsWith` alleen voor tekst; `In` voor lijsten (zie [filters-en-slicers.md](filters-en-slicers.md)).

## Projecties en sortering

```json
{
  "field": { },
  "queryRef": "<Entity>.<Property>",
  "nativeQueryRef": "<Property>",
  "active": true
}
```

| Veld | Regel |
|---|---|
| `queryRef` | Uniek per visual. `Tabel.Veld`; bij aggregatie `Sum(Tabel.Kolom)` |
| `nativeQueryRef` | Meestal de veldnaam; bij aggregatie `"Sum of <Kolom>"`; dubbel in meerdere rollen → nummer erachter (`Orders1`) |
| `active` | Alleen voor drill-hiërarchieën in staaf/lijn-`Category`. **Nooit** op `tableEx`/`pivotTable` (kolommen verdwijnen) |
| `displayName` | Optioneel: leesbare naam i.p.v. de modelnaam |

**Sortering** staat in `visual.query.sortDefinition` (naast `queryState`):

```json
"sortDefinition": {
  "sort": [ { "field": { "Measure": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Open Orders" } }, "direction": "Descending" } ],
  "isDefaultSort": false
}
```

- `isDefaultSort: false` = expliciete gebruikerskeuze; Power BI overschrijft die niet.
- Tekstcategorieën (maandnamen) sorteren altijd alfabetisch; chronologisch = datum- of maandnummerkolom op de as, of een sorteerkolom in het model (`sortByColumn`, via `fabric-semantic-model`). PBIR kan die niet maken.

## Drillthrough-pagina

In `page.json` van de doelpagina: een filter met `"howCreated": "Drillthrough"` plus een `pageBinding` die ernaar verwijst.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json",
  "name": "<pageName>",
  "displayName": "Orderdetail",
  "displayOption": "FitToPage",
  "height": 720,
  "width": 1280,
  "filterConfig": {
    "filters": [
      {
        "name": "Filter<24hex>",
        "field": { "Column": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Order Number" } },
        "type": "Categorical",
        "howCreated": "Drillthrough"
      }
    ]
  },
  "pageBinding": {
    "name": "Pod",
    "type": "Drillthrough",
    "parameters": [
      {
        "name": "Param_Filter<24hex>",
        "boundFilter": "Filter<24hex>",
        "fieldExpr": { "Column": { "Expression": { "SourceRef": { "Entity": "Orders" } }, "Property": "Order Number" } }
      }
    ]
  }
}
```

*(voorbeeld: tabel `Orders`, kolom `Order Number`)*

Stappen:

1. Kies het drillthrough-veld en zorg dat de bronvisual dat veld bevat.
2. Maak de doelpagina met filter (`howCreated: "Drillthrough"`) en `pageBinding.type: "Drillthrough"` (of `"Tooltip"` voor een tooltip-pagina); `boundFilter` = filternaam, `fieldExpr` = hetzelfde veld.
3. Zet een **Terug-knop** op de doelpagina ([knoppen-en-bladwijzers.md](knoppen-en-bladwijzers.md#terugknop)).
4. Open in Desktop, selecteer een datapunt met het veld, ga naar de doelpagina, controleer de filtercontext en de Terug-knop.

Een drillthrough-knop wordt pas actief als een geselecteerd datapunt het drillthrough-veld bevat; een slicerselectie alleen is niet genoeg.

## Visualinteracties

Standaard filteren visuals elkaar. Alleen afwijkingen leg je vast in `page.json`:

```json
{
  "visualInteractions": [
    { "source": "<bronVisualName>", "target": "<doelVisualName>", "type": "NoFilter" }
  ]
}
```

| `type` | Effect |
|---|---|
| `NoFilter` | Bron filtert doel niet |
| `DataFilter` | Bron filtert doel (subset) |
| `HighlightFilter` | Bron markeert overeenkomende data in doel |
