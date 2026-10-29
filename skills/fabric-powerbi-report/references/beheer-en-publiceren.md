# Beheer en publiceren

Wijzigingen veilig bijhouden met Git, het rapport controleren, publiceren naar een Fabric-werkruimte, de definitie downloaden en het rapport aan een ander semantisch model koppelen (rebind). Inhoud van de PBIR-bestanden zelf staat in de andere references; hier gaat het om transport en beheer.

## Inhoud

- [Twee routes](#twee-routes)
- [Spelregels](#spelregels)
- [Git: wijzigingen bijhouden en terugdraaien](#git-wijzigingen-bijhouden-en-terugdraaien)
- [Controleren vóór publiceren](#controleren-vóór-publiceren)
- [Optioneel: de CLI powerbi-report-author](#optioneel-de-cli-powerbi-report-author)
- [Publiceren via Power BI Desktop](#publiceren-via-power-bi-desktop)
- [REST: authenticatie en ID's](#rest-authenticatie-en-ids)
- [REST: overzicht van de API's](#rest-overzicht-van-de-apis)
- [Langlopende bewerkingen (LRO)](#langlopende-bewerkingen-lro)
- [Definitie downloaden](#definitie-downloaden)
- [Lokaal PBIP publiceren via REST](#lokaal-pbip-publiceren-via-rest)
- [Bestaand rapport in Fabric wijzigen](#bestaand-rapport-in-fabric-wijzigen)
- [Rebind naar een ander semantisch model](#rebind-naar-een-ander-semantisch-model)
- [Problemen](#problemen)

## Twee routes

| Route | Wanneer | Wat je nodig hebt |
|---|---|---|
| **Desktop** (standaard) | Lokaal PBIP, je publiceert zelf | Power BI Desktop |
| **REST** | Automatiseren, rapport zonder Desktop bijwerken, definitie downloaden | `az` CLI + `powerbi-report-author` (≥ 0.3.0) voor `pack`/`unpack` |

De REST-route gebruikt de Fabric REST API via `az rest`. Het omzetten van de mapstructuur naar een API-body (base64, padnamen) gebeurt met `powerbi-report-author pack`/`unpack`. Het origineel schrijft dat dwingend voor; handmatig base64 coderen en mappen doorlopen wordt afgeraden (backslashes in paden, ontbrekende onderdelen). Geen CLI? Gebruik de Desktop-route.

## Spelregels

- **Lokaal blijft lokaal.** Publiceer alleen als je daar in dit verzoek expliciet om vraagt ("publiceer", "upload", "deploy"). Akkoord op een ontwerp, een wijziging of een eerdere publicatie is géén toestemming voor een nieuwe publicatie.
- **Overschrijven vraagt een aparte bevestiging.** Ook na een publicatieverzoek: eerst bevestigen dat het bestaande rapport overschreven mag worden.
- **Alleen modern PBIR.** Geen PBIR-Legacy, geen `.pbix`.
- **Eén werkruimte** voor model én rapport; niet verdelen.
- **Bindingen controleren tegen het doelmodel** voordat je publiceert (zie [Rebind](#rebind-naar-een-ander-semantisch-model)).
- **Tijdelijke bestanden opruimen** na afloop (gedownloade definities, `payload.json`, request-bodies, logs).

## Git: wijzigingen bijhouden en terugdraaien

De Git-repo hoort de hele PBIP-map te omvatten (de map met het `.pbip`-bestand), niet alleen de `.Report`-map.

1. Controleer of de map een repo is:

   ```bash
   git -C "<pbip-map>" rev-parse --is-inside-work-tree
   ```

2. Geen repo? Alleen met jouw akkoord initialiseren:

   ```bash
   git -C "<pbip-map>" init
   git -C "<pbip-map>" add -A
   git -C "<pbip-map>" commit -m "Initial commit: baseline report state"
   ```

3. Openstaande wijzigingen? Eerst vastleggen als checkpoint of stashen (`git stash push -m "..."`), niet zomaar overschrijven.
4. Maak een werkbranch per doel, bijv. `report/voorraad-pagina` of `report/donker-thema`.
5. Wijzig, controleer (zie hieronder) en commit pas na jouw akkoord, met een beschrijvende boodschap (bijv. "Pagina Voorraad toegevoegd met 4 KPI-kaarten en trendgrafiek").
6. Klaar: de wijzigingen staan op de werkbranch; samenvoegen doe je zelf.

`localSettings.json` hoort in `.gitignore` (gebruikersstatus).

| Terugdraaien | Commando |
|---|---|
| Eén bestand naar laatste commit | `git -C "<pbip-map>" checkout HEAD -- "pad/naar/bestand.json"` |
| Alle niet-vastgelegde wijzigingen (alleen op uitdrukkelijk verzoek; let op ongerelateerde nieuwe bestanden) | `git -C "<pbip-map>" checkout -- .` en `git -C "<pbip-map>" clean -fd` |
| Laatste commit ongedaan | `git -C "<pbip-map>" reset --hard HEAD~1` |
| Hele werkbranch weggooien | `git -C "<pbip-map>" checkout main` en `git -C "<pbip-map>" branch -D <werkbranch>` |

Nooit force-pushen of geschiedenis herschrijven op branches die jij niet voor dit werk hebt aangemaakt.

## Controleren vóór publiceren

1. Loop de checklist **Controle voor oplevering** in `SKILL.md` na.
2. Open het `.pbip` in Power BI Desktop (of herlaad het) en bekijk elke gewijzigde pagina.
3. Optioneel met de CLI: `powerbi-report-author validate "<pad-naar-.Report>"` en los elke fout op.
4. Bij publiceren naar een bestaand model in de werkruimte: bindingen vergelijken met dat model ([Rebind](#rebind-naar-een-ander-semantisch-model)).

## Optioneel: de CLI powerbi-report-author

Niet nodig voor de Desktop-route. Wil je validatie of de REST-route gebruiken, installeer hem dan zelf:

```bash
npm install -g @microsoft/powerbi-report-authoring-cli@latest
powerbi-report-author --version   # minimaal 0.3.0
```

| Commando | Doet |
|---|---|
| `powerbi-report-author validate "<.Report>"` | Schema- en verwijzingscontrole (ook bladwijzers) |
| `powerbi-report-author pack <map> --raw --out body.json` | Bouwt de request-body voor `updateDefinition` (alle onderdelen) |
| `powerbi-report-author pack <map> --raw --mode create --display-name "<naam>" [--description "<tekst>"] --out body.json` | Bouwt de request-body voor een nieuw rapport |
| `powerbi-report-author unpack <map> --input payload.json` | Zet een `getDefinition`-antwoord om naar bestanden |

- `pack` accepteert een `.pbip`-bestand, een `.Report`-map of een map met `definition/`, en geeft altijd **alle** onderdelen met forward-slash-paden en `payloadType: "InlineBase64"`.
- Gebruik `--raw` altijd als de uitvoer de request-body is (zonder `--raw` krijg je een `{"data":{...}}`-envelop).
- `--display-name` alleen bij `--mode create`, nooit bij een update. Geen `--description ""`; laat de vlag weg.
- `pack` controleert het formaat niet. Eerst controleren: moderne `definition/`-map met `definition/report.json`, en `validate` zonder fouten.
- `unpack` overschrijft standaard niets; `--force` alleen in een wegwerpmap, nooit in je eigen bronmap. `unpack` weigert PBIR-Legacy met `UNPACK_FORMAT_UNSUPPORTED`.
- Werk bij voorkeur via bestanden (`--out`, `--input`, `--body @bestand`), zeker in PowerShell; pipes kunnen de codering verstoren.

## Publiceren via Power BI Desktop

1. Controleer volgens [Controleren vóór publiceren](#controleren-vóór-publiceren).
2. Open het `.pbip` in Power BI Desktop en sla op.
3. Kies **Home → Publish** en selecteer de doelwerkruimte.
4. Bestaat er al een rapport met die naam, dan vraagt Desktop om te vervangen: alleen bevestigen als jij overschrijven hebt goedgekeurd.
5. Open het rapport in de browser en controleer elke pagina; programmatisch kan de weergave na publicatie niet betrouwbaar gecontroleerd worden.

## REST: authenticatie en ID's

Inloggen, werkruimte- en item-ID's opzoeken en paginering: zie skill `fabric-basis`. Voor deze API geldt:

- Altijd `--resource "https://api.fabric.microsoft.com"` meegeven aan `az rest` (anders 401 of stille fout).
- ID's niet hardcoderen; opzoeken op naam.

```bash
REPORT_NAME="Warehouse KPI"   # voorbeeld
REPORT_ID=$(az rest --method get \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/reports" \
  --query "value[?displayName=='$REPORT_NAME'] | [0].id" \
  --output tsv)
```

Houd per sessie één kort overzicht bij: werkruimte (naam/ID), model (naam/ID), rapport (naam/ID), lokale paden en de volledige `getDefinition`-URL. Hergebruik die in plaats van steeds opnieuw op te zoeken.

## REST: overzicht van de API's

Basis-URL: `https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/reports`.

| Bewerking | Methode + pad | Rechten | Scopes | LRO |
|---|---|---|---|---|
| Rapporten opsommen | `GET /reports` | Viewer op werkruimte | `Workspace.Read.All` of `Workspace.ReadWrite.All` | nee (paginering via `continuationToken`) |
| Eigenschappen ophalen | `GET /reports/$REPORT_ID` | Lezen op rapport | `Report.Read.All` of `Report.ReadWrite.All` | nee |
| Definitie ophalen | `POST /reports/$REPORT_ID/getDefinition?format=PBIR` | Lezen én schrijven op rapport | `Report.ReadWrite.All` of `Item.ReadWrite.All` | ja |
| Rapport maken | `POST /reports` | Contributor op werkruimte | `Report.ReadWrite.All` of `Item.ReadWrite.All` | ja |
| Definitie bijwerken | `POST /reports/$REPORT_ID/updateDefinition` | Lezen én schrijven op rapport | `Report.ReadWrite.All` of `Item.ReadWrite.All` | ja |
| Naam/omschrijving wijzigen | `PATCH /reports/$REPORT_ID` | Lezen én schrijven op rapport | `Report.ReadWrite.All` of `Item.ReadWrite.All` | nee |
| Verwijderen | `DELETE /reports/$REPORT_ID` (`?hardDelete=true` = definitief) | Schrijven op rapport | `Report.ReadWrite.All` of `Item.ReadWrite.All` | nee |

- `getDefinition` is een **POST** en altijd met `?format=PBIR`; zonder die parameter kunnen oudere rapporten PBIR-Legacy teruggeven.
- `getDefinition` werkt niet bij een versleutelend gevoeligheidslabel (`OperationNotSupportedForItem`).
- `updateDefinition` **vervangt de hele definitie**: ontbrekende onderdelen worden verwijderd. `pack` neemt altijd alles mee.
- `?updateMetadata=true` op `updateDefinition` werkt ook de itemmetadata bij uit `.platform`.
- Voorkeur: soft delete (herstelbaar) boven `hardDelete=true`.

**Naam/omschrijving wijzigen** (raakt de definitie niet):

```bash
cat > update-report.json << 'EOF'
{
  "displayName": "Renamed Report",
  "description": "Updated description"
}
EOF

az rest --method patch \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/reports/$REPORT_ID" \
  --headers "Content-Type=application/json" \
  --body @update-report.json
```

## Langlopende bewerkingen (LRO)

Maken, `getDefinition` en `updateDefinition` kunnen `202 Accepted` teruggeven. Dan:

1. Draai de aanroep altijd met `--verbose` en schrijf de uitvoer naar een logbestand; alleen zo krijg je de header `x-ms-operation-id` te zien.
2. Lees de operatie-ID uit het log.
3. Poll `GET https://api.fabric.microsoft.com/v1/operations/$OP_ID` tot `status` `Succeeded`, `Failed` of `Cancelled` is (`Running`/`NotStarted` = wachten). Houd een begrensde wachttijd aan (bijv. 5 s, oplopend tot max. 30 s, max. 60 pogingen) en volg een eventuele `Retry-After`.
4. Bij `getDefinition`: haal na `Succeeded` het resultaat op via `GET .../v1/operations/$OP_ID/result`.

**Nooit een create-POST herhalen na een `202`**: de bewerking loopt al en een tweede POST maakt een duplicaat. Operatie-ID kwijt? Zoek het nieuwe rapport via de lijst-API.

```bash
OP_ID=$(grep -ioE "x-ms-operation-id[^a-f0-9-]*[a-f0-9-]+" start.log | grep -ioE "[a-f0-9-]+$" | head -1 || true)
STATUS=$(az rest --method get \
  --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/operations/$OP_ID" \
  --query status --output tsv)
```

PowerShell-variant om de ID uit het log te halen:

```powershell
az rest --method post ... --verbose 2>&1 | Out-File "$env:TEMP\lro-response.txt" -Encoding utf8
$opId = (Select-String -Path "$env:TEMP\lro-response.txt" -Pattern "x-ms-operation-id.*?'([a-f0-9-]+)'" | Select-Object -First 1).Matches.Groups[1].Value
```

Bij een pipe in PowerShell (`pack ... | az rest ...`): `2>&1` aan de `az rest`-kant, nooit aan de `pack`-kant, en eerst `[Console]::OutputEncoding` en `$OutputEncoding` op UTF-8 zetten. Eenvoudiger: werk via bestanden.

## Definitie downloaden

1. Zoek `$WS_ID` en `$REPORT_ID` op en leg de volledige URL één keer vast:

   ```bash
   GET_DEF_URL="https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/reports/$REPORT_ID/getDefinition?format=PBIR"
   ```

2. Vraag de definitie op:

   ```bash
   az rest --method post \
     --resource "https://api.fabric.microsoft.com" \
     --url "$GET_DEF_URL" \
     --output-file payload.json \
     --verbose 2>&1 | tee get-definition-start.log
   ```

3. Kwam er een `202`? Dan is `payload.json` nog niet de definitie. Poll volgens [LRO](#langlopende-bewerkingen-lro) en sla het resultaat op:

   ```bash
   az rest --method get \
     --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/operations/$OP_ID/result" \
     --output-file payload.json
   ```

4. Controleer dat `definition.format` gelijk is aan `"PBIR"`. `"PBIR-Legacy"` = stoppen; die vorm wordt niet ondersteund.
5. Pak uit in een **nieuwe, lege** map:

   ```bash
   powerbi-report-author unpack ./MyReport.Report --input payload.json
   ```

   `unpack` overschrijft alleen bestanden die in het antwoord zitten. In een hergebruikte map blijven onderdelen staan die op de server verwijderd zijn, en de volgende `pack` zet ze weer terug.

In een gedownload rapport staat `definition.pbir` als `byConnection` met `semanticmodelid=…`; die vorm opent niet in Desktop (zie [pbir-structuur.md](pbir-structuur.md#koppeling-met-het-model-definitionpbir)).

## Lokaal PBIP publiceren via REST

Alleen na een expliciet publicatieverzoek.

1. **Herken een lokaal PBIP**: een `<Naam>.pbip`, een `.Report`-map met een `.SemanticModel`-map ernaast, `definition.pbir` met `byPath`, of een `.pbi/`-map. Alleen een `.Report` met `byConnection`? Gebruik [Bestaand rapport in Fabric wijzigen](#bestaand-rapport-in-fabric-wijzigen).
2. **Bevestig de doelwerkruimte** en zoek de ID op. Bestaat ze niet of is de naam dubbelzinnig: melden en stoppen. Deze werkruimte geldt voor model én rapport.
3. **Vraag wat er met het model moet gebeuren**: "Wil je het lokale semantisch model ook naar deze werkruimte publiceren, of dit rapport koppelen aan een bestaand model in de werkruimte?" Niet zelf kiezen.
4. **Model publiceren** → via skill `fabric-semantic-model` (werkruimte-ID, pad naar de `.SemanticModel`-map, gewenste modelnaam). Wacht tot dat klaar is.
   **Bestaand model** → somt de semantische modellen in de werkruimte op en bevestig de keuze.
5. **Zoek de `semanticModelId`** op naam in de werkruimte (ook na een verse modelpublicatie).
6. **Controleer de bindingen** tegen het doelmodel (zie [Rebind](#rebind-naar-een-ander-semantisch-model)). Ook na een verse publicatie: tabelnamen kunnen bij publiceren veranderen.
7. **Zet `definition.pbir` om** van `byPath` naar `byConnection` (API-vorm) vóór `pack`; `pack` repareert dit niet en de API weigert `byPath`:

   ```json
   "datasetReference": {
     "byConnection": {
       "connectionString": "semanticmodelid=<resolved-id>"
     }
   }
   ```

8. **Nieuw of overschrijven?** Standaardnaam = bestandsnaam van het `.pbip` zonder extensie (`SalesDashboard.pbip` → `"SalesDashboard"`); laat de naam bevestigen. Zoek die naam in de werkruimte op:
   - niet gevonden → nieuw rapport maken;
   - gevonden → vragen: overschrijven (`updateDefinition`), andere naam, of annuleren.
9. **Pack en upload** (na `validate`):

   Nieuw:

   ```bash
   powerbi-report-author pack ./MyReport.Report --raw --mode create --display-name "$REPORT_DISPLAY_NAME" --out create-report.json
   az rest --method post \
     --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/reports" \
     --headers "Content-Type=application/json" \
     --body @create-report.json \
     --verbose 2>&1 | tee publish-create-start.log
   ```

   Overschrijven (alleen na bevestiging):

   ```bash
   powerbi-report-author pack ./MyReport.Report --raw --out update-definition.json
   az rest --method post \
     --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/reports/$REPORT_ID/updateDefinition" \
     --headers "Content-Type=application/json" \
     --body @update-definition.json \
     --verbose 2>&1 | tee publish-update-start.log
   ```

   Daarna de LRO pollen tot `Succeeded`.
10. **Opruimen** en de link naar werkruimte/rapport geven, zodat je het in de browser controleert.

Let op: met `byConnection` in de API-vorm opent het lokale project niet meer in Desktop. Werk op een kopie of zet `definition.pbir` na publicatie terug (Git).

## Bestaand rapport in Fabric wijzigen

1. Log in en zoek werkruimte- en rapport-ID op (`fabric-basis`).
2. Download de definitie in een verse map ([Definitie downloaden](#definitie-downloaden)).
3. Pas de bestanden aan volgens de andere references van deze skill.
4. Controleer met `powerbi-report-author validate`.
5. Na expliciet verzoek én bevestiging van overschrijven: `pack --raw --out update-definition.json` → `POST .../updateDefinition` met `--body @update-definition.json` → LRO pollen.
6. Download eventueel opnieuw met dezelfde `GET_DEF_URL` ter controle en ruim tijdelijke bestanden op.

## Rebind naar een ander semantisch model

Rebind = het rapport naar een ander model laten wijzen. Twee onderdelen: de koppeling in `definition.pbir` en de veldnamen in alle visuals, filters en bladwijzers.

1. **Doelmodel bepalen** en de `semanticModelId` opzoeken in de werkruimte.
2. **Inventaris van het doelmodel maken**: download de TMDL-definitie één keer (skill `fabric-semantic-model`) en maak een lijst van tabel-, kolom- en measurenamen.
3. **Vergelijk alle bindingen** in de `.Report`-map met die lijst: `Entity`, `Property`, `queryRef`, `nativeQueryRef`, en filter-`Entity`/`Source`-verwijzingen in `report.json`, `page.json`, `visual.json` en bladwijzers.
4. **Beslis**:

   | Uitkomst | Actie |
   |---|---|
   | Alles klopt | Alleen de koppeling aanpassen |
   | Namen wijken af, structuur gelijk (zelfde kolommen/measures) | Alle tabelgebonden verwijzingen hernoemen (parse JSON, geen zoek-en-vervang) |
   | Structuur verschilt | Eerst aan jou voorleggen welke tabellen/kolommen/measures ontbreken en vragen of het rapport aangepast moet worden |

5. **Koppeling zetten** in `definition.pbir` volgens [pbir-structuur.md](pbir-structuur.md#koppeling-met-het-model-definitionpbir): `byPath` voor lokaal met model ernaast, volledige `byConnection` om in Desktop live te koppelen, `semanticmodelid=…` voor API-publicatie. Alleen `connectionString` in `byConnection`; `$schema` ongewijzigd.
6. **Controleren**: openen in Desktop (of na publicatie in de browser) en elke pagina nalopen op lege visuals.

*Voorbeeld:* rapport gebouwd op lokaal model met tabel `Voorraad`, doelmodel in de werkruimte heeft `Inventory` met dezelfde kolommen → elke `"Entity": "Voorraad"` wordt `"Entity": "Inventory"` en elke `queryRef` `Voorraad.<veld>` wordt `Inventory.<veld>`, ook in `metadata`-selectors van voorwaardelijke opmaak.

## Problemen

| Fout | Oorzaak | Oplossing |
|---|---|---|
| `401 Unauthorized` | Verkeerde of ontbrekende `--resource` | `--resource "https://api.fabric.microsoft.com"` |
| `403 Forbidden` | Te weinig rechten | Minimaal Contributor voor schrijven |
| `404 Not Found` | Verkeerde werkruimte- of rapport-ID | Opnieuw opzoeken via de lijst-API's |
| `CorruptedPayload` | Ongeldige base64 of PBIR, meestal door handwerk | `pack`/`unpack` gebruiken |
| `MissingDefinitionParts` | Backslashes in paden (`definition\report.json`) door handwerk | `pack` (forward slashes) |
| `202` zonder resultaat | LRO niet gepold | Pollen tot eindstatus |
| `OperationNotSupportedForItem` | Versleutelend gevoeligheidslabel | Definitie kan niet opgehaald worden |
| `ItemDisplayNameAlreadyInUse` | Naam bestaat al in werkruimte | Andere naam of overschrijven (met bevestiging) |
| `format: "PBIR-Legacy"` / `UNPACK_FORMAT_UNSUPPORTED` | Oud formaat of `?format=PBIR` vergeten | Opnieuw met `?format=PBIR`; blijft het Legacy, dan stoppen |
| Dubbele rapporten na maken | Create-POST herhaald na `202` | Nooit herhalen; duplicaten verwijderen |
| Lege visuals na publicatie | Tabelnamen in rapport ≠ doelmodel | Bindingen vergelijken en hernoemen ([Rebind](#rebind-naar-een-ander-semantisch-model)) |
| Lege visuals, bindingen kloppen | `byConnection` wijst naar oude model-ID (bijv. uit `.pbi/`-cache) | `semanticmodelid` op de net opgezochte ID zetten en opnieuw publiceren |
| Model en rapport in verschillende werkruimtes | Werkruimte niet vooraf vastgelegd | Rapport opnieuw publiceren in de werkruimte van het model, of model verplaatsen |
| Onderdelen verdwenen na update | Body bevatte niet alle onderdelen | Altijd volledige `pack`, uit een complete map |
| Verwijderde pagina komt terug na update | `unpack --force` in hergebruikte map | Altijd in een nieuwe, lege map downloaden |
