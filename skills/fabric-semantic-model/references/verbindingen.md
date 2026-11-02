# Verbindingen binden

De gegevensbronverwijzingen van een semantisch model programmatisch koppelen aan (of loskoppelen van) een Fabric-verbinding met de Fabric REST-API **Bind Semantic Model Connection**. Gebruik dit bij promoveren tussen omgevingen (dev → prod), wisselen van gateway, overstappen naar een nieuwe server of het aansluiten van een vers gedeployed model.

Deze API vervangt de oude Power BI-API [Bind to Gateway in Group](https://learn.microsoft.com/rest/api/power-bi/datasets/bind-to-gateway-in-group). Hij ondersteunt gateway-, cloud-, virtual-network- en automatische verbindingen, en ontkoppelen (`None`).

> **Documentatie**
> - [Bind Semantic Model Connection](https://learn.microsoft.com/rest/api/fabric/semanticmodel/items/bind-semantic-model-connection)
> - [List Item Connections](https://learn.microsoft.com/rest/api/fabric/core/items/list-item-connections)
> - [List Connections](https://learn.microsoft.com/rest/api/fabric/core/connections/list-connections)
> - [Create Connection](https://learn.microsoft.com/rest/api/fabric/core/connections/create-connection)

## Voorwaarden

| Wat | Vereiste |
|---|---|
| Rol | Je bent **eigenaar** van het semantisch model |
| Delegated scope | `SemanticModel.ReadWrite.All` of `Item.ReadWrite.All` |
| Identiteiten | User, Service Principal, Managed Identity |
| Audience voor `az rest` | `https://api.fabric.microsoft.com` (niet de Power BI-audience) |

**Beperking:** geen bulk. Eén `bindConnection`-verzoek per gegevensbronverwijzing; een model met N bronnen vraagt N verzoeken.

## Endpoint

```
POST https://api.fabric.microsoft.com/v1/workspaces/{workspaceId}/semanticModels/{semanticModelId}/bindConnection
```

### Body

```jsonc
{
  "connectionBinding": {
    "id": "<connectionId-uuid>",                // Verplicht voor gateway/cloud; WEGLATEN bij Automatic en None
    "connectivityType": "OnPremisesGateway",    // Zie de tabel hieronder
    "connectionDetails": {
      "type": "SQL",                            // Brontype uit List Item Connections
      "path": "contoso.database.windows.net;sales"  // Bronpad uit List Item Connections
    }
  }
}
```

`connectionDetails` bepaalt **welke** gegevensbronverwijzing van het model je koppelt. Het moet exact overeenkomen met de `connectionDetails` die `List Item Connections` voor dat model teruggeeft.

### Waarden van `connectivityType`

| Waarde | Gebruik |
|---|---|
| `ShareableCloud` | Cloudverbinding die je met anderen kunt delen |
| `PersonalCloud` | Cloudverbinding voor één gebruiker |
| `OnPremisesGateway` | Standaard on-premises data gateway |
| `OnPremisesGatewayPersonal` | Persoonlijke on-premises data gateway |
| `VirtualNetworkGateway` | Virtual network data gateway |
| `Automatic` | Impliciete cloudverbinding (bijv. SSO). **Geen** `id` meesturen |
| `None` | Gegevensbronverwijzing ontkoppelen. **Geen** `id` meesturen |

### Antwoorden

| Status | Betekenis |
|---|---|
| `200 OK` | Koppeling toegepast |
| `429 Too Many Requests` | Rate limit; `Retry-After` afwachten |
| `400 InvalidRequest` | Ongeldige payload (`connectionDetails` komt niet overeen, verkeerd `connectivityType`) |
| `404 ItemNotFound` | Workspace of semantisch model niet gevonden |
| `403 Forbidden` | Je bent geen eigenaar van het model of mist de scope |

## Werkwijze

Stap 1–3 bepalen wat je aan wat koppelt; stap 4 koppelt. De variabelen komen overeen met [rest-api.md](rest-api.md); ID's opzoeken: zie [rest-api.md § ID's vinden](rest-api.md#ids-vinden).

1. **Gegevensbronverwijzingen van het model opvragen.** Zo zie je welke bronnen het model nodig heeft en welke exacte `connectionDetails` je moet terugsturen.

   ```bash
   WS_ID="<workspaceId>"
   MODEL_ID="<semanticModelId>"

   az rest --method get \
     --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/items/$MODEL_ID/connections"
   ```

   Elk item bevat de `connectionDetails` (`type` + `path`) van één gegevensbronverwijzing, plus de huidige gekoppelde verbinding (als die er is).

2. **Verbindingen opvragen waar je bij kunt.**

   ```bash
   az rest --method get \
     --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/connections"
   ```

3. **Verbinding zoeken (of maken).** Zoek voor elke verwijzing uit stap 1 een verbinding uit stap 2 met dezelfde `connectionDetails.type` en `connectionDetails.path` en noteer de `id`. Bestaat er geen, maak er dan eerst een met [Create Connection](https://learn.microsoft.com/rest/api/fabric/core/connections/create-connection).

   > **Matchregel:** `type` en `path` moeten **exact** overeenkomen (hoofdlettergevoelig en formaatgevoelig).

4. **Eén bind-verzoek per gegevensbronverwijzing versturen.**

   Koppelen aan een gateway- of cloudverbinding:

   ```bash
   CONNECTION_ID="<connectionId>"

   cat > /tmp/bind.json << EOF
   {
     "connectionBinding": {
       "id": "$CONNECTION_ID",
       "connectivityType": "OnPremisesGateway",
       "connectionDetails": {
         "type": "SQL",
         "path": "contoso.database.windows.net;sales"
       }
     }
   }
   EOF

   az rest --method post \
     --resource "https://api.fabric.microsoft.com" \
     --url "https://api.fabric.microsoft.com/v1/workspaces/$WS_ID/semanticModels/$MODEL_ID/bindConnection" \
     --headers "Content-Type=application/json" \
     --body @/tmp/bind.json
   ```

   Automatisch / standaardinstellingen (SSO), zonder `id`:

   ```jsonc
   {
     "connectionBinding": {
       "connectivityType": "Automatic",
       "connectionDetails": { "type": "SQL", "path": "contoso.database.windows.net;sales" }
     }
   }
   ```

   Ontkoppelen, zonder `id`:

   ```jsonc
   {
     "connectionBinding": {
       "connectivityType": "None",
       "connectionDetails": { "type": "SQL", "path": "contoso.database.windows.net;sales" }
     }
   }
   ```

5. **Controleren.** Voer stap 1 opnieuw uit en controleer dat elke verwijzing de verwachte verbindings-`id` heeft (of ontkoppeld is na `None`). Start daarna een refresh (zie [rest-api.md § Vernieuwen](rest-api.md#vernieuwen-refresh)) om te bevestigen dat de referenties werken.

> In PowerShell schrijf je de body naar een bestand en geef je dat mee met `--body @pad\naar\bind.json`; zie [rest-api.md](rest-api.md).

## Veelvoorkomende scenario's

| Scenario | Aanpak |
|---|---|
| Model promoveren dev → prod | Na deployen met `updateDefinition`: verwijzingen opvragen (stap 1), prod-verbindingen zoeken (stap 2), één bind-verzoek per verwijzing |
| Van cloudverbinding naar gateway | Eén bind-verzoek met `connectivityType: OnPremisesGateway` en de `id` van de gatewayverbinding |
| Bron tijdelijk loskoppelen | `connectivityType: None` (zonder `id`) |
| Model met meerdere bronnen | Over de verwijzingen uit stap 1 lopen; **één** verzoek per verwijzing. Bulk wordt niet ondersteund |
| Nieuwe deployment zonder verbindingen | Eerst verbindingen maken met Create Connection, dan koppelen |

## Moet / vermijd

**Moet**
- **Eén verzoek per gegevensbronverwijzing.** Bulkpayloads worden geweigerd.
- De **exacte** `connectionDetails.type` en `connectionDetails.path` uit `List Item Connections` gebruiken: niet herformatteren, niet naar kleine letters, niet normaliseren.
- Authenticeren tegen de Fabric-audience (`https://api.fabric.microsoft.com`), niet de Power BI-audience.
- Na elke koppeling controleren door de item connections opnieuw op te vragen.

**Vermijd**
- Het oude Power BI-endpoint `Default.BindToGateway`; deze API vervangt het.
- `id` meesturen bij `connectivityType: Automatic` of `None`.
- Verbindings-ID's hardcoderen; zoek ze op door de `connectionDetails` uit stap 1 te matchen met stap 2.
- Aannemen dat een geslaagde koppeling betekent dat de referenties kloppen; start altijd een refresh ter controle.

## Probleemoplossing

| Symptoom | Oorzaak / oplossing |
|---|---|
| `400 InvalidRequest` | `connectionDetails` komt met geen enkele verwijzing van het model overeen. Opnieuw ophalen via `List Item Connections` en letterlijk overnemen. |
| `403 Forbidden` | Je bent geen eigenaar van het model, of mist de scope `SemanticModel.ReadWrite.All` / `Item.ReadWrite.All`. Stop; niet opnieuw proberen. |
| `404 ItemNotFound` | Verkeerde `workspaceId` of `semanticModelId`. Opnieuw opzoeken (zie [rest-api.md § ID's vinden](rest-api.md#ids-vinden)). |
| Koppelen lukt, refresh mislukt | Referenties op de verbinding ontbreken of zijn ongeldig. Stel ze in op de verbinding zelf (in de Power BI Service); binden koppelt alleen de ID's. Niet programmatisch omzeilen. |
| Maar een deel van de bronnen bijgewerkt | Eén verzoek gestuurd terwijl het model meerdere bronnen heeft. Eén verzoek per verwijzing. |
| `id` geweigerd bij `Automatic` / `None` | `id` uit de payload halen; die geldt alleen voor expliciete cloud-, gateway- of VNet-koppelingen. |
