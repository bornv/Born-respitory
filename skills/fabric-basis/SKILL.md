---
name: fabric-basis
description: "Basiskennis Microsoft Fabric: concepten (tenant, capaciteit/capacity, werkruimte/workspace, item, OneLake, Lakehouse, Warehouse), werkruimtes en items zoeken met hun item ID (Catalog Search, item zoeken), authenticatie en token-audiences (az login, az rest, token, 401/403/429), REST API-patronen (paginering, LRO-polling, throttling), item-definities (getDefinition/updateDefinition, base64-parts), deployment pipelines, Git-integratie en capaciteit/SKU-overzicht. Gebruik bij vragen als 'hoe vind ik het ID van mijn werkruimte', 'waarom krijg ik 401 op de Fabric API', 'wat is een Lakehouse', 'hoe werkt een deployment pipeline'. Voor semantische modellen/DAX/TMDL: fabric-semantic-model. Voor Power BI-rapporten (PBIR): fabric-powerbi-report. Voor Dataflows Gen2: fabric-dataflows."
---

# Fabric-basis

Gebaseerd op [microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric) (MIT, © Microsoft Corporation): `common/COMMON-CORE.md`, `common/COMMON-CLI.md`, `common/ITEM-DEFINITIONS-CORE.md` en de skills `search-consumption-cli`, `fabriciq`, `deployment-pipelines-authoring-cli`, `git-integration-operations-cli`, `e2e-fabric-cost-estimation`, commit bc42aaf. Vertaald en ingekort; zonder MCP-servers en telemetrie-headers.

Deze skill helpt je Microsoft Fabric te begrijpen en de Fabric REST API veilig aan te roepen. Jij voert de commando's zelf uit (`az` in PowerShell of bash); de skill legt uit wat je moet draaien, wat je terugkrijgt en wat een foutmelding betekent.

## Uitgangspunten

- **Gebruik API's precies zoals beschreven.** Ze hebben implementatiebeperkingen; verzin geen eigen varianten, filters of endpoints.
- **Nooit GUID's raden.** Werkruimte-, item-, pipeline- en stage-ID's altijd opzoeken (zie [items-zoeken.md](references/items-zoeken.md)).
- **Juiste token-audience = geen 401.** De verkeerde audience is de meest voorkomende oorzaak van `401 Unauthorized`.
- **`az rest` altijd met `--resource "https://api.fabric.microsoft.com"`.** Zonder dit krijg je `"Can't derive appropriate Azure AD resource from --url"`.
- **Filter op `displayName`, niet op `name`.** Een werkruimte-object heeft geen `name`; een query op `name` geeft leeg/null terug en lijkt dan op "werkruimte niet gevonden".
- **Body altijd via een bestand** (`--body @body.json`). Een inline JSON-body wordt in PowerShell (`az` is daar `az.cmd`) verminkt tot een lege body.
- **Muterende acties bevestigen.** Vraag bevestiging vóór verwijderen, ontkoppelen, `updateFromGit` of een deploy naar productie.
- Je bent waarschijnlijk geen Fabric-admin. Tenant-instellingen (zoals *Service principals can use Fabric APIs*) kun je zelf niet aanzetten: benoem dan wat de admin moet doen.

## Werkwijze

| Vraag of taak | Aanpak | Laad |
|---|---|---|
| "Wat is een werkruimte / capaciteit / Lakehouse / OneLake?" | Leg uit met de hiërarchie hieronder | [concepten.md](references/concepten.md) |
| Inloggen, token ophalen, 401 onderzoeken | `az login` → token voor de juiste audience → `aud` controleren | [authenticatie.md](references/authenticatie.md) |
| ID van werkruimte vinden | `GET /v1/workspaces` + filter op `displayName` | [items-zoeken.md](references/items-zoeken.md) |
| ID van item vinden, werkruimte bekend | `GET /v1/workspaces/<id>/items?type=<Type>` + filter op `displayName` | [items-zoeken.md](references/items-zoeken.md) |
| Item vinden, werkruimte onbekend | `POST /v1/catalog/search` | [items-zoeken.md](references/items-zoeken.md) |
| Lijsten met meer dan één pagina | `continuationToken` / `continuationUri` volgen | [rest-patronen.md](references/rest-patronen.md) |
| Aanroep geeft `202 Accepted` | LRO pollen via `Location` / `x-ms-operation-id` | [rest-patronen.md](references/rest-patronen.md) |
| `429 Too Many Requests` | Wachten op `Retry-After`, exponential backoff | [rest-patronen.md](references/rest-patronen.md) |
| Notebook/pipeline draaien, model verversen | `POST .../jobs/instances?jobType=<type>` | [rest-patronen.md](references/rest-patronen.md) |
| Inhoud van een item lezen of schrijven | `getDefinition` / `updateDefinition` met base64-parts | [item-definities.md](references/item-definities.md) |
| Dev → test → prod promoveren | Deployment pipeline | [alm-deployment-en-git.md](references/alm-deployment-en-git.md) |
| Werkruimte koppelen aan Azure DevOps/GitHub | Git-integratie | [alm-deployment-en-git.md](references/alm-deployment-en-git.md) |
| Welke capaciteit/SKU, wat kost het? | CU-model en SKU-tabel; prijzen altijd live | [capaciteit-en-kosten.md](references/capaciteit-en-kosten.md) |
| Vraag in gewone taal over een Power BI-rapport/-model | Zie "Vragen stellen aan Power BI-data" hieronder | [concepten.md](references/concepten.md) |
| DAX, TMDL, measures | Andere skill | `fabric-semantic-model` |
| Rapportlay-out, PBIR, visuals | Andere skill | `fabric-powerbi-report` |
| Dataflow Gen2, Power Query (M) | Andere skill | `fabric-dataflows` |

## Kernconcepten in het kort

| Begrip | Betekenis |
|---|---|
| **Tenant** | Eén Fabric-omgeving per organisatie, gekoppeld aan één Microsoft Entra ID-tenant. |
| **Capaciteit (capacity)** | Rekenpool (F-SKU of P-SKU) die Fabric-workloads aandrijft. Elke werkruimte moet aan een capaciteit hangen. |
| **Werkruimte (workspace)** | Container voor items; grens voor samenwerking en beveiliging. "My workspace" is persoonlijk (geen workspace identity, niet te delen). |
| **Item** | Artefact in een werkruimte (Lakehouse, Warehouse, Notebook, SemanticModel, Report, …). Elk item heeft een unieke GUID (`itemId`). |
| **OneLake** | Eén datalake voor de hele tenant. Alle items slaan data op als Delta/Parquet-bestanden in OneLake. |

Lakehouse, Warehouse, SparkJobDefinition en het uitvoeren van Notebooks vereisen een werkruimte met capaciteit; zonder capaciteit krijg je `FeatureNotAvailable`. Meer in [concepten.md](references/concepten.md).

## Snelstart: inloggen en je werkruimtes zien

1. Log in. Heb je geen Azure-abonnement (vaak bij Fabric-gebruikers), gebruik dan `--allow-no-subscriptions`:

   ```bash
   az login --allow-no-subscriptions --tenant <tenantId>
   ```

2. Controleer met welke identiteit en tenant je bent ingelogd:

   ```bash
   az account show --output table
   ```

3. Toon je werkruimtes als tabel (werkt in PowerShell en bash, op één regel):

   ```bash
   az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces" --query "value[].{name:displayName, id:id}" --output table
   ```

4. Zoek het ID van één werkruimte op naam:

   ```bash
   az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces" --query "value[?displayName=='Marketing'] | [0].id" --output tsv
   ```

   Let op: dit doorzoekt alleen de eerste pagina. Bij veel werkruimtes moet je pagineren (zie [rest-patronen.md](references/rest-patronen.md)).

5. Lijst de items in die werkruimte (optioneel gefilterd op type):

   ```bash
   az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/workspaces/<workspaceId>/items?type=Lakehouse"
   ```

> In bash kun je lange commando's afbreken met `\`; in PowerShell met een backtick `` ` `` of zet je alles op één regel.

## Token-audiences (kernpunt voor 401)

Alle Fabric REST-aanroepen vereisen een **Microsoft Entra ID OAuth 2.0 bearer token**. Fabric ondersteunt geen API-keys, SAS-tokens of SQL-authenticatie voor de REST API's.

| Doel | Audience / scope |
|---|---|
| Fabric REST API | `https://api.fabric.microsoft.com/.default` |
| Power BI REST API (legacy) | `https://analysis.windows.net/powerbi/api/.default` |
| OneLake (DFS / Blob) | `https://storage.azure.com/.default` |
| Warehouse / SQL Endpoint / SQL Database (TDS) | `https://database.windows.net/.default` |
| KQL / Kusto | `https://kusto.kusto.windows.net/.default` (of per-cluster URI) |
| XMLA Endpoint | `https://analysis.windows.net/powerbi/api/.default` |
| Azure Resource Management | `https://management.azure.com/.default` |

OneLake accepteert **alleen** `https://storage.azure.com/.default`; `https://datalake.azure.net/` faalt. Details, inlogvarianten en het decoderen van een token: [authenticatie.md](references/authenticatie.md).

## REST-basispatronen in het kort

- **Basis-URL:** `https://api.fabric.microsoft.com/v1`. Headers: `Authorization: Bearer <token>` en bij POST/PUT/PATCH `Content-Type: application/json`.
- **Paginering:** lijst-API's geven `continuationToken` (en `continuationUri`). Herhaal tot die leeg/null is. Wijzig het token niet; het is ondoorzichtig.
- **LRO:** veel mutaties geven `202 Accepted` met `Location`, `x-ms-operation-id` en `Retry-After`. Poll `GET /v1/operations/<operationId>` tot `Succeeded` of `Failed`; haal daarna het resultaat op met `GET /v1/operations/<operationId>/result`.
- **Throttling:** `429` bevat `Retry-After`; je **moet** wachten. Gebruik exponential backoff met jitter. Admin-API's: 200 verzoeken per uur per principal per tenant.
- **Transient vs. permanent:** opnieuw proberen bij 429/503/504; repareren (niet herhalen) bij 400/403/404.
- **Bewaar `x-ms-request-id`** uit responses voor supportverzoeken.

Volledige recepten (`az rest`-sjabloon, pagineringslus, LRO-helper, jobs en schema's): [rest-patronen.md](references/rest-patronen.md).

## Item-definities in het kort

- `getDefinition` is een **POST** (geen GET) en vereist een lege body (`--body '{}'`), anders krijg je `411`.
- Een definitie is een envelop met `format` en `parts`; elke part heeft `path`, `payload` (Base64) en `payloadType` (altijd `InlineBase64`).
- De `.platform`-part (metadata) wordt alleen door `updateDefinition` verwerkt met `?updateMetadata=true`; zonder die parameter wordt hij **stil genegeerd**.
- `format` is per itemtype: `TMDL` (voorkeur) of `TMSL` voor SemanticModel, `PBIR` (voorkeur) of `PBIR-Legacy` voor Report, `ipynb` voor Notebook. Warehouse heeft **geen** item-definitie-API.

Envelop, per-type parts en voorbeelden: [item-definities.md](references/item-definities.md).

## Deployment pipelines en Git in het kort

| | Deployment pipeline | Git-integratie |
|---|---|---|
| Doel | Inhoud promoveren tussen stages (Development → Test → Production) | Werkruimte-items versiebeheren in Azure DevOps of GitHub |
| Kern | 2–10 stages, max. één werkruimte per stage; deploy is een LRO | Eén werkruimte ↔ één repo + branch + map; commit en update |
| Rechten | Pipeline-**Admin** + werkruimterol (Admin voor (ont)koppelen, minimaal Contributor/Member voor deploy) | **Admin** voor connect/disconnect; minimaal **Contributor** (schrijfrecht op alle items) voor commit/update |
| Let op | Deployment-/parameterregels kunnen alleen in de portal; deploy kopieert definities, geen data | GitHub-sync staat tenantbreed standaard **uit**; werkruimte moet een capaciteit hebben |

Stappen en valkuilen: [alm-deployment-en-git.md](references/alm-deployment-en-git.md).

## Vragen stellen aan Power BI-data (FabricIQ)

De bron-skill `fabriciq` beantwoordt vragen in gewone taal over bestaande Power BI-rapporten en semantische modellen: artefact zoeken, rapport- en modelschema lezen, waarden opzoeken, zelf DAX genereren en het antwoord in gewone taal teruggeven. Dat werkt **alleen via het FabricIQ MCP-endpoint**, dat deze skill niet gebruikt. Bruikbare principes uit die bron:

- Rapport-ID ≠ semantisch-model-ID. Queries draaien tegen het **model**; het rapport vertelt welk model en welke filters gelden.
- Pas standaard de rapport-, pagina- en visualfilters toe; wijk alleen af als de vraag daar expliciet om vraagt (en meld dat).
- Volg de *Custom Instructions* en *Verified Answers* van het model; verzin nooit data.
- Alleen Power BI-rapporten en semantische modellen worden ondersteund (geen paginated reports of dashboards).

Voor het schrijven of controleren van DAX: gebruik `fabric-semantic-model`.

## Power Automate en Fabric REST

De bron beschrijft geen Power Automate-connectoren of -acties voor Fabric. Wil je de Fabric REST API vanuit een flow of ander hulpmiddel aanroepen, dan gelden dezelfde REST-feiten als hierboven: een Entra ID-bearertoken met audience `https://api.fabric.microsoft.com/.default`, `202`-antwoorden die je moet pollen, en `429` met `Retry-After`. Voor onbeheerde automatisering (zonder ingelogde gebruiker) is volgens de bron een service principal met *Application permissions*, admin consent én de tenantinstelling *Service principals can use Fabric APIs* nodig. Zie [authenticatie.md](references/authenticatie.md).

## Veelvoorkomende fouten

| Fout / status | Waarschijnlijke oorzaak | Oplossing |
|---|---|---|
| `401 Unauthorized` | Verkeerde token-audience, verlopen token of onvoldoende rechten | Decodeer het token en controleer `aud`; gebruik de juiste audience (tabel hierboven); log opnieuw in |
| `401` "Audience validation failed" | Token-audience past niet bij de dienst (bijv. Fabric-token naar OneLake) | Voor OneLake `--resource https://storage.azure.com` gebruiken |
| `"Can't derive appropriate Azure AD resource from --url"` | `az rest` zonder `--resource` | Altijd `--resource "https://api.fabric.microsoft.com"` meegeven |
| `AADSTS500011: resource not found` | Verkeerd geschreven resource-URI | Exacte string gebruiken, zonder varianten met afsluitende slash |
| `403 Forbidden` | Werkruimterol of itemrecht ontbreekt | Rolverdeling controleren; bij service principals de admin-portalinstellingen laten controleren |
| `404 Not Found` | Verkeerd werkruimte-/item-ID of item verwijderd | Werkruimte/item opnieuw opzoeken |
| `411` bij `getDefinition` | Lege body ontbreekt | `--body '{}'` meegeven |
| `429 Too Many Requests` | Rate limit overschreden | Wachten op `Retry-After`, dan opnieuw |
| `FeatureNotAvailable` | Werkruimte heeft geen capaciteit | Capaciteit toewijzen; wachten tot `capacityAssignmentProgress` = "Completed" |
| `PrincipalTypeNotSupported` | Service principal gebruikt waar alleen een gebruiker mag | Sommige API's zijn alleen voor gebruikers; documentatie checken |
| `az login`: "No subscriptions found" | Fabric-tenant zonder Azure-abonnement | `az login --allow-no-subscriptions --tenant <tenantId>` |
| Leeg resultaat bij werkruimte-zoeken | Filter op `name` i.p.v. `displayName`, of alleen eerste pagina gelezen | Op `displayName` filteren; pagineren |
| Nieuw item niet gevonden in Catalog Search | Indexeringsvertraging | Via `GET /v1/workspaces/{id}/items` controleren |
| Lege `--body` / `InvalidInput: Unexpected end when reading JSON` | Inline JSON in PowerShell verminkt | Body naar bestand schrijven, `--body @bestand.json` |
| LRO-poll faalt halverwege | Token verlopen tijdens lange operatie (tokens leven meestal 60–90 minuten) | Token opnieuw ophalen in de poll-lus |

Specifieke fouten voor Catalog Search, deployment pipelines en Git staan in de bijbehorende references.

## Referenties

| Bestand | Inhoud | Wanneer laden |
|---|---|---|
| [references/concepten.md](references/concepten.md) | Hiërarchie, itemtypes, endpoints, OneLake-paden, capaciteitseisen, FabricIQ-concept | Bij uitlegvragen of als je een URL/endpoint zoekt |
| [references/authenticatie.md](references/authenticatie.md) | Audiences, `az login`-varianten, tokens ophalen en decoderen, identiteitstypes, app-registratie | Bij 401/403, inlogproblemen of service principals |
| [references/items-zoeken.md](references/items-zoeken.md) | Zoekalgoritme, werkruimte/item op naam, Catalog Search met filters en fouten | Als je een ID nodig hebt |
| [references/rest-patronen.md](references/rest-patronen.md) | `az rest`-sjabloon, CRUD, paginering, LRO, throttling, jobs, schema's, OneLake via `curl` | Bij het bouwen of debuggen van API-aanroepen |
| [references/item-definities.md](references/item-definities.md) | Definitie-envelop, `.platform`, ondersteunde types en parts | Bij `getDefinition` / `updateDefinition` |
| [references/alm-deployment-en-git.md](references/alm-deployment-en-git.md) | Deployment pipelines en Git-integratie: stappen, rechten, fouten | Bij promoveren of versiebeheer |
| [references/capaciteit-en-kosten.md](references/capaciteit-en-kosten.md) | CU-model, SKU-tiers, billing modes, P→F-mapping | Bij capaciteits- of kostenvragen |

## Controle voor oplevering

- [ ] Elk `az rest`-commando naar `api.fabric.microsoft.com` heeft `--resource "https://api.fabric.microsoft.com"`.
- [ ] De token-audience past bij de dienst (Fabric, OneLake, SQL, Power BI/XMLA).
- [ ] ID's zijn opgezocht, niet geraden; filters gebruiken `displayName`.
- [ ] Lijstaanroepen houden rekening met paginering.
- [ ] Muterende aanroepen die `202` kunnen geven, worden gepold tot `Succeeded`/`Failed`.
- [ ] Bij `429` wordt `Retry-After` gerespecteerd.
- [ ] JSON-bodies staan in een bestand (`--body @...`), zeker in PowerShell.
- [ ] Destructieve acties (verwijderen, ontkoppelen, `updateFromGit`, deploy naar productie) zijn eerst bevestigd.
- [ ] Geen geheimen (client secrets, tokens) in code, bestanden of chat; liever certificaten of managed identity, geheimen in Key Vault.
- [ ] Geen API's, scopes, rollen of instellingen genoemd die niet in deze skill staan; bij twijfel naar Microsoft Learn verwijzen.
- [ ] Prijzen nooit uit het hoofd: alleen live uit de Azure Retail Prices API, met regio en datum.
