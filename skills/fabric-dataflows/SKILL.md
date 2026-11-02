---
name: fabric-dataflows
description: "Bouwen, aanpassen, controleren en debuggen van Microsoft Fabric Dataflow Gen2 (gegevensstroom): Power Query M-code, verbindingen/connections, uitvoerbestemmingen/output destinations (Lakehouse, Warehouse, Azure SQL), refresh en refreshhistorie, getDefinition/updateDefinition, executeQuery-preview en upgrade van Dataflow Gen1 naar Gen2 (saveAsNativeArtifact). Gebruik bij vragen over Dataflow Gen2, Dataflow Gen1, Power Query, M-code, mashup.pq, queryMetadata.json, gegevensstroom, output destination, uitvoerbestemming, Lakehouse, refresh, verbinding, connection of upgrade Gen1 naar Gen2. Niet voor: semantisch model en DAX (fabric-semantic-model), rapportvisuals (fabric-powerbi-report), authenticatie, workspaces/items vinden, REST-basis en Catalog Search (fabric-basis), Power Automate flows (power-automate-flows)."
---

# Fabric Dataflow Gen2

Gebaseerd op [microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric) (MIT, © Microsoft Corporation), skill `dataflows-cli`, commit bc42aaf. Vertaald en ingekort; zonder MCP-servers, lokale scripts en telemetrie-headers.

Deze skill helpt je met Dataflow Gen2-items in Microsoft Fabric: Power Query M schrijven en debuggen, verbindingen koppelen, data wegschrijven naar een Lakehouse of Warehouse, refreshes starten en volgen, en Gen1-dataflows upgraden. Commando's zijn `az rest`-/`curl`-voorbeelden die **jij zelf uitvoert**; Claude voert niets uit in je tenant.

Typische bronnen in een magazijn/supply-chain-context: SharePoint-lijsten en -bestanden, Excel, ERP-exports (CSV), SQL-databases. Het doel is meestal een schone, getypte tabel in een Lakehouse of Warehouse waar een Power BI-semantisch model op leest.

## Werkwijze

Kies eerst één modus. Lees daarna het genoemde referentiebestand voordat je commando's of definities opstelt.

| Vraag van de gebruiker | Modus | Laad eerst |
|---|---|---|
| "Schrijf/verbeter deze M-query", foutmelding in Power Query, types, fouten per cel, `each`, joins | M-code | [references/m-taal.md](references/m-taal.md) |
| Welke bron-functie (SQL, Lakehouse, Web, SharePoint, CSV, JSON), verbinding aanmaken of koppelen, `ClusterId`, credentials | Verbindingen | [references/connectoren-en-verbindingen.md](references/connectoren-en-verbindingen.md) |
| Resultaat wegschrijven naar Lakehouse-tabel, Lakehouse Files, Warehouse, Azure SQL, ADX | Uitvoerbestemming | [references/uitvoerbestemmingen.md](references/uitvoerbestemmingen.md) |
| Dataflow aanmaken, definitie lezen/wijzigen, M vooraf testen met `executeQuery`, refresh starten, CI/CD via Git | Authoring (schrijven) | [references/rest-api.md](references/rest-api.md) |
| Dataflows opsommen, parameters, M-code bekijken, refreshhistorie/fouten analyseren, opgeslagen query uitvoeren | Verbruik (alleen lezen) | [references/verbruik-en-refreshhistorie.md](references/verbruik-en-refreshhistorie.md) |
| Gen1-dataflow naar Gen2 (Gen2.1 CI/CD) upgraden, gereedheid/risico beoordelen | Upgrade | [references/upgrade-gen1-gen2.md](references/upgrade-gen1-gen2.md) |

Regels voor de keuze:

- **Classificeer op bedoeling, niet op endpoint.** `executeQuery` om M te testen vóór opslaan hoort bij authoring; een opgeslagen query uitvoeren of een losse alleen-lezen query hoort bij verbruik.
- **Verbruik is alleen-lezen.** Vraagt iemand in die modus om te maken, wijzigen of verwijderen: zeg dat expliciet en behandel het als een aparte authoring-vraag.
- **Upgrade gaat alleen van Gen1 naar Gen2.1.** Is de bron al Gen2, of is de generatie onbekend: zeg dat er geen publiek save-as- of in-place-upgrade-endpoint is en stop. Een alleen-lezen gereedheidsscan mag wel.
- Spant een vraag meerdere modi: behandel ze na elkaar en meld de wissel.
- Is de vraag te vaag ("maak de dataflow die ik nodig heb"): vraag eerst naar bron, query/schema en transformatie, bestemming en refreshgedrag (inclusief "geen bestemming" of "geen refresh"). Gok geen bron, verbinding of dataflow.

## Kernbegrippen

### Definitie: drie onderdelen

Een Dataflow Gen2-definitie bestaat altijd uit drie delen. Via de REST API is elk deel base64 (`payloadType: "InlineBase64"`); in Git zijn het platte tekstbestanden.

| Deel | Inhoud |
|---|---|
| `mashup.pq` | De Power Query M-code als *section document*: `section Section1;` + `shared Naam = let ... in ...;` per query |
| `queryMetadata.json` | `formatVersion` (`"202502"`), `name`, `queriesMetadata` (per query `queryId`, `queryName`, `loadEnabled`, `isHidden`), `connections[]`, `computeEngineSettings` |
| `.platform` | Itemmetadata: `type: "Dataflow"`, `displayName`, `logicalId` |

```m
section Section1;

shared Klanten = let
    Bron = Sql.Database("server.database.windows.net", "mydb"),
    Data = Bron{[Schema = "dbo", Item = "Customers"]}[Data]
in
    Data;
```

### Belangrijkste spelregels

| Regel | Waarom |
|---|---|
| `updateDefinition` krijgt **altijd alle drie** de delen | Het is een volledige vervanging; met 1 of 2 delen verdwijnen queries stil |
| Altijd eerst `getDefinition`, dan wijzigen, dan `updateDefinition` | Lezen-wijzigen-schrijven voorkomt dataverlies |
| `getDefinition` is een **POST** | Met GET krijg je 405 |
| `formatVersion: "202502"` en een top-level `name` gelijk aan `displayName` | Anders fouten bij opslaan of verouderde naam |
| `loadEnabled` staat standaard aan | Zet `loadEnabled: false` alleen op hulpqueries die niet weggeschreven moeten worden; `loadEnabled: true` kan bij teruglezen ontbreken (is de standaard) |
| Eerste refresh na elke definitiewijziging met `{"executionData":{"executeOption":"ApplyChangesIfNeeded"}}` | Zonder dit ververst Fabric de vorige toegepaste definitie |
| Bestemmingskolommen moeten getypt zijn | Kolommen van type `Any` worden door elke bestemming geweigerd |
| Meerdere bronnen in één document: `[AllowCombine = true]` vóór `section Section1;` | Anders blokkeert de privacy-firewall de evaluatie |
| `connectionId` in `queryMetadata.json` is een **samengestelde string** `{"ClusterId":"…","DatasourceId":"…"}` | REST-aanroepen op `/v1/connections/...` gebruiken juist de gewone GUID |

### API-audiences

| API | `--resource` |
|---|---|
| Fabric REST (`https://api.fabric.microsoft.com/v1/...`) | `https://api.fabric.microsoft.com` |
| Power BI REST (`https://api.powerbi.com/...`), o.a. `gatewayClusterDatasources` en `saveAsNativeArtifact` | `https://analysis.windows.net/powerbi/api` (**zonder** slash aan het eind; met slash: `AADSTS500011 invalid_resource`) |

Inloggen, workspace- en item-ID's opzoeken en algemene REST-patronen (paginering, LRO) staan in de skill **fabric-basis**. Gebruik nooit een geraden GUID: zoek workspace en dataflow op via lijst + filter op `displayName`.

## Stappenplannen (kort)

### A. Nieuwe dataflow met bron en bestemming

1. Bevestig bron, transformaties, bestemming en refreshwens met de gebruiker.
2. Zoek een bestaande verbinding (`GET /v1/connections`, filter op `connectionDetails.type` en pad). Geen match: eerst `GET /v1/connections/supportedConnectionTypes`, dan `POST /v1/connections`. OAuth2-verbindingen kunnen alleen in de Fabric-portal worden gemaakt. Zie [verbindingen](references/connectoren-en-verbindingen.md).
3. Haal de `ClusterId` op via `GET https://api.powerbi.com/v2.0/myorg/me/gatewayClusterDatasources` en filter op het verbindings-ID.
4. Maak de lege dataflow: `POST /v1/workspaces/{ws}/dataflows` met `{"displayName":"..."}` (sync 201).
5. Schrijf de M-code (inclusief `[DataDestinations]`-annotatie en verborgen `_DataDestination`-query als er een bestemming is) en `queryMetadata.json` met `connections[]`.
6. Test de M met `executeQuery` (begrensd met `Table.FirstN`), laat de eerste 10 rijen zien en controleer op ingebedde fouten.
7. Sla op met `POST .../updateDefinition?updateMetadata=true` (alle drie delen).
8. Controleer met `getDefinition` dat `connections[]` bewaard is.
9. Alleen als de gebruiker dat wil: refresh met `ApplyChangesIfNeeded` en volg de job tot `Completed`.

### B. Bestaande dataflow wijzigen

1. `getDefinition` → decodeer `mashup.pq` en `queryMetadata.json`.
2. Controleer elke verbinding in `connections[]` met `GET /v1/connections/{id}` (gewone GUID = `DatasourceId`).
3. Pas de M aan; test met `executeQuery` en een `customMashupDocument`.
4. `updateDefinition` met alle drie delen, daarna opnieuw `getDefinition` ter controle.
5. Refresh (eerste keer met `ApplyChangesIfNeeded`). Mislukt de refresh: maximaal één isolatiepoging met `executeQuery`; bij `isRetriable: false` of een workspace-brede `UnknownException` de fout letterlijk melden en stoppen.

### C. M-probleem debuggen

1. Vraag de exacte foutmelding en de betreffende stap.
2. Controleer de typische valkuilen in [m-taal.md](references/m-taal.md): fouten per cel die als `null` verschijnen, `each` binnen `Table.Group`, ontbrekende velden (`[veld]?`), ongeciteerde namen (`#"..."`), `File.Contents`.
3. Isoleer met een klein `customMashupDocument` en `executeQuery`; bij grote bronnen altijd begrenzen.

### D. Refresh of historie bekijken

Zie [verbruik-en-refreshhistorie.md](references/verbruik-en-refreshhistorie.md): `GET .../jobs/instances`, statuswaarden en `failureReason`.

### E. Gen1 → Gen2.1

Eerst gereedheidsscan (zeven risicosignalen), dan pas `saveAsNativeArtifact` met bodybestand. Het origineel blijft bestaan; schema komt uitgeschakeld mee. Zie [upgrade-gen1-gen2.md](references/upgrade-gen1-gen2.md).

## Snelle foutentabel

| Symptoom | Oplossing |
|---|---|
| 401 Unauthorized | `az login`; juiste `--resource` (zie API-audiences) |
| 405 op `getDefinition` | POST gebruiken, geen GET |
| Queries verdwenen na `updateDefinition` | Alle drie delen meesturen |
| `connections[]` leeg na opslaan | `queryMetadata.json` werd opnieuw opgebouwd zonder koppelingen; opnieuw koppelen en opslaan |
| Refresh gebruikt oude definitie | Eerste refresh met `ApplyChangesIfNeeded` |
| "Connection not found" bij refresh | Verkeerd ID-formaat; `connectionId` moet de samengestelde `ClusterId`/`DatasourceId`-string zijn |
| `executeQuery` geeft 200 maar resultaat klopt niet | Ingebedde `{"Error":"..."}` in de Arrow-stroom; controleer altijd en toon `head(10)` |
| `400 DataflowExecuteQueryError: Invalid query name` | Body is `{"queries":[…]}`; gebruik top-level `{"QueryName":"..."}` |
| `ModelBuilderOutputDestinationInvalidOutputDestinationConfiguration` | `loadEnabled: false` op de `_DataDestination`-query |
| `A query with a data destination has only columns whose types are not supported by the destination` | Kolommen typen met `Table.TransformColumnTypes` |
| "The key didn't match any rows in the table." in bestemmingsquery | Null-veilig navigeren: `?[Data]?` |
| `The CredentialType input is not supported for this API` | OAuth2-verbinding: aanmaken in de Fabric-portal |
| 429 Too Many Requests | `Retry-After` respecteren, exponentieel terugvallen |

## Grenzen met andere skills

| Onderwerp | Skill |
|---|---|
| Semantisch model, relaties, DAX-measures | fabric-semantic-model |
| Rapportpagina's en visuals | fabric-powerbi-report |
| Authenticatie, workspaces/items vinden, REST-basis, Catalog Search | fabric-basis |
| Power Automate cloud flows (ook flows die een refresh starten) | power-automate-flows |

## Controle voor oplevering

- [ ] Modus gekozen en het juiste referentiebestand gebruikt.
- [ ] Workspace- en dataflow-ID's opgezocht via lijst + filter, niet geraden.
- [ ] M-code is een volledig section document; elke `shared`-query eindigt op `;`; namen met spaties als `#"..."`.
- [ ] Alle kolommen die naar een bestemming gaan zijn expliciet getypt; fouten per cel afgevangen waar nodig.
- [ ] Bij meerdere bronnen: `[AllowCombine = true]` en elke bron heeft een eigen koppeling in `connections[]`.
- [ ] Bestemming: `[DataDestinations]`-annotatie, `_DataDestination`-query met `?[Data]?`, `loadEnabled: false` + `isHidden: true`, `IsNewTarget = true`, GUID-navigatie.
- [ ] `executeQuery`-preview begrensd (`Table.FirstN`), gecontroleerd op `{"Error":"..."}`, eerste 10 rijen getoond; begrenzing verwijderd vóór opslaan.
- [ ] `updateDefinition` met `mashup.pq`, `queryMetadata.json` én `.platform`; daarna `getDefinition` ter controle.
- [ ] Eerste refresh met `ApplyChangesIfNeeded`; succes is `Completed` (job) of `Succeeded` (LRO-operatie); `Deduped` is geen succes.
- [ ] Geen wachtwoorden of secrets in voorbeelden: alleen `passwordReference`/`keyReference`/`servicePrincipalSecretReference`.
- [ ] In de samenvatting: welke ID's zijn gemaakt/gewijzigd, welke delen opgeslagen, via welk endpoint, en of er wel of geen refresh is gedaan. Niets als gelukt melden zonder bevestigde respons.
