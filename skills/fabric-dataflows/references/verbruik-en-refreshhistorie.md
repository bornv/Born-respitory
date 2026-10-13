# Verbruik en refreshhistorie (alleen lezen)

Dataflows opsommen, parameters en M-code bekijken, refreshhistorie analyseren en een opgeslagen of losse query uitvoeren zonder iets te wijzigen.

**Alleen lezen.** In deze modus geen `Create Dataflow`, geen `updateDefinition`, geen `DELETE`/`PATCH`/`PUT`. De enige toegestane POST's zijn `getDefinition` en `executeQuery`. Vraagt iemand om iets te maken, wijzigen of verwijderen: zeg dat expliciet en behandel het als een aparte authoring-vraag ([rest-api.md](rest-api.md)). Het opzoeken van ondersteunde verbindingstypes (`supportedConnectionTypes`) hoort ook bij authoring.

## Inhoud

| Sectie | Wanneer laden |
|---|---|
| [Verkenningsvolgorde](#verkenningsvolgorde) | "Wat doet deze dataflow?" |
| [Rechten](#rechten) | 403 op `getDefinition` |
| [Definitie bekijken](#definitie-bekijken) | M-code en `queryMetadata.json` lezen |
| [Parameters](#parameters) | Welke invoer accepteert de dataflow |
| [Refreshhistorie](#refreshhistorie) | Laatste status, duur, foutredenen |
| [Query uitvoeren](#query-uitvoeren) | Opgeslagen query of losse alleen-lezen M |
| [Arrow-uitvoer lezen](#arrow-uitvoer-lezen) | Fouten detecteren, eerste 10 rijen tonen, CSV voor Excel |
| [Foutentabel](#foutentabel) | |

## Verkenningsvolgorde

```bash
RES="https://api.fabric.microsoft.com"; API="$RES/v1"

# 1. Workspaces
az rest --method get --resource "$RES" --url "$API/workspaces" \
  --query "value[].{name:displayName, id:id}" -o table

# 2. Dataflows in de workspace (geen serverfilter op naam: filter zelf)
az rest --method get --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows" \
  --query "value[].{name:displayName, id:id, desc:description}" -o table
DF_ID=$(az rest --method get --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows" \
  --query "value[?displayName=='Sales Data Pipeline'].id" -o tsv)

# 3. Eigenschappen
az rest --method get --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows/$DF_ID"

# 4. Parameters
az rest --method get --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/parameters" \
  --query "value[].{name:name, type:type, required:isRequired, default:defaultValue}" -o table

# 5. Definitie (POST) → mashup.pq decoderen
az rest --method post --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/getDefinition" \
  | jq -r '.definition.parts[] | select(.path=="mashup.pq") | .payload' | base64 --decode

# 6. Refreshhistorie
az rest --method get --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/jobs/instances" \
  --query "value[].{status:status, type:invokeType, start:startTimeUtc, end:endTimeUtc, error:failureReason}" -o table
```

- Lijsten zijn gepagineerd: herhaal met de `continuationToken` uit het laatste antwoord tot die ontbreekt of `null` is (geen offset/skip).
- `displayName` is niet uniek; werk verder met `id`.
- Vat daarna samen: welke queries, welke bronnen, wat wordt weggeschreven, hoe gaat het met de refreshes. Vermeld de gebruikte URL zodat de gebruiker de aanroep kan herhalen.

## Rechten

| Rol | Lijst | Ophalen | Parameters | Definitie | Jobs |
|---|---|---|---|---|---|
| Admin / Member / Contributor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Viewer | ✅ | ✅ | ✅ | ❌ | ✅ |

Een Viewer kan `getDefinition` niet aanroepen (403). Gebruik dan alleen parameters en jobhistorie om de dataflow te begrijpen. Ook `executeQuery` vereist Contributor of hoger.

## Definitie bekijken

`getDefinition` is een POST en kan 202 + `Location` teruggeven bij grote definities; poll dan zoals in [rest-api.md](rest-api.md#definitie-lezen-getdefinition).

| Deel | Waar je op let |
|---|---|
| `mashup.pq` | Bronnen, transformaties, afhankelijkheden tussen queries (`Source = AndereQuery`), `[StagingDefinition = [Kind = "FastCopy"]]` |
| `queryMetadata.json` | `queriesMetadata`: `loadEnabled` (`true` = wordt weggeschreven, `false` = hulpquery), `isHidden` (niet zichtbaar in de editor maar draait wel); `connections[]`; `computeEngineSettings` (`allowFastCopy`, `maxConcurrency`) |
| `.platform` | Type (`Dataflow`) en weergavenaam |

- `connectionId` kan een geneste JSON-string zijn (`{"ClusterId":…,"DatasourceId":…}`); parse als tekst.
- Lege of ontbrekende `connections[]` bij queries met bijv. `#table()`: normaal, er is geen externe bron. Meld "geen externe verbindingen (inline bron)" en verzin geen koppeling.

Querynamen uit `mashup.pq` halen:

```bash
az rest --method post --resource "$RES" --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/getDefinition" \
  | jq -r '.definition.parts[] | select(.path=="mashup.pq") | .payload' \
  | base64 --decode | grep -oP '(?<=shared )\w+(?= =)'
```

## Parameters

`GET .../dataflows/{df}/parameters` geeft per parameter `name`, `type`, `isRequired`, `description`, `defaultValue`.

| Type | Formaat | Voorbeeld |
|---|---|---|
| String | tekst | `"test-value"` |
| Boolean | true/false | `true` |
| Integer | int64 | `123456789` |
| Number | double | `3.14` |
| DateTime | `yyyy-MM-ddTHH:mm:ss.xxxZ` | `"2025-09-15T21:45:00.000Z"` |
| DateTimeZone | `yyyy-MM-ddTHH:mm:sszzz` | `"2025-09-15T21:45:00+02:00"` |
| Date | `yyyy-MM-dd` | `"2025-09-15"` |
| Time | `HH:mm:ss` | `"21:45:00"` |
| Duration | ISO 8601 | `"P5DT21H35M30S"` |

Geen parameters: de API geeft `DataflowNotParametricError` (4xx) of een lege `value`. Dat is geen fout; meld "deze dataflow heeft geen parameters" en controleer eventueel op `IsParameterQuery` in `mashup.pq`.

## Refreshhistorie

```bash
# Laatste 5
az rest --method get --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/jobs/instances?limit=5" \
  --query "value[].{Status:status, Start:startTimeUtc, End:endTimeUtc, Id:id}" -o table

# Alleen mislukte, met reden
az rest --method get --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/jobs/instances" \
  --query "value[?status=='Failed'].{start:startTimeUtc, reason:failureReason}" -o json
```

Dezelfde historie is ook beschikbaar via `GET /v1/workspaces/{ws}/items/{df}/jobs/instances`.

| Veld | Betekenis |
|---|---|
| `jobType` | Voor dataflows `Execute` |
| `invokeType` | `Manual`, `Scheduled` of `External` |
| `status` | `NotStarted`, `InProgress`, `Completed`, `Failed`, `Cancelled`, `Deduped` |
| `startTimeUtc` / `endTimeUtc` | Begin/einde (`endTimeUtc` is `null` zolang hij loopt) |
| `failureReason` | Foutdetails bij `Failed` |

Analyse die je kunt maken: laatste geslaagde refresh, gemiddelde duur van `Completed`-jobs, terugkerende foutpatronen, gepland vs. handmatig. Een lopende operatie volg je met `GET /v1/operations/{operationId}` (tenantniveau, zonder workspace-prefix).

## Query uitvoeren

`executeQuery` dient twee alleen-lezen doelen:

| Doel | Body |
|---|---|
| Opgeslagen query uitvoeren | `{"QueryName":"<shared-naam>"}` (geen `customMashupDocument`) |
| Losse M uitvoeren zonder op te slaan | `{"QueryName":"X","customMashupDocument":"section Section1; shared X = ...;"}` |

Wil je de M daarna opslaan, dan is het authoring (zie [rest-api.md](rest-api.md#m-testen-met-executequery)).

```bash
jq -n --arg q "SalesData" '{QueryName: $q}' > req.json
az rest --method post --resource "$RES" \
  --url "$API/workspaces/$WS_ID/dataflows/$DF_ID/executeQuery" \
  --body "@req.json" --output-file SalesData_results.arrow
```

- Gebruik altijd `--output-file`; het antwoord is binaire Arrow, geen JSON. Niet door `jq` halen.
- Gebruik geen zelfverwijzing als `shared X = #shared[X]`; stuur gewoon alleen `QueryName`.
- Te zware opgeslagen query (`TimedOut`): niet dezelfde body herhalen. Stuur de volledige `mashup.pq` als `customMashupDocument` plus `shared __PreviewCap = Table.FirstN(<Q>, 10);` met `QueryName: "__PreviewCap"`.
- Meld bij de resultaten letterlijk welke `QueryName` je stuurde en of het een opgeslagen `shared`-query of een niet-opgeslagen `customMashupDocument` was.

## Arrow-uitvoer lezen

Vereist lokaal Python met `pyarrow` en `pandas` (optioneel `tabulate` voor markdown). Probeer eerst het stream-formaat, val terug op het file-formaat.

### Fouten detecteren en eerste 10 rijen tonen

```python
import json, sys, pyarrow as pa, pyarrow.ipc as ipc

ARROW_FILE, N = "SalesData_results.arrow", 10
with open(ARROW_FILE, "rb") as f:
    try:
        reader = ipc.open_stream(f)
    except pa.lib.ArrowInvalid:
        f.seek(0); reader = ipc.open_file(f)
    for v in (reader.schema.metadata or {}).values():
        s = v.decode("utf-8", errors="replace")
        if '"Error"' in s:
            try:
                msg = json.loads(s)["Error"]
            except (ValueError, KeyError):
                msg = s[:200]
            sys.exit(f"Preview failed: {msg}")
    table = reader.read_all()

print(f"**{table.num_rows} rows × {table.num_columns} columns** · {', '.join(table.schema.names)}\n")
if table.num_rows:
    df = table.slice(0, N).to_pandas().copy()
    for c in df.select_dtypes(include=["object", "string"]).columns:
        df[c] = df[c].astype(str).str.slice(0, 50)
    try:
        print(df.to_markdown(index=False))
    except ImportError:
        print(df.to_string(index=False))
```

Toon de eerste 10 rijen standaard. Sla dat alleen over als de gebruiker expliciet alleen het bestand wil of als het resultaat direct naar een ander hulpmiddel gaat; bij meer dan ~1000 rijen toon je de eerste 10 plus het totaal. Een lege tabel is een geldig resultaat (0 rijen), geen fout.

### Naar CSV voor Excel

```python
import pyarrow as pa

with open("SalesData_results.arrow", "rb") as f:
    table = pa.ipc.open_stream(f).read_all()
table.to_pandas().to_csv("SalesData_results.csv", index=False)
```

Voer eerst de foutcontrole hierboven uit; een mislukte stroom geeft anders verwarrende parsefouten.

## Foutentabel

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `401 Unauthorized` | Token verlopen of verkeerde audience | `az login`; `--resource "https://api.fabric.microsoft.com"` |
| `403 Forbidden` op `getDefinition` | Viewer-rol | Contributor of hoger nodig |
| `404` / `ItemNotFound` | Verkeerde ID | Opnieuw opzoeken via de lijst |
| `getDefinition` geeft 202 | Grote definitie of drukte | `Location` pollen |
| `DataflowNotParametricError` | Geen parameters | Geen fout; zo melden |
| Base64 geeft rare tekens | BOM | `\xEF\xBB\xBF` verwijderen |
| `429 TooManyRequests` | Throttling | `Retry-After`, exponentieel terugvallen |
| Dubbele resultaten in lijst | Oude `continuationToken` | Altijd de token van het laatste antwoord |
| `OperationNotSupportedForItem` / `InvalidItemType` | Item is geen `Dataflow` | Itemtype controleren |
| `executeQuery` 200 maar data klopt niet | Ingebedde `{"Error":"..."}` | Foutcontrole + eerste 10 rijen |
| Polling stopt nooit | Geen time-out | Terugvallen 5s → 10s → 20s → 30s; max. bijv. 60 minuten |
