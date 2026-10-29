---
name: fabric-semantic-model
description: "Bouwen, wijzigen, reviewen en beheren van Power BI semantische modellen (datasets): tabellen, kolommen, metingen/measures, DAX, relaties, datumtabel, hiërarchieën, calculation groups, veldparameters, RLS-rollen, TMDL, PBIP, Import/DirectQuery/Direct Lake, vernieuwen/refresh, gegevensbronnen, parameters, rechten, verbindingen binden, DAX-performance en Copilot/AI-gereedheid. Gebruik bij vragen over semantic model, semantisch model, dataset, DAX, meting, measure, relaties, sterschema, TMDL, PBIP, Direct Lake, refresh, vernieuwen, RLS, formatString, INFO.VIEW of trage DAX. Niet voor visuals, rapportpagina's of PBIR: gebruik fabric-powerbi-report. Niet voor Power Query M of Dataflow Gen2: gebruik fabric-dataflows. Voor authenticatie, workspaces/items vinden, REST-basis, Catalog Search en capaciteit: fabric-basis."
---

# Fabric semantisch model

> Gebaseerd op [microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric) (MIT, © Microsoft Corporation), skill `semantic-model-authoring`, commit bc42aaf. Vertaald en ingekort; zonder MCP-servers en zonder telemetrie-headers.

Deze skill helpt je een Power BI semantisch model (in de Service ook "dataset" genoemd) te ontwerpen, te wijzigen en te beheren. Claude levert DAX, TMDL, JSON en `az rest`-commando's; jij voert ze uit in Power BI Desktop, in een PBIP-projectmap of in een terminal.

## Werkwijze

Kies de route op basis van wat je wilt doen.

| Je wilt... | Ga naar | Laad ook |
|---|---|---|
| Een nieuw model opzetten | [Nieuw model](#nieuw-model) | [modelleren.md](references/modelleren.md), [tmdl.md](references/tmdl.md) |
| Zien wat er in een model zit (tabellen, kolommen, metingen, relaties) | [Model verkennen](#model-verkennen) | [metadata-ontdekken.md](references/metadata-ontdekken.md) |
| Metingen, kolommen, tabellen of relaties toevoegen of aanpassen | [Model wijzigen](#model-wijzigen) | [modelleren.md](references/modelleren.md), [dax-richtlijnen.md](references/dax-richtlijnen.md) |
| DAX schrijven of herschrijven | [Model wijzigen](#model-wijzigen) | [dax-richtlijnen.md](references/dax-richtlijnen.md) |
| Een veldparameter (metric-/"bekijk per"-kiezer) maken of wijzigen | [Veldparameter](#veldparameter) | [veldparameters.md](references/veldparameters.md) |
| Een trage meting of query sneller maken | [DAX-performance](#dax-performance) | [dax-performance.md](references/dax-performance.md) |
| Een model laten beoordelen op best practices | [Best-practice-review](#best-practice-review) | [modelleren.md](references/modelleren.md), [naamgeving.md](references/naamgeving.md) |
| Het model klaarmaken voor Copilot / Data Agents | [AI-gereedheid](#ai-gereedheid) | [ai-gereedheid.md](references/ai-gereedheid.md) |
| Een model als PBIP-project opslaan of exporteren | [Exporteren naar PBIP](#exporteren-naar-pbip) | [pbip.md](references/pbip.md) |
| Een model publiceren/deployen naar een workspace | [Deployen](#deployen-naar-een-workspace) | [rest-api.md](references/rest-api.md) |
| Een model vernieuwen (refresh) of het schema instellen | [Vernieuwen](#vernieuwen) | [rest-api.md](references/rest-api.md) |
| Gegevensbronnen, parameters of rechten beheren | [Beheren in de Service](#beheren-in-de-service) | [rest-api.md](references/rest-api.md) |
| Een model aan een gateway- of cloudverbinding koppelen | [Beheren in de Service](#beheren-in-de-service) | [verbindingen.md](references/verbindingen.md) |

## Referenties

Laad een referentie pas als een stap erom vraagt; niet alles tegelijk.

| Onderwerp | Bestand | Wanneer laden |
|---|---|---|
| Modelleerregels, Direct Lake, formatStrings | [modelleren.md](references/modelleren.md) | Altijd vóór je objecten maakt of wijzigt |
| Naamgeving en displayFolders | [naamgeving.md](references/naamgeving.md) | Bij (her)benoemen of een naamgevingsreview |
| DAX-regels, query-syntaxis, UDF's, warehousevoorbeelden | [dax-richtlijnen.md](references/dax-richtlijnen.md) | Bij elke DAX die je schrijft of reviewt |
| DAX-performance: aanpak, engine, traces | [dax-performance.md](references/dax-performance.md) | Startpunt bij optimaliseren |
| DAX-performance: patronencatalogus | [dax-performance-patronen.md](references/dax-performance-patronen.md) | Pas als dax-performance.md kandidaatpatronen aanwijst |
| TMDL-syntaxis en voorbeelden | [tmdl.md](references/tmdl.md) | Vóór je TMDL schrijft of bewerkt |
| PBIP-mappenstructuur | [pbip.md](references/pbip.md) | Bij werken met of aanmaken van een PBIP-map |
| REST via `az rest`: auth, ID's, LRO, definitie, refresh, rechten | [rest-api.md](references/rest-api.md) | Bij elk commando tegen de Service/Fabric |
| Verbinding binden/ontkoppelen | [verbindingen.md](references/verbindingen.md) | Bij gateway-/cloudverbindingen |
| Veldparameters | [veldparameters.md](references/veldparameters.md) | Bij maken/wijzigen van een veldparameter |
| Metadata ontdekken met `INFO.VIEW`-functies | [metadata-ontdekken.md](references/metadata-ontdekken.md) | Vóór je een `INFO`-query schrijft |
| Copilot / AI-gereedheid | [ai-gereedheid.md](references/ai-gereedheid.md) | Bij "Prep data for AI", Copilot of Data Agents |

## Waar staat het model en hoe wijzig je het?

Een model staat op één van drie plekken. Dat bepaalt de route.

| Plek | Route | Hoe |
|---|---|---|
| **Power BI Desktop** (`.pbix`) | A. Handmatig in Desktop | Claude levert per object de naam, DAX, `formatString`, `description` en `displayFolder`; jij maakt het object aan in Desktop. |
| **PBIP-projectmap** | B. TMDL-bestanden bewerken | Claude bewerkt de bestanden in `<Naam>.SemanticModel/definition/` direct (laad [tmdl.md](references/tmdl.md) en [pbip.md](references/pbip.md)). Daarna open je het project opnieuw in Desktop. |
| **Fabric/Power BI-workspace** | C. REST-roundtrip | `getDefinition` → TMDL lokaal bewerken → `updateDefinition` (laad [rest-api.md](references/rest-api.md)). Jij voert de `az rest`-commando's uit. |

Aanvullend:

- **TMDL view / TMDL-scripts**: TMDL view in Power BI Desktop werkt met scripts met het commando `createOrReplace` (zie [tmdl.md](references/tmdl.md#tmdl-scripts)). Claude kan zo'n script aanleveren voor meerdere objecten tegelijk.
- **Alleen een `.pbix` en veel wijzigingen?** Sla het bestand op als PBIP-project en gebruik route B. Handmatig in Desktop (route A) is prima voor een paar metingen.
- **Eén route per wijziging.** Bouw niet half in Desktop en half in TMDL; dat geeft afwijkingen.
- **Tabular Editor** wordt in de bron niet beschreven; de TMDL-regels in deze skill gelden wel voor elk hulpmiddel dat TMDL leest of schrijft.

### Opslaan per route

| Route | Opslaan |
|---|---|
| A. Desktop | Opslaan in Desktop; publiceren vanuit Desktop of via [Deployen](#deployen-naar-een-workspace). |
| B. PBIP | De TMDL-bestanden zijn de bron; er is geen extra opslagstap. Deployen: zie [Deployen](#deployen-naar-een-workspace). |
| C. Workspace | De lokaal bewerkte TMDL terugzetten met `updateDefinition` (met **alle** parts). |

---

## Nieuw model

1. **Eisen verzamelen.** Doel van het model, gegevensbronnen (SharePoint-lijst, Excel, ERP-export, SQL, Lakehouse) en hun kolommen en datatypes, belangrijke feiten (orderregels, leveringen, voorraadstanden) en dimensies (artikel, klant, leverancier, magazijn, datum). **Ontbreekt broninformatie, vraag het; gok niet.**
2. **Opslagmodus kiezen.** Bron is Fabric OneLake (Lakehouse) → **Direct Lake**; anders **Import**. Alleen **DirectQuery** als je daar expliciet om vraagt.
3. **Sterschema ontwerpen.** Bepaal feit- en dimensietabellen en de sleutels. Heeft een feittabel datumvelden, maak dan een aparte datumtabel met een relatie; bij voorkeur via Power Query/M (of uit de bron), niet als DAX-tabel, tenzij je dat wilt.
4. **Richtlijnen laden.** Altijd [modelleren.md](references/modelleren.md); bij Direct Lake ook het Direct Lake-deel daarin. Niet uit het hoofd bouwen.
5. **Bouwen in deze volgorde per tabel:** partitie → kolommen → relaties → metingen. Het lege model krijgt compatibility level 1702 of hoger.
   - **Import/DirectQuery**: M-parameters voor de bron (bijv. `Server`, `Database`) en die gebruiken in de partitie-M; juiste `dataType` en `sourceColumn` per kolom.
   - **Direct Lake**: één gedeelde named expression met de `AzureStorage.DataLake`-connector; partities van het type `EntityPartitionSource` met `mode: directLake`.
6. **Eerst alles, dan één keer deployen.** Voeg alle tabellen, kolommen, relaties en metingen toe vóór je deployt; niet half deployen en dan blijven bijwerken.
7. **Opslaan of deployen.** Workspace beschikbaar → [Deployen](#deployen-naar-een-workspace); anders → [Exporteren naar PBIP](#exporteren-naar-pbip).
8. **Controleren** met [Controle voor oplevering](#controle-voor-oplevering).

## Model verkennen

Gebruik dit ook als eerste stap van wijzigen, reviewen en AI-gereedheid.

| Situatie | Methode |
|---|---|
| Je hebt de PBIP-map of hebt `getDefinition` gedaan | Lees de `.tmdl`-bestanden (tabellen, `relationships.tmdl`, expressions). |
| Je kunt DAX-query's uitvoeren (DAX Studio, `executeQueries`-REST) | `INFO.VIEW.*`-functies. **Laad eerst [metadata-ontdekken.md](references/metadata-ontdekken.md)**; stel `INFO`-query's niet uit het hoofd samen. |
| Je hebt alleen **Build**-rechten (geen Write) | `INFO.VIEW.*` via `executeQueries` (zie [rest-api.md](references/rest-api.md#dax-query-uitvoeren)). |

Begin smal: eerst de tellingen (tabellen, kolommen, metingen, relaties), dan alleen de objecten die voor de taak nodig zijn.

## Model wijzigen

1. **Verbinden en verkennen** (zie [Model verkennen](#model-verkennen)). Noteer tabellen, relaties, bestaande metingen en de opslagmodus.
2. **Richtlijnen laden**: [modelleren.md](references/modelleren.md) altijd; [tmdl.md](references/tmdl.md) bij TMDL-bewerking; [dax-richtlijnen.md](references/dax-richtlijnen.md) bij elke DAX-wijziging (ook UDF's).
3. **Plannen.** Wat komt erbij, wat verandert, wat gaat weg? Controleer op naamconflicten en dubbele metingen. Sluit aan bij de bestaande stijl van het model.
4. **Uitvoeren in de juiste volgorde.**
   - Tabel toevoegen: partitie → kolommen → relaties → metingen.
   - Relatie toevoegen: sleutelkolommen bestaan aan beide kanten met hetzelfde `dataType`.
   - Meting toevoegen: alle verwezen tabellen en kolommen bestaan; `formatString` en `description` ingevuld.
5. **Opslaan en controleren** (zie [Opslaan per route](#opslaan-per-route) en [Controle voor oplevering](#controle-voor-oplevering)).

## Veldparameter

Een veldparameter is een berekende tabel waarmee een slicer bepaalt welke kolom of meting een visual toont. Laad [veldparameters.md](references/veldparameters.md).

1. Controleer of er al een veldparameter is (een kolom met `ParameterMetadata` `"kind": 2`). Zo ja: wijzigen in plaats van een tweede maken.
2. Maken, wijzigen (de hele lijst vervangen) of hernoemen/verwijderen volgens de referentie.
3. Controleer dat de drie kolommen en `ParameterMetadata` `"kind": 2` intact zijn, anders herkent Desktop de tabel niet als veldparameter.

De slicer en visual in het rapport zijn rapportwerk: zie **fabric-powerbi-report**.

## DAX-performance

Je hebt een hulpmiddel nodig dat DAX-query's met server-timings/trace uitvoert, bijvoorbeeld **DAX Studio** (Server Timings) of een trace via ADOMD.NET/PowerShell. Zonder trace kun je alleen op DAX-vorm gokken.

1. Laad [dax-performance.md](references/dax-performance.md) en volg de fasen: baseline → iteraties → (met jouw akkoord) query- of modelwijzigingen.
2. Laad [dax-performance-patronen.md](references/dax-performance-patronen.md) alleen voor de patronen die de beslistabel aanwijst.
3. Houd een wijziging alleen als hij aantoonbaar sneller is **én** exact hetzelfde resultaat geeft.

## Best-practice-review

1. **Inventariseren**: alle tabellen, kolommen, relaties, metingen, opslagmodus.
2. **Richtlijnen laden**: [modelleren.md](references/modelleren.md); bij naamgeving [naamgeving.md](references/naamgeving.md); bij DAX [dax-richtlijnen.md](references/dax-richtlijnen.md).
3. **Toetsen** op onder meer: sterschema, naamgeving, kardinaliteit en filterrichting van relaties, expliciete metingen met `formatString`, datatypes en `sourceColumn`, verborgen vreemde sleutels, berekende kolom versus meting, Direct Lake-beperkingen.
4. **Bevindingen tonen** per ernst (kritiek, aanbevolen, optioneel), met per punt de regel en de voorgestelde oplossing. **Wacht op akkoord.**
5. **Goedgekeurde punten doorvoeren** via [Model wijzigen](#model-wijzigen) en daarna controleren.

## AI-gereedheid

Voor Copilot in Power BI, Data Agents en andere vraag-in-gewone-taal-toepassingen. Laad [ai-gereedheid.md](references/ai-gereedheid.md).

1. Vraag hoe het model gebruikt wordt (alleen rapporten / conversationeel / beide) en verzamel bedrijfscontext: proces, kern-KPI's, typische vragen, vakjargon. Niets verzinnen.
2. Inventariseer het model en waar het staat (PBIP, workspace, alleen Desktop).
3. Loop de checklist in de referentie op volgorde door en label elk punt: **door Claude aan te passen** (namen, beschrijvingen, metingen, verbergen, datatypes) of **zelf instellen in "Prep data for AI"** (AI instructions, AI data schema, synoniemen, Verified Answers).
4. Toon de bevindingen per ernst en wacht op akkoord.
5. Voer de modelwijzigingen door; voor de "Prep data for AI"-onderdelen lever je zelf de instellingen in de Power BI-UI in (Claude kan tekstvoorstellen geven).
6. Test daarna met echte vragen in Copilot of de Data Agent en verbeter iteratief.

## Exporteren naar PBIP

Exporteren levert alleen de TMDL-definitie op, **niet** de omliggende PBIP-structuur. Die moet er eerst staan, anders opent Desktop het niet. Laad [pbip.md](references/pbip.md).

1. Bepaal de doelmap en de modelnaam.
2. Zorg dat aanwezig zijn: `<Naam>.SemanticModel/` (met `definition/` en `definition.pbism`), `<Naam>.Report/` (met `definition/` en `definition.pbir` met een `byPath`-verwijzing) en `<Naam>.pbip`.
3. Zet de TMDL in `<Naam>.SemanticModel/definition/`: uit `getDefinition` (workspace) of door bestaande TMDL-bestanden te kopiëren.
4. Controleer: minimaal `model.tmdl` en tabelbestanden in `definition/`; `definition.pbir` verwijst met `byPath` naar `../<Naam>.SemanticModel`.

## Deployen naar een workspace

| Bron | Route |
|---|---|
| PBIP/TMDL-bestanden op schijf | Fabric REST: `createSemanticModel` (nieuw) of `updateDefinition` (bestaand). Zie [rest-api.md](references/rest-api.md#tmdl-definitie-via-de-fabric-items-api). |
| Model alleen in Power BI Desktop | Publiceren vanuit Desktop, of eerst opslaan als PBIP en dan de REST-route. |

- **Eén keer deployen; het is niet idempotent.** Een herhaalde create maakt een tweede model met dezelfde naam, waarna je `There are multiple datasets named '<name>'` krijgt. Bij die fout: niet blind opnieuw proberen. Lijst de semantische modellen in de workspace, verwijder alle duplicaten met die naam en deploy één keer vanuit een schone situatie.
- Controleer daarna dat het model in de workspace staat (items van type `SemanticModel` opvragen).
- De workspace moet aan een capaciteit gekoppeld zijn (`capacityId` bij `GET /v1/workspaces/{id}`); zie **fabric-basis** voor capaciteit.

## Vernieuwen

Vernieuwen kan alleen op een live model (Desktop of Service). Met alleen lokale TMDL-bestanden: eerst deployen.

- **Power BI Desktop**: vernieuwen in Desktop zelf.
- **Service**: via de Power BI refresh-API of de Fabric job-API (zie [rest-api.md](references/rest-api.md#vernieuwen-refresh)), of in de Service.
- **Fout met referenties (credentials)?** Stop direct. Stel de verbinding/gegevensbronreferenties handmatig in de Power BI Service in. Niet opnieuw proberen en niet programmatisch omzeilen.

## Beheren in de Service

Gebruik hiervoor de REST-API's (zie [rest-api.md](references/rest-api.md)):

| Taak | Waar |
|---|---|
| Gegevensbronnen en parameters opvragen/bijwerken | [rest-api.md § Gegevensbronnen en parameters](references/rest-api.md#gegevensbronnen-en-parameters) |
| Datasetrechten van gebruikers tonen/geven | [rest-api.md § Rechten](references/rest-api.md#rechten) |
| Model koppelen aan een gateway-/cloudverbinding | [verbindingen.md](references/verbindingen.md): één bind-verzoek per gegevensbronverwijzing |

**RLS-rollidmaatschap** (gebruikers of groepen aan een beveiligingsrol toevoegen of verwijderen) valt buiten deze skill: Claude stelt daarvoor geen REST-, TMDL- of andere wijzigingen voor. Dat doe je in de Power BI-portal; zie [Manage role membership](https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security#manage-role-membership). De rol zelf en de DAX-filter (`tablePermission`) maken mag wel (zie [tmdl.md](references/tmdl.md#beveiligingsrollen-rls)).

## Rechten die je nodig hebt

Je hebt mogelijk geen Fabric-adminrechten. Dit vraagt de bron per taak:

| Taak | Minimaal nodig |
|---|---|
| Definitie ophalen/bijwerken, model aanmaken via REST | Workspace-rol Contributor of hoger |
| DAX-query via `executeQueries` | Build-recht op de dataset |
| Volledige operationele eigenschappen (`GET .../datasets/{id}`) | Write-recht op de dataset (met alleen Read krijg je `id` en `name`) |
| Verbinding binden (`bindConnection`) | Eigenaar van het semantisch model |
| Copilot / AI-gereedheid | Copilot ingeschakeld in de organisatie; Q&A aan voor het model |

Krijg je `403 Forbidden` of `identity None`: stop, het is een rechtenkwestie. Vraag de workspace-beheerder om de juiste rol.

## Moet / liever / vermijd

**Moet**
- Het bronschema (tabellen, kolommen, datatypes) begrijpen vóór je ontwerpt of wijzigt.
- [modelleren.md](references/modelleren.md) volgen: sterschema, naamgeving, kolom- en meetregels.
- Elke zichtbare meting een `formatString` en een `description` geven.

**Liever**
- Sterschema boven sneeuwvlok of één platte tabel; enkelvoudige relatiesleutels.
- Consistent blijven met het bestaande model (naamgeving, structuur) in plaats van nieuwe conventies opleggen.
- TMDL boven TMSL: tekstgebaseerd en goed te vergelijken (diff).
- Na elke wijziging controleren of de objecten er echt staan.

**Vermijd**
- Workspace- en item-ID's hardcoderen; zoek ze op (zie [rest-api.md](references/rest-api.md#ids-vinden)).
- Bidirectionele en many-to-many-relaties zonder harde reden.
- `Double` als datatype; gebruik `Decimal` of `Int64`.

**Niet doen**
- RLS-rollidmaatschap beheren (zie hierboven).
- Credentialfouten bij vernieuwen programmatisch omzeilen.

## Controle voor oplevering

Altijd:

- [ ] PBIP-structuur klopt (als het model uit een PBIP-map komt); zie [pbip.md](references/pbip.md).
- [ ] Elke wijziging opnieuw getoetst aan [modelleren.md](references/modelleren.md) (en het Direct Lake-deel bij Direct Lake).
- [ ] Elke nieuwe zichtbare meting heeft `formatString`, `description` en waar zinvol `displayFolder`.
- [ ] Kolommen die in een meting worden opgeteld en vreemde sleutels zijn verborgen.
- [ ] Relaties: sleutels aan beide kanten hetzelfde `dataType`, standaard enkele filterrichting.
- [ ] Geen dubbele metingen en geen metingen die alleen naar een andere meting verwijzen.
- [ ] Bij `updateDefinition`: **alle** parts meegestuurd, geen `.platform`.

Alleen met een live model (Desktop of Service):

- [ ] Elke nieuwe meting getest met een eenvoudige query, bijv. `EVALUATE { [Naam van de meting] }`.
- [ ] Geen fouten: `EVALUATE INFO.MEASURES()` en kijk naar de kolom `ErrorMessage`.
- [ ] Nieuwe tabellen: vernieuwen gelukt. Een mislukte refresh wijst meestal op een verkeerde `sourceColumn`, een ongeldige M-expressie of een verkeerde Direct Lake-entiteit.

Mislukt een controle: herstellen en de controle opnieuw doen.

## Probleemoplossing

| Symptoom | Oplossing |
|---|---|
| TMDL-validatiefout | Lees de foutdetails, herstel de syntaxis, valideer opnieuw. Zie [tmdl.md](references/tmdl.md). |
| `InvalidLineType: Property!` | `database.tmdl` begint niet met een `database`-declaratie. Zie [tmdl.md](references/tmdl.md#databasetmdl). |
| `Import from JSON supported for V3 models only` | `defaultPowerBIDataSourceVersion: powerBI_V3` ontbreekt in `model.tmdl`. |
| `403 Forbidden` / `identity None` | Je hebt minimaal Contributor nodig. Stop; niet opnieuw proberen. |
| `401 Unauthorized` | Corrigeer één keer de `--resource` (audience); zie [rest-api.md](references/rest-api.md#authenticatie-en-audiences). Blijft het, dan ontbreken rechten: stop. |
| `202 Accepted` maar geen resultaat | Long-running operation: pollen tot het klaar is (zie [rest-api.md](references/rest-api.md#long-running-operations-lro)). |
| Onderdelen weg na `updateDefinition` | Je moet **alle** parts meesturen, gewijzigd én ongewijzigd. |
| Credentialfout bij vernieuwen | Referenties instellen in de Power BI Service. Niet opnieuw proberen. |
| DAX-fout in een meting | Controleer tabel- en kolomnamen en of de verwezen objecten bestaan. |
| `There are multiple datasets named '<name>'` | Duplicaten verwijderen en één keer deployen (zie [Deployen](#deployen-naar-een-workspace)). |
| Deployment mislukt | Controleer workspacerechten, compatibility level en de bronverwijzingen van Direct Lake-expressies. |
| Gegevensbron ontbreekt | Controleer of M-parameters of named expressions goed gedefinieerd zijn. |

## Voorbeeld: metingen toevoegen aan een ordermodel

*Vraag*: "Maak basismetingen voor alle optelbare kolommen in het model **Orders** in workspace **Supply Chain**."

1. **ID's opzoeken** met `az rest` (zie [rest-api.md](references/rest-api.md#ids-vinden)).
2. **Definitie ophalen** met `getDefinition` en de TMDL lokaal wegschrijven (route C), of de PBIP-map openen (route B).
3. **Inventariseren**: numerieke kolommen die geen sleutel of verborgen ID zijn, bijvoorbeeld `'Orderregels'[Bestelde hoeveelheid]` en `'Orderregels'[Geleverde hoeveelheid]`. Kies per kolom `SUM`, `AVERAGE`, `MIN` of `MAX` volgens [modelleren.md](references/modelleren.md) en [naamgeving.md](references/naamgeving.md).
4. **Metingen schrijven** bovenaan het tabelbestand (vóór de kolommen), met `formatString` en `///`-beschrijving; verberg de opgetelde kolommen. Voorbeeld:

   ```tmdl
   table Orderregels

   	/// Som van de bestelde aantallen op orderregelniveau.
   	measure 'Bestelde hoeveelheid (qty)' = SUM('Orderregels'[Bestelde hoeveelheid])
   		formatString: #,##0
   		displayFolder: Hoeveelheid

   	/// Aantal orderregels in de huidige selectie.
   	measure '# Orderregels' = COUNTROWS('Orderregels')
   		formatString: #,##0
   		displayFolder: Aantallen
   ```

   Let op: de meting mag niet exact dezelfde naam hebben als de kolom die hij optelt.
5. **Terugzetten** met `updateDefinition` (alle parts) of het project opnieuw openen in Desktop, en de [controle](#controle-voor-oplevering) doen.

Meer warehousevoorbeelden (OTIF, voorraadstand, leverbetrouwbaarheid) staan in [dax-richtlijnen.md](references/dax-richtlijnen.md#voorbeelden-voor-warehouse-en-supply-chain).
