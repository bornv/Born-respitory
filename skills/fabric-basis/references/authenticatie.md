# Authenticatie en tokens

Detail bij [SKILL.md](../SKILL.md). Bron: `common/COMMON-CORE.md` § Authentication & Token Acquisition en `common/COMMON-CLI.md` § Authentication Recipes (microsoft/skills-for-fabric, MIT).

## Kernprincipe

**Alle** Fabric REST-aanroepen vereisen een **Microsoft Entra ID OAuth 2.0 bearer token**. Fabric ondersteunt geen API-keys, SAS-tokens of SQL-authenticatie voor REST API's.

De verkeerde audience gebruiken is de meest voorkomende oorzaak van `401 Unauthorized`.

## Audiences en scopes per dienst

| Doel | Token-audience / scope | `--resource` voor `az` | CLI-tool |
|---|---|---|---|
| Fabric REST API | `https://api.fabric.microsoft.com/.default` | `https://api.fabric.microsoft.com` | `az rest` |
| Power BI REST API (legacy) | `https://analysis.windows.net/powerbi/api/.default` | `https://analysis.windows.net/powerbi/api` | `curl` |
| OneLake (DFS / Blob, ook OneLake Table API's) | `https://storage.azure.com/.default` | `https://storage.azure.com` | `curl` |
| Warehouse / SQL Endpoint / SQL Database (TDS) | `https://database.windows.net/.default` | `https://database.windows.net` | `sqlcmd -G` |
| KQL / Kusto | `https://kusto.kusto.windows.net/.default` (of per-cluster URI) | `https://kusto.kusto.windows.net` | `curl` |
| XMLA Endpoint | `https://analysis.windows.net/powerbi/api/.default` | `https://analysis.windows.net/powerbi/api` | `curl` of specifieke tools |
| Azure Resource Management | `https://management.azure.com/.default` | `https://management.azure.com` | `az rest` (native) |

Aandachtspunten:

- **OneLake** accepteert **alleen** `https://storage.azure.com/.default`. `https://datalake.azure.net/` faalt; andere audiences geven `401 — Audience validation failed`.
- **SQL dubbele slash**: met het MSAL v1.0-endpoint moet de scope `https://database.windows.net//.default` zijn (dubbele slash). Het v2.0-endpoint regelt dit zelf. `az account get-access-token --resource` gebruikt intern v1.0, maar `az` handelt dit correct af: daar speelt het probleem niet.
- Referentie: https://learn.microsoft.com/en-us/rest/api/fabric/articles/scopes

## Inloggen met `az login`

```bash
# Interactief (opent browser)
az login

# Fabric-tenant zonder Azure-abonnement:
az login --allow-no-subscriptions --tenant <tenantId>

# Zonder browser / via SSH (device code):
az login --use-device-code --tenant <tenantId>

# Service principal (client secret), voor CI/CD:
az login --service-principal --username <appId> --password <clientSecret> --tenant <tenantId>

# Service principal (certificaat), voorkeur: geen secret om te roteren:
az login --service-principal --username <appId> --certificate /path/to/cert.pem --tenant <tenantId>

# Managed identity (system-assigned):
az login --identity

# Managed identity (user-assigned):
az login --identity --username <clientId>
```

> **`--allow-no-subscriptions`**: veel Fabric-gebruikers hebben geen Azure-abonnement. Zonder deze vlag meldt `az login` "No subscriptions found" en kunnen volgende commando's falen.

Controleer welke identiteit en tenant actief zijn (handig bij meerdere `az login`-sessies):

```bash
az account show --output table
```

## Token ophalen voor een audience

Sjabloon:

```bash
az account get-access-token --resource <AUDIENCE> --query accessToken --output tsv
```

Tokens één keer ophalen en hergebruiken (bash):

```bash
FABRIC_TOKEN=$(az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken --output tsv)
STORAGE_TOKEN=$(az account get-access-token --resource https://storage.azure.com --query accessToken --output tsv)
SQL_TOKEN=$(az account get-access-token --resource https://database.windows.net --query accessToken --output tsv)
```

PowerShell-equivalent van dezelfde `az`-aanroep:

```powershell
$FABRIC_TOKEN = az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken --output tsv
```

> **Levensduur:** Entra-tokens verlopen doorgaans na 60–90 minuten. Controleer bij lange scripts `--query expiresOn` en haal een nieuw token op vóór het verloopt.

`az rest` haalt zelf een token op en hangt het aan de aanvraag, mits je `--resource` meegeeft. Omdat `api.fabric.microsoft.com` **geen** ingebouwd Azure-endpoint is, moet je bij Fabric-aanroepen altijd `--resource https://api.fabric.microsoft.com` meegeven; anders probeert `az rest` de audience uit de URL af te leiden en faalt dat.

## Token controleren (debuggen)

```bash
TOKEN=$(az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken --output tsv)
echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .
```

Je kunt het token ook decoderen op jwt.ms. Controleer de claims:

| Claim | Betekenis |
|---|---|
| `aud` | Moet overeenkomen met de doeldienst (zie tabel hierboven) |
| `exp` | Verlooptijd (Unix-timestamp) |
| `oid` | Object-ID van de principal |
| `tid` | Tenant-ID |

> Plak een token nooit in chat, tickets of bestanden: het geeft toegang zolang het geldig is.

## Gedelegeerde vs. applicatierechten

| Flow | Toepassing | Opmerkingen |
|---|---|---|
| **Delegated** (interactief) | Gebruiker logt in via CLI | `authorization_code`- of `device_code`-grant |
| **Delegated on-behalf-of** | Backend handelt namens ingelogde gebruiker | Wisselt gebruikerstoken in voor een token voor de downstream-resource |
| **Application** (client credentials) | Onbeheerde automatisering, CI/CD | Vereist Application permissions met admin consent. De Fabric-admin moet "Service principals can use Fabric APIs" inschakelen. |

## Tokenaanvraag rechtstreeks via REST

Endpoint: `POST https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token`

Client credentials:

```
grant_type=client_credentials&client_id=<appId>&client_secret=<secret>&scope=https://api.fabric.microsoft.com/.default
```

Device code:

1. `POST .../oauth2/v2.0/devicecode` met `client_id=<appId>&scope=https://api.fabric.microsoft.com/.default`.
2. Poll voor het token met de teruggegeven `device_code`.

## Identiteitstypes

| Identiteit | Beschrijving |
|---|---|
| **User principal** | Interactieve gebruiker (UPN). Breedste API-ondersteuning. |
| **Service principal (SPN)** | App-registratie in Entra ID. Vereist admin consent + tenantinstelling. |
| **Managed identity** | Door Azure beheerd (system- of user-assigned). Werkt vanaf Azure-compute. |
| **Workspace identity** | Door Fabric beheerde SPN per werkruimte. Aan te maken via werkruimte-instellingen of `POST /v1/workspaces/<workspaceId>/provisionIdentity` (response 200/202 LRO: `{ "applicationId", "servicePrincipalId" }`). Gebruikt voor shortcuts, pipelines, semantische modellen, Dataflows Gen2. Geen geheim te beheren. Niet bruikbaar om vanuit notebooks programmatisch een token op te halen (stand medio 2025). |

Sommige API's zijn alleen voor gebruikers: een service principal krijgt dan `PrincipalTypeNotSupported`.

## Entra-app-registratie (voor automatisering)

Meestal regelt een beheerder dit; de stappen volgens de bron:

1. **App-registratie** aanmaken op `https://entra.microsoft.com` > Applications > App registrations.
2. **Redirect URI**: voor interactieve flows `http://localhost` toevoegen als Mobile/Desktop redirect URI.
3. **API-permissies**: onder **Power BI Service** (daar staan de Fabric-scopes), bijvoorbeeld `Workspace.ReadWrite.All`, `Item.ReadWrite.All`, `OneLake.ReadWrite.All`. Voor client_credentials: Application permissions met admin consent.
4. **Tenant-admininstelling**: "Service principals can use Fabric APIs" inschakelen in de Fabric Admin Portal en de SPN/beveiligingsgroep in de allowlist opnemen.

Scopes die de bron per functie noemt:

| Functie | Gedelegeerde scope |
|---|---|
| Catalog Search | `Catalog.Read.All` |
| Deployment pipelines lezen | `Pipeline.Read.All` of `Pipeline.ReadWrite.All` |
| Deployment pipelines beheren | `Pipeline.ReadWrite.All` (+ `Workspace.ReadWrite.All` voor werkruimte (ont)koppelen) |
| Deploy uitvoeren | `Pipeline.Deploy` |
| Verbindingen aanmaken (o.a. voor Git met SPN) | `Connection.ReadWrite.All` |

## Goede gewoonten

- Least privilege: `Read.All` als je niet hoeft te schrijven.
- Liever certificaten of managed identities dan client secrets.
- Geheimen in Key Vault, nooit in broncode of platte configuratie.
- Parametriseer basis-URL, werkruimte-ID, item-ID en token-audience.

## Foutopsporing

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| `401 Unauthorized` | Verkeerde audience, verlopen token of onvoldoende rechten | `aud` controleren (jwt.ms of decoderen); juiste scope gebruiken |
| `401` "Audience validation failed" | Audience past niet | `aud` vergelijken met de audiencetabel |
| `401` op OneLake-`curl` | Fabric-token gebruikt i.p.v. Storage-token | `--resource https://storage.azure.com` |
| `"Can't derive appropriate Azure AD resource from --url"` | `az rest` zonder `--resource` | `--resource "https://api.fabric.microsoft.com"` toevoegen |
| `AADSTS500011: resource not found` | Verkeerde resource-URI | Exacte string gebruiken, geen varianten met afsluitende slash |
| `az login`: "No subscriptions found" | Fabric-tenant zonder Azure-abonnement | `az login --allow-no-subscriptions --tenant <tenantId>` |
| `403 Forbidden` | Werkruimterol of itemrecht ontbreekt | Rolverdeling controleren; voor SPN's de admin-portalinstellingen |
| `PrincipalTypeNotSupported` | SPN waar alleen een gebruiker mag | API is alleen voor gebruikers; documentatie controleren |
| Token-grootte-limiet | Te veel Entra-groepen of SQL-items | Groepen per gebruiker beperken; max. ca. 40 SQL-items per werkruimte |
| Onzeker welke identiteit actief is | Meerdere `az login`-sessies | `az account show --output table` |
