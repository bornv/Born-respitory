# Fabric-concepten

Achtergrond bij [SKILL.md](../SKILL.md). Bron: `common/COMMON-CORE.md`, `common/ITEM-DEFINITIONS-CORE.md` en het conceptuele deel van de skill `fabriciq` uit microsoft/skills-for-fabric (MIT).

## Hiërarchie

```
Tenant (één per organisatie, = Entra ID-tenant)
 └─ Capaciteit (F-SKU of P-SKU, rekenpool)
     └─ Werkruimte (workspace, moet aan een capaciteit hangen)
         └─ Item (Lakehouse, Warehouse, SemanticModel, Report, …; elk met een eigen GUID)
OneLake: één datalake voor de hele tenant; alle items bewaren data als Delta/Parquet
```

| Begrip | Betekenis |
|---|---|
| **Tenant** | Eén Fabric-instantie per organisatie, gekoppeld aan één Microsoft Entra ID-tenant. |
| **Capaciteit (capacity)** | Rekenpool (F-SKU of P-SKU) die de Fabric-workloads aandrijft. Elke werkruimte moet aan een capaciteit zijn toegewezen. |
| **Werkruimte (workspace)** | Container voor Fabric-items; bepaalt de grens voor samenwerking en beveiliging. "My workspace" is persoonlijk: geen workspace identity en niet te delen. |
| **Item** | Artefact in een werkruimte, bijvoorbeeld Lakehouse, Warehouse, Notebook of SemanticModel. Elk item heeft een unieke GUID (`itemId`). |
| **OneLake** | Eén uniform datalake voor de hele tenant. Alle items slaan hun data op als Delta/Parquet-bestanden in OneLake. |

## Werkruimterollen

Rollen die je via de API kunt toekennen (`POST /v1/workspaces/<workspaceId>/roleAssignments`):

| Rol | Gebruik in deze skill |
|---|---|
| `Admin` | Nodig voor o.a. Git connect/disconnect en een werkruimte aan een deployment-pipeline-stage koppelen |
| `Member` | Volstaat (net als Contributor) op bron- én doelwerkruimte voor een deploy via een deployment pipeline |
| `Contributor` | Minimaal nodig voor Git commit/update (met schrijfrecht op alle items) en voor deploys (op bron- én doelwerkruimte) |
| `Viewer` | — |

Principal-types bij een roltoewijzing: `User`, `Group`, `ServicePrincipal`.

```json
{ "principal": { "id": "<principalId>", "type": "User|Group|ServicePrincipal" }, "role": "Admin|Member|Contributor|Viewer" }
```

Je eigen werkruimtes filteren op rol: `GET /v1/workspaces?roles=Admin` (ook `Member`, `Contributor`, `Viewer`).

## Itemtypes die je vaak tegenkomt

Itemtypenamen zoals de REST API ze gebruikt (hoofdlettergevoelig in filters):

| Itemtype | Wat de bron erover zegt |
|---|---|
| `Lakehouse` | Aanmaken levert automatisch een SQL analytics endpoint op. Response bevat `properties.sqlEndpointProperties`, `oneLakeFilesPath`, `oneLakeTablesPath`. Data staat onder `Tables/` en `Files/`. Vereist capaciteit. |
| `Warehouse` | SQL-warehouse, bereikbaar via TDS (`<unique-id>.datawarehouse.fabric.microsoft.com:1433`). Het type-specifieke endpoint geeft `connectionString`. Heeft **geen** item-definitie-API. Vereist capaciteit. |
| `SQLEndpoint` | Wordt automatisch per Lakehouse/Warehouse aangemaakt en volgt zijn "ouder"; niet los deployen of vergelijken. |
| `SemanticModel` | Power BI semantisch model. Verversen via job `Refresh`. Definitieformaat `TMDL` (voorkeur) of `TMSL`. |
| `Report` | Power BI-rapport. Definitieformaat `PBIR` (voorkeur) of `PBIR-Legacy`. |
| `Notebook` | Spark-notebook. Uitvoeren via job `RunNotebook`; uitvoeren vereist capaciteit. |
| `DataPipeline` | Data Factory-pipeline. Uitvoeren via job `Pipeline`. |
| `Dataflow` | Dataflow (Gen2). Wordt **niet** door Catalog Search gevonden. |
| `SparkJobDefinition` | Spark-batchjob. Job `SparkJob`; vereist capaciteit. |
| `Environment` | Spark-omgeving (bibliotheken, compute-instellingen). |
| `Eventhouse`, `KQLDatabase` | Real-Time Intelligence (KQL). |
| `SQLDatabase` | SQL-database in Fabric (TDS via `<unique-id>.database.windows.net:1433`). |
| `VariableLibrary` | Variabelen per omgeving (dev/test/prod) voor notebooks en pipelines. |

Type-specifieke lijst-endpoints (geven extra `properties`, zoals verbindingsstrings):

```
GET /v1/workspaces/<workspaceId>/{lakehouses|warehouses|notebooks|semanticModels|kqlDatabases|sqlDatabases|dataPipelines|eventstreams|eventhouses|reports|environments}
```

## Capaciteitseisen

- Lakehouse, Warehouse, SparkJobDefinition en het uitvoeren van een Notebook vereisen een werkruimte met capaciteit. Zonder capaciteit: `FeatureNotAvailable`.
- Ook Git-integratie vereist een capaciteit (anders `WorkspaceHasNoCapacityAssigned`), net als deployment pipelines.
- Wijs bij voorkeur capaciteit toe bij het aanmaken van de werkruimte, of daarna via `POST /v1/workspaces/{id}/assignToCapacity`.
- Controleer dat `capacityAssignmentProgress` "Completed" is vóór je capaciteitsafhankelijke items aanmaakt (`GET /v1/workspaces/<workspaceId>` geeft `id`, `displayName`, `capacityId`, `capacityAssignmentProgress`).

Meer over SKU's en kosten: [capaciteit-en-kosten.md](capaciteit-en-kosten.md).

## Identiteiten

| Identiteit | Beschrijving |
|---|---|
| **User principal** | Interactieve gebruiker (UPN). Breedste API-ondersteuning. |
| **Service principal (SPN)** | App-registratie in Entra ID. Vereist admin consent + tenantinstelling. |
| **Managed identity** | Door Azure beheerd (system- of user-assigned). Werkt vanaf Azure-compute. |
| **Workspace identity** | Door Fabric beheerde SPN, gekoppeld aan een werkruimte. Aan te maken via werkruimte-instellingen of `POST .../provisionIdentity`. Gebruikt voor shortcuts, pipelines, semantische modellen en Dataflows Gen2. Geen geheim te beheren. Kan (stand medio 2025) niet gebruikt worden om vanuit notebooks programmatisch een token op te halen. |

Details: [authenticatie.md](authenticatie.md).

## Endpoints (publieke cloud)

| Dienst | URL |
|---|---|
| Fabric REST API | `https://api.fabric.microsoft.com/v1/` |
| OneLake DFS (globaal) | `https://onelake.dfs.fabric.microsoft.com` |
| OneLake DFS (regionaal) | `https://<region>-onelake.dfs.fabric.microsoft.com` |
| OneLake Blob (globaal) | `https://onelake.blob.fabric.microsoft.com` |
| OneLake API (algemeen) | `https://api.onelake.fabric.microsoft.com` |
| OneLake API (regionaal) | `https://<region>-api.onelake.fabric.microsoft.com` |
| OneLake workspace-scoped (Private Link) | `https://<wsid>.z<xy>.onelake.fabric.microsoft.com` |
| Warehouse / SQL Endpoint (TDS) | `<unique-id>.datawarehouse.fabric.microsoft.com:1433` |
| SQL Database (TDS) | `<unique-id>.database.windows.net:1433` |
| XMLA Endpoint | `powerbi://api.powerbi.com/v1.0/myorg/<workspace>` |
| Entra ID token-endpoint | `https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token` |
| Power BI REST API | `https://api.powerbi.com/v1.0/myorg/` |
| KQL Cluster URI | `https://trd-<hash>.z<n>.kusto.fabric.microsoft.com` (per item) |
| KQL Ingestion URI | `https://ingest-trd-<hash>.z<n>.kusto.fabric.microsoft.com` (per item) |

## OneLake-paden

OneLake gebruikt ADLS Gen2-compatibele REST API's:

```
https://onelake.dfs.fabric.microsoft.com/<workspace>/<item>.<itemtype>/<path>
```

ABFS-URI (voor Spark): `abfss://<workspace>@onelake.dfs.fabric.microsoft.com/<item>.<itemtype>/<path>`

- `<workspace>`: GUID of weergavenaam (gebruik voor ABFS de GUID; spaties zijn niet toegestaan).
- `<item>.<itemtype>`: bijvoorbeeld `MySalesLakehouse.Lakehouse`.
- `<path>`: `Tables/<tableName>` of `Files/<folder>/<file>`.

Verschillen met gewone ADLS Gen2:

- Werkruimtes en items maak/verwijder je niet via ADLS-API's, maar via de Fabric REST API.
- Rechten wijzig je niet via ADLS-API's.
- HEAD-aanroepen alleen op werkruimte- en tenantniveau.
- Genegeerde headers worden gemeld in `x-ms-rejected-headers`.

**Shortcuts** zijn virtuele verwijzingen naar andere opslag (OneLake, ADLS Gen2, S3, GCS). Je maakt ze via `POST /v1/workspaces/<workspaceId>/items/<lakehouseId>/shortcuts` (voorbeeld in [rest-patronen.md](rest-patronen.md)). Een shortcut kopieert geen data.

## Vragen in gewone taal over Power BI (FabricIQ)

De bron-skill `fabriciq` is bedoeld om zakelijke vragen in gewone taal te beantwoorden over **bestaande** Power BI-rapporten en semantische modellen. Hij werkt uitsluitend via het **FabricIQ MCP-endpoint**; deze skill gebruikt dat endpoint niet. Conceptueel verloopt zo'n vraag zo:

1. **Artefact bepalen**: rapport of semantisch model zoeken (of een geplakte Fabric/Power BI-URL herleiden). Bij meerdere sterke kandidaten: laat de gebruiker kiezen.
2. **Rapport bekijken**: pagina's, visuals, bindingen en filters. Het rapport verwijst naar het onderliggende semantisch model. **Rapport-ID ≠ model-ID**: queries draaien tegen het model.
3. **Modelschema lezen**: tabellen, kolommen, measures, relaties, *Custom Instructions* en *Verified Answers*.
4. **Verified Answers eerst**: als een vooraf goedgekeurd antwoord over dezelfde vraag gaat, heeft dat voorrang op zelfgeschreven DAX.
5. **Waarden opzoeken**: een genoemde klant/product/regio eerst opzoeken zodat het filter de exacte spelling gebruikt.
6. **DAX schrijven en uitvoeren**: bij voorkeur bestaande measures; rapport-, pagina- en visualfilters standaard toepassen.
7. **Antwoorden**: in gewone taal, kerngetallen vet, zonder DAX of technische namen; artefacten bij naam noemen.

Beperkingen volgens de bron:

- Alleen Power BI-rapporten en semantische modellen; geen paginated reports, dashboards of andere itemtypes.
- Nooit data verzinnen; alleen wat de queries opleveren.
- Mogelijke meldingen: geen toegang (de beheerder moet mogelijk Power BI MCP-toegang aanzetten), throttling, endpoint niet ingeschakeld in de tenant, of een time-out omdat het model nog koud geladen wordt.

DAX zelf schrijven of controleren: skill `fabric-semantic-model`.
