# REST API voor Dataflow Gen2 (authoring)

Dataflows aanmaken, definities lezen en schrijven, M testen met `executeQuery`, refreshes starten en definities via Git uitrollen. Alle Fabric-aanroepen gaan naar `https://api.fabric.microsoft.com/v1` met `--resource "https://api.fabric.microsoft.com"`. Inloggen en workspace-/item-ID's opzoeken: skill **fabric-basis**.

## Inhoud

| Sectie | Wanneer laden |
|---|---|
| [Endpoints in één oogopslag](#endpoints-in-één-oogopslag) | Snel het juiste endpoint vinden |
| [Gereedschap en variabelen](#gereedschap-en-variabelen) | `az`, `jq`, `base64`, `curl`, `uuidgen` |
| [Dataflow aanmaken](#dataflow-aanmaken) | Lege dataflow of met definitie |
| [Definitie lezen](#definitie-lezen-getdefinition) | `getDefinition`, 200 of 202 |
| [Definitie schrijven](#definitie-schrijven-updatedefinition) | `updateDefinition`, voorbeeld van begin tot eind |
| [M testen met executeQuery](#m-testen-met-executequery) | Preview vóór opslaan, Arrow-uitvoer, fouten |
| [Refresh starten](#refresh-starten) | `jobType=Refresh`, parameters, statuswaarden |
| [Schema](#schema) | Geplande refresh |
| [LRO-polling](#lro-polling) | 202 + `Location` afhandelen |
| [Git en CI/CD](#git-en-cicd) | Exporteren, uitrollen, omgevingsparameters |
| [Foutentabel](#foutentabel) | Veelvoorkomende fouten |

## Endpoints in één oogopslag

| Doel | Methode en pad | Antwoord |
|---|---|---|
| Dataflow aanmaken | `POST /v1/workspaces/{ws}/dataflows` | 201 (zonder definitie) of 202 LRO (met definitie, groot) |
| Eigenschappen wijzigen (naam/omschrijving) | `PATCH /v1/workspaces/{ws}/dataflows/{df}` | 200 |
| Verwijderen | `DELETE /v1/workspaces/{ws}/dataflows/{df}` | 200; onomkeerbaar, ook refreshhistorie weg |
| Definitie lezen | `POST /v1/workspaces/{ws}/dataflows/{df}/getDefinition` | 200 of 202 LRO |
| Definitie schrijven | `POST /v1/workspaces/{ws}/dataflows/{df}/updateDefinition?updateMetadata=true` | Meestal 200, soms 202 LRO |
| M evalueren (preview) | `POST /v1/workspaces/{ws}/dataflows/{df}/executeQuery` | 200 met Arrow-stroom, of 202 |
| Refresh starten | `POST /v1/workspaces/{ws}/dataflows/{df}/jobs/instances?jobType=Refresh` | 202 + `Location` |
| Schema's | `GET`/`POST /v1/workspaces/{ws}/items/{df}/jobs/Execute/schedules` | |
| LRO-status | `GET /v1/operations/{operationId}` (en `/result`) | |

Rechten: aanmaken, schrijven, verwijderen en refresh vereisen de workspacerol Contributor; scopes `Dataflow.ReadWrite.All` of `Item.ReadWrite.All`. `getDefinition` vereist lees- én schrijfrecht.

## Gereedschap en variabelen

| Tool | Rol |
|---|---|
| `az` | Inloggen (`az login`) en `az rest` (regelt het token zelf) |
| `jq` | JSON lezen en opbouwen |
| `base64` | Definitiedelen coderen/decoderen (`base64 -w0` op Linux) |
| `curl` | Alleen als je response-headers nodig hebt (bijv. `Location` bij 202); `az rest` toont die niet |
| `uuidgen` | `queryId` en `logicalId` voor nieuwe definities; in PowerShell `[guid]::NewGuid().Guid` |

```bash
WS_ID="<workspaceId>"; DF_ID="<dataflowId>"
RES="https://api.fabric.microsoft.com"; API="$RES/v1"
TOKEN=$(az account get-access-token --resource "$RES" --query accessToken -o tsv)   # alleen voor curl
```

JSON-body's altijd via een bestand: `--body "@/tmp/body.json"`. Op Windows: `--body "@$env:TEMP\body.json"`, geschreven als UTF-8 zonder BOM met `[IO.File]::WriteAllText($pad, $body, [System.Text.UTF8Encoding]::new($false))`. `Out-File` in Windows PowerShell 5.1 schrijft een BOM en breekt `az.exe`.

## Dataflow aanmaken

Lege dataflow (aanbevolen eerste stap):

```bash
printf '{"displayName":"%s"}' "my-df" > /tmp/shell.json
DF_ID=$(az rest --method post --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows" \
  --headers "Content-Type=application/json" \
  --body "@/tmp/shell.json" --query id -o tsv)
```

Je kunt ook direct een `definition` met de drie delen meesturen. Dan is die POST het opslagmoment (meld dat in je samenvatting, niet `updateDefinition`). `folderId` is optioneel; een niet-bestaande map geeft een fout. `displayName` hoeft niet uniek te zijn, dus gebruik een duidelijke naamconventie (bijv. omgevingsprefix).

## Definitie lezen (getdefinition)

```bash
HDR=$(mktemp); BODY=$(mktemp)
CODE=$(curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Length: 0" \
  "$API/workspaces/$WS_ID/dataflows/$DF_ID/getDefinition" \
  -D "$HDR" -o "$BODY" -w "%{http_code}")
if [ "$CODE" = "202" ]; then
  LOC=$(tr -d '\r' < "$HDR" | grep -i "^location:" | awk '{print $2}')
  RETRY=$(tr -d '\r' < "$HDR" | grep -i "^retry-after:" | awk '{print $2}'); RETRY=${RETRY:-5}
  while :; do
    sleep "$RETRY"
    OP=$(az rest --method get --resource "$RES" --url "$LOC")
    case "$(echo "$OP" | jq -r '.status // empty')" in
      Succeeded) DEF=$(az rest --method get --resource "$RES" --url "${LOC%/}/result"); break ;;
      Failed|Cancelled) echo "ERROR: getDefinition $(echo "$OP" | jq -r '.status')" >&2; exit 1 ;;
    esac
  done
else
  DEF=$(cat "$BODY")
fi
rm -f "$HDR" "$BODY"

MASHUP=$(echo "$DEF" | jq -r '.definition.parts[] | select(.path=="mashup.pq")          | .payload' | base64 -d)
META=$(  echo "$DEF" | jq -r '.definition.parts[] | select(.path=="queryMetadata.json") | .payload' | base64 -d)
PLAT=$(  echo "$DEF" | jq -r '.definition.parts[] | select(.path==".platform")          | .payload' | base64 -d)
```

Gedecodeerde tekst begint met rare tekens? Verwijder de UTF-8-BOM (`\xEF\xBB\xBF`).

## Definitie schrijven (updatedefinition)

`updateDefinition` vervangt de hele definitie. Stuur altijd `mashup.pq`, `queryMetadata.json` en `.platform` mee. Voeg `?updateMetadata=true` toe zodat wijzigingen in `.platform` (zoals de weergavenaam) ook worden doorgevoerd. Voeg geen `"format"`-veld toe aan `definition` (`400 InvalidDefinitionFormat`).

### Bestaande dataflow aanpassen

```bash
NEW_MASHUP=$(echo "$MASHUP" | sed 's/old-pattern/new-pattern/')   # of bewerk het bestand

MASHUP_B64=$(echo -n "$NEW_MASHUP" | base64 -w0)
META_B64=$(echo -n "$META" | base64 -w0)
PLAT_B64=$(echo -n "$PLAT" | base64 -w0)

cat > /tmp/update.json <<EOF
{"definition":{"parts":[
  {"path":"mashup.pq",          "payload":"${MASHUP_B64}", "payloadType":"InlineBase64"},
  {"path":"queryMetadata.json", "payload":"${META_B64}",   "payloadType":"InlineBase64"},
  {"path":".platform",          "payload":"${PLAT_B64}",   "payloadType":"InlineBase64"}
]}}
EOF
az rest --method post --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/updateDefinition?updateMetadata=true" \
  --headers "Content-Type=application/json" --body "@/tmp/update.json"
```

Nieuwe query toevoegen: extra `shared`-query in `mashup.pq` **en** een entry in `queriesMetadata` (met `queryId` en `queryName`).

### Nieuwe definitie opbouwen (Web-CSV-voorbeeld)

```bash
URL="https://example.com/data.csv"
MASHUP='section Section1;
shared Data = let
    Source = Csv.Document(Web.Contents("'"$URL"'"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true])
in Headers;'

COMPOSITE_ID="{\"ClusterId\":\"$CLUSTER_ID\",\"DatasourceId\":\"$CONN_ID\"}"
QUERY_META=$(jq -n --arg name "my-df" --arg cid "$COMPOSITE_ID" --arg url "$URL" --arg qid "$(uuidgen)" '{
  formatVersion: "202502",
  name: $name,
  queriesMetadata: { Data: { queryId: $qid, queryName: "Data" } },
  connections: [ { connectionId: $cid, kind: "Web", path: $url } ]
}')
PLATFORM=$(jq -n --arg name "my-df" --arg lid "$(uuidgen)" '{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json",
  metadata: { type: "Dataflow", displayName: $name },
  config: { version: "2.0", logicalId: $lid }
}')
# Daarna base64-coderen en opslaan zoals hierboven.
```

Hoe je `CONN_ID` en `CLUSTER_ID` krijgt: [connectoren-en-verbindingen.md](connectoren-en-verbindingen.md#koppelen-aan-de-dataflow).

### Na het opslaan

1. `getDefinition` opnieuw en controleer dat `queryMetadata.json` → `connections[]` intact is.
2. Pas dan refresh.

Een `connections[]`-array die alleen in de create-POST zat, is nog niet zichtbaar voor `executeQuery`; sla eerst minimaal één keer op via `updateDefinition` ("bootstrap-opslag") voordat je M met credentials test.

## M testen met executeQuery

`executeQuery` evalueert M tegen de gekoppelde verbindingen van één dataflow en geeft het resultaat als Apache Arrow IPC-stroom. Er wordt niets opgeslagen of ververst.

| Veld (body) | Verplicht | Toelichting |
|---|---|---|
| `QueryName` | ja | Naam van een `shared`-query in het meegestuurde document of in de opgeslagen `mashup.pq`. Veldnaam is hoofdletterongevoelig; `QueryName` is de gangbare vorm |
| `customMashupDocument` | nee | Volledig `section Section1; ...`-document als platte UTF-8-tekst (niet base64). Weglaten = opgeslagen query uitvoeren |

- Exacte namen: `executeQuery` (enkelvoud), `customMashupDocument` (niet `mashupDocument`).
- De body `{"queries":[…]}` faalt altijd met `400 DataflowExecuteQueryError: Invalid query name`. Eén query per aanroep.
- Er is geen automatische inpakking: een losse `let ... in` moet je zelf verpakken als `section Section1;\n\nshared <QueryName> = <expressie>;`.
- Het document wordt los geëvalueerd: alle parameters, hulpfuncties en andere queries moeten erin staan.
- `executeQuery` geeft de **volledige** dataset terug. Begrens bij grote bronnen met `Table.FirstN`, een datumfilter of `TOP N`, en haal die begrenzing weg vóór `updateDefinition`.

```bash
jq -n --arg q "Sample" --arg m 'section Section1;
shared Sample =
    let
        S = Sql.Database("server", "db"),
        T = S{[Schema="dbo", Item="Orders"]}[Data],
        F = Table.FirstN(T, 100)
    in
        F;' '{QueryName: $q, customMashupDocument: $m}' > /tmp/req.json

az rest --method post --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/executeQuery" \
  --headers "Content-Type=application/json" \
  --body "@/tmp/req.json" --output-file result.arrow

grep -q '"Error":"' result.arrow && echo "Preview mislukt: zie {\"Error\":...} in result.arrow"
```

### Resultaat controleren (drie stappen)

1. **Ingebedde fout.** HTTP 200 betekent niet dat het gelukt is. Bij een fout bevat de laatste kolom `PQ Arrow Metadata` iets als `{"Error":"Request is invalid and cannot be processed: ..."}`. De `grep` hierboven is snel maar kan vals alarm geven bij een kolom die letterlijk `Error` heet; de nette controle leest de schema-metadata met `pyarrow` (zie [verbruik-en-refreshhistorie.md](verbruik-en-refreshhistorie.md#arrow-uitvoer-lezen)).
2. **Eerste 10 rijen tonen** als markdowntabel. Dat vangt stille fouten: filter liet alles weg, verkeerde kolom of join-sleutel, verkeerde datumconversie.
3. **Foutcellen** verschijnen als `null`. Twijfel? Test met `try Stap{N}[Kol]` (zie [m-taal.md](m-taal.md#fouten-per-cel)).

### Statuscodes executeQuery

| Code | Betekenis | Actie |
|---|---|---|
| 200 | Arrow-stroom | Ook op ingebedde fout controleren |
| 202 | Loopt asynchroon | `Location` pollen tot 200, `Retry-After` respecteren |
| 400 `DataflowExecuteQueryError` | Ongeldige body of M | Body repareren, niet automatisch opnieuw |
| 401 | Token verlopen/verkeerde audience | Token vernieuwen, één keer opnieuw |
| 403 / 404 | Geen toegang / verkeerde ID's | Rechten of ID's repareren |
| 429 | Throttling | `Retry-After` |
| 500 / 503 | Tijdelijk | Terugvallen 1s, 2s, 4s; max. 3 keer |

| `InternalErrorCode` in `message` | Oorzaak |
|---|---|
| `RewriteDocumentFailed` / `QueryNotFound` | `QueryName` komt niet voor als `shared`-query |
| `ReinterpretRequestFailed` | Syntaxfout: geen `section`-kop, ontbrekende `;`, of ontbrekende parameter/hulpfunctie |
| `EvaluationError` met `TimedOut` | Bron te zwaar (~90 s waargenomen). Stuur de volledige opgeslagen `mashup.pq` mee als `customMashupDocument` plus `shared __PreviewCap = Table.FirstN(<Query>, 10);` en `QueryName: "__PreviewCap"` |

Ingebedde `{"Error":"Credentials are required to connect to the <source> source"}`: de verbinding is niet (goed) gekoppeld; eerst via `updateDefinition` koppelen.

## Refresh starten

```bash
# jobType moet "Refresh" zijn; "Pipeline" geeft 400 InvalidJobType.
LOCATION=$(curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"executionData":{"executeOption":"ApplyChangesIfNeeded"}}' \
  "$API/workspaces/$WS_ID/dataflows/$DF_ID/jobs/instances?jobType=Refresh" \
  -o /dev/null -D - | tr -d '\r' | grep -i "^location:" | awk '{print $2}')

ATTEMPT=0; MAX_POLLS=60
while [ "$ATTEMPT" -lt "$MAX_POLLS" ]; do
  STATUS=$(az rest --method get --url "$LOCATION" --resource "$RES" --query "status" -o tsv)
  echo "Status: $STATUS"
  case "$STATUS" in NotStarted|InProgress) ;; *) break ;; esac
  sleep 10; ATTEMPT=$((ATTEMPT + 1))
done
```

Met parameters overschrijven:

```json
{
  "executionData": { "executeOption": "ApplyChangesIfNeeded" },
  "parameters": [
    { "name": "ServerName", "value": "prod-server.database.windows.net", "type": "Automatic" },
    { "name": "StartDate", "value": "2025-06-01", "type": "Automatic" }
  ]
}
```

Runtime-parametertypes: `String`, `Boolean`, `Integer`, `Number`, `DateTime`, `DateTimeZone`, `Date`, `Time`, `Duration`, `Automatic`.

| Jobstatus | Betekenis |
|---|---|
| `NotStarted`, `InProgress` | Nog bezig; blijven pollen |
| `Completed` | Gelukt |
| `Failed`, `Cancelled` | Eindfout: `failureReason` (`errorCode`, `isRetriable`, `message`) letterlijk melden en stoppen |
| `Deduped` | Er liep al een refresh; deze trigger is overgeslagen. **Geen succes**: volg de lopende refresh, start niet opnieuw |

Max. aantal polls bereikt met `NotStarted`/`InProgress`: dat is een time-out van het pollen, geen uitkomst. Meld de ruwe jobinstantie.

Bij `Failed` met `isRetriable: false` of een workspace-brede `UnknownException`: niet opnieuw starten en niet blijven debuggen. Hoogstens één `executeQuery`-poging om een M- of bronfout te lokaliseren. Soms geeft `GET https://api.powerbi.com/v1.0/myorg/groups/{ws}/dataflows/{df}/transactions` (Power BI-audience) meer detail per entiteit.

> De algemene Fabric-documentatie noemt voor dataflows ook het jobtype `Execute` (`POST /v1/workspaces/{ws}/items/{df}/jobs/Execute/instances` of `.../items/{df}/jobs/instances?jobType=Execute`). De live geverifieerde route in de bron is `.../dataflows/{df}/jobs/instances?jobType=Refresh`.

## Schema

Een geplande refresh stel je in via de portal of via de algemene Fabric-scheduling-API:

```http
GET  /v1/workspaces/{workspaceId}/items/{dataflowId}/jobs/Execute/schedules
POST /v1/workspaces/{workspaceId}/items/{dataflowId}/jobs/Execute/schedules
```

Een schema heeft frequentie (bijv. elke 30 minuten, elk uur, dagelijks), tijdzone, start-/eindtijd en aan/uit. De exacte body volgt het standaard Fabric-schedulingmodel uit de Fabric REST API-referentie; die staat niet in de bron, dus controleer hem daar voordat je een body opstelt.

## LRO-polling

| Gepolde URL komt van | Statuswaarden | Succes |
|---|---|---|
| LRO-operatie (`getDefinition`, `updateDefinition`, async create) | `Running`, `Succeeded`, `Failed`, `Cancelled` (soms `NotStarted`) | `Succeeded` |
| Jobinstantie (`.../jobs/instances?jobType=...`) | `NotStarted`, `InProgress`, `Completed`, `Failed`, `Cancelled`, `Deduped` | `Completed` |

- Gebruik altijd de URL uit de `Location`-header; bouw die niet zelf (anders 404).
- Respecteer `Retry-After`; anders terugvallen 5s → 10s → 20s → 30s en een maximale wachttijd.
- Resultaat van een geslaagde operatie: `GET /v1/operations/{operationId}/result`.
- `POST /dataflows`, `updateDefinition` en `getDefinition` antwoorden meestal synchroon (200/201), maar kunnen 202 geven bij grote body's. Handel beide af.

## Git en CI/CD

In Git staat een Dataflow Gen2 als map met drie platte tekstbestanden:

```
MyDataflow.Dataflow/
├── .platform
├── mashup.pq
└── queryMetadata.json
```

`logicalId` in `.platform` is de stabiele sleutel voor Git-integratie en koppeling tussen omgevingen.

1. **Exporteren:** `getDefinition` → elk deel base64-decoderen → als bestand committen.
2. **Uitrollen:** bestanden lezen → base64-coderen → `updateDefinition` (alle drie delen) op de doelworkspace.
3. **Omgevingsverschil** (bijv. test- vs. productieserver): pas de standaardwaarden van de parameters in `mashup.pq` aan vóór het coderen.
4. Optioneel: refresh op de doelworkspace als validatie.

Gevoeligheidslabels zitten niet in de definitie; die beheer je via de portal of beheer-API's.

## Foutentabel

| Symptoom | Oplossing |
|---|---|
| 401 | `az login`; `--resource "https://api.fabric.microsoft.com"` |
| 405 op `getDefinition` | POST gebruiken |
| Queries verdwenen na `updateDefinition` | Alle drie delen meesturen |
| `formatVersion`-fout | `"202502"` |
| Weergavenaam niet bijgewerkt | `?updateMetadata=true` toevoegen |
| Fast Copy werkt niet | `[StagingDefinition = [Kind = "FastCopy"]]` vóór `section` |
| Query schrijft niets weg | `loadEnabled` staat op `false` |
| `400 InvalidDefinitionFormat` | `"format"` uit `definition` halen |
| `400 InvalidJobType` | `jobType=Refresh` |
| Inline `--body` geeft 400/lege body op Windows | Body via bestand (UTF-8 zonder BOM) |
| `EvaluateQuery` faalt op nieuwe dataflow | `EvaluateQuery` vereist een eerdere geslaagde refresh; gebruik voor previews `executeQuery` met `customMashupDocument` |
| `EntityUserFailure` / "Something went wrong" | (1) Is `updateDefinition` na aanmaken gedaan? (2) Credentialtype (OAuth2 onder Conditional Access); (3) `executeQuery` om M en bron te isoleren; (4) PBI `.../transactions` voor detail |
| 429 | `Retry-After` en exponentieel terugvallen |
