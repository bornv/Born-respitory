# Uitvoerbestemmingen (output destinations)

Hoe een Dataflow Gen2 zijn queryresultaat wegschrijft naar een Lakehouse-tabel, Lakehouse Files, Warehouse, Azure SQL of Azure Data Explorer, wanneer je de definitie via de REST API opbouwt.

## Inhoud

| Sectie | Wanneer laden |
|---|---|
| [Ondersteunde bestemmingen](#ondersteunde-bestemmingen) | Overzicht en connection kinds |
| [Opbouw: twee queries](#opbouw-twee-queries) | `DataDestinations`-annotatie + verborgen `_DataDestination`-query |
| [queryMetadata.json](#querymetadatajson) | `loadEnabled`/`isHidden`-regels |
| [Stappen](#stappen) | Volgorde van API-aanroepen |
| [Lakehouse-tabel](#lakehouse-tabel) / [Lakehouse Files](#lakehouse-files) / [Warehouse](#warehouse) / [Azure SQL](#azure-sql) / [Azure Data Explorer](#azure-data-explorer) | M-patroon en koppeling per bestemming |
| [Vervangen of toevoegen](#vervangen-of-toevoegen) | `IsNewTarget`, `Replace`/`Append` |
| [Volledig voorbeeld (PowerShell)](#volledig-voorbeeld-powershell) | Lakehouse-bestemming end-to-end |
| [Foutentabel](#foutentabel) | Fouten bij refresh met bestemming |

## Ondersteunde bestemmingen

| Bestemming | Connection kind | M-functie in bestemmingsquery | Uitvoer |
|---|---|---|---|
| Lakehouse-tabel | `Lakehouse` | `Lakehouse.Contents(...)` | Table |
| Lakehouse Files | `Lakehouse` | `Lakehouse.Contents(...)` | File |
| Warehouse | `Warehouse` | `Fabric.Warehouse(...)` | Table |
| Azure Data Explorer | `AzureDataExplorer` | `AzureDataExplorer.Contents(...)` | Table |
| Azure SQL | `Sql` | `Sql.Database(...)` | Table |

> Relatieve verwijzingen (`workspaceId = "."`, `warehouseName`) werken **niet** voor dataflows die via de API zijn gemaakt; die zijn alleen voor de UI. Navigeer altijd op GUID (`workspaceId`, `lakehouseId`, `warehouseId`).

## Opbouw: twee queries

1. **Bronquery** levert de data en krijgt een `[DataDestinations]`-annotatie die naar de bestemmingsquery wijst.
2. **Verborgen bestemmingsquery** (achtervoegsel `_DataDestination`) navigeert naar de doellocatie.

Bij refresh leest Fabric de annotatie, evalueert de bronquery en schrijft naar de plek uit de bestemmingsquery.

```m
section Section1;

[DataDestinations = {[
  Definition = [Kind = "Reference", QueryName = "MyQuery_DataDestination", IsNewTarget = true],
  Settings = [Kind = "Automatic", TypeSettings = [Kind = "Table"]]
]}]
shared MyQuery = let
    Source = #table({"Col1", "Col2"}, {{"A", "B"}}),
    Typed = Table.TransformColumnTypes(Source, {{"Col1", type text}, {"Col2", type text}})
in
    Typed;

shared MyQuery_DataDestination = let
    Pattern = Lakehouse.Contents([HierarchicalNavigation = null, CreateNavigationProperties = false, EnableFolding = false]),
    Navigation_1 = Pattern{[workspaceId = "<workspace-id>"]}[Data],
    Navigation_2 = Navigation_1{[lakehouseId = "<lakehouse-id>"]}[Data],
    TableNavigation = Navigation_2{[Id = "MyQuery", ItemKind = "Table"]}?[Data]?
in
    TableNavigation;
```

| Veld | Waarde | Toelichting |
|---|---|---|
| `Definition.Kind` | `"Reference"` | Altijd |
| `QueryName` | `"<Bronquery>_DataDestination"` | Moet exact gelijk zijn aan de naam van de bestemmingsquery |
| `IsNewTarget` | `true` | **Altijd `true` voor API-gemaakte dataflows**, ook bij een bestaande tabel |
| `Settings.Kind` | `"Automatic"` | Automatische kolomtoewijzing; voorkomt `DestinationColumnNotFound` bij nieuwe tabellen |
| `TypeSettings.Kind` | `"Table"` of `"File"` | Tabel- of bestandsbestemming |
| `?[Data]?` / `?[Content]?` | null-veilig | De tabel bestaat bij de eerste refresh nog niet |
| `Id` / `Item` / `Name` | naam bronquery | Wordt de tabelnaam |

De bronquery moet **getypte kolommen** opleveren (`Table.TransformColumnTypes`). Kolommen van type `Any` geven bij elke bestemming een fout.

## queryMetadata.json

| Query | `loadEnabled` | `isHidden` | `queryName` |
|---|---|---|---|
| Bronquery | `true` (of weglaten; standaard) | weglaten | verplicht |
| `_DataDestination`-query | **`false`** (verplicht) | `true` | verplicht |

```json
{
  "formatVersion": "202502",
  "computeEngineSettings": {},
  "name": "<dataflow-display-name>",
  "allowNativeQueries": false,
  "queriesMetadata": {
    "BlankTable": {
      "queryName": "BlankTable",
      "queryId": "<guid>",
      "loadEnabled": true
    },
    "BlankTable_DataDestination": {
      "queryName": "BlankTable_DataDestination",
      "queryId": "<guid>",
      "isHidden": true,
      "loadEnabled": false
    }
  },
  "connections": [
    {
      "connectionId": "{\"ClusterId\": \"<cluster-guid>\", \"DatasourceId\": \"<connection-guid>\"}",
      "kind": "Lakehouse",
      "path": "Lakehouse"
    }
  ]
}
```

- Zonder `loadEnabled: false` op de bestemmingsquery faalt de refresh met `ModelBuilderOutputDestinationInvalidOutputDestinationConfiguration: Destination query should have loadEnabled set to false.`
- `loadEnabled: true` op de bronquery kan na teruglezen ontbreken; dat is normaal. `loadEnabled: false` op de bestemmingsquery blijft staan.
- Leest de bronquery ook uit een bron met credentials (bijv. SQL → Lakehouse), dan moeten **beide** verbindingen in `connections[]` staan.

## Stappen

| Stap | Actie | API |
|---|---|---|
| 1 | ID van het doel-Lakehouse/-Warehouse opzoeken | `GET /v1/workspaces/{ws}/lakehouses` of `/warehouses` |
| 2 | Bestemmingsverbinding zoeken | `GET /v1/connections` + filter op type |
| 3 | `ClusterId` ophalen | `GET https://api.powerbi.com/v2.0/myorg/me/gatewayClusterDatasources` |
| 4 | Mashup bouwen met annotatie + `_DataDestination`-query | — |
| 5 | `queryMetadata.json` bouwen met `loadEnabled: false` op de bestemmingsquery + verbinding | — |
| 6 | Volledige definitie opslaan | `POST .../updateDefinition` |
| 7 | Controleren of verbindingen bewaard zijn | `POST .../getDefinition` → `queryMetadata.json` decoderen |
| 8 | Refresh met `ApplyChangesIfNeeded` | `POST .../jobs/instances?jobType=Refresh` |

Waarom `ApplyChangesIfNeeded`: een via de API gemaakte dataflow begint als ongepubliceerd concept. Met `SkipApplyChanges` (standaard) faalt de refresh direct; `ApplyChangesIfNeeded` leest de annotaties opnieuw, publiceert het concept en voert dan uit. Na de eerste geslaagde refresh mag beide.

```json
{"executionData": {"executeOption": "ApplyChangesIfNeeded"}}
```

## Lakehouse-tabel

```bash
az rest --method get --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/lakehouses" \
  --query "value[].{name:displayName, id:id}" -o table
```

Bestemmingsquery: zie het patroon onder [Opbouw](#opbouw-twee-queries). `EnableFolding = false` is verplicht in de `Lakehouse.Contents()`-aanroep van de bestemmingsquery.

| Koppeling | Waarde |
|---|---|
| `kind` | `"Lakehouse"` |
| `path` | `"Lakehouse"` |
| Aanmaken | Bestaat meestal al; hergebruik via `GET /v1/connections`. Een OAuth2-Lakehouse-verbinding maak je in de portal |

## Lakehouse Files

Schrijft het resultaat als CSV of Parquet in de Files-sectie. De extensie in de navigatie bepaalt het formaat (`.csv` of `.parquet`).

```m
[DataDestinations = {[
  Definition = [Kind = "Reference", QueryName = "MyQuery_DataDestination", IsNewTarget = true],
  Settings = [Kind = "Automatic", TypeSettings = [Kind = "File"]]
]}]
shared MyQuery = ...
```

```m
shared MyQuery_DataDestination = let
    Pattern = Lakehouse.Contents([HierarchicalNavigation = null, CreateNavigationProperties = false, EnableFolding = false]),
    Navigation_1 = Pattern{[workspaceId = "<workspace-id>"]}[Data],
    Navigation_2 = Navigation_1{[lakehouseId = "<lakehouse-id>"]}[Data],
    FilesFolder = Navigation_2{[Id = "Files", ItemKind = "Folder"]}[Data],
    File = FilesFolder{[Name = "MyQuery.csv"]}?[Content]?
in
    File;
```

Koppeling: zelfde Lakehouse-verbinding (`kind` en `path` = `"Lakehouse"`).

## Warehouse

```bash
az rest --method get --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/warehouses" \
  --query "value[].{name:displayName, id:id}" -o table

az rest --method get --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/connections" \
  --query "value[?connectionDetails.type=='Warehouse'].{id:id, name:displayName, path:connectionDetails.path}" -o table
```

```m
shared MyQuery_DataDestination = let
    Source = Fabric.Warehouse([HierarchicalNavigation = false, CreateNavigationProperties = false]),
    Workspace = Source{[workspaceId = "<workspace-id>"]}[Data],
    Warehouse = Workspace{[warehouseId = "<warehouse-id>"]}[Data],
    Table = Warehouse{[Schema = "dbo", Item = "MyQuery"]}?[Data]?
in
    Table;
```

| Element | Eis |
|---|---|
| `HierarchicalNavigation = false` | Verplicht; platte navigatie op `Schema`/`Item` |
| `CreateNavigationProperties = false` | Verplicht |
| `warehouseId` | GUID; `warehouseName` faalt bij API-gemaakte dataflows |
| `Schema` / `Item` | Meestal `"dbo"` / naam van de bronquery |
| Koppeling | `kind: "Warehouse"`, `path: "Warehouse"`; verbinding bestaat meestal al (vaak OAuth2) |

## Azure SQL

```m
shared MyQuery_DataDestination = let
    Source = Sql.Database("<server>.database.windows.net", "<database>", [HierarchicalNavigation = false, CreateNavigationProperties = false]),
    Table = Source{[Schema = "dbo", Item = "MyQuery"]}?[Data]?
in
    Table;
```

Koppeling: `kind: "Sql"`, `path: "<server>;<database>"` (gelijk aan het geregistreerde pad). Basic en ServicePrincipal zijn via de API aan te maken; OAuth2 alleen in de portal.

## Azure Data Explorer

```m
shared MyQuery_DataDestination = let
    Source = AzureDataExplorer.Contents("<cluster-url>", "<database>", null, [CreateNavigationProperties = false]),
    Table = Source{[Name = "MyQuery"]}?[Data]?
in
    Table;
```

- De cluster-URL in M en het `path` in `connections[]` moeten **exact** gelijk zijn aan `connectionDetails.path` van de verbinding, inclusief een eventuele slash aan het eind. Anders: `ActionUserFailure: Data source credentials are missing or invalid`.
- Derde argument `null` is een verplichte plaatshouder.
- Koppeling: `kind: "AzureDataExplorer"`. OAuth2 alleen via de portal; ServicePrincipal en WorkspaceIdentity via de API.

## Vervangen of toevoegen

Met `IsNewTarget = true` wordt een bestaande doeltabel bij elke refresh verwijderd en opnieuw aangemaakt met het nieuwe schema (vervangen, gelijk aan `UpdateMethod = [Kind = "Replace"]`).

Wil je toevoegen of een bestaande tabel met relaties behouden: het patroon `IsNewTarget = false` met `Settings.Kind = "Manual"` werkt **alleen** voor dataflows die al via de Fabric-UI gepubliceerd zijn, of voor een API-dataflow ná de eerste geslaagde refresh.

```m
[DataDestinations = {[
  Definition = [Kind = "Reference", QueryName = "MyQuery_DataDestination", IsNewTarget = false],
  Settings = [
    Kind = "Manual",
    AllowCreation = false,
    DynamicSchema = false,
    UpdateMethod = [Kind = "Replace"],
    TypeSettings = [Kind = "Table"]
  ]
]}]
```

| Instelling | `Kind = "Automatic"` | `Kind = "Manual"` |
|---|---|---|
| Kolomtoewijzing | Door de engine | Expliciete `ColumnSettings` nodig |
| Schemawijziging | Toegestaan (tabel opnieuw gemaakt) | Moet exact passen |
| Gebruik | Nieuwe tabellen, flexibel schema | Bestaande tabellen, relaties behouden |

Updatemethoden in `Manual`: `[Kind = "Replace"]` (vervangen) of `[Kind = "Append"]` (toevoegen).

## Volledig voorbeeld (PowerShell)

Lege dataflow → Lakehouse-verbinding → `ClusterId` → definitie met bestemming → controle → refresh. Vereist `az login` en een bestaand Lakehouse.

```powershell
$WS_ID = "<workspaceId>"
$LH_ID = "<lakehouseId>"
$DF_NAME = "my-od-dataflow"
$RESOURCE = "https://api.fabric.microsoft.com"
$API = "$RESOURCE/v1"
$PBI_RESOURCE = "https://analysis.windows.net/powerbi/api"

# 1. Lege dataflow
$createFile = "$env:TEMP\df_create.json"
[IO.File]::WriteAllText($createFile, (@{ displayName = $DF_NAME } | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
$DF_ID = (az rest --method post --resource $RESOURCE `
  --url "$API/workspaces/$WS_ID/dataflows" --body "@$createFile" | ConvertFrom-Json).id

# 2. Lakehouse-verbinding
$CONN_ID = az rest --method get --resource $RESOURCE --url "$API/connections" `
  --query "value[?connectionDetails.type=='Lakehouse'] | [0].id" --output tsv

# 3. ClusterId
$CLUSTER_ID = az rest --method get --resource $PBI_RESOURCE `
  --url "https://api.powerbi.com/v2.0/myorg/me/gatewayClusterDatasources" `
  --query "value[?id=='$CONN_ID'] | [0].clusterId" --output tsv

# 4. Definitie
$mashupPq = @"
section Section1;

[DataDestinations = {[
  Definition = [Kind = "Reference", QueryName = "BlankTable_DataDestination", IsNewTarget = true],
  Settings = [Kind = "Automatic", TypeSettings = [Kind = "Table"]]
]}]
shared BlankTable = let
    Source = #table({"Column1", "Column2", "Column3"}, {{"Value1", "Value2", "Value3"}}),
    Typed = Table.TransformColumnTypes(Source, {{"Column1", type text}, {"Column2", type text}, {"Column3", type text}})
in
    Typed;

shared BlankTable_DataDestination = let
    Pattern = Lakehouse.Contents([HierarchicalNavigation = null, CreateNavigationProperties = false, EnableFolding = false]),
    Navigation_1 = Pattern{[workspaceId = "$WS_ID"]}[Data],
    Navigation_2 = Navigation_1{[lakehouseId = "$LH_ID"]}[Data],
    TableNavigation = Navigation_2{[Id = "BlankTable", ItemKind = "Table"]}?[Data]?
in
    TableNavigation;
"@

$queryMetadataJson = @"
{
  "formatVersion": "202502",
  "computeEngineSettings": {},
  "name": "$DF_NAME",
  "allowNativeQueries": false,
  "queriesMetadata": {
    "BlankTable": { "queryName": "BlankTable", "queryId": "$([guid]::NewGuid().ToString())", "loadEnabled": true },
    "BlankTable_DataDestination": { "queryName": "BlankTable_DataDestination", "queryId": "$([guid]::NewGuid().ToString())", "isHidden": true, "loadEnabled": false }
  },
  "connections": [
    { "connectionId": "{\"ClusterId\": \"$CLUSTER_ID\", \"DatasourceId\": \"$CONN_ID\"}", "kind": "Lakehouse", "path": "Lakehouse" }
  ]
}
"@

# Bestaande .platform hergebruiken (behoudt logicalId)
$defResult = az rest --method post --resource $RESOURCE `
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/getDefinition" --headers "Content-Length=0" | ConvertFrom-Json
$platformB64 = ($defResult.definition.parts | Where-Object { $_.path -eq ".platform" }).payload
$mashupB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mashupPq))
$qmB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($queryMetadataJson))

# 5. Opslaan (alle drie delen)
$updateBody = @"
{ "definition": { "parts": [
  {"path": "mashup.pq", "payload": "$mashupB64", "payloadType": "InlineBase64"},
  {"path": "queryMetadata.json", "payload": "$qmB64", "payloadType": "InlineBase64"},
  {"path": ".platform", "payload": "$platformB64", "payloadType": "InlineBase64"}
] } }
"@
$updateFile = "$env:TEMP\df_update.json"
[IO.File]::WriteAllText($updateFile, $updateBody, [Text.UTF8Encoding]::new($false))
az rest --method post --resource $RESOURCE `
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/updateDefinition" `
  --headers "Content-Type=application/json" --body "@$updateFile"

# 6. Controleren of de verbinding bewaard is
$verify = az rest --method post --resource $RESOURCE `
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/getDefinition" --headers "Content-Length=0" | ConvertFrom-Json
$qm = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(
  ($verify.definition.parts | Where-Object { $_.path -eq "queryMetadata.json" }).payload)) | ConvertFrom-Json
if ($qm.connections.Count -gt 0) { Write-Host "OK: connections persisted." } else { Write-Error "FAIL: connections missing." }

# 7. Refresh (alleen na akkoord gebruiker)
$refreshFile = "$env:TEMP\df_refresh.json"
[IO.File]::WriteAllText($refreshFile, '{"executionData":{"executeOption":"ApplyChangesIfNeeded"}}', [Text.UTF8Encoding]::new($false))
az rest --method post --resource $RESOURCE `
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/jobs/instances?jobType=Refresh" --body "@$refreshFile"
```

Voor een **Warehouse** vervang je in stap 2 het filter door `connectionDetails.type=='Warehouse'`, gebruik je de [Warehouse-bestemmingsquery](#warehouse) en zet je in `connections[]` `"kind": "Warehouse", "path": "Warehouse"`. Bij een bron als `LeverStatus` uit [m-taal.md](m-taal.md#orders-koppelen-aan-leveringen) heet de bestemmingsquery `LeverStatus_DataDestination` en wordt de tabel `LeverStatus`.

## Foutentabel

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `ModelBuilderOutputDestinationInvalidOutputDestinationConfiguration: Destination query should have loadEnabled set to false` | `loadEnabled: false` ontbreekt | Toevoegen aan de `_DataDestination`-entry |
| `DestinationColumnNotFound` | `Settings.Kind = "Manual"` bij een nieuwe tabel | `"Automatic"` gebruiken |
| "The key didn't match any rows in the table" | `[Data]` i.p.v. `?[Data]?` | Null-veilige `?` toevoegen |
| "Job instance failed without detail error" | Verlopen OAuth, verkeerde verbinding, concept niet gepubliceerd | Verbinding controleren (`GET /v1/connections/{id}`), `ApplyChangesIfNeeded`, na 30 s opnieuw |
| `IsNewTarget = false` faalt bij eerste refresh | Annotaties nog niet gepubliceerd | `IsNewTarget = true` |
| Tabel niet aangemaakt na geslaagde refresh | Bronquery levert niets of `loadEnabled` weg | Bronquery eerst met `executeQuery` testen |
| `Required property 'queryName' not found` | `queryName` ontbreekt in `queriesMetadata` | Toevoegen |
| `A query with a data destination has only columns whose types are not supported by the destination` | Ongetypte (`Any`) kolommen | `Table.TransformColumnTypes` (text, `Int64.Type`, number, logical, datetime, …) |
| `ActionUserFailure: Data source credentials are missing or invalid` (code 999999) | URL in M ≠ `connectionDetails.path` | Exact gelijk maken, ook slash aan het eind |
| ADX-tabel niet aangemaakt | `Name` in bestemmingsquery ≠ naam bronquery | Gelijk maken |
| `EntityUserFailure` met `workspaceId = "."` of `warehouseName` | Relatieve/naamnavigatie niet ondersteund via API | GUID-sleutels gebruiken |
| `EntityUserFailure` bij Warehouse/SQL-bestemming | Verouderde credentials of gatewayverbinding | Verbinding moet `ShareableCloud` of `PersonalCloud` zijn; credentials in de portal controleren |
