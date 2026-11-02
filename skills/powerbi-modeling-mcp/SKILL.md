---
name: powerbi-modeling-mcp
description: Installeren, configureren en veilig gebruiken van de Power BI Authoring MCP Server (npm-pakket @microsoft/powerbi-modeling-mcp, voorheen Power BI Modeling MCP) om semantische modellen in Power BI Desktop, een Fabric-workspace of PBIP/TMDL-bestanden via een AI-agent te bewerken. Gebruik bij vragen over powerbi-modeling-mcp, Power BI MCP, MCP-server voor Power BI, connect to Power BI Desktop, XMLA, EULA accepteren, --readonly, --authmode, serviceprincipal, PBI_MODELING_MCP_*, MCP-tools zoals measure_operations of dax_query_operations, of storingen met de MCP-server. Voor modelinhoud (DAX, relaties, TMDL) zonder MCP: fabric-semantic-model en pbi-model-power-query-dax; voor bulkwijzigingen met Tabular Editor: tabular-editor-bpa; voor Fabric-authenticatie en REST: fabric-basis.
---

# Power BI Authoring MCP Server

> Gebaseerd op de documentatie in [microsoft/powerbi-modeling-mcp](https://github.com/microsoft/powerbi-modeling-mcp) (`README.md` en `TROUBLESHOOTING.md`, MIT, © Microsoft Corporation), commit 2b25def (29 september 2026). Vertaald en ingekort. De server zelf valt **niet** onder MIT maar onder de [Power BI Authoring MCP Server EULA](https://github.com/microsoft/powerbi-modeling-mcp/blob/main/EULA.txt); die is hier niet overgenomen.

De repository bevat alleen documentatie. De server zelf wordt verspreid als VS Code-extensie en als npm-pakket `@microsoft/powerbi-modeling-mcp`. Het is een **lokale** MCP-server die via het XMLA-endpoint of de lokale Analysis Services-instantie van Power BI Desktop modelwijzigingen uitvoert.

> **Let op (uit de bron):** voor het bewerken van semantische modellen **in een Fabric-workspace** raadt Microsoft de **remote (hosted)** Power BI Authoring MCP-server aan: geen lokale installatie en updates door Microsoft. Vergelijk beide via [Power BI Authoring MCP server (Microsoft Learn)](https://learn.microsoft.com/power-bi/developer/mcp/power-bi-authoring-mcp). Het adres en de configuratie van de remote server staan niet in deze repository; die heb ik dus niet gecontroleerd.

## Werkwijze

| Je wilt… | Ga naar |
|---|---|
| De server installeren | [Installatie](#installatie) |
| Verbinden met een model | [Verbinden](#verbinden) |
| Weten wat de agent kan | [Tools en prompts](#tools-en-prompts) |
| Instellingen (alleen lezen, serviceprincipal, EULA) | [Instellingen](#instellingen) |
| Een probleem oplossen | [Problemen oplossen](#problemen-oplossen) |
| Weten of je dit binnen JBT Marel mag gebruiken | [Risico's en governance](#risicos-en-governance) |

## Veiligheidsregels voor de agent

Volg deze regels altijd als deze MCP-server verbonden is:

1. **Eerst een back-up.** De bron zegt letterlijk: *"Always create a backup of your model before performing any operations."* Vraag de gebruiker te bevestigen dat er een back-up is (kopie van de .pbix/PBIP-map, of Git-commit) vóór de eerste schrijfactie.
2. **Lezen vóór schrijven.** Begin met `list`/`get` en DAX-queries om het model te begrijpen. Stel wijzigingen eerst voor in een tabel (object, oud, nieuw).
3. **Transacties gebruiken bij bulkwerk.** `transaction_operations` ondersteunt begin, commit, rollback en status. Bundel bulkhernoemingen of -beschrijvingen in één transactie, zodat je kunt terugdraaien.
4. **Geen gevoelige data in de chat.** Resultaten van DAX-queries en metadata gaan naar de MCP-client en mogelijk naar de LLM-provider. Vraag alleen de rijen op die nodig zijn (bijv. `TOPN`), geen volledige klant- of personeelstabellen.
5. **Alleen modelwijzigingen.** De server kan geen rapportpagina's of diagramlay-outs aanpassen. Voor rapporten: fabric-powerbi-report.
6. **EULA niet zelf accepteren** zonder expliciete toestemming van de gebruiker (zie [EULA](#eula-accepteren)).

## Installatie

### Visual Studio Code met GitHub Copilot (aanbevolen in de bron)

1. Installeer [Visual Studio Code](https://code.visualstudio.com/download).
2. Installeer de extensie **GitHub Copilot Chat**.
3. Installeer de VS Code-extensie **Power BI Authoring MCP** via <https://aka.ms/powerbi-modeling-mcp-vscode>.
4. Open Copilot Chat en controleer in de toollijst of **powerbi-modeling-mcp** beschikbaar en aangevinkt is.

Zie je de server niet? Controleer dan of de optie **MCP servers in Copilot** aan staat in je Copilot-instellingen op GitHub.com. Bij enterprise-accounts staat die standaard **uit** en moet een beheerder hem aanzetten.

### Andere MCP-clients via npx (vereist Node.js)

Registratie-JSON uit de bron:

```json
{
	"powerbi-authoring-local": {
			"type": "stdio",
			"command": "npx",
			"args": [
				"-y",
				"@microsoft/powerbi-modeling-mcp@latest",
				"--start"
			]
		}
}
```

Voor **Claude Code** komt dat neer op de volgende regel. De `claude mcp add`-syntax komt niet uit de bron. Ik heb hem niet getest met deze server.

```bash
claude mcp add powerbi-authoring-local -- npx -y @microsoft/powerbi-modeling-mcp@latest --start
```

Aanname (niet uit de bron): om met Power BI Desktop te verbinden moet de server op dezelfde Windows-pc draaien als Desktop. Een cloudsessie, zoals Claude Code op het web, kan dus niet bij je lokale Power BI Desktop.

### Handmatige download (zonder Node.js)

1. Download het VSIX-pakket:
   `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/analysis-services/vsextensions/powerbi-modeling-mcp/[version]/vspackage?targetPlatform=[platform]`
   (voorbeeld uit de bron: versie `0.1.9`, platform `win32-x64`).
2. Wijzig de extensie van het gedownloade bestand in `.zip`.
3. Pak uit naar bijvoorbeeld `C:\MCPServers\PowerBIAuthoringMCP`.
4. Start `\extension\server\powerbi-modeling-mcp.exe`.
5. Kopieer de MCP-registratie-JSON uit de console naar je MCP-client.

```json
{
	"powerbi-authoring-local": {
		"type": "stdio",
		"command": "C:\\MCPServers\\PowerBIAuthoringMCP\\extension\\server\\powerbi-modeling-mcp.exe",
		"args": [
			"--start"
		],
		"env": {}
	}
}
```

### EULA accepteren

Bij npx-installaties blokkeert de server alle andere tools tot de EULA geaccepteerd is.

| Situatie | Hoe |
|---|---|
| Interactief | De agent roept `accept_eula` aan, **alleen na expliciete toestemming van de gebruiker**. De acceptatie wordt lokaal opgeslagen. |
| Onbewaakt | `--accepteula` toevoegen aan `args`, of omgevingsvariabele `PBI_MODELING_MCP_ACCEPT_EULA` = `true` |

Gebruik de onbewaakte opties pas nadat je de EULA zelf hebt gelezen en akkoord bent.

## Verbinden

Je moet eerst verbinden met een model. Voorbeeldprompts uit de bron:

| Bron | Prompt |
|---|---|
| Power BI Desktop (bestand open) | `Connect to '[File Name]' in Power BI Desktop` |
| Fabric-workspace | `Connect to semantic model '[Semantic Model Name]' in Fabric Workspace '[Workspace Name]'` |
| PBIP-project | `Open semantic model from PBIP folder '[Path to the definition/ TMDL folder in the PBIP]'` |

Voorwaarden:

- Je hebt **Write**-rechten op het semantische model nodig.
- Voor Fabric/Power BI Service verloopt de verbinding via het **XMLA-endpoint**. Staat dat uit in je tenant of capaciteit, dan werkt verbinden met de service niet.
- De server volgt dezelfde regels als **External Tools** in Power BI Desktop ([data-modeling operations](https://learn.microsoft.com/power-bi/transform-model/desktop-external-tools#data-modeling-operations)).

## Tools en prompts

### Tools

| Tool | Doet |
|---|---|
| `connection_operations` | Verbinden met Power BI Desktop of Fabric-workspaces |
| `database_operations` | Modellen beheren: verbinden, maken, bijwerken, lijst, TMDL-mappen importeren/exporteren, deployen naar Fabric |
| `transaction_operations` | Transacties: begin, commit, rollback, status |
| `model_operations` | Model: get, create, update, refresh, stats, rename |
| `table_operations` | Tabellen: create, update, delete, get, list, refresh, rename |
| `column_operations` | Kolommen: create, update, delete, get, list, rename |
| `measure_operations` | Metingen: create, update, delete, get, list, rename, verplaatsen naar andere tabel |
| `relationship_operations` | Relaties: create, update, delete, (de)activeren, zoeken |
| `dax_query_operations` | DAX-queries uitvoeren en valideren |
| `trace_operations` | Analysis Services-events vastleggen en analyseren |
| `partition_operations` | Partities: create, update, delete, specifieke partities vernieuwen |
| `user_hierarchy_operations` | Hiërarchieën en niveaus |
| `calculation_group_operations` | Calculation groups en calculation items |
| `security_role_operations` | Rollen en RLS-tabelmachtigingen |
| `perspective_operations` | Perspectieven en leden |
| `named_expression_operations` | Named expressions en Power Query-parameters |
| `function_operations` | DAX user-defined functions (UDF) |
| `culture_operations` | Culturen voor meertaligheid |
| `object_translation_operations` | Vertalingen van modelobjecten |
| `calendar_operations` | Calendar-objecten en time intelligence-kolomgroepen |
| `query_group_operations` | Query groups voor Power Query-expressies |

### Ingebouwde prompts (in VS Code via `/`)

| Prompt | Doet |
|---|---|
| `CreateDAXQuery` | DAX-query maken uit een vraag in gewone taal (met resource `dax_query_instructions_and_examples`) |
| `RunDAXQueryWithMetrics` | Query uitvoeren, optioneel cache legen, alleen metrics teruggeven |
| `AnalyzeDAXQuery` | Prestaties analyseren met lege cache en metrics |
| `ConnectToPowerBIDesktop` | Desktop-instantie zoeken op bestandsnaam en verbinden |
| `ConnectToFabric` | Verbinden met model in een Fabric-workspace |
| `ConnectToPBIP` | TMDL uit PBIP laden (met resource `powerbi_project_instructions`) |

### Bruikbare scenario's (voorbeeld, vertaald naar warehouse)

| Scenario | Voorbeeldprompt |
|---|---|
| Naamgeving analyseren en bulk hernoemen | `Analyseer de naamgeving van de tabel 'Orderregels' en pas hetzelfde patroon toe op het hele model. Toon eerst een voorstel.` |
| Beschrijvingen toevoegen | `Voeg beschrijvingen toe aan alle metingen, kolommen en tabellen en leg de DAX-logica in eenvoudige taal uit.` |
| Vertalen | `Maak een Engelse vertaling (en-US) voor tabellen, kolommen en metingen.` |
| Metingen omzetten naar calculation group | `Zet 'Leverbetrouwbaarheid 12M Gem' en 'Leverbetrouwbaarheid 6M Gem' om naar een calculation group en voeg 3M en 24M toe.` |
| Bron parametriseren | `Analyseer de Power Query-code van alle tabellen, bepaal de bronconfiguratie en maak parameters zodat ik de SharePoint-site kan wisselen.` |
| Twee modelversies benchmarken | `Verbind met model 'V1' en 'V2' en benchmark deze DAX-query op beide: [query]` |
| Documentatie | `Maak een Markdown-document met een mermaid-relatiediagram, alle metingen met DAX en zakelijke uitleg, RLS-filters en databronnen.` |

## Instellingen

| Optie | Standaard | Betekenis |
|---|---|---|
| `--start` | | Start de server; nodig voor registratie |
| `--readwrite` | Ja | Schrijven toegestaan, met bevestiging vóór de eerste wijziging (één keer per database) |
| `--readonly` | | Veilige modus: geen schrijfacties |
| `--compatibility` | `PowerBI` | `Full` voor Analysis Services-databases |
| `--authmode` | `interactive` | `interactive` of `serviceprincipal` |
| `--accepteula` | | EULA accepteren voor onbewaakt gebruik |

| Omgevingsvariabele | Betekenis |
|---|---|
| `AZURE_CLIENT_ID` | Client-ID van de serviceprincipal (vereist bij `serviceprincipal`) |
| `AZURE_TENANT_ID` | Tenant-ID; vereist bij `serviceprincipal`, of om een tenant af te dwingen bij interactief |
| `AZURE_CLIENT_SECRET` | Clientgeheim (bij geheim-gebaseerde serviceprincipal) |
| `AZURE_CLIENT_CERTIFICATE_PATH` | Pad naar PFX/PEM-certificaat (in plaats van geheim) |
| `AZURE_CLIENT_CERTIFICATE_PASSWORD` | Wachtwoord van het certificaat |
| `PBI_MODELING_MCP_ACCEPT_EULA` | `true` = EULA geaccepteerd |
| `PBI_MODELING_MCP_ALLOWED_CONNECTION_HOSTS` | Kommagescheiden lijst van vertrouwde hosts voor AAS/SSAS/XMLA-verbindingen |

**Aanbeveling:** start voor verkennen en documenteren met `--readonly`. Zet pas `--readwrite` aan als je een back-up hebt en weet wat je wilt wijzigen.

Voorbeeld met opties:

```json
{
"servers": {
		"powerbi-authoring-local": {
			"command": "[Path To MCP Server folder]\\powerbi-modeling-mcp.exe",
			"args": [
				"--start"
				, "--authmode=interactive"
			],
			"type": "stdio"
		}
	}
}
```

In VS Code stel je dit in via **User Settings**, zoekterm `@ext:Microsoft.powerbi-modeling-mcp`.

**Host-allowlist:** voeg alleen hosts toe aan `PBI_MODELING_MCP_ALLOWED_CONNECTION_HOSTS` waarvan je organisatie weet wie ze beheert. De server stuurt er toegangstokens naartoe. Herstart de server na een wijziging.

## Problemen oplossen

| Probleem | Oplossing |
|---|---|
| Server niet zichtbaar in Copilot | Controleer **MCP servers in Copilot** op GitHub.com; bij enterprise moet een beheerder dit aanzetten |
| Tools geblokkeerd | EULA nog niet geaccepteerd (zie [EULA](#eula-accepteren)) |
| Logboek bekijken (VS Code) | Ctrl+Shift+P → **MCP: List Servers** → **powerbi-modeling-mcp** → **Show Output** → kies in de dropdown **MCP: powerbi-modeling-mcp** |
| Server herstarten | Ctrl+Shift+P → **MCP: List Servers** → **powerbi-modeling-mcp** → **Restart Server** |
| Ander account gebruiken | Server herstarten; bij de volgende verbinding krijg je opnieuw een aanmeldprompt |
| Nieuwe versie installeert niet / blijft hangen | Server herstarten en opnieuw proberen; anders VS Code herstarten |
| Versie of binaries controleren | `%USERPROFILE%/.vscode/extensions/microsoft.powerbi-modeling-mcp-<version>-<platform>/server` |
| Gedetailleerde .NET-logs nodig | `dotnet-trace collect -p {your-process-id} --providers 'Microsoft-Extensions-Logging:4:5'` (proces `powerbi-modeling-mcp.exe`) |
| Verbinden met AAS/SSAS geeft validatiefout | Host toevoegen aan `PBI_MODELING_MCP_ALLOWED_CONNECTION_HOSTS`, alleen als hij vertrouwd is |

**Activiteit volgen in Fabric:** alle commando's en queries van de server worden gelogd onder applicatienaam `MCP-PBIModeling`. Filter in Workspace Monitoring op `ApplicationName == "MCP-PBIModeling"`.

## Risico's en governance

| Punt | Wat de bron zegt |
|---|---|
| Rechten | De server gebruikt je eigen credentials en rechten en omzeilt geen Power BI-beveiliging |
| Data naar LLM | Metadata en queryresultaten gaan naar de MCP-client en kunnen naar de LLM-provider gaan. AI vergroot de toegang niet, maar kan opgevraagde data wel doorsturen |
| Blokkeren | Er is geen tenantinstelling specifiek voor deze server; alleen XMLA uitzetten blokkeert hem, en daarmee ook andere XMLA-tools |
| Destructieve acties | Autonome of verkeerd ingestelde clients kunnen schade doen; gebruik least-privilege-rollen |
| Telemetrie | De software kan gebruiksgegevens naar Microsoft sturen |
| Compliance | Jij bent verantwoordelijk dat het gebruik past binnen organisatie- en contractregels |

Voor JBT Marel (aanbeveling, niet gecontroleerd): stem met IT/Data-governance af welke AI-client en LLM-provider zijn toegestaan voordat je de server koppelt aan productiemodellen met klant-, leveranciers- of personeelsdata.

## Controle voor oplevering

- [ ] Back-up of Git-commit van het model gemaakt vóór schrijfacties
- [ ] Wijzigingsvoorstel getoond en bevestigd voordat iets is aangepast
- [ ] Bulkwijzigingen in één transactie, met commit pas na controle
- [ ] Gewijzigde metingen gevalideerd met een DAX-query (`dax_query_operations`)
- [ ] Geen onnodige detaildata opgevraagd of in de chat gezet
- [ ] Bij Fabric: model vernieuwd (indien nodig) en rapporten nog werkend
- [ ] Benoemd wat wel en niet getest is
