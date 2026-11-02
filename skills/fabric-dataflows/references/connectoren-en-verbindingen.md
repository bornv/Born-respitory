# Connectoren en verbindingen

Welke bronfuncties je in Dataflow Gen2 kunt gebruiken, hoe je een Fabric-verbinding vindt of aanmaakt en hoe je die aan de dataflow koppelt.

## Inhoud

| Sectie | Wanneer laden |
|---|---|
| [Drie lagen](#drie-lagen-verbinding-koppeling-m-functie) | Begrijpen waarom een query "Credentials are required" geeft |
| [Bronfuncties](#bronfuncties) | Welke M-functie bij welke bron |
| [Lakehouse lezen](#lakehouse-lezen) | Tabel of bestand uit een Lakehouse halen |
| [Andere Dataflow Gen2 lezen](#andere-dataflow-gen2-lezen) | Uitvoer van een upstream dataflow gebruiken |
| [Parsers zonder verbinding](#parsers-zonder-verbinding) | CSV, JSON, HTML, tekstregels, `#table` |
| [Verbinding vinden of aanmaken](#verbinding-vinden-of-aanmaken) | `GET /v1/connections`, `supportedConnectionTypes`, `POST /v1/connections` |
| [Credentialtypes](#credentialtypes) | Basic, ServicePrincipal, WorkspaceIdentity, OAuth2-beperking |
| [Koppelen aan de dataflow](#koppelen-aan-de-dataflow) | `ClusterId`, samengestelde `connectionId` |
| [Valkuilen](#valkuilen) | Meerdere bronnen, gateways, dubbele namen |
| [Foutentabel](#foutentabel) | 400/403/409-fouten bij verbindingen |

## Drie lagen: verbinding, koppeling, M-functie

| Laag | Wat | Waar |
|---|---|---|
| Verbinding | Fabric-object met credentials en parameters | `/v1/connections/{id}` |
| Koppeling | Entry in `connections[]` van `queryMetadata.json` die de verbinding aan de dataflow hangt | Dataflowdefinitie |
| M-functie | De bronaanroep in `mashup.pq`, bijv. `Sql.Database(...)` | `mashup.pq` |

De M-functie en de koppeling moeten dezelfde soort (`kind`) hebben. Let op hoofdletters: REST `connectionDetails.type` is `SQL`, de `kind` in `queryMetadata.json` is `Sql`.

Zonder passende koppeling geeft een bronfunctie: `Credentials are required to connect to the <kind> source. (Source at <bron>.)`. Die melding bewijst ook dat de syntax en het aantal argumenten wel klopten.

## Bronfuncties

| M-functie | `kind` in `connections[]` | Pad-voorbeeld | Opmerking |
|---|---|---|---|
| `Lakehouse.Contents()` | `Lakehouse` | `"Lakehouse"` | Werkt volledig met een gekoppelde Lakehouse-verbinding |
| `Sql.Database(server, database, [opties])` | `Sql` | `"server.database.windows.net;mydb"` | 2 of 3 argumenten; `Sql.Database("server")` geeft `1 arguments were passed to a function which expects between 2 and 3.` |
| `AzureSql.Database()` | `AzureSqlDatabase` | `"server.database.windows.net;mydb"` | |
| `Fabric.Warehouse([opties])` / `Fabric.Warehouse(null)` | `Warehouse` | `"Warehouse"` | |
| `Web.Contents(url, [opties])` | `Web` | `"https://example.com/api"` | Geeft binary terug; combineer met een parser |
| `OData.Feed(url, [headers], [opties])` | — | | 1–3 argumenten; vereist een OData-koppeling |
| `SharePoint.Contents()` | `SharePoint` | `"https://tenant.sharepoint.com/sites/mysite"` | |
| `AzureStorage.DataLake()` | `AzureDataLakeStorage` | `"https://account.dfs.core.windows.net"` | |
| `PowerPlatform.Dataflows(null)` | — | | Argument `null` is verplicht; vereist een PowerPlatformDataflows-koppeling |
| `Excel.Workbook`, `Snowflake.Databases` | | | Functie aanwezig; in de bron niet end-to-end getest |
| `Variable.Value("naam")` | | | Vereist een Variable Library op de dataflow; anders `The variable '<name>' could not be found.` |

Beschikbare functies opvragen in de engine zelf:

```m
let
    Source = #shared,
    AsTable = Record.ToTable(Source),
    SqlFunctions = Table.SelectRows(AsTable, each Text.StartsWith([Name], "Sql."))
in
    SqlFunctions
```

## Lakehouse lezen

```m
section Section1;

shared Producten = let
    Source = Lakehouse.Contents(),
    Workspace = Source{[workspaceId = "<workspace-guid>"]}[Data],
    Lakehouse = Workspace{[lakehouseId = "<lakehouse-guid>"]}[Data],
    Table = Lakehouse{[Name = "Products"]}[Data]
in
    Table;
```

| Niveau | Kolommen / sleutel |
|---|---|
| Root | `workspaceId`, `workspaceName`, `Data` → index op `{[workspaceId="..."]}` |
| Workspace | `lakehouseId`, `lakehouseName`, `Data`, … → index op `{[lakehouseId="..."]}` |
| Lakehouse | Gemengd: `ItemKind = "Table"` (schema `dbo`), `ItemKind = "View"` (`sys`, `queryinsights`) en één `ItemKind = "Folder"` met `Name = "Files"` |

- Tabel of view: `{[Name="MijnTabel"]}[Data]`.
- Bestanden: `{[Id="Files"]}[Data]` (rijen met `Content`, `Name`, `Extension`, `Folder Path`, `Date modified`, …).
- Alleen tabellen: `Table.SelectRows(Lh, each [ItemKind] = "Table")`.
- **Fout:** `{[Id="Tables"]}` bestaat niet; tabellen staan direct op het Lakehouse-niveau ("The key didn't match any rows in the table.").
- Indexeer bij voorkeur op GUID, niet op weergavenaam.
- Lees je meerdere tabellen uit hetzelfde Lakehouse: gebruik één `Lakehouse.Contents(...)`-aanroep; elke aanroep telt anders als aparte bron.

## Andere Dataflow Gen2 lezen

```m
section Section1;

shared UpstreamDataflow = let
    Source     = PowerPlatform.Dataflows(null),
    Workspaces = Source{[Id = "Workspaces"]}[Data],
    Workspace  = Workspaces{[workspaceId = Variable.Value("currentWorkspaceId")]}[Data],
    Dataflow   = Workspace{[dataflowName = "eval_authoring_basic"]}[Data]
in
    Dataflow;
```

De eerste stap is altijd de letterlijke entry `{[Id = "Workspaces"]}`; pas daarna kies je op `workspaceId`. `PowerPlatform.Dataflows()` zonder argument is een compileerfout.

## Parsers zonder verbinding

Deze functies werken op data in het geheugen en hebben geen koppeling nodig.

```m
Csv.Document(Web.Contents("https://example.com/data.csv"),
    [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv])
```

- `QuoteStyle.Csv` en `QuoteStyle.None` worden geaccepteerd; optioneel `Columns = <n>`.
- Na `Csv.Document` meestal `Table.PromoteHeaders(Source, [PromoteAllScalars=true])`.

```m
Json.Document("{""x"": 42}")
Json.Document(Text.ToBinary("{""x"":42}", 65001), 65001)
Lines.FromBinary(Web.Contents("https://example.com/log.txt"))
#table(type table [Id = Int64.Type, Name = text], {{1, "A"}, {2, "B"}})
```

```m
Html.Table(Web.Contents("https://example.com/page"),
    {{"Name", ".product-name"}, {"Price", ".product-price"}},
    [RowSelector = ".product-row"])
```

Bij `Html.Table` met meer dan één kolom/selector-paar is in live refresh een `RowSelector` nodig (in de bron vastgesteld gedrag; Microsoft Learn noemt `RowSelector` optioneel). Gebruik `Web.Contents` + `Html.Table` in plaats van `Web.Page`/`Web.BrowserContents` (zie [m-taal.md](m-taal.md#niet-bruikbare-functies)).

## Verbinding vinden of aanmaken

Volgorde:

1. **Zoek** een bestaande verbinding en hergebruik die als type, netwerkpad en credentials kloppen.
2. **Vraag de ondersteunde types op** (`supportedConnectionTypes`) als er niets bruikbaars is. Nooit parameternamen of credentialtypes gokken.
3. **Maak** de verbinding (`POST /v1/connections`, sync 201) en bewaar het `id`.
4. **Test** optioneel (`POST /v1/connections/{id}/testConnection`).
5. **Koppel** aan de dataflow en sla op met `updateDefinition`; controleer daarna dat `connections[]` bewaard is.

```bash
RES="https://api.fabric.microsoft.com"; API="$RES/v1"

# 1. Zoeken op naam of type
az rest --method get --resource "$RES" --url "$API/connections" \
  --query "value[?displayName=='ContosoSqlConnection'].id" -o tsv
az rest --method get --resource "$RES" --url "$API/connections" \
  --query "value[?connectionDetails.type=='SQL'].{id:id, name:displayName, path:connectionDetails.path}" -o table

# Bekende GUID inspecteren
az rest --method get --resource "$RES" --url "$API/connections/$CONN_ID" \
  --query "{id:id, name:displayName, connectivity:connectivityType, type:connectionDetails.type, path:connectionDetails.path, credType:credentialDetails.credentialType, gw:gatewayId}"

# 2. Ondersteunde types (paginering via continuationToken tot null)
az rest --method get --resource "$RES" \
  --url "$API/connections/supportedConnectionTypes" --query "value[?type=='SQL']"
```

`supportedConnectionTypes` geeft per type: `creationMethods[].parameters[]` (naam, `dataType`, `required`), `supportedCredentialTypes[]`, `supportedConnectionEncryptionTypes[]` en `supportsSkipTestConnection`. Geef elke parameter de `dataType` mee die daar staat: het aanmaken accepteert vaak alles als `Text`, maar bij refresh leidt een verkeerd type tot stille `null` of `EntityUserFailure`.

`GET /v1/connections` toont alleen verbindingen waar jij leesrechten op hebt. Een lege lijst betekent niet dat de verbinding niet bestaat; vraag de eigenaar om toegang.

### Verbinding aanmaken (cloud, SQL met Key Vault-wachtwoord)

```json
{
  "connectivityType": "ShareableCloud",
  "displayName": "ContosoSqlConnection",
  "connectionDetails": {
    "type": "SQL",
    "creationMethod": "SQL",
    "parameters": [
      { "dataType": "Text", "name": "server",   "value": "contoso.database.windows.net" },
      { "dataType": "Text", "name": "database", "value": "sales" }
    ]
  },
  "privacyLevel": "Organizational",
  "credentialDetails": {
    "singleSignOnType": "None",
    "connectionEncryption": "Encrypted",
    "skipTestConnection": false,
    "credentials": {
      "credentialType": "Basic",
      "username": "admin",
      "passwordReference": {
        "connectionId": "<keyVaultConnectionId>",
        "secretName": "sql-admin-password"
      }
    }
  }
}
```

```bash
NEW_CONN_ID=$(az rest --method post --resource "$RES" --url "$API/connections" \
  --headers "Content-Type=application/json" --body @body.json --query "id" -o tsv)
```

| Veld | Standaard | Opmerking |
|---|---|---|
| `connectivityType` | | `ShareableCloud`, `PersonalCloud`, `OnPremisesGateway`, `OnPremisesGatewayPersonal`, `VirtualNetworkGateway`; gateway-varianten vereisen `gatewayId` |
| `privacyLevel` | `Organizational` | `None`, `Public`, `Organizational`, `Private`; bepaalt of bronnen gecombineerd mogen worden |
| `connectionEncryption` | niet versleuteld | `NotEncrypted`, `Encrypted`, `Any` |
| `skipTestConnection` | `false` | Test bij aanmaken; mislukt → `IncorrectCredentials` |
| `singleSignOnType` | `None` | `Kerberos`, `MicrosoftEntraID`, `SecurityAssertionMarkupLanguage`, `KerberosDirectQueryAndRefresh` |
| `allowUsageInUserControlledCode` | `false` | Alleen `true` als de verbinding ook vanuit notebooks gebruikt mag worden |

Lakehouse-verbinding met workspace-identiteit (parameters `workspaceId` en `lakehouseId`):

```json
{
  "connectivityType": "ShareableCloud",
  "displayName": "ContosoLakehouseConnection",
  "connectionDetails": {
    "type": "Lakehouse", "creationMethod": "Lakehouse",
    "parameters": [
      {"dataType":"Text","name":"workspaceId","value":"<wsId>"},
      {"dataType":"Text","name":"lakehouseId","value":"<lhId>"}
    ]
  },
  "privacyLevel": "Organizational",
  "credentialDetails": {
    "singleSignOnType": "None",
    "connectionEncryption": "Encrypted",
    "skipTestConnection": false,
    "credentials": {"credentialType":"WorkspaceIdentity"}
  }
}
```

Body's altijd via een bestand meegeven (`--body @bestand.json`); inline JSON is kwetsbaar in bash en gaat op Windows stuk doordat `cmd.exe` aanhalingstekens verminkt. In PowerShell schrijf je het bestand als UTF-8 zonder BOM: `[IO.File]::WriteAllText($pad, $body, [Text.UTF8Encoding]::new($false))`.

Voorbeelden van types (altijd bevestigen via `supportedConnectionTypes`):

| `connectionDetails.type` | Gangbare parameters | Gangbare credentials | `kind` in `queryMetadata.json` |
|---|---|---|---|
| `SQL` | `server`, `database` (optioneel) | `Basic`, `ServicePrincipal`, `WorkspaceIdentity` | `Sql` |
| `AzureBlobs` | `account`, `domain` | `Key`, `SharedAccessSignature`, `WorkspaceIdentity` | `AzureStorage` |
| `Web` | `url` | `Anonymous`, `Basic`, `Key` | `Web` |
| `Lakehouse` | `workspaceId`, `lakehouseId` | `WorkspaceIdentity`, `OAuth2` (niet via API) | `Lakehouse` |
| `Warehouse` | `workspaceId`, `warehouseId` | `WorkspaceIdentity`, `ServicePrincipal` | `Sql` (DW SQL-endpoint); voor de Warehouse-*uitvoerbestemming* gebruikt de bron `kind: "Warehouse"`, zie [uitvoerbestemmingen.md](uitvoerbestemmingen.md#warehouse) |

## Credentialtypes

| `credentialType` | Verplichte velden | Key Vault-variant |
|---|---|---|
| `Anonymous` | alleen `credentialType` | — |
| `Basic` | `username`, `password` **of** `passwordReference` | `passwordReference` |
| `Key` | `key` **of** `keyReference` | `keyReference` |
| `KeyPair` | `identifier`, `privateKey` (PKCS #8), `passphrase` | — |
| `ServicePrincipal` | `tenantId`, `servicePrincipalClientId`, `servicePrincipalSecret` **of** `servicePrincipalSecretReference` | `servicePrincipalSecretReference` |
| `SharedAccessSignature` | `token` **of** `tokenReference` | `tokenReference` |
| `WorkspaceIdentity` | alleen `credentialType` | — |
| `Windows` / `WindowsWithoutImpersonation` | alleen on-premises gateway | — |

- **OAuth2 kan niet via `POST /v1/connections`.** De API antwoordt `400 InvalidInput` met `"The CredentialType input is not supported for this API"`. Maak OAuth2-verbindingen eenmalig interactief in de Fabric-portal en hergebruik daarna het ID.
- Een Key Vault-referentie (`connectionId` + `secretName` + optioneel `version`) verwijst naar een **bestaande Fabric Key Vault-verbinding**, niet naar een Key Vault-URL.
- Onbekende sleutels in `credentials` worden stil genegeerd (bijv. `passWord`): je krijgt 201, maar de eerste refresh faalt met `IncorrectCredentials`. Controleer sleutelnamen tegen het schema.
- Zet nooit wachtwoorden of secrets als platte tekst in voorbeelden of scripts.
- Voor onbewaakte refresh liever `WorkspaceIdentity` of `ServicePrincipal`; `OAuth2` met `singleSignOnType: None` werkt voor interactieve `executeQuery` maar is kwetsbaar onder Conditional Access.

Rechten: `Connection.Read.All` voor lezen, `Connection.ReadWrite.All` voor aanmaken. Een service principal mag alleen verbindingen maken als de Fabric-tenantbeheerder dat heeft ingeschakeld.

## Koppelen aan de dataflow

### ID-formaten

| Waar | Formaat |
|---|---|
| `id` uit `POST`/`GET /v1/connections` | Gewone GUID |
| `clusterId` uit `gatewayClusterDatasources` | Gewone GUID |
| `connectionId` in `queryMetadata.json` | **Samengestelde JSON-string** `"{\"ClusterId\":\"<guid>\",\"DatasourceId\":\"<guid>\"}"` |

REST-aanroepen op `/v1/connections/...` gebruiken de gewone GUID; de dataflowdefinitie gebruikt de samengestelde string. Verwisselen geeft "connection not found" bij refresh.

### `ClusterId` ophalen

```bash
PBI="https://analysis.windows.net/powerbi/api"   # zonder slash aan het eind
CLUSTER_ID=$(az rest --method get --resource "$PBI" \
  --url "https://api.powerbi.com/v2.0/myorg/me/gatewayClusterDatasources" \
  --query "value[?id=='$CONN_ID'] | [0].clusterId" -o tsv)
```

- Gebruik lijst + filter. De route per ID (`.../gatewayClusterDatasources/{id}`) geeft `PowerBIEntityNotFound` voor cloudverbindingen.
- Nieuwe verbindingen verschijnen pas na 5–15 seconden; probeer opnieuw bij een leeg resultaat. Na ~30 s nog leeg: controleer met `GET /v1/connections/{id}` en maak de verbinding zo nodig opnieuw.
- `gatewayClusterDatasources` is een interne Power BI-API (v2.0 is geen publieke versie) en kan zonder aankondiging veranderen; er is geen gedocumenteerd alternatief.
- Stop als `ClusterId` leeg blijft: een lege waarde maakt de samengestelde `connectionId` ongeldig.

### `connections[]`-entry

```json
"connections": [
  {
    "connectionId": "{\"ClusterId\":\"<cluster-guid>\",\"DatasourceId\":\"<connection-guid>\"}",
    "kind": "Web",
    "path": "https://example.com/data.csv"
  }
]
```

Na `updateDefinition` altijd controleren of de koppeling bewaard is:

```bash
az rest --method post --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/getDefinition" --headers "Content-Length=0" \
  | jq -r '.definition.parts[] | select(.path=="queryMetadata.json") | .payload' | base64 -d \
  | jq '.connections // []'
```

Gebruik **niet** `GET /v1/workspaces/{ws}/items/{id}/connections` als controle: dat toont de status na een refresh en geeft 0 terug direct na een geslaagde koppeling.

Kan de koppeling niet doorgaan omdat `gatewayClusterDatasources` 401/403 geeft of geen `ClusterId` toont: maak de dataflow wel aan en sla de queries op zonder te claimen dat de bron gekoppeld is, voer `executeQuery` uit met alleen `QueryName`, meld de exacte fout, verzin geen data en start geen refresh.

## Valkuilen

| Valkuil | Aanpak |
|---|---|
| Meerdere bronnen in één dataflow | Elke bron eigen koppeling in `connections[]` + `[AllowCombine = true]` vóór `section` |
| Gepubliceerde dataflow met één bron uitbreiden naar meerdere bronnen | Koppelingen raken inconsistent; maak een nieuwe dataflow en faseer de oude uit |
| Zelfde bron zowel als `PersonalCloud` als `OnPremisesGateway` | Kies de cloudverbinding als de bron vanuit de cloud bereikbaar is; een gateway voegt "gateway offline"-fouten toe |
| `409 DuplicateConnectionName` | Bestaande verbinding hergebruiken of een unieke naam kiezen |
| On-premises gateway | Credentials moeten per gatewaylid RSA-versleuteld worden (`encryptedCredentials`); geen platte-tekstsjablonen. Liever `ShareableCloud` of `VirtualNetworkGateway` |
| Koppelen op weergavenaam | Altijd op ID; namen kunnen veranderen |

Gateways opvragen:

```bash
az rest --method get --resource "$RES" --url "$API/gateways" \
  --query "value[].{id:id, name:displayName, type:type}"
```

## Foutentabel

| Fout | Oorzaak | Oplossing |
|---|---|---|
| `409 DuplicateConnectionName` | Naam bestaat al | Hergebruiken of hernoemen |
| `400 InvalidConnectionDetails` | Verkeerd `type`, `creationMethod` of parameters | Opnieuw `supportedConnectionTypes`; namen exact overnemen |
| `400 InvalidCredentialDetails` | `credentialType` niet ondersteund of velden ontbreken | Schema en `supportedCredentialTypes` controleren |
| `400 InvalidInput` — `The CredentialType input is not supported for this API` | OAuth2 via API | In de portal maken of ander credentialtype |
| `400 IncorrectCredentials` | Test bij aanmaken mislukt | Credentials controleren |
| `400 CreateGatewayConnectionFailed` | Verkeerde `gatewayId`, geen gatewayrechten of foute versleuteling | Gateway en rechten controleren |
| `403 Forbidden` op `POST` | Geen `Connection.ReadWrite.All` of SP niet toegestaan | Scope of tenantinstelling regelen |
| `429 Too Many Requests` | Limiet | `Retry-After` respecteren |
| "Connection not found" bij refresh | Verkeerd ID-formaat | Samengestelde `connectionId` gebruiken |
| `ActionUserFailure: Data source credentials are missing or invalid` | URL in M wijkt af van `connectionDetails.path` (bijv. slash aan het eind) | Exact gelijk maken |
| `EntityUserFailure` zonder details | Ontbrekende/ontoegankelijke verbinding of OAuth2 onder Conditional Access | Verbindingen controleren met `GET /v1/connections/{id}`; eventueel `POST /v1/connections/{id}/testConnection` |
