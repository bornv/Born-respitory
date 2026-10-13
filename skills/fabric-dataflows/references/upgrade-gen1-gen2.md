# Upgrade van Dataflow Gen1 naar Gen2.1

Een in-place migratie is niet mogelijk. Met *save-as* maak je een geüpgradede Gen2.1-kopie (CI/CD-formaat) terwijl de originele Gen1-dataflow blijft bestaan. Werkwijze: eerst gereedheid beoordelen, dan pas uitvoeren met vangrails.

## Harde grens

- Save-as werkt **alleen van Gen1 naar Gen2.1**.
- Is de bron al Gen2, of is de generatie niet vastgesteld: zeg dat er geen publiek save-as- of in-place-upgrade-endpoint beschikbaar is en stop vóór elke API-aanroep. Een alleen-lezen scan om Gen1-kandidaten te vinden mag wel.
- "Neem dan maar het dichtstbijzijnde endpoint" is geen toestemming om een definitie te exporteren en een kopie te maken via authoring. Vraag de gebruiker wat het doel is en om expliciete goedkeuring.
- Gen2 → Gen2 CI/CD in-place upgrade bestaat (nog) niet in de publieke API. Verzin geen endpoint.

## Inhoud

| Sectie | Wanneer laden |
|---|---|
| [API-audiences](#api-audiences) | 401 bij Power BI-aanroepen |
| [Stap 1: Gen1-dataflows vinden](#stap-1-gen1-dataflows-vinden) | Inventaris per workspace of tenantbreed |
| [Stap 2: risicosignalen](#stap-2-risicosignalen) | Zeven signalen met detectie-aanroepen |
| [Stap 3: classificeren en rapporteren](#stap-3-classificeren-en-rapporteren) | Veilig / handmatig / geblokkeerd |
| [Stap 4: save-as uitvoeren](#stap-4-save-as-uitvoeren) | `saveAsNativeArtifact` |
| [Stap 5: controle na save-as](#stap-5-controle-na-save-as) | Checklist voordat Gen1 wordt opgeruimd |

## API-audiences

| API | `--resource` | Gebruik |
|---|---|---|
| Fabric Items API | `https://api.fabric.microsoft.com` | Gen2-dataflows, workspaces, pipelines |
| Power BI REST API | `https://analysis.windows.net/powerbi/api` | Gen1-detectie, `saveAsNativeArtifact`, datasources, upstream dataflows, admin-scan |

Altijd `--resource` meegeven en bij POST naar Power BI ook `--headers "Content-Type=application/json"`.

## Stap 1: Gen1-dataflows vinden

Per workspace (geen beheerrechten nodig). De eigenschap `generation` (`1` of `2`) onderscheidt Gen1 en Gen2:

```bash
PBI="https://analysis.windows.net/powerbi/api"
ALL=$(az rest --method get --resource "$PBI" \
  --url "https://api.powerbi.com/v1.0/myorg/groups/$WS_ID/dataflows" \
  --query "value[].{id:objectId, name:name, generation:generation, modelUrl:modelUrl, configuredBy:configuredBy}" -o json)

echo "$ALL" | jq '[.[] | select(.generation == 1)]'
```

Tenantbreed (Fabric-beheerder of service principal met `Tenant.Read.All`; max. 200 aanvragen per uur; ondersteunt `$filter`, `$top`, `$skip`):

```bash
az rest --method get --resource "$PBI" \
  --url "https://api.powerbi.com/v1.0/myorg/admin/dataflows" \
  --query "value[].{id:objectId, name:name, workspaceId:workspaceId, modelUrl:modelUrl, configuredBy:configuredBy}" -o json \
  | jq '[.[] | select(.modelUrl != null and .modelUrl != "")]'
```

De admin-API toont `generation` mogelijk niet; gebruik dan `modelUrl` als signaal.

## Stap 2: risicosignalen

| # | Signaal | Ernst | Detectie | Kenmerk |
|---|---|---|---|---|
| 1 | Incrementele refresh | ⚠️ | Get Dataflow | `entities[].ppiConfig` aanwezig |
| 2 | BYOSA / eigen ADLS Gen2-opslag | ❌ | List Dataflows / admin-API | `modelUrl` → `<klant>.dfs.core.windows.net` |
| 3 | Power Automate- of API-triggers | ⚠️ | Vragen + transacties | Externe refreshes op het Gen1-ID |
| 4 | Pipelines die de dataflow aanroepen | ⚠️ | Fabric Pipelines API | Activiteit verwijst naar dataflow-ID |
| 5 | Gekoppelde/berekende entiteiten | ⚠️/❌ | Upstream Dataflows | `upstreamDataflows[]` niet leeg |
| 6 | DirectQuery | ❌ | Get Dataflow | `entities[].partitions[].mode == "directQuery"` |
| 7 | Je bent geen eigenaar en hebt minder dan Contributor | ❌ | `configuredBy` + rol | `DataflowUnauthorizedError` |

```bash
API_PBI="https://api.powerbi.com/v1.0/myorg"

# Volledige Gen1-definitie (signaal 1, 5, 6)
az rest --method get --resource "$PBI" --url "$API_PBI/groups/$WS_ID/dataflows/$DF_ID" -o json > dataflow-definition.json
jq '[.entities[]? | select(.ppiConfig != null) | {entity: .name, incrementalRefreshPolicy: .ppiConfig}]' dataflow-definition.json
jq '[.entities[]? | .partitions[]? | select(.mode == "directQuery") | {entity: .name, mode: .mode}]' dataflow-definition.json
jq '[.entities[]? | select(.linkedEntityRef != null) | {entity: .name, linkedTo: .linkedEntityRef}]' dataflow-definition.json

# Upstream dataflows (signaal 5)
az rest --method get --resource "$PBI" --url "$API_PBI/groups/$WS_ID/dataflows/$DF_ID/upstreamDataflows" -o json

# Datasources
az rest --method get --resource "$PBI" --url "$API_PBI/groups/$WS_ID/dataflows/$DF_ID/datasources" -o json

# Externe/API-refreshes (signaal 3)
az rest --method get --resource "$PBI" --url "$API_PBI/groups/$WS_ID/dataflows/$DF_ID/transactions" \
  --query "value[?refreshType=='OnDemand' || refreshType=='ViaApi']" -o json

# Pipelines in de workspace (signaal 4); daarna per pipeline de definitie op het dataflow-ID doorzoeken
az rest --method get --resource "https://api.fabric.microsoft.com" \
  --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/dataPipelines" \
  --query "value[].{id:id, name:displayName}" -o json

# Eigenaarschap (signaal 7)
az account show --query user.name -o tsv   # vergelijken met configuredBy
```

Toelichting per signaal:

| # | Gevolg | Herstel |
|---|---|---|
| 1 | Incrementeel beleid moet na save-as gecontroleerd worden | Testrefresh; venster (bewaartermijn + nieuwe data) controleren; zo nodig aanpassen |
| 2 | Data blijft in de oude opslag; Gen2 CI/CD gebruikt alleen Fabric-opslag | Data verplaatsen, of Gen1 laten staan / opnieuw ontwerpen; eventueel een nieuwe Gen2-dataflow die dezelfde ADLS-bron leest |
| 3 | De kopie krijgt een **nieuw ID** | Alle Power Automate-flows en API-integraties naar het nieuwe ID omzetten en testen (flows zelf: skill power-automate-flows) |
| 4 | Pipelineactiviteiten verwijzen op ID | Activiteiten opnieuw koppelen en testen |
| 5 | Verwijzingen breken als de bron nog Gen1 is | Afhankelijkheden in kaart brengen; upstream eerst (topologische volgorde). Upstream al Gen2: ⚠️; nog Gen1: ❌ |
| 6 | Gen2 CI/CD ondersteunt geen DirectQuery, alleen Import (met optionele staging/Fast Copy) | Eerst naar Import omzetten, of Gen1 laten staan |
| 7 | `saveAsNativeArtifact` vereist eigenaar of Contributor/Admin in de bronworkspace | Eigenaar of workspacebeheerder laten uitvoeren |

Signaal 3 is niet volledig via de API te zien: vraag de gebruiker of er Power Automate-flows of externe API's zijn die deze dataflow verversen.

## Stap 3: classificeren en rapporteren

| Categorie | Criteria | Actie |
|---|---|---|
| ✅ Veilig | Geen signalen | Save-as uitvoeren |
| ⚠️ Handmatige opvolging | Alleen signalen 1, 3, 4 of 5 (niet-blokkerend) | Save-as uitvoeren, daarna punten oplossen |
| ❌ Geblokkeerd | Signaal 2, 6 of 7 (of 5 met Gen1-upstream) | Eerst blokkade oplossen |

Rapport (markdown voor mensen):

```
## Save-As Readiness Snapshot
| Workspace | Dataflow | Type | Readiness | Risk Signals | Recommendation |
|---|---|---|---|---|---|
| Sales Analytics | SalesETL | Gen1 | ✅ Safe | None | Save as Gen2.1 copy now |
| Sales Analytics | CustomerLoad | Gen1 | ⚠️ Manual | Incremental refresh, Pipeline dep | Save as Gen2.1 copy, then re-enable schedule & update pipeline |
| Finance | FinanceDaily | Gen1 | ❌ Blocked | BYOSA storage | Resolve storage dependency first |
```

JSON voor automatisering:

```json
{
  "snapshotDate": "2025-04-13T10:00:00Z",
  "summary": { "total": 3, "safe": 1, "manual": 1, "blocked": 1 },
  "dataflows": [
    {
      "workspaceName": "Sales Analytics",
      "workspaceId": "...",
      "dataflowName": "SalesETL",
      "dataflowId": "...",
      "type": "Gen1",
      "readiness": "safe",
      "riskSignals": [],
      "recommendation": "Save as Gen2.1 copy now",
      "saveAsPath": "saveAsNativeArtifact"
    }
  ]
}
```

Een gereedheidsrapport upgradet niets; zeg dat ook zo als de gebruiker alleen om een scan vroeg.

## Stap 4: save-as uitvoeren

```
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/dataflows/{gen1DataflowId}/saveAsNativeArtifact
```

Preview-API. Maakt een **nieuw** Gen2.1 CI/CD-item; het Gen1-origineel blijft bestaan.

```bash
cat > /tmp/save-as-body.json <<'EOF'
{
  "displayName": "SalesETL_Gen2CICD",
  "description": "Saved as Gen2.1 copy from Gen1",
  "includeSchedule": true,
  "targetWorkspaceId": "<targetWorkspaceId>"
}
EOF

RESPONSE=$(az rest --method post \
  --resource "https://analysis.windows.net/powerbi/api" \
  --url "https://api.powerbi.com/v1.0/myorg/groups/$WS_ID/dataflows/$GEN1_ID/saveAsNativeArtifact" \
  --headers "Content-Type=application/json" \
  --body @/tmp/save-as-body.json)

echo "$RESPONSE" | jq '{newId: .artifactMetadata.objectId, state: .artifactMetadata.provisionState, errors: .errors}'
```

| Parameter | Type | Verplicht | Betekenis |
|---|---|---|---|
| `displayName` | string (max. 200) | nee | Naam; zonder wordt `_copy1` achtervoegsel gebruikt |
| `description` | string (max. 4000) | nee | Wordt anders van de bron gekopieerd |
| `includeSchedule` | boolean | nee | Kopieert het refreshschema, **uitgeschakeld** |
| `targetWorkspaceId` | uuid | nee | Doelworkspace; anders dezelfde |

Antwoord `200 OK` met `artifactMetadata` (o.a. `objectId`, `provisionState`) en `errors[]` met niet-fatale waarschuwingen:

| Waarschuwing | Betekenis |
|---|---|
| `FailedToCopySchedule` | Schema niet gekopieerd |
| `SetDataflowOriginFailed` | Herkomst niet vastgelegd |
| `ConnectionsUpdateFailed` | Verbindingen niet naar Fabric-formaat omgezet |

Valkuilen:

- **Body altijd via bestand.** Inline `--body '{...}'` kan door `az rest` in een extra envelop worden verpakt: `"saveAsRequest is a required parameter"`.
- **Windows (`az.cmd`):** laat `-o json` weg; anders `"A value that is not valid (json) was specified for the outputFormat parameter"`. Parse met `ConvertFrom-Json`.
- **Niet idempotent.** Elke aanroep maakt een nieuwe kopie. Controleer vóór een herhaling of de doelnaam al bestaat, of gebruik een tijdstempel in `displayName`.
- **Rechten.** Geen eigenaar en alleen Viewer/Member: `DataflowUnauthorizedError`.
- Bij een batch: upstream dataflows eerst; geen batch zonder dat het gereedheidsrapport is bekeken.

## Stap 5: controle na save-as

```bash
FAB="https://api.fabric.microsoft.com"
az rest --method get --resource "$FAB" --url "$FAB/v1/workspaces/$WS_ID/dataflows/$NEW_ID" -o json
az rest --method post --resource "$FAB" --url "$FAB/v1/workspaces/$WS_ID/dataflows/$NEW_ID/getDefinition" \
  --headers "Content-Type=application/json" -o json
```

- [ ] `artifactMetadata.provisionState` is `Active`.
- [ ] Elke waarschuwing in `errors[]` is een opvolgtaak geworden.
- [ ] Het nieuwe item staat in de doelworkspace met de verwachte naam en omschrijving; de definitie heeft het 3-delige Gen2-formaat.
- [ ] Pipelines, Power Automate-flows en API-aanroepen verwijzen naar het nieuwe ID.
- [ ] Schema staat uit; pas aanzetten of verversen na **expliciete toestemming** van de gebruiker.
- [ ] Gen1-dataflow pas verwijderen na geslaagde controle én expliciete toestemming.
