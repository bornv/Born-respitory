# Power BI Project (PBIP)

Een PBIP-project is de "code achter" een Power BI-ontwikkeling: een semantisch model plus rapport, of alleen een rapport (live verbonden met een model in een workspace). Je krijgt het door een `.pbix` in Power BI Desktop op te slaan als Power BI Project.

## Mappenstructuur

**Met semantisch model en rapport:**

```text
PBIPFolder/
├── [Name].SemanticModel/
|   ├── /definition         # Het model in TMDL [VERPLICHT]
|   ├── definition.pbism    # Definitiebestand van het model [VERPLICHT]
|   ├── *                   # Overige metadata
├── [Name].Report/
|   ├── /definition         # Het rapport in PBIR-formaat
|   ├── definition.pbir     # Rapportdefinitie met byPath-verwijzing naar de modelmap [VERPLICHT]
|   ├── *                   # Overige metadata
└── [Name].pbip             # Snelkoppeling naar de rapportmap
```

**Alleen rapport:**

```text
PBIPFolder/
├── [Name].Report/
|   ├── /definition
|   ├── definition.pbir     # Met byConnection-verwijzing naar een model in een workspace [VERPLICHT]
|   ├── *
└── [Name].pbip
```

Voor het modelwerk heb je alleen `[Name].SemanticModel/definition/` nodig (de TMDL). Het rapportdeel (PBIR, visuals) valt onder de skill **fabric-powerbi-report**.

## definition.pbism

Geen aanpassingen nodig; maak het precies zo aan:

```json
{
    "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json",
    "version": "4.2",
    "settings": {
        "qnaEnabled": true
    }
}
```

Schema: [definitionProperties 1.0.0](https://github.com/microsoft/json-schemas/blob/main/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json).

## definition.pbir

Algemene rapportdefinitie en de verwijzing naar het semantisch model. Door dit bestand aan te passen kun je het rapport aan een ander model koppelen. Power BI Desktop kan dit bestand openen.

Naar een lokale modelmap:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": {
    "byPath": {
      "path": "../Sales.SemanticModel"
    }
  }
}
```

Naar een model in een workspace:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": {
    "byConnection": {
      "connectionString": "semanticmodelid=[SemanticModelId]"
    }
  }
}
```

- Gebruik forward slashes in `byPath`; alleen relatieve paden worden ondersteund.
- Met `byConnection` opent Desktop het model **niet** in bewerkmodus.

Schema: [report definitionProperties 2.0.0](https://github.com/microsoft/json-schemas/blob/main/fabric/item/report/definitionProperties/2.0.0/schema.json).

## .pbip-bestand

Snelkoppeling naar het rapport:

```json
{
    "$schema": "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json",
    "version": "1.0",
    "artifacts": [
        {
          "report": {
              "path": "{Name of the Semantic Model}.Report"
          }
        }
    ],
    "settings": {
        "enableAutoRecovery": true
    }
}
```

Schema: [pbipProperties 1.0.0](https://github.com/microsoft/json-schemas/blob/main/fabric/pbip/pbipProperties/1.0.0/schema.json).

## Structuur controleren

- [ ] `<Naam>.SemanticModel/definition/` bevat minimaal `database.tmdl`, `model.tmdl` en tabelbestanden in `tables/`.
- [ ] `<Naam>.SemanticModel/definition.pbism` bestaat.
- [ ] `<Naam>.Report/definition.pbir` verwijst met `byPath` naar `../<Naam>.SemanticModel`.
- [ ] `<Naam>.pbip` verwijst naar `<Naam>.Report`.
- [ ] `.platform`-bestanden laat je ongemoeid; ze horen niet in een `updateDefinition`-payload (zie [rest-api.md](rest-api.md)).

## Meer informatie

- [PBIP-documentatie](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview)
- [PBIP SemanticModel-map](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-dataset)
- [PBIP Report-map](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-report)
