# REST-API voor semantische modellen (`az rest`)

Fabric- en Power BI-REST-aanroepen voor semantische modellen: inloggen, ID's vinden, TMDL-definitie ophalen/bijwerken, vernieuwen, gegevensbronnen, parameters, rechten, DAX-query's en eigenschappen. Je voert de commando's zelf uit; Claude stelt ze op.

> De voorbeelden gebruiken Bash (bijv. Git Bash of WSL). `az rest` werkt ook in PowerShell; schrijf JSON-bodies dan naar een bestand en geef dat mee met `--body @pad\naar\body.json`.

Variabelen die overal terugkomen:

```bash
API_FABRIC="https://api.fabric.microsoft.com/v1"
API_PBI="https://api.powerbi.com/v1.0/myorg"
RESOURCE_PBI="https://analysis.windows.net/powerbi/api"
RESOURCE_FABRIC="https://api.fabric.microsoft.com"
WS_ID="<workspaceId>"
MODEL_ID="<semanticModelId>"   # dezelfde waarde als datasetId
```

## Inloggen

```bash
# Interactief (opent browser)
az login

# Fabric-tenant zonder Azure-abonnement
az login --allow-no-subscriptions --tenant <tenantId>

# Zonder browser (device code)
az login --use-device-code --tenant <tenantId>

# Welke identiteit/tenant is actief?
az account show --output table
```

Veel Fabric-gebruikers hebben geen Azure-abonnement. Zonder `--allow-no-subscriptions` meldt `az login` "No subscriptions found" en kunnen volgende commando's mislukken.

## Authenticatie en audiences

Er zijn **twee API-audiences**. De verkeerde audience geeft `401`.

| API | Audience (`--resource`) | Voor |
|---|---|---|
| Fabric Items API | `https://api.fabric.microsoft.com` | Modeldefinities maken/ophalen/bijwerken/verwijderen, items opvragen, LRO-polling, verbindingen binden |
| Power BI Datasets API | `https://analysis.windows.net/powerbi/api` | Vernieuwen, gegevensbronnen, parameters, rechten, DAX-query's, operationele eigenschappen |

Regels:
- **Geef altijd `--resource` mee.** Zonder krijg je `Can't derive appropriate Azure AD resource from --url`.
- Geef `--headers "Content-Type=application/json"` mee bij POST/PATCH/PUT met een body naar de Power BI Datasets API.
- Schrijf JSON-bodies naar een bestand en gebruik `--body @/tmp/body.json` (voorkomt escapeproblemen).
- Tokens verlopen na ongeveer 60–90 minuten; log opnieuw in of vraag een nieuw token bij lange acties.

Token controleren bij een `401` ("Audience validation failed"):

```bash
TOKEN=$(az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken --output tsv)
echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .
```

Kijk naar `aud` (moet gelijk zijn aan de doel-resource), `exp`, `oid` en `tid`.

## ID's vinden

Hardcodeer geen ID's; zoek ze op.

1. Workspace én model bekend → workspace-ID op naam, dan model-ID binnen die workspace.
2. Workspace onbekend → Catalog Search (zie **fabric-basis**).

Workspace-ID op naam (filter op `displayName`, niet op `name`):

```bash
WS_NAME="Supply Chain"
WS_ID=$(az rest --method get \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces" \
  --query "value[?displayName=='$WS_NAME'] | [0].id" \
  --output tsv)
```

Model-ID op naam:

```bash
MODEL_NAME="Orders"
MODEL_ID=$(az rest --method get \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items?type=SemanticModel" \
  --query "value[?displayName=='$MODEL_NAME'] | [0].id" \
  --output tsv)
```

- Dit doorzoekt alleen de eerste pagina. Bij veel workspaces/items: pagineren met `continuationToken` (herhaal de aanroep met `?continuationToken=<waarde>` tot die leeg is).
- Een naam met een apostrof: backtick-escaping, bijv. `--query "value[?displayName==\`Born's Workspace\`]"`.
- Heb je eenmaal het ID, gebruik dan directe opvraging: `GET /v1/workspaces/$WS_ID`.

## Long-running operations (LRO)

`createSemanticModel`, `getDefinition` en `updateDefinition` kunnen `202 Accepted` teruggeven met de headers `Location` (poll-URL), `x-ms-operation-id` en `Retry-After`.

- Poll: `GET /v1/operations/<operationId>` → `{ "status": "Running|Succeeded|Failed", "percentComplete" }`
- Resultaat (na `Succeeded`): `GET /v1/operations/<operationId>/result`
- Respecteer `Retry-After`; stel een maximale wachttijd in; handel `Failed` netjes af.

Herbruikbare Bash-helper:

```bash
# Gebruik: fabric_lro POST "https://api.fabric.microsoft.com/v1/..." '{"body":"..."}'
fabric_lro() {
  local METHOD="$1" URL="$2" BODY="$3"
  local TOKEN=$(az account get-access-token \
    --resource https://api.fabric.microsoft.com \
    --query accessToken --output tsv)

  local CURL_ARGS=(-si -X "$METHOD" "$URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  [ -n "$BODY" ] && CURL_ARGS+=(-d "$BODY")

  local RESPONSE=$(curl "${CURL_ARGS[@]}")
  local HTTP_STATUS=$(echo "$RESPONSE" | head -1 | awk '{print $2}')

  # Geen 202: synchroon antwoord direct teruggeven
  if [ "$HTTP_STATUS" != "202" ]; then
    echo "$RESPONSE" | sed '1,/^\r$/d'
    return 0
  fi

  local OP_URL=$(echo "$RESPONSE" | grep -i '^location:' | tr -d '\r' | awk '{print $2}')
  local RETRY=$(echo "$RESPONSE" | grep -i '^retry-after:' | tr -d '\r' | awk '{print $2}')
  RETRY=${RETRY:-5}

  echo "LRO started, polling $OP_URL every ${RETRY}s..." >&2
  while true; do
    sleep "$RETRY"
    local STATUS_JSON=$(curl -s "$OP_URL" -H "Authorization: Bearer $TOKEN")
    local STATUS=$(echo "$STATUS_JSON" | jq -r '.status')
    echo "  status: $STATUS" >&2
    case "$STATUS" in
      Succeeded) echo "$STATUS_JSON"; return 0 ;;
      Failed)    echo "$STATUS_JSON"; return 1 ;;
    esac
  done
}
```

Bij `429 Too Many Requests`: wacht de `Retry-After` af en probeer dan opnieuw.

---

## TMDL-definitie via de Fabric Items API

Regels:
- **Stuur bij `updateDefinition` alle parts mee**, gewijzigd én ongewijzigd. De API vervangt de hele definitie; ontbrekende parts worden verwijderd.
- **Nooit `.platform` meesturen** in `updateDefinition` (Git-integratiemetadata; geeft fouten). Alleen met `?updateMetadata=true` als je via de definitie naam of beschrijving wilt wijzigen.
- Alle `payload`-waarden zijn **base64**.
- Controleer vóór aanmaken dat de workspace een capaciteit heeft: `GET /v1/workspaces/{id}` en kijk naar `capacityId`.
- Liever één `createSemanticModel` (POST met definitie) dan aanmaken-en-daarna-bijwerken.
- Haal altijd eerst de actuele definitie op voor je bijwerkt; zo overschrijf je geen wijzigingen van anderen.

Verplichte parts:

| Part | Inhoud | Verplicht |
|---|---|---|
| `definition.pbism` | Instellingen semantisch model | Ja |
| `definition/database.tmdl` | Database-eigenschappen (compatibility level) | Ja |
| `definition/model.tmdl` | Modeleigenschappen | Ja |
| `definition/tables/<TableName>.tmdl` | Per tabel: kolommen, metingen, partities | Ja (minstens 1) |
| `diagramLayout.json` | Diagramindeling | Nee |

Minimale inhoud:

```tmdl
database
	compatibilityLevel: 1702
	compatibilityMode: powerBI
```

```tmdl
model Model
	culture: en-US
	defaultPowerBIDataSourceVersion: powerBI_V3
```

`definition.pbism`: zie [pbip.md](pbip.md#definitionpbism).

### Model aanmaken

```bash
# 1. Elk bestand base64-coderen
PBISM=$(base64 -w 0 < definition.pbism)
DB=$(base64 -w 0 < definition/database.tmdl)
MODEL=$(base64 -w 0 < definition/model.tmdl)
TABLE=$(base64 -w 0 < definition/tables/Customer.tmdl)

# 2. Payload opbouwen en aanmaken (--verbose toont status en LRO-headers)
cat > /tmp/body.json << EOF
{
  "displayName": "MySalesModel",
  "definition": {
    "format": "TMDL",
    "parts": [
      {"path": "definition.pbism", "payload": "$PBISM", "payloadType": "InlineBase64"},
      {"path": "definition/database.tmdl", "payload": "$DB", "payloadType": "InlineBase64"},
      {"path": "definition/model.tmdl", "payload": "$MODEL", "payloadType": "InlineBase64"},
      {"path": "definition/tables/Customer.tmdl", "payload": "$TABLE", "payloadType": "InlineBase64"}
    ]
  }
}
EOF
az rest --method post --verbose \
  --resource "$RESOURCE_FABRIC" \
  --url "$API_FABRIC/workspaces/$WS_ID/semanticModels" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json
```

PowerShell: gebruik `[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("bestand"))` in plaats van `base64 -w 0`.

Bij `202 Accepted`: pollen (zie [LRO](#long-running-operations-lro)). **Niet opnieuw versturen**: een tweede create maakt een tweede model met dezelfde naam.

### Definitie ophalen

`getDefinition` is een **POST** (geen GET), met een lege body.

```bash
# 1. Opvragen: 200 (direct) of 202 (LRO)
RESPONSE=$(az rest --method post --verbose \
  --resource "https://api.fabric.microsoft.com" \
  --url "$API_FABRIC/workspaces/$WS_ID/semanticModels/$MODEL_ID/getDefinition?format=TMDL" \
  --body '{}' \
  --output json 2>/dev/null)

# 2. Bij 202: de Location-URL pollen tot Succeeded, dan GET .../result

# 3. Elke part decoderen naar een bestand
echo "$RESPONSE" | jq -r '.definition.parts[] | .path + " " + .payload' | \
while read -r path payload; do
  mkdir -p "$(dirname "$path")"
  echo "$payload" | base64 -d > "$path"
done
```

### Definitie bijwerken

```bash
# 1. Actuele definitie ophalen (zie hierboven)
# 2. De TMDL-bestanden aanpassen
# 3. ALLE parts opnieuw coderen en versturen
cat > /tmp/body.json << EOF
{
  "definition": {
    "format": "TMDL",
    "parts": [
      {"path": "definition.pbism", "payload": "$PBISM", "payloadType": "InlineBase64"},
      {"path": "definition/database.tmdl", "payload": "$DB", "payloadType": "InlineBase64"},
      {"path": "definition/model.tmdl", "payload": "$MODEL", "payloadType": "InlineBase64"},
      {"path": "definition/tables/Customer.tmdl", "payload": "$TABLE", "payloadType": "InlineBase64"}
    ]
  }
}
EOF
az rest --method post \
  --resource "https://api.fabric.microsoft.com" \
  --url "$API_FABRIC/workspaces/$WS_ID/semanticModels/$MODEL_ID/updateDefinition" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json
```

Heeft het model meer bestanden (relaties, rollen, expressions, cultures), neem die dan allemaal op als part.

---

## Vernieuwen (refresh)

Via de Power BI Datasets API:

```bash
# Volledige refresh starten
cat > /tmp/body.json << 'EOF'
{"notifyOption": "NoNotification"}
EOF
az rest --method post --verbose \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json

# Refreshgeschiedenis (nieuwste eerst)
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/refreshes?\$top=5"

# Details van één refresh
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/refreshes/<refreshId>"

# Lopende refresh annuleren (alleen bij refreshType = ViaEnhancedApi)
az rest --method delete \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/refreshes/<refreshId>"
```

Of via de Fabric job-API (geeft `202` met `Location`; pollen zoals bij LRO):

```bash
az rest --method post \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$MODEL_ID/jobs/instances?jobType=Refresh"
```

Refreshschema (Import-modellen):

```bash
# Ophalen
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/refreshSchedule"

# Bijwerken
cat > /tmp/body.json << 'EOF'
{
  "value": {
    "enabled": true,
    "days": ["Monday", "Wednesday", "Friday"],
    "times": ["02:00", "14:00"],
    "localTimeZoneId": "UTC"
  }
}
EOF
az rest --method patch \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/refreshSchedule" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json

# DirectQuery/LiveConnection-schema (apart endpoint)
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/directQueryRefreshSchedule"
```

Velden in de refreshgeschiedenis: `id`, `requestId`, `refreshType` (`ViaEnhancedApi`, `Scheduled`, `OnDemand`, `ViaXmlaEndpoint`), `startTime`/`endTime`, `status` (`Completed`, `Failed`, `Unknown`, `Disabled`), `extendedStatus`, `serviceExceptionJson` (bij fouten, met `errorCode` en `errorDescription`), `refreshAttempts[]`.

Het DirectQuery-schema gebruikt **óf** `frequency` (15, 30, 60, 120, 180 minuten) **óf** `days` + `times`, niet beide.

**Credentialfout?** Stop en stel de referenties in de Power BI Service in. Niet opnieuw proberen.

## Gegevensbronnen en parameters

```bash
# Gegevensbronnen van het model
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/datasources"

# Gekoppelde gatewaybronnen
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/Default.GetBoundGatewayDatasources"

# Beschikbare gateways voor het model
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/Default.DiscoverGateways"

# Parameters ophalen
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/parameters"

# Parameters bijwerken
cat > /tmp/body.json << 'EOF'
{
  "updateDetails": [
    {"name": "Server", "newValue": "newserver.database.windows.net"},
    {"name": "Database", "newValue": "ProductionDB"}
  ]
}
EOF
az rest --method post \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/Default.UpdateParameters" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json
```

Na het bijwerken van parameters of referenties: vernieuwen om de wijziging door te voeren.

Velden per gegevensbron: `datasourceType` (bijv. `AzureDataLakeStorage`, `Sql`, `AnalysisServices`), `connectionDetails` (`server`, `database` of `path`), `datasourceId`, `gatewayId`. Bij Direct Lake zie je de bron in de M-expressie van de TMDL.

Een model aan een gateway- of cloudverbinding koppelen: zie [verbindingen.md](verbindingen.md).

## Rechten

```bash
# Gebruikers van het model
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/users"

# Recht geven
cat > /tmp/body.json << 'EOF'
{
  "identifier": "user@contoso.com",
  "principalType": "User",
  "datasetUserAccessRight": "Read"
}
EOF
az rest --method post \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/users" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json

# Bestaand recht wijzigen: zelfde body (bijv. "ReadReshare") met --method put
```

Niveaus: `Read`, `ReadReshare`, `ReadExplore`, `ReadReshareExplore`, `ReadWrite`, `ReadWriteReshare`, `ReadWriteExplore`, `ReadWriteReshareExplore`, `None`.

Dit gaat over datasetrechten, **niet** over RLS-rollidmaatschap; dat beheer je in de Power BI-portal.

## DAX-query uitvoeren

Alleen-lezen DAX (`EVALUATE`) tegen het model; handig om metingen te testen en metadata op te vragen.

```bash
cat > /tmp/body.json << 'EOF'
{
  "queries": [
    {"query": "EVALUATE TOPN(10, 'Customer', 'Customer'[CustomerKey], ASC)"}
  ],
  "serializerSettings": {"includeNulls": true}
}
EOF
az rest --method post \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID/executeQueries" \
  --headers "Content-Type=application/json" \
  --body @/tmp/body.json
```

Met `"impersonatedUserName": "user@contoso.com"` in de body voer je de query uit in de RLS-context van die gebruiker (verplicht voor service principals als er RLS is).

**Grenzen:** alleen DAX (geen MDX/DMV), 1 query per verzoek, max. 100.000 rijen / 1.000.000 waarden / 15 MB, 120 verzoeken per gebruiker per minuut. Je hebt **Build**-recht nodig. Niet voor push-datasets, Excel-live-verbonden datasets of bronnen met SSO.

## Eigenschappen opvragen

Operationele metadata (alleen via de Power BI Datasets API):

```bash
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/$MODEL_ID"
```

| Eigenschap | Betekenis |
|---|---|
| `configuredBy` | Eigenaar / laatst geconfigureerd door |
| `createdDate` | Aanmaakdatum (ISO 8601) |
| `targetStorageMode` | `Abf` (Direct Lake), `PremiumFiles` (Import op Fabric), `Import` |
| `isRefreshable` | Kan vernieuwd worden (altijd `false` bij DirectQuery/LiveConnection) |
| `isEffectiveIdentityRequired` / `isEffectiveIdentityRolesRequired` | RLS vereist effectieve identiteit/rollen bij embedding |
| `isOnPremGatewayRequired` | On-premises gateway nodig |
| `queryScaleOutSettings` | `maxReadOnlyReplicas`, `autoSyncReadOnlyReplicas` |
| `upstreamDataflows` | Afhankelijke dataflows |
| `description`, `webUrl` | Beschrijving, browser-URL |

Met alleen **Read**-recht krijg je alleen `id` en `name`; voor alles heb je **Write** nodig.

Dataflow-afhankelijkheden voor alle modellen in een workspace:

```bash
az rest --method get \
  --resource "$RESOURCE_PBI" \
  --url "$API_PBI/groups/$WS_ID/datasets/upstreamDataflows"
```

Opslagmodus per tabel: zoek `mode:` in de partities van de TMDL (`directLake`, `import`, `directQuery`). Tabellen, kolommen, metingen, relaties en expressions lees je uit de TMDL-parts van `getDefinition`.

## Veelvoorkomende fouten

| Fout | Oorzaak | Oplossing |
|---|---|---|
| `Can't derive appropriate Azure AD resource from --url` | `--resource` ontbreekt | `--resource` toevoegen |
| `401 Unauthorized` | Verkeerde audience, verlopen token of geen rechten | Audience één keer corrigeren; blijft het, dan rechten: stop |
| `403 Forbidden` / `identity None` | Geen (voldoende) workspacerol | Minimaal Contributor nodig; stop en vraag de beheerder |
| `404 Not Found` | Verkeerd ID of item verwijderd | ID's opnieuw opzoeken |
| `429 Too Many Requests` | Rate limit | `Retry-After` afwachten |
| `"No subscriptions found"` bij `az login` | Tenant zonder Azure-abonnement | `az login --allow-no-subscriptions --tenant <tenantId>` |
| `jq` "Cannot iterate over null" | API gaf een fout in plaats van de verwachte vorm | Ruwe respons bekijken (`--output json`) |
| JSON breekt door speciale tekens | Escaping in de shell | Body naar bestand en `--body @bestand` |
