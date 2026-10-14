# Werkruimtes en items zoeken

Detail bij [SKILL.md](../SKILL.md). Bron: `common/COMMON-CORE.md` en `common/COMMON-CLI.md` § Finding Workspaces and Items, plus de skill `search-consumption-cli` (microsoft/skills-for-fabric, MIT).

## Zoekalgoritme

1. **Werkruimte én item zijn bekend:**
   1. Werkruimte opgegeven als naam? Zoek eerst het werkruimte-ID op (zie hieronder).
   2. Item opgegeven als naam? Zoek met dat werkruimte-ID het item op binnen de werkruimte.
2. **Werkruimte is niet bekend:** gebruik de **Catalog Search API** (`POST /v1/catalog/search`). Je kunt zoeken op naam, beschrijving of werkruimtenaam en filteren op type. De response bevat zowel het item-`id` als `hierarchy.workspace.id`: een tweede aanroep is niet nodig.
3. **Meerdere treffers?** Toon weergavenaam, type en werkruimtenaam en vraag welke bedoeld is.

Gebruik de API's precies zoals hier beschreven; ze hebben implementatiebeperkingen.

## Werkruimte opzoeken

**Heb je al een werkruimte-ID** (uit een eerdere response, een lijst of van de gebruiker)? Gebruik dan direct:

```
GET /v1/workspaces/<workspaceId>
```

Dat is een directe, op rechten gecontroleerde lookup zonder lijst- of filterproblemen. Response: `id`, `displayName`, `capacityId`, `capacityAssignmentProgress`.

**Alleen een naam?** Er bestaat geen "get workspace by name"-endpoint. Lijst en filter op `displayName`:

```bash
az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces" --query "value[?displayName=='Marketing'] | [0].id" --output tsv
```

- Filter op **`displayName`**, niet op `name`. Het werkruimte-object heeft geen `name`; `value[?name==...]` of `value[].{name:name}` geeft leeg/null en lijkt dan op "werkruimte niet gevonden".
- Dit doorzoekt alleen de **eerste pagina**. Bij veel werkruimtes: pagineren (zie [rest-patronen.md](rest-patronen.md)).
- Heb je het ID eenmaal, gebruik dan de directe ID-lookup voor de rest van de taak.
- Namen met een apostrof: gebruik backticks in de JMESPath-query, bijvoorbeeld ``--query "value[?displayName==`Alice's Workspace`]"``.
- De Catalog Search API vindt **items, geen werkruimtes**. Zoek werkruimtes altijd via `GET /v1/workspaces`.

Lijst-response: `{ "value": [{ "id", "displayName", "type": "Workspace", "capacityId" }], "continuationToken" }`. Filteren op je rol kan met `?roles=Admin|Member|Contributor|Viewer`.

## Item opzoeken als de werkruimte bekend is

```bash
az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces/<workspaceId>/items?type=Lakehouse" --query "value[?displayName=='SalesLakehouse'] | [0].id" --output tsv
```

- Ook dit leest alleen de eerste pagina; pagineer bij veel items.
- Response van de generieke lijst: `{ "value": [{ "id", "displayName", "type", "workspaceId" }], "continuationToken" }`.
- `?type=Lakehouse` verkleint de response.
- Heb je extra eigenschappen nodig (verbindingsstrings, SQL-endpoint), gebruik dan het type-specifieke endpoint, bijvoorbeeld `GET /v1/workspaces/<workspaceId>/lakehouses` of `.../warehouses/<warehouseId>`.

Eén item op ID:

```
GET /v1/workspaces/<workspaceId>/items/<itemId>
```

Verbindingsinformatie (SQL-verbindingsstrings, OneLake-paden):

```
GET /v1/workspaces/<workspaceId>/items/<itemId>/connections
```

### SQL-verbindingsgegevens opvragen

```bash
# Warehouse
az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces/<workspaceId>/warehouses/<itemId>" --query "properties.{server:connectionString, database:displayName}" --output table

# SQL analytics endpoint van een Lakehouse
az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces/<workspaceId>/lakehouses/<itemId>" --query "properties.sqlEndpointProperties.{server:connectionString, status:provisioningStatus}"

# SQL Database
az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces/<workspaceId>/sqlDatabases/<itemId>" --query "properties.{server:serverFqdn, database:databaseName}"
```

Bij een SQL-verbinding is `Initial Catalog` de **weergavenaam** van het item, niet de FQDN (anders: `Login failed... database not found`).

## Catalog Search (werkruimte onbekend)

```
POST /v1/catalog/search
{ "search": "<text>", "filter": "Type eq '<itemType>'", "pageSize": 10, "continuationToken": "..." }
```

- Vereiste gedelegeerde scope: `Catalog.Read.All`.
- `search` matcht op **weergavenaam**, **beschrijving** en **werkruimtenaam** van items.
- `search` mag leeg zijn: dan filter je alleen op type.
- `pageSize`: 1–1000.
- Response: `{ "value": [{ "id", "type", "catalogEntryType", "displayName", "description", "hierarchy": { "workspace": { "id", "displayName" } } }], "continuationToken" }`.
- **Dataflow (Gen1) en Dataflow (Gen2) worden niet ondersteund.** Gebruik voor dataflows `GET /v1/workspaces/{id}/items`.
- Nieuwe items verschijnen met vertraging (de bron noemt "meestal minuten, niet gegarandeerd" en elders "tot 24 uur"). Controleer een net aangemaakt item via `GET /v1/workspaces/{id}/items`.

### Stappen

1. Schrijf de body naar een bestand (voorkomt quotingproblemen met filterstrings).

   bash:

   ```bash
   cat > /tmp/body.json << 'EOF'
   {"search": "SalesLakehouse", "filter": "Type eq 'Lakehouse'", "pageSize": 10}
   EOF
   ```

   PowerShell (zelfde patroon als de bron gebruikt voor body-bestanden):

   ```powershell
   @{search="SalesLakehouse"; filter="Type eq 'Lakehouse'"; pageSize=10} | ConvertTo-Json -Compress | Out-File $env:TEMP\body.json
   ```

2. Voer de zoekopdracht uit en haal direct item- en werkruimte-ID op:

   ```bash
   az rest --method post --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/catalog/search" --body @/tmp/body.json --query "value[0].{itemId:id, workspaceId:hierarchy.workspace.id, name:displayName}" --output json
   ```

   In PowerShell: `--body "@$env:TEMP\body.json"`.

3. Meerdere treffers? Toon ze als tabel en laat kiezen:

   ```bash
   az rest --method post --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/catalog/search" --body @/tmp/body.json --query "value[].{name:displayName, type:type, workspace:hierarchy.workspace.displayName}" --output table
   ```

4. Geef het item-`id` en `hierarchy.workspace.id` door aan de volgende stap.

### Filtervoorbeelden

| Doel | Filter |
|---|---|
| Alleen lakehouses | `Type eq 'Lakehouse'` |
| Rapporten of semantische modellen | `Type eq 'Report' or Type eq 'SemanticModel'` |
| Notebooks uitsluiten | `Type ne 'Notebook'` |

Alleen `eq`, `ne`, `or` en haakjes zijn toegestaan. Combineer `eq` niet met `and`, `ne` niet met `or`, en `eq` en `ne` niet in hetzelfde filter. Typenamen zijn hoofdlettergevoelig. Volledige lijst types: [Catalog Search API reference](https://learn.microsoft.com/en-us/rest/api/fabric/core/catalog/search).

### Alle items van één type (tenantbreed, voor zover jij toegang hebt)

```json
{"search": "", "filter": "Type eq 'SemanticModel'", "pageSize": 1000}
```

### Paginering

Bevat de response een `continuationToken` dat niet null is, stuur het mee in de volgende body en herhaal tot het null is:

```json
{"search": "", "filter": "Type eq 'Lakehouse'", "pageSize": 100, "continuationToken": "<token>"}
```

### Fouten bij Catalog Search

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `401 Unauthorized` | Verkeerde audience of verlopen sessie | `--resource "https://api.fabric.microsoft.com"` controleren; `az login` |
| `InvalidPageSize` | `pageSize` buiten 1–1000 | Waarde tussen 1 en 1000 |
| `InvalidFilter` | Ongeldige filtersyntax | Alleen `eq`, `ne`, `or`, haakjes; zie combinatieregels hierboven |
| `TypeNotFound` | Onbekend itemtype in filter | Spelling (hoofdlettergevoelig) controleren |
| `FilterTooManyValues` | Meer dan 500 waarden in filter | Minder typewaarden gebruiken |
| `InvalidRequest` | Body ontbreekt | `--body` naar een geldig JSON-bestand laten wijzen |
| Leeg resultaat voor bekend item | Type niet ondersteund (Dataflow Gen1/Gen2) | `GET /v1/workspaces/{id}/items` gebruiken |
| Nieuw item niet gevonden | Indexeringsvertraging | Via `GET /v1/workspaces/{id}/items` controleren |
| Te veel resultaten | Zoektekst te breed | Typefilter toevoegen of specifiekere tekst |

## Na het vinden

Catalog Search is alleen om items te **vinden**. Wil je daarna data opvragen of inhoud wijzigen, ga naar de juiste route: item-definities ([item-definities.md](item-definities.md)), semantische modellen (`fabric-semantic-model`), rapporten (`fabric-powerbi-report`) of dataflows (`fabric-dataflows`).
