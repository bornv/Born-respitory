# ALM: deployment pipelines en Git-integratie

Detail bij [SKILL.md](../SKILL.md). Bron: de overzichtsdelen van de skills `deployment-pipelines-authoring-cli` en `git-integration-operations-cli` (inclusief `references/git-integration-concepts.md` en `references/supported-item-types.md`) uit microsoft/skills-for-fabric (MIT). Dit is een ingekorte versie; volledige scripts (diffen van definities, service-principal-pijplijnen, workspace relations) zijn weggelaten.

## Welke kies je?

| Je wilt… | Gebruik |
|---|---|
| Inhoud gecontroleerd doorzetten van ontwikkel- naar test- naar productiewerkruimte | **Deployment pipeline** |
| Wijzigingen in items versiebeheren, terugkijken, samenwerken via branches | **Git-integratie** |

Beide kunnen naast elkaar bestaan. Alle aanroepen gaan naar `https://api.fabric.microsoft.com` met audience `https://api.fabric.microsoft.com` (verkeerde audience = `401`).

---

## Deployment pipelines

### Concepten

- Een **deployment pipeline** heeft **2–10 geordende stages** (`order` begint bij 0), meestal Development → Test → Production.
- Elke stage heeft **maximaal één toegewezen werkruimte**, en een werkruimte hoort bij maximaal één stage.
- Een **deploy** kopieert ondersteunde iteminhoud van een bronstage naar een **aangrenzende** doelstage.
  - Vooruit (dev → test → prod) kan altijd tussen aangrenzende stages.
  - **Achteruit** (bijv. prod → test) kan alleen als de doelstage **leeg** is (geen werkruimte).
- **Item-pairing (autobinding):** Fabric onthoudt welk bronitem bij welk doelitem hoort, zodat een volgende deploy overschrijft in plaats van dupliceert, en gerelateerde items (rapport ↔ semantisch model) gekoppeld blijven. Je kunt pairing niet via de API instellen, alleen bekijken (`sourceItemId` / `targetItemId` in *List stage items*).
- Een deploy is een **LRO**: `202 Accepted` met een operatie-ID (in de header `x-ms-operation-id`, niet in de body); pollen tot `Succeeded`/`Failed`.
- **Deployment rules en parameter rules** (bijv. per stage een andere databron) stel je in de **Fabric-portal** in; er is **geen REST API** om ze aan te maken.
- Alleen **ondersteunde itemtypes** worden gekopieerd; niet-ondersteunde items worden overgeslagen (geen fout).
- Er is **geen "wat is er veranderd"/compare-API**. De "Compare"-weergave in de portal is niet via de API beschikbaar.
- Een deploy kopieert **definities, geen data**. Tabeldata, queryresultaten en caches gaan niet mee: ververs/laad na een deploy in de doelstage.

### Benodigde rechten

Er zijn **twee** losse rechtensystemen: je rol op de **pipeline** én je rol op elke betrokken **werkruimte**. Meestal heb je beide nodig. Deployment pipelines vereisen een Fabric-capaciteit; wie de pipeline aanmaakt wordt pipeline-**Admin**.

| Operatie | Pipelinerol | Werkruimterol |
|---|---|---|
| Pipeline aanmaken | — (wordt **Admin**) | **Admin** van een Fabric-werkruimte |
| Pipeline, stages, items, operaties bekijken | **Admin** | — |
| Pipeline wijzigen/verwijderen, rollen beheren | **Admin** | — |
| Werkruimte aan stage koppelen/ontkoppelen | **Admin** | **Admin** van die werkruimte |
| **Deployen** | **Admin** | minimaal **Contributor/Member** op bron- én doelwerkruimte |
| Deployen naar lege stage (maakt werkruimte aan) | **Admin** | recht om de nieuwe werkruimte op een capaciteit te zetten; de deployer wordt enige Admin van de nieuwe werkruimte |

- Een pipeline delen geeft de **Admin**-rol; er is geen lagere schrijfrol.
- Een service principal kan dit alleen als de Fabric-admin *service principals can create deployment pipelines* heeft ingeschakeld.
- Bij `403`: maak duidelijk of de **pipelinerol** of de **werkruimterol** ontbreekt, zodat je weet welke toegang je moet aanvragen.

Gedelegeerde scopes per operatie:

| Operatie | Scope |
|---|---|
| Lijsten / ophalen | `Pipeline.Read.All` of `Pipeline.ReadWrite.All` |
| Pipeline aanmaken/wijzigen/verwijderen, stage wijzigen | `Pipeline.ReadWrite.All` |
| Werkruimte koppelen/ontkoppelen | `Pipeline.ReadWrite.All` **en** `Workspace.ReadWrite.All` |
| **Deployen** | **`Pipeline.Deploy`** (alleen `Pipeline.ReadWrite.All` geeft `403` op `POST .../deploy`) |

### Endpoints

Basis: `https://api.fabric.microsoft.com/v1`

| Operatie | Methode + pad |
|---|---|
| Pipelines lijsten | `GET /deploymentPipelines` |
| Pipeline aanmaken | `POST /deploymentPipelines` |
| Pipeline ophalen/wijzigen/verwijderen | `GET\|PATCH\|DELETE /deploymentPipelines/{id}` |
| Stages lijsten/ophalen | `GET /deploymentPipelines/{id}/stages[/{stageId}]` |
| Stage-items lijsten | `GET /deploymentPipelines/{id}/stages/{stageId}/items` |
| Werkruimte koppelen | `POST /deploymentPipelines/{id}/stages/{stageId}/assignWorkspace` |
| Werkruimte ontkoppelen | `POST /deploymentPipelines/{id}/stages/{stageId}/unassignWorkspace` |
| **Deployen (LRO)** | `POST /deploymentPipelines/{id}/deploy` |
| Recente operaties (≤ 20) | `GET /deploymentPipelines/{id}/operations` |
| Eén operatie (met uitvoeringsplan) | `GET /deploymentPipelines/{id}/operations/{operationId}` |
| Rollen | `GET\|POST\|DELETE /deploymentPipelines/{id}/roleAssignments[/{principalId}]` |

Body-vormen:

- **Aanmaken:** `{ "displayName", "description"?, "stages": [ { "displayName", "description"?, "isPublic" } ] }` (2–10 stages). `displayName` is **uniek in de hele tenant**.
- **Werkruimte koppelen:** `{ "workspaceId" }`.
- **Deploy:** `{ "sourceStageId", "targetStageId", "items"?: [ { "sourceItemId", "itemType" } ], "note"?, "options"?: { "allowCrossRegionDeployment": false }, "createdWorkspaceDetails"?: { "name", "capacityId"? } }`.

### Stappen: inhoud promoveren (bijv. dev → test)

1. Zoek pipeline-ID en stage-ID's op door te lijsten en op `displayName` te filteren. **Nooit raden.**

   ```bash
   az rest --method get --resource "https://api.fabric.microsoft.com" --url "https://api.fabric.microsoft.com/v1/deploymentPipelines" --query "value[?displayName=='Sales Analytics ALM'].id | [0]" --output tsv
   ```

2. Controleer dat de doelstage een werkruimte heeft. Zo niet: neem `createdWorkspaceDetails` (naam en zo nodig `capacityId`) op in de body, anders faalt de deploy.
3. Bekijk optioneel wat er meegaat: `GET .../stages/{stageId}/items`.
4. Controleer je rechten (pipeline-Admin + werkruimterollen) en vraag bevestiging bij deploy naar productie.
5. Start de deploy met een `note` (de API slaat die op maar geeft hem nooit terug; hij is alleen in de portal zichtbaar). Body via bestand:

   ```json
   { "sourceStageId": "<devStageId>", "targetStageId": "<testStageId>", "note": "Promote validated dev build" }
   ```

   Alleen bepaalde items: voeg `"items": [ { "sourceItemId": "<id>", "itemType": "SemanticModel" }, { "sourceItemId": "<id>", "itemType": "Report" } ]` toe. Zonder `items` gaan **alle** ondersteunde items mee.
6. Lees de operatie-ID uit header `x-ms-operation-id` (gebruik `curl -i` of `az rest --verbose`; `az rest` toont headers niet netjes) en poll `/v1/operations/{operationId}` tot `Succeeded` of `Failed`.
7. Meld welke items zijn gedeployed (of de foutreden). Ververs daarna de data in de doelstage.

### Let op

- **Eén deploy tegelijk per pipeline.** Een tweede starten terwijl er één loopt geeft `WorkspaceMigrationOperationInProgress` (HTTP 400). Ook werkruimte koppelen faalt tijdens een actieve deploy.
- **Eerste deploy na koppelen** kan falen met `Alm_InvalidRequest_WorkloadUnavailable`: een net gekoppelde werkruimte heeft ca. 60–120 s nodig. Wacht, of deploy eerst Power BI-items (`SemanticModel`, `Report`) en daarna Fabric-items (`Lakehouse`, `Notebook`); opnieuw proberen bij deze fout.
- **Maximaal 300 items per deploy**; verdeel grotere promoties over meerdere aanroepen.
- **Verwijderingen gaan niet mee bij een selectieve deploy.** Gebruik een volledige deploy (zonder `items`) of verwijder het doelitem handmatig, en waarschuw vooraf.
- Alleen gewijzigde items deployen kan alleen door zelf te vergelijken: `lastDeploymentTime` is de laatste **deploy**-tijd, niet de laatste wijziging. Bij het vergelijken van definities verschillen gekoppelde items legitiem door auto-rebinding (bijv. rapport → model-ID); naïef hashen geeft dus valse "gewijzigd". Bij twijfel: als gewijzigd behandelen.
- **Kapotte pairing herstellen** kan alleen door de werkruimte van de stage te ontkoppelen en opnieuw te koppelen. Dit **verwijdert permanent de deploygeschiedenis en alle deployment-/parameterregels** van die stage. Vraag eerst of er regels zijn, laat ze noteren, en vraag expliciete bevestiging.
- Semantische modellen die niet naar *Enhanced Metadata* zijn geüpgraded, worden vanaf 12 februari 2026 niet meer ondersteund door deployment pipelines.

### Ondersteunde items (selectie)

De lijst verandert; de bron is de Microsoft Learn-pagina *Introduction to deployment pipelines § Supported items*. Lees het exacte `itemType` terug uit `GET .../stages/{stageId}/items` in plaats van het te raden.

| Categorie | Items (status volgens bron, laatst afgestemd 2026-07-20) |
|---|---|
| Power BI | Dashboard, Dataflow (Power BI), Org App, Paginated Report, Report, Semantic Model: alle **preview** |
| Data Engineering | Environment, GraphQL API, Lakehouse, Notebook, Spark Job Definition, User Data Functions: GA |
| Data Factory | Copy Job, Dataflow Gen2, Data Pipeline, Mirrored Database, Mount ADF: GA (enkele andere preview) |
| Data Warehouse | Warehouse: preview; Mirrored Azure Databricks Catalog: GA |
| Database | SQL Database: GA |
| CI/CD | Variable Library: GA |

---

## Git-integratie

### Concepten

- Werkt op **werkruimteniveau**: één werkruimte koppelt aan één **repository + branch + map**. De mappenstructuur van de werkruimte wordt gespiegeld (max. 10 niveaus).
- **Commit** (werkruimte → Git): exporteert ondersteunde items als bronbestanden en overschrijft de branchinhoud. API `commitToGit`, `mode` `All` of `Selective`.
- **Update** (Git → werkruimte): importeert de branchinhoud en overschrijft de werkruimte. **Destructief** voor niet-gesynchroniseerde werkruimtewijzigingen. API `updateFromGit`.
- **Eerste sync na koppelen:** is één kant leeg, dan wordt automatisch gekopieerd. Hebben beide kanten inhoud, dan kies je via `initializeConnection`: `PreferWorkspace` (werkruimte leidend) of `PreferRemote` (Git leidend).
- **Status** via `git/status`: `workspaceHead`, `remoteCommitHash` en een `changes`-lijst.

| Status | Betekenis | Actie |
|---|---|---|
| Synced | Heads gelijk, geen wijzigingen | Niets |
| Uncommitted changes | Werkruimte heeft wijzigingen die niet in Git staan | `commitToGit` |
| Update required | Branch heeft commits die de werkruimte mist | `updateFromGit` |
| Conflict | Hetzelfde item aan beide kanten gewijzigd | `updateFromGit` met conflictbeleid |

Niet-ondersteunde items in de werkruimte of map worden genegeerd: niet opgeslagen, gesynchroniseerd of verwijderd.

### Providers

Alleen cloud: **Azure DevOps** (Azure Repos), **GitHub** en **GitHub Enterprise**.

- Azure DevOps ondersteunt de *automatische* Git-credential (SSO van de interactieve gebruiker) en een *configured connection* (`ServicePrincipal` of `OAuth2`).
- GitHub vereist altijd een **Personal Access Token** in een configured connection: fine-grained met Contents `Read` (plus `Write` om te committen) of classic met scope `repo`.
- Automatisering met een service principal vereist bij beide providers een `ConfiguredConnection` (`"myGitCredentials": { "source": "ConfiguredConnection", "connectionId": "<connection-guid>" }`).

### Rechten en voorwaarden

| Actie | Vereiste werkruimterol |
|---|---|
| Connect / disconnect | **Admin** |
| Commit / update | Minimaal **Contributor** met schrijfrecht op alle items |
| Branch wisselen | **Admin** (of Contributor als de werkruimte-instelling *Allow users with at least Contributor role to change Git branch* aanstaat) |

- Git-kant: Azure Repos `Read` (plus `Contribute` om te committen); GitHub Contents `Read` (plus `Write`).
- De werkruimte moet een **capaciteit** hebben (`WorkspaceHasNoCapacityAssigned`).
- **Eén Git-operatie tegelijk** per werkruimte.
- **Tenant-adminschakelaars** (vaak de oorzaak van onverklaarbare fouten; jij kunt ze niet zelf aanzetten):
  - *Users can synchronize workspace items with their Git repositories* (Azure DevOps): standaard **aan**.
  - *Users can sync workspace items with GitHub repositories*: standaard **uit**.
  - *Users can export items to Git repositories in other geographical locations*: nodig als capaciteitsregio en Azure DevOps-repo verschillen.
  - *Users can export workspace items with applied sensitivity labels to Git repositories*: nodig voor items met gevoeligheidslabels.

### Stappen: werkruimte koppelen en synchroniseren

1. **Vooraf controleren:** ingelogd met juiste audience, jij bent werkruimte-**Admin**, de werkruimte heeft een `capacityId`, en de repo, branch én doelmap bestaan al. De API maakt (anders dan de portal) **geen** ontbrekende map aan: `404 GitProviderResourceNotFound`.
2. **Koppelen:** `POST /v1/workspaces/{workspaceId}/git/connect` met bijvoorbeeld:

   ```json
   {
     "gitProviderDetails": {
       "gitProviderType": "AzureDevOps",
       "organizationName": "myorg",
       "projectName": "MyProject",
       "repositoryName": "fabric",
       "branchName": "main",
       "directoryName": "/workspace-a"
     }
   }
   ```

3. **Initialiseren:** `POST .../git/initializeConnection` met `{"initializationStrategy":"PreferWorkspace"}` of `PreferRemote`. De response geeft `requiredAction` (`UpdateFromGit`, `CommitToGit` of `None`) plus `workspaceHead` en `remoteCommitHash`; voer de genoemde actie uit, anders blijft de werkruimte gekoppeld maar niet gesynchroniseerd.
4. **Status lezen:** `GET .../git/status` en het **actuele** `workspaceHead` gebruiken.
5. **Committen:** `POST .../git/commitToGit` met `{ "mode": "All", "workspaceHead": "<head>", "comment": "<bericht>" }`.
6. **Updaten:** `POST .../git/updateFromGit` met `workspaceHead`, `remoteCommitHash` en bij conflicten `"conflictResolution": { "conflictResolutionType": "Workspace", "conflictResolutionPolicy": "PreferRemote" }` plus `"options": { "allowOverrideItems": true }`. Vraag eerst bevestiging: dit overschrijft werkruimte-inhoud.
7. **Afwachten:** `commitToGit`, `updateFromGit`, `initializeConnection` en zelfs `git/status` kunnen `202` geven. Poll de operatie tot `Succeeded` en controleer daarna dat `workspaceHead == remoteCommitHash` **en** `changes` leeg is.
8. **Ontkoppelen:** `POST .../git/disconnect` (Admin; eerst bevestigen).

Conflictbeleid kiezen: `PreferRemote` als de doelwerkruimte de laatste Git-stand moet krijgen; `PreferWorkspace` (of `commitToGit`) als de werkruimte de bron van waarheid is; bij echte tweezijdige wijzigingen per item bewust beslissen.

### Regels

- Nooit twee Git-operaties tegelijk op dezelfde werkruimte.
- Per branch één schrijver: óf mensen committen vanuit de werkruimte, óf automatisering pusht naar Git, niet allebei.
- Commit een item samen met de items waarnaar het verwijst.

### Fouten bij Git-integratie

| Fout | Oorzaak | Oplossing |
|---|---|---|
| `400 WorkspaceHeadMismatch` | Verouderd `workspaceHead` | `git/status` opnieuw lezen en opnieuw proberen |
| `400 MissingWorkspaceConflictResolution` | Conflict, maar geen `conflictResolution` meegestuurd | `conflictResolution` + `options.allowOverrideItems: true` toevoegen |
| `WorkspaceHasNoCapacityAssigned` | Werkruimte zonder capaciteit | Capaciteit toewijzen |
| `404 GitProviderResourceNotFound` | Repo, branch of map bestaat niet | Namen controleren; map eerst aanmaken in de repo |
| `WorkspaceAlreadyConnectedToGit` | Werkruimte al gekoppeld | Eerst ontkoppelen |
| `InsufficientPrivileges` / `403` | Rol ontbreekt | Admin voor connect/disconnect, Contributor (schrijfrecht op alle items) voor commit/update |
| `PrincipalTypeNotSupported` | SPN met automatische credentials (of GitHub) | `ConfiguredConnection` in `myGitCredentials` |
| `202` en daarna niets | Async nog bezig | Operatie pollen of `git/status` tot heads gelijk zijn |
| Lang `Running` | Grote werkruimte of tweede operatie in de wachtrij | Blijven pollen met redelijke time-out (ca. 10 min); geen tweede operatie starten |
| `401 Unauthorized` | Verkeerde audience | `--resource https://api.fabric.microsoft.com` |
| Steeds een "wijziging" die je niet maakte (één lege regel minder, CRLF/LF) | Bestand buiten Fabric bewerkt met afsluitende newline of CRLF; Fabric serialiseert terug naar LF zonder afsluitende newline | Bij schrijven LF en geen afsluitende newline gebruiken; vastleggen met `.editorconfig` en `.gitattributes` in de repo |
