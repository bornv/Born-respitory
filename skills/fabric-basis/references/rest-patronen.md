# REST-patronen voor de Fabric API

Detail bij [SKILL.md](../SKILL.md). Bron: `common/COMMON-CORE.md` § Core Control-Plane REST APIs, Job Execution, OneLake Data Access en `common/COMMON-CLI.md` (microsoft/skills-for-fabric, MIT). Telemetrie-headers uit de bron zijn bewust weggelaten.

## Gereedschap

| Tool | Rol |
|---|---|
| `az login` | Aanmelden bij Entra ID (MFA, device code, SPN) |
| `az account get-access-token` | Token voor een specifieke audience (`--resource`) |
| `az rest` | **Primaire tool** voor Fabric REST: hangt zelf het token aan, mits `--resource` |
| `curl` | OneLake DFS/Blob en endpoints die `az rest` niet dekt |
| `jq` | JSON-responses verwerken |

## `az rest`-sjabloon

```bash
# JSON-body eerst naar een bestand:
cat > /tmp/body.json << 'EOF'
{"key": "value"}
EOF

az rest \
  --method {get|post|put|patch|delete} \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/{path}" \
  [--body @/tmp/body.json] \
  [--query "jmesPathExpression"] \
  [--output {json|table|tsv}]
```

- **Laat `--resource` nooit weg** bij Fabric-aanroepen. Dat is de meest gemaakte fout en geeft de cryptische melding "Can't derive appropriate Azure AD resource".
- Basis-URL: `https://api.fabric.microsoft.com/v1`. Alle aanvragen: `Authorization: Bearer <token>`; bij POST/PUT/PATCH ook `Content-Type: application/json`.
- Huidige API-versie: `v1`. De parameter `preview` is vervangen door `beta` (ondersteund tot 31 maart 2026).
- URL-encodeer weergavenamen in URL's; gebruik bij voorkeur GUID's.

### PowerShell

- `az` werkt in PowerShell hetzelfde, maar heredocs (`cat > ... << 'EOF'`) niet.
- Een inline `--body '{...}'` wordt in PowerShell verminkt tot een lege body (`InvalidInput: Unexpected end when reading JSON`). Schrijf de body altijd naar een bestand. Het patroon uit de bron:

  ```powershell
  @{displayName="MyItem"; type="Lakehouse"} | ConvertTo-Json -Compress | Out-File $env:TEMP\body.json
  az rest --method post --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces/<workspaceId>/items" --body "@$env:TEMP\body.json"
  ```

- Een `|` in een inline body wordt door PowerShell als pipeline-operator gezien: nog een reden voor een body-bestand.

### Nuttige response-headers

| Header | Gebruik |
|---|---|
| `x-ms-request-id` | Loggen voor supportverzoeken |
| `x-ms-operation-id` | ID van een long-running operation |
| `Location` | Poll-URL van een LRO |
| `Retry-After` | Wachttijd bij `202` en `429` |

## Veelgebruikte operaties

| Operatie | Methode | Pad | Opmerking |
|---|---|---|---|
| Catalog Search | POST | `/v1/catalog/search` | Body: `search`, `filter`, `pageSize` |
| Werkruimtes lijsten | GET | `/v1/workspaces` | `?roles=Admin` om op rol te filteren |
| Werkruimte op ID | GET | `/v1/workspaces/<workspaceId>` | |
| Items lijsten | GET | `/v1/workspaces/<workspaceId>/items` | `?type=Lakehouse` om te filteren |
| Item op ID | GET | `/v1/workspaces/<workspaceId>/items/<itemId>` | |
| Items per type | GET | `/v1/workspaces/<workspaceId>/{type}s` | Rijkere `properties` |
| Item per type + ID | GET | `/v1/workspaces/<workspaceId>/{type}s/<itemId>` | Rijkere `properties` |
| Werkruimte aanmaken | POST | `/v1/workspaces` | Body: `displayName`, `description`, `capacityId` |
| Rol toekennen | POST | `/v1/workspaces/<workspaceId>/roleAssignments` | Body: `principal` (id, type), `role` |
| Workspace identity | POST | `/v1/workspaces/<workspaceId>/provisionIdentity` | |
| Capaciteiten lijsten | GET | `/v1/capacities` | |
| Werkruimte aan capaciteit | POST | `/v1/workspaces/<workspaceId>/assignToCapacity` | Body: `capacityId` |

## Items aanmaken, wijzigen, verwijderen

Aanmaken (generiek, elk itemtype):

```bash
cat > /tmp/body.json << 'EOF'
{"displayName": "MyItem", "type": "Lakehouse", "description": "Optional description"}
EOF
az rest --method post --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items" \
  --body @/tmp/body.json --query "id" --output tsv
```

- Sommige itemtypes worden asynchroon aangemaakt (LRO, zie hieronder).
- Een Lakehouse krijgt automatisch een SQL analytics endpoint.
- Voor items met inhoud: eerst aanmaken, daarna `updateDefinition` (zie [item-definities.md](item-definities.md)).
- **Controleer eerst of het item al bestaat** (idempotent werken).

Metadata wijzigen:

```bash
cat > /tmp/body.json << 'EOF'
{"displayName": "Updated Name", "description": "Updated description"}
EOF
az rest --method patch --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$ITEM_ID" \
  --body @/tmp/body.json
```

Verwijderen (eerst bevestigen):

```bash
az rest --method delete --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$ITEM_ID"
```

## Paginering

Alle lijst-API's gebruiken **continuation tokens**:

1. Doe de eerste `GET`.
2. Is `continuationToken` niet null, herhaal dan met `?continuationToken=<waarde>`.
3. Ga door tot `continuationToken` null of leeg is.

Je kunt ook `continuationUri` direct gebruiken. **Wijzig het token niet**; het is ondoorzichtig.

Bash-lus uit de bron:

```bash
fetch_all_pages() {
  local URL="$1"
  local RESOURCE="https://api.fabric.microsoft.com"
  local ALL_ITEMS="[]"
  local NEXT_URL="$URL"

  while [ -n "$NEXT_URL" ]; do
    RESPONSE=$(az rest --method get \
      --resource "$RESOURCE" \
      --url "$NEXT_URL" \
      --output json 2>/dev/null)

    PAGE_ITEMS=$(echo "$RESPONSE" | jq -c '.value // []')
    ALL_ITEMS=$(echo "$ALL_ITEMS $PAGE_ITEMS" | jq -sc 'add')

    NEXT_URL=$(echo "$RESPONSE" | jq -r '.continuationUri // empty')
  done

  echo "$ALL_ITEMS"
}

# Gebruik:
ALL_WORKSPACES=$(fetch_all_pages "https://api.fabric.microsoft.com/v1/workspaces")
echo "$ALL_WORKSPACES" | jq '.[].displayName'
```

Catalog Search pagineert via `continuationToken` in de **body** (zie [items-zoeken.md](items-zoeken.md)).

## Long-Running Operations (LRO)

Veel muterende operaties geven `202 Accepted` met:

- `Location`: poll-URL
- `x-ms-operation-id`: GUID van de operatie
- `Retry-After`: seconden wachten

Stappen:

1. Lees `x-ms-operation-id` (of `Location`) en `Retry-After` uit de `202`-response.
2. Wacht `Retry-After` seconden (ontbreekt die: exponential backoff).
3. Poll `GET /v1/operations/<operationId>`. Response: `{ "status": "Running|Succeeded|Failed", "percentComplete" }`.
4. Herhaal tot `Succeeded` of `Failed`; stel een maximale wachttijd in.
5. Bij `Succeeded`: resultaat ophalen met `GET /v1/operations/<operationId>/result` (als de operatie een resultaat heeft).
6. Bij `Failed`: de fout netjes tonen, niet blind opnieuw starten.

`az rest` toont response-headers niet overzichtelijk. Voor betrouwbaar header-uitlezen gebruik je `curl -i` (zoals de helper hieronder) en poll je daarna eventueel met `az rest`.

Herbruikbare bash-helper (uit de bron, zonder telemetrie-header):

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

  # Geen 202: synchrone response direct teruggeven
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

Let op: bij lange operaties kan het token verlopen (meestal na 60–90 minuten). Haal dan in de poll-lus een nieuw token op.

## Rate limiting en throttling

HTTP `429 Too Many Requests` bevat een `Retry-After`-header. Je **moet** wachten.

| API-categorie | Limiet |
|---|---|
| Admin-API's | 200 verzoeken/uur per principal per tenant |
| Algemene Fabric-API's | Verschilt per endpoint |
| OneLake ADLS-API's | Standaard Azure Storage-throttling (per werkruimte) |
| Warehouse TDS | ca. 128 gelijktijdige verbindingen (verschilt per SKU) |

Aanpak:

- Retry met **exponential backoff + jitter**; respecteer altijd `Retry-After`.
- Geen strakke poll-lussen.
- Houd `x-ms-ratelimit-remaining-*`-headers in de gaten.
- Cache werkruimte- en itemmetadata in plaats van steeds opnieuw te lijsten.
- Opnieuw proberen bij 429/503/504; **niet** bij 400/403/404 (eerst de oorzaak oplossen).

## Jobs uitvoeren

```
POST /v1/workspaces/<workspaceId>/items/<itemId>/jobs/instances?jobType=<jobType>
```

| Itemtype | `jobType` |
|---|---|
| Notebook | `RunNotebook` |
| DataPipeline | `Pipeline` |
| SparkJobDefinition | `SparkJob` |
| SemanticModel | `Refresh` |

- `DefaultJob` werkt voor de meeste itemtypes **niet** (faalt stil). Gebruik de type-specifieke waarde.
- Response: `202 Accepted` met `Location` en `x-ms-operation-id`. Volg met het LRO-patroon of:

```
GET  /v1/workspaces/<workspaceId>/items/<itemId>/jobs/instances/<jobInstanceId>
POST /v1/workspaces/<workspaceId>/items/<itemId>/jobs/instances/<jobInstanceId>/cancel
```

Voorbeeld semantisch model verversen:

```bash
az rest --method post --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$MODEL_ID/jobs/instances?jobType=Refresh"
```

## Jobs inplannen

```
POST /v1/workspaces/<workspaceId>/items/<itemId>/jobs/<jobType>/schedules
```

```json
{
  "enabled": true,
  "configuration": {
    "startDateTime": "2026-01-01T06:00:00.000Z",
    "endDateTime": "2027-01-01T06:00:00.000Z",
    "type": "Daily",
    "interval": 1,
    "localTimeZoneId": "UTC",
    "times": ["06:00"]
  }
}
```

- Verplicht: `enabled`, `configuration.startDateTime`, `configuration.endDateTime`, `configuration.type`.
- `type`: `Daily`, `Weekly` (vereist ook `weekDays`), `Monthly`.
- Pad is `/jobs/{jobType}/schedules`, **niet** `/jobs/instances/schedules`.
- `endDateTime` weglaten geeft `400`.

Lijsten en verwijderen:

```
GET    /v1/workspaces/<workspaceId>/items/<itemId>/jobs/<jobType>/schedules
DELETE /v1/workspaces/<workspaceId>/items/<itemId>/jobs/<jobType>/schedules/<scheduleId>
```

## Capaciteit

```bash
az rest --method get --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/capacities" \
  --query "value[].{name:displayName, id:id, sku:sku, region:region}" --output table
```

Response-velden: `id`, `displayName`, `sku`, `region`, `state`. Filter op `"state": "Active"`. Leeg? Dan moet er capaciteit worden ingericht via de Fabric-portal of Azure.

Werkruimte toewijzen: `POST /v1/workspaces/<workspaceId>/assignToCapacity` met `{ "capacityId": "<capacityId>" }`, daarna controleren dat `capacityAssignmentProgress` "Completed" is.

## OneLake via `curl`

`az rest` is hier **niet** geschikt (audience is `https://storage.azure.com`). Alle OneLake-`curl`-aanroepen vereisen `-H "x-ms-version: 2021-06-08"`.

```bash
STORAGE_TOKEN=$(az account get-access-token --resource https://storage.azure.com --query accessToken --output tsv)
ONELAKE="https://onelake.dfs.fabric.microsoft.com"
AUTH=(-H "Authorization: Bearer $STORAGE_TOKEN" -H "x-ms-version: 2021-06-08")
WS="<workspaceGuid>"
LH="SalesLakehouse.Lakehouse"

# Bestanden op topniveau
curl -s "$ONELAKE/$WS/$LH?resource=filesystem&recursive=false" "${AUTH[@]}" | jq .

# Submap recursief
curl -s "$ONELAKE/$WS/$LH?resource=filesystem&recursive=true&directory=Tables" "${AUTH[@]}" | jq .

# Bestand lezen
curl -s "$ONELAKE/$WS/$LH/Files/raw/data.csv" "${AUTH[@]}"
```

Uploaden is drie stappen (create → append → flush):

```bash
FILE_PATH="Files/uploads/data.csv"
LOCAL_FILE="./data.csv"
FILE_SIZE=$(wc -c < "$LOCAL_FILE" | tr -d ' ')

curl -s -X PUT "$ONELAKE/$WS/$LH/$FILE_PATH?resource=file" "${AUTH[@]}" -H "Content-Length: 0"
curl -s -X PATCH "$ONELAKE/$WS/$LH/$FILE_PATH?action=append&position=0" "${AUTH[@]}" \
  -H "Content-Length: $FILE_SIZE" --data-binary @"$LOCAL_FILE"
curl -s -X PATCH "$ONELAKE/$WS/$LH/$FILE_PATH?action=flush&position=$FILE_SIZE" "${AUTH[@]}" \
  -H "Content-Length: 0"
```

## Shortcuts

```bash
cat > /tmp/body.json << 'EOF'
{
  "path": "Tables/external_data",
  "name": "my_shortcut",
  "target": {
    "oneLake": {
      "workspaceId": "<sourceWorkspaceId>",
      "itemId": "<sourceItemId>",
      "path": "Tables/source_table"
    }
  }
}
EOF
az rest --method post --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$LH_ID/shortcuts" \
  --body @/tmp/body.json
```

Lijsten: `GET .../items/$LH_ID/shortcuts`. Verwijderen: `DELETE .../items/$LH_ID/shortcuts/<naam>?path=<pad>`.

## CLI-specifieke valkuilen

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `"Can't derive appropriate Azure AD resource from --url"` | Fabric-URL is geen ingebouwd Azure-endpoint | Altijd `--resource "https://api.fabric.microsoft.com"` |
| `az rest` kapt grote JSON-bodies af | Escaping in de shell | Body naar bestand, `--body @body.json` |
| Complexe JSON met speciale tekens breekt | Escaping in de shell | Body naar bestand |
| Paginering geeft onvolledige resultaten | Alleen eerste pagina opgehaald | Pagineringslus gebruiken |
| LRO-poll met verlopen token | Token verliep tijdens lange operatie | Token opnieuw ophalen in de lus |
| `jq` "Cannot iterate over null" | API gaf een fout i.p.v. de verwachte vorm | stderr van `az rest` bekijken; `--output json` en ruwe response inspecteren |
| JMESPath met apostrof in naam | Standaard quoting werkt niet | Backticks: ``--query "value[?displayName==`Alice's Workspace`]"`` |
| `sqlcmd`-time-out | Poort 1433 uitgaand geblokkeerd of verkeerde FQDN | FQDN via REST opvragen; firewall: uitgaand TCP 1433, `*.datawarehouse.fabric.microsoft.com` en `*-pbidedicated.windows.net` toestaan |
| `sqlcmd`-authfout met `-G` | `az login`-sessie verlopen of verkeerde tenant | Opnieuw `az login`; `az account show` controleren |
