# Item-definities (getDefinition / updateDefinition)

Detail bij [SKILL.md](../SKILL.md). Bron: `common/ITEM-DEFINITIONS-CORE.md`, `common/COMMON-CORE.md` § Item Creation, `common/COMMON-CLI.md` § Item CRUD Operations en de skill `deployment-pipelines-authoring-cli` (microsoft/skills-for-fabric, MIT).

Een **item-definitie** is de inhoud van een item als set bestanden ("parts"), bijvoorbeeld de TMDL-bestanden van een semantisch model of de PBIR-bestanden van een rapport. Via de API lees je die met `getDefinition` en schrijf je ze met `updateDefinition`.

## Definitie-envelop

Alle definitie-payloads delen dezelfde envelop:

```json
{
  "definition": {
    "format": "<format>",
    "parts": [
      {
        "path": "<filePath>",
        "payload": "<base64-encoded-content>",
        "payloadType": "InlineBase64"
      }
    ]
  }
}
```

- `format`: per itemtype (bijv. `ipynb`, `TMDL`, `PBIR`). De meeste types hebben één standaardformaat (weglaten of `null`). **Uitzondering:** VariableLibrary ondersteunt `format` niet; laat het veld helemaal weg.
- `parts`: lijst van bestanden. Elke part heeft `path` (bestandsnaam/pad), `payload` (Base64-gecodeerde inhoud) en `payloadType` (altijd `InlineBase64`).

### De `.platform`-part

Bevat itemmetadata (type, weergavenaam, beschrijving, logical ID).

- **Altijd meegegeven** door Get Item Definition.
- **Optioneel** bij Create Item with Definition.
- Bij Update Item Definition **alleen verwerkt met `?updateMetadata=true`**. Zonder die parameter wordt de `.platform`-part stil genegeerd.

Referentie: https://learn.microsoft.com/en-us/fabric/cicd/git-integration/source-code-format

## Definitie ophalen

1. Zoek werkruimte- en item-ID op (zie [items-zoeken.md](items-zoeken.md)).
2. Roep `getDefinition` aan. Dit is een **POST** (geen GET) en vereist een lege body, anders krijg je `411`:

   ```bash
   az rest --method post --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$ITEM_ID/getDefinition?format=TMDL" \
     --body '{}' --output json > definition.json
   ```

   - `?format=` hangt af van het itemtype (bijv. `ipynb` voor Notebook, `TMDL` voor SemanticModel). Weglaten bij types met één standaardformaat.
   - In PowerShell geldt `--body '{}'` als korte, vaste body; lukt dat niet, gebruik dan een body-bestand met `{}`.

3. Houd rekening met een **LRO**: voor `Notebook`, `SemanticModel` en `Report` geeft `getDefinition` `202` → pollen → resultaat via `GET /v1/operations/<operationId>/result`. `DataPipeline` geeft direct `200`. Zie [rest-patronen.md](rest-patronen.md).
4. Decodeer de parts. In bash, voor één part:

   ```bash
   jq -r '.definition.parts[] | select(.path=="definition/model.tmdl") | .payload' definition.json | base64 -d
   ```

## Definitie bijwerken

1. Codeer elk bestand als Base64 (bash):

   ```bash
   ENCODED_CONTENT=$(base64 -w 0 < ./notebook.ipynb)
   ```

2. Bouw de body in een bestand:

   ```bash
   cat > /tmp/body.json << EOF
   {
     "definition": {
       "format": "ipynb",
       "parts": [{
         "path": "notebook-content.ipynb",
         "payload": "$ENCODED_CONTENT",
         "payloadType": "InlineBase64"
       }]
     }
   }
   EOF
   ```

3. Stuur hem naar `updateDefinition` (voeg `?updateMetadata=true` toe als je ook `.platform` wilt laten verwerken):

   ```bash
   az rest --method post --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$ITEM_ID/updateDefinition" \
     --body @/tmp/body.json
   ```

4. Krijg je `202`, poll dan de operatie tot `Succeeded`/`Failed`.

Een item **met** definitie aanmaken kan in één keer: `POST /v1/workspaces/<workspaceId>/items` met `displayName`, `type` en een `definition`-blok. Het aanbevolen patroon volgens de bron: eerst het item aanmaken, daarna `updateDefinition`.

> Wijzig je de definitie van een semantisch model of rapport, gebruik dan de skills `fabric-semantic-model` (TMDL/TMSL) of `fabric-powerbi-report` (PBIR) voor de inhoud zelf; voor Dataflows `fabric-dataflows`.

## Ondersteunde itemtypes

Niet elk itemtype ondersteunt definitie-API's. **Warehouse heeft geen item-definitie-API.**

| Itemtype | Formaten | Hoofd-part(s) |
|---|---|---|
| Notebook | `ipynb` (standaard), `FabricGitSource` | `notebook-content.ipynb` of `notebook-content.py`/`.sql`/`.scala`/`.r` |
| DataPipeline | *(standaard)* | `pipeline-content.json` |
| SemanticModel | `TMSL`, `TMDL` (voorkeur) | zie hieronder |
| Report | `PBIR-Legacy`, `PBIR` (voorkeur) | zie hieronder |
| Lakehouse | `LakehouseDefinitionV1` | `lakehouse.metadata.json` |
| SparkJobDefinition | `SparkJobDefinitionV1`, `SparkJobDefinitionV2` | `SparkJobDefinitionV1.json` |
| Environment | *(standaard, `null`)* | `Libraries/...`, `Setting/Sparkcompute.yml` |
| Eventhouse | `JSON` | `EventhouseProperties.json` |
| KQLDatabase | `JSON` | `DatabaseProperties.json`, `DatabaseSchema.kql` |
| VariableLibrary | *(geen `format`-veld)* | `variables.json`, `settings.json`, `valueSets/<name>.json` |
| Dataflow | *(standaard)* | `queryMetadata.json`, `mashup.pq` |
| CopyJob | *(standaard)* | `copyjob-content.json` |
| Eventstream | *(standaard)* | `eventstream.json`, `eventstreamProperties.json` |
| KQLDashboard | *(standaard)* | `RealTimeDashboard.json` |
| KQLQueryset | *(standaard)* | `RealTimeQueryset.json` |
| GraphQLApi | *(standaard)* | `graphql-definition.json` |
| MirroredDatabase | *(standaard)* | `mirroring.json` |
| Reflex | *(standaard)* | `ReflexEntities.json` |

Overige types met definitie-API volgens de bron: DataBuildToolJob, EventSchemaSet, GraphModel, HLSCohort, MirroredAzureDatabricksCatalog, MountedDataFactory, SnowflakeDatabase. Schema-index: https://github.com/microsoft/json-schemas/tree/main/fabric/item · Overzicht: https://learn.microsoft.com/en-us/rest/api/fabric/articles/item-management/definitions/item-definition-overview

### SemanticModel

| Part (TMDL) | Inhoud | Verplicht |
|---|---|---|
| `definition/database.tmdl` | Databasedefinitie | Ja |
| `definition/model.tmdl` | Modeldefinitie | Ja |
| `definition/tables/<TableName>.tmdl` | Per tabel | Ja |
| `definition.pbism` | Verbinding van het semantisch model | Ja |
| `diagramLayout.json` | Diagramindeling | Nee |
| `.platform` | Itemmetadata | Nee |

Bij `TMSL`: `model.bim` (tabular model JSON) + `definition.pbism` verplicht; `diagramLayout.json` en `.platform` optioneel.

### Report

| Part (PBIR) | Inhoud | Verplicht |
|---|---|---|
| `definition/report.json` | Rapportinstellingen | Ja |
| `definition/version.json` | Formaatversie | Ja |
| `definition/pages/pages.json` | Paginalijst | Ja |
| `definition/pages/<pageId>/page.json` | Indeling per pagina | Ja |
| `definition/pages/<pageId>/visuals/<visualId>/visual.json` | Configuratie per visual | Ja |
| `definition.pbir` | Verwijzing naar het semantisch model | Ja |
| `StaticResources/RegisteredResources/*` | Custom visuals, afbeeldingen, thema's | Nee |
| `.platform` | Itemmetadata | Nee |

Bij `PBIR-Legacy`: `report.json` + `definition.pbir` verplicht. **Let op:** `definition.pbir` bevat de modelverwijzing; de Fabric REST API ondersteunt alleen `byConnection`-verwijzingen (niet `byPath`).

### DataPipeline

Gedecodeerde structuur van `pipeline-content.json`:

```json
{
  "properties": {
    "description": "Pipeline description",
    "activities": [
      {
        "name": "ActivityName",
        "type": "TridentNotebook",
        "dependsOn": [],
        "policy": { "timeout": "0.12:00:00", "retry": 0, "retryIntervalInSeconds": 30 },
        "typeProperties": { "notebookId": "<guid>", "workspaceId": "<guid>" }
      }
    ]
  }
}
```

Belangrijke activity-types: `TridentNotebook`, `Copy`, `Lookup`, `GetMetadata`, `ForEach`, `IfCondition`, `Switch`, `Until`, `Wait`, `Fail`, `SetVariable`, `AppendVariable`, `ExecutePipeline`, `SparkJobDefinition`, `Script`, `WebActivity`, `PBISemanticModelRefresh`, `Delete`, `Filter`. Elk type heeft eigen `typeProperties`.

### Lakehouse

| Part | Inhoud | Verplicht |
|---|---|---|
| `lakehouse.metadata.json` | Eigenschappen, bijv. `{ "defaultSchema": "dbo" }` | Ja |
| `shortcuts.metadata.json` | Array met OneLake-shortcuts | Nee |
| `data-access-roles.json` | Data access roles (ALM-instelling vereist) | Nee |
| `alm.settings.json` | ALM-instellingen voor Git/deployment pipelines | Nee |
| `.platform` | Itemmetadata | Nee |

De definitie bevat structuur/metadata, **geen tabeldata**. Shortcut-doeltypes: `OneLake`, `AdlsGen2`, `AmazonS3`, `GoogleCloudStorage`, `S3Compatible`, `Dataverse`.

### Notebook

Met `FabricGitSource` volgt de extensie de taal: `.py` (PySpark/Python), `.sql` (Spark SQL), `.scala`, `.r` (SparkR). Gedecodeerde `ipynb` is standaard Jupyter-JSON (`nbformat`, `cells`, `metadata`).

### VariableLibrary

- Variabeletypes: `String`, `Boolean`, `Number`, `Integer`, `DateTime`, `ItemReference` (binding aan een Fabric-item-GUID).
- `settings.json` is altijd aanwezig; `valueSetsOrder` is leeg zonder value sets. Elke naam in `valueSetsOrder` moet een bestand onder `valueSets/` hebben.
- In pipelines: Boolean → **Bool**, Integer → **Int**, Number → **Double**, DateTime/String/ItemReference → **String**. Dynamische verwijzingen als expressie-object: `{"value": "@pipeline().libraryVariables.x", "type": "Expression"}`.

| Probleem | Oplossing |
|---|---|
| Definitie geweigerd vanwege `format` | `format` helemaal weglaten |
| Value sets genegeerd | `valueSetsOrder` toevoegen aan `settings.json` |
| Validatiefout value set | Voor elke naam in `valueSetsOrder` een bestand onder `valueSets/` |
| Pipelinevariabele lost niet op | Zowel `libraryName` als `libraryId` opnemen |

## Valkuilen

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `411` bij `getDefinition` | Geen body meegestuurd | `--body '{}'` |
| `.platform`-wijziging komt niet door | `?updateMetadata=true` ontbreekt | Parameter toevoegen |
| Lege of onvolledige definitie | `202` niet gepold | Operatie pollen, dan `/result` ophalen |
| Rapport-update geweigerd | `byPath`-verwijzing in `definition.pbir` | `byConnection` gebruiken |
| Warehouse-definitie niet op te halen | Warehouse heeft geen definitie-API | Niet via definities werken; bij vergelijken alleen op aanwezigheid letten |
| Body afgekapt of leeg | Shell-escaping / PowerShell inline body | Body naar bestand, `--body @bestand.json` |
