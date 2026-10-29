# Refresh: types, strategie en troubleshooting

Refreshtypes, enhanced-refresh-opties, strategieën voor grote modellen en een uitgebreide foutentabel. De REST-basis (`az rest`, ID's opzoeken, authenticatie, long-running operations) staat in **fabric-semantic-model** (`rest-api.md`) en **fabric-basis**. De voorbeelden hier gebruiken de Fabric CLI (`fab`), die je zelf installeert en draait na `fab auth login`. Je hebt minstens Contributor op de workspace nodig.

## Inhoud

- [Refreshtypes](#refreshtypes)
- [Enhanced refresh](#enhanced-refresh)
- [Commit modes](#commit-modes)
- [Incremental refresh-beleid](#incremental-refresh-beleid)
- [Commando's](#commandos)
- [Patronen](#patronen)
- [Grote modellen](#grote-modellen)
- [Capaciteitsgrenzen](#capaciteitsgrenzen)
- [Troubleshooting](#troubleshooting)
- [Debugstappen](#debugstappen)

## Refreshtypes

| Type | Laadt data | Herberekent | Leegt eerst | Scope | Gebruik |
|---|:-:|:-:|:-:|---|---|
| `full` | ja | ja | ja | DB / tabel / partitie | Alles opnieuw laden en herberekenen |
| `automatic` | waar nodig | waar nodig | nee | DB / tabel / partitie | Alleen wat niet `Ready` is |
| `dataOnly` | ja | nee | ja | DB / tabel / partitie | Data laden zonder afhankelijken te herberekenen |
| `calculate` | nee | ja | nee | DB / tabel / partitie | Herberekenen zonder data te laden |
| `clearValues` | nee | nee | ja | DB / tabel / partitie | Object en afhankelijken leegmaken |
| `add` | ja (toevoegen) | ja | nee | alleen partitie | Rijen toevoegen aan een bestaande partitie |
| `defragment` | nee | nee | nee | DB / tabel | Ongebruikte dictionary-waarden opruimen |

Details:

- **`full`**: duurste maar grondigste. Gebruik na structurele bronwijzigingen of als partities in een inconsistente of foutstatus staan.
- **`automatic`**: standaard als je geen type opgeeft. Een partitie met data in `Ready` wordt overgeslagen. Geschikt voor geplande refreshes.
- **`dataOnly`**: berekende kolommen worden leeg, berekende tabellen verliezen hun data. Het model staat half-onverwerkt tot een `calculate` volgt.
- **`calculate`**: maakt geen bronverbinding. Handig na `dataOnly`, of als alleen DAX-logica is gewijzigd (nieuwe of aangepaste metingen).
- **`clearValues`**: maakt leeg zonder te laden; handig om geheugen vrij te maken vóór een selectieve herlaad.
- **`add`**: **niet via REST**, alleen via XMLA/TMSL (SSMS, Tabular Editor, PowerShell). Alleen voor gewone importpartities; de bronquery moet alleen de nieuwe rijen teruggeven. Bruikbaar voor log- of eventtabellen.
- **`defragment`**: verkleint het geheugen na veel partitiewijzigingen (incremental refresh).

## Enhanced refresh

Vereist Premium Per User, Premium of Fabric-capaciteit.

| Parameter | Standaard | Doel |
|---|---|---|
| `type` | `automatic` | Refreshtype |
| `commitMode` | `transactional` | Atomisch of per object |
| `maxParallelism` | `10` | Aantal parallelle threads; `1` = sequentieel |
| `retryCount` | `0` | Automatische herpogingen |
| `objects` | hele model | Lijst van tabellen/partities |
| `applyRefreshPolicy` | `true` | Incremental refresh-beleid toepassen of overslaan |
| `effectiveDate` | huidige datum | Andere datum voor het beleidsvenster |
| `timeout` | `05:00:00` | Per poging (max. 24 uur totaal met retries) |

| Functie | Standaard refresh | Enhanced refresh |
|---|---|---|
| Tabel/partitie kiezen | nee | ja |
| Commit mode, parallelliteit, retries, timeout | nee | ja |
| Status per object | nee | ja |
| Annuleren | nee | ja (`DELETE /refreshes/{id}`) |
| Refreshbeleid aan/uit | altijd aan | instelbaar |
| Vereist Premium/Fabric | nee (Pro kan) | ja |

Optimale volgorde bij parallel verwerken: eerst `clearValues` op alle objecten, dan `dataOnly`, dan `full` of `calculate`.

## Commit modes

| Mode | Gedrag | Wanneer |
|---|---|---|
| `transactional` (standaard) | Alles atomisch; faalt één object, dan wordt alles teruggedraaid en blijft het oude model staan | Productie, veilig |
| `partialBatch` | Elk object wordt los vastgelegd; bij een fout kan het model oude en nieuwe data mengen | Grote modellen met veel onafhankelijke tabellen; `applyRefreshPolicy` moet dan `false` zijn |

## Incremental refresh-beleid

Met `applyRefreshPolicy: true` en een tabel met beleid:

| Type | Gedrag |
|---|---|
| `full` | Maakt/actualiseert partities volgens beleid; ververst het incrementele bereik; slaat historie over |
| `dataOnly` | Als `full`, zonder afhankelijken te herberekenen |
| `automatic` | Als `full`, met automatische verwerking per partitie |
| `calculate`, `clearValues`, `add`, `defragment` | Beleid heeft geen invloed |

Zet `applyRefreshPolicy: false` om het beleid te omzeilen en partities handmatig te verversen; verplicht bij `partialBatch`.

## Commando's

Voorbeelden met de Fabric CLI; jij voert ze uit.

```bash
# ID's ophalen
WS_ID=$(fab get "WorkspaceName.Workspace" -q "id" | tr -d '"')
MODEL_ID=$(fab get "WorkspaceName.Workspace/ModelName.SemanticModel" -q "id" | tr -d '"')

# Baseline (en na de refresh hetzelfde nogmaals)
fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/executeQueries" \
  -X post -i '{
    "queries": [{"query": "EVALUATE ROW(\"RowCount\", COUNTROWS(FactSales), \"MaxDate\", MAX(FactSales[OrderDate]))"}],
    "serializerSettings": {"includeNulls": true}
  }'

# Volledige refresh
fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
  -X post -i '{"type":"full"}'

# Specifieke tabellen
fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
  -X post -i '{"type": "full", "objects": [{"table": "FactSales"}, {"table": "DimProduct"}]}'

# Specifieke partities
fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
  -X post -i '{"type": "full", "objects": [
      {"table": "FactSales", "partition": "FactSales_2024"},
      {"table": "FactSales", "partition": "FactSales_2023"}]}'

# Status (laatste refresh)
fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes?\$top=1"

# Annuleren: requestId uit de status halen
fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes/<requestId>" -X delete
```

Statussen: `Unknown` (mogelijk nog bezig), `InProgress`, `Completed`, `Failed`, `Disabled` (bijv. door selectieve refresh), `Cancelled`. Het veld `extendedStatus` geeft `NotStarted`, `InProgress`, `Completed`, `Failed`, `Cancelled`.

Annuleren werkt alleen voor refreshes die via de enhanced API zijn gestart, niet voor geplande of portal-refreshes.

Partitienamen vinden: exporteer het model en kijk in de `partition`-blokken van de TMDL-tabelbestanden.

```bash
fab export "Workspace.Workspace/Model.SemanticModel" -o /tmp/model -f
```

## Patronen

### Tweefasen-refresh (grote modellen)

1. `dataOnly` met `partialBatch` om alle tabellen te laden (elk apart vastgelegd): [examples/refresh-fase1-dataonly.json](../examples/refresh-fase1-dataonly.json).
2. `calculate` met `transactional` om alles atomisch te herberekenen: [examples/refresh-fase2-calculate.json](../examples/refresh-fase2-calculate.json).

Voordelen: een mislukte dataload laat berekende kolommen niet inconsistent achter, elke fase heeft zijn eigen commit mode, en je ziet direct welke fase faalde.

### Refresh na ETL

1. Upstream ETL laten lopen (pipeline, notebook, dataflow).
2. Controleren dat de bron (Lakehouse, Warehouse, SQL) verse data heeft.
3. Modelrefresh starten.
4. Met een DAX-query controleren dat rijtelling of maximale datum veranderd is.
5. Ongewijzigd? Dan slaagde de refresh maar was de bron oud: onderzoek de ETL-uitvoer. De refresh haalt alleen op wat de bron levert.

## Grote modellen

Modellen boven 1 GB of met refreshes langer dan een uur:

| Strategie | Wat |
|---|---|
| Partitie-refresh | Losse partities via enhanced REST of XMLA in plaats van het hele model (Premium/Fabric) |
| Incremental refresh | Tabellen automatisch per datum partitioneren; alleen recente data per cyclus. `RangeStart`/`RangeEnd` in Power Query; kies bewaarperiode (bijv. 3 jaar) en verversperiode (bijv. 30 dagen); "detect data changes" slaat ongewijzigde partities over |
| Aggregaties | Grote feitentabel op grovere grain voorgeaggregeerd in import; detailvragen vallen terug op DirectQuery |
| Hybride tabellen | Historie in import, recente data als DirectQuery-partitie; gerelateerde tabellen in Dual |
| Scale-out | Read-only replica bedient query's terwijl de primaire refresht (Premium) |

## Capaciteitsgrenzen

| Capaciteit | Max. refreshes/dag | Standaard timeout | Enhanced refresh |
|---|:-:|:-:|:-:|
| Pro | 8 | 2 uur | nee |
| Premium Per User | 48 | 5 uur | ja |
| Premium / Fabric | 48 | 5 uur | ja |

Pro ondersteunt alleen standaard-refreshes van het hele model.

## Troubleshooting

### Referenties en authenticatie

| Fout | Oorzaak | Oplossing |
|---|---|---|
| `DatasourceHasNoCredentialError` | Referenties ontbreken | Instellen in de modelinstellingen in de Service; cloudbronnen opnieuw aanmelden via OAuth |
| `OAuthTokenRefreshFailedError` | OAuth-token verlopen tijdens refresh (vaak bij Entra ID-bronnen zoals SharePoint, Dynamics); token verloopt na ~1 uur | Minder data per query, of een service principal gebruiken |
| Access forbidden / 403 | Te weinig workspacerechten | Minstens Contributor |
| Referenties niet meegekomen na `fab cp` | Persoonlijke of gateway-gebonden referenties gaan niet mee bij kopiëren naar een andere workspace | Opnieuw aanmelden in de modelinstellingen; alleen gedeelde cloudverbindingen gaan mee |

### Gegevensbron en gateway

| Fout | Oorzaak | Oplossing |
|---|---|---|
| `GatewayNotReachable` | On-premises gateway offline of verouderd | Laatste gatewayversie installeren; status controleren |
| Bron niet ondersteund voor refresh | Brontype niet geschikt voor geplande refresh | Ondersteunde bronnen nakijken; gateway of andere connector |
| `Web.Page`-connector faalt | Vereist een gateway | On-premises data gateway configureren |
| Verbinding verlopen of verbroken | Tijdelijke netwerkfout of langlopende M-query | Opnieuw proberen; blijft het, `Table.Buffer` voor complexe joins overwegen en brontimeouts controleren |

### Types en schema

| Fout | Oorzaak | Oplossing |
|---|---|---|
| Type mismatch | Brontype past niet bij `dataType` van de modelkolom | `Table.TransformColumnTypes` in de partitie, of het modeltype aanpassen |
| Column does not exist in rowset | Bronkolom hernoemd, verwijderd of andere hoofdletters | Bronschema controleren; `Table.RenameColumns` |
| Duplicate value on key column | Duplicaten aan de één-kant van een relatie | `Table.Distinct` in de partitie, bron opschonen, of herzien of de kolom een sleutel moet zijn |
| Kolom van type `ANY` met TRUE/FALSE | Booleans worden -1/0 in de Service (anders dan Desktop) | Expliciete types in Power Query vóór publiceren |

### Timeout en grootte

| Fout | Oorzaak | Oplossing |
|---|---|---|
| Timeout geplande refresh (2u / 5u) | Model te groot of complex | Verkleinen; incremental refresh; partitie-refresh via XMLA |
| Uncompressed data limit exceeded | Gedeelde capaciteit: 10 GB ongecomprimeerd tijdens refresh | Minder data; filteren in Power Query; naar Premium |
| Model groter dan capaciteitslimiet | 1 GB Pro, 25 GB Trial, wisselt per Fabric-SKU | Large model storage format (Premium); verkleinen; capaciteit verhogen |
| Querytimeout bij de bron | Bron heeft eigen timeout | `CommandTimeout` in de verbindingsreeks of M-expressie |
| Eerste incremental refresh time-out | Eerste run laadt alle historie | Initiële refresh via XMLA opstarten: partities aanmaken zonder data te laden |

### Incremental refresh

| Fout | Oorzaak | Oplossing |
|---|---|---|
| Query niet gefold | Filter op `RangeStart`/`RangeEnd` gaat niet naar de bron; alles wordt geladen en lokaal gefilterd | Folding controleren; filterstap foldbaar maken; `RangeStart`/`RangeEnd` als `DateTime` passend bij de bronkolom |
| Typeverschil parameters | Type past niet bij de datumkolom | Beide `DateTime`; bij gehele sleutels een conversiefunctie |
| Partitiesleutelconflict | Datumwaarden aan de bron gewijzigd na de eerste partitionering | Alle betrokken partities vanaf de wijzigingsdatum via XMLA verversen |
| Data afgekapt | Bron levert > 64 MB gecomprimeerd (Azure Data Explorer, Log Analytics) | Kleinere refresh-/bewaarperiodes |
| Dubbele rijen na datumwijziging | Gewijzigde transactiedatum zet een rij in twee partities | Partities vanaf het wijzigingspunt verversen; de partitiedatum aan de bron niet wijzigen |

### Capaciteit en throttling

| Fout | Oorzaak | Oplossing |
|---|---|---|
| Refresh gedrosseld | Te veel gelijktijdige refreshes | Buiten piekuren; schema's spreiden |
| `Capacity level limit exceeded` | Capaciteitsbrede limiet bereikt | Later opnieuw; overlappende schema's verminderen |
| Geheugenfout | Refresh vraagt ~2× de modelgrootte (origineel + kopie voor query's) | `Max Memory %` in capaciteitsinstellingen verhogen; model vereenvoudigen; scale-out |
| `Container exited unexpectedly (0x0000DEAD)` | Interne servicefout | Geplande refresh uit, model opnieuw publiceren, weer aan |

### Berekende tabellen en kolommen

| Fout | Oorzaak | Oplossing |
|---|---|---|
| Circular dependency bij refresh | `SummarizeColumns` binnen `CalculateTable` introduceerde nieuwe afhankelijkheden (wijziging september 2024) | De gegroepeerde tabellen als expliciete filters binnen `SummarizeColumns` opnemen |
| Berekende tabellen leeg na `dataOnly` | `dataOnly` leegt maar herbouwt niet | `calculate` erachteraan |
| `calculate` time-out | Veel calculation groups of grote berekende tabellen | Berekende tabellen los via XMLA verversen; timeout verhogen |

## Debugstappen

1. **Refreshhistorie bekijken**: `fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes?\$top=5"`. Kijk naar `status` en `serviceExceptionJson` voor de foutmelding en de tabel/partitie die faalde. In de Service zie je dit ook in de refreshgeschiedenis van het model.
2. **Falende tabel isoleren**: tabellen één voor één verversen, eerst dimensies, dan feiten, dan `calculate`.

   ```bash
   fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
     -X post -i '{"type":"full","objects":[{"table":"Customers"}]}'
   fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
     -X post -i '{"type":"full","objects":[{"table":"Invoices"}]}'
   fab api -A powerbi "groups/$WS_ID/datasets/$MODEL_ID/refreshes" \
     -X post -i '{"type":"calculate"}'
   ```

   Zonder Premium: test de query van de verdachte tabel in Power BI Desktop (Power Query-preview) en ververs daar per tabel.
3. **Bronschema vs modelschema vergelijken**:

   ```bash
   fab table schema "MyWorkspace.Workspace/MyLakehouse.Lakehouse/Tables/invoices"
   fab export "MyWorkspace.Workspace/MyModel.SemanticModel" -o ./model-export -f
   cat ./model-export/MyModel.SemanticModel/definition/tables/Invoices.tmdl | grep -A1 "column "
   ```

   Verschillen ze: typeconversie of hernoeming in de partitie-expressie toevoegen.
4. **Query folding controleren** (vooral bij incremental refresh): in Desktop **View Native Query** op de filterstap moet een `WHERE` tonen; bij de bron hoort per partitie één gefilterde query te verschijnen.
5. **Capaciteit controleren**:

   ```bash
   fab get "MyWorkspace.Workspace" -q "capacityId"
   fab api -A powerbi "capacities" -q "value[].{name:displayName, state:state, sku:sku}"
   ```

   Een workspace zonder (of met een gepauzeerde) capaciteit laat alle refreshes falen. Capaciteit: zie **fabric-basis**.
