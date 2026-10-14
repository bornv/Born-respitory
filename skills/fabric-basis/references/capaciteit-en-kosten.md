# Capaciteit en kosten (overzicht)

Detail bij [SKILL.md](../SKILL.md). Bron: `common/COMMON-CORE.md` § Capacity Management en een ingekort overzicht uit de skill `e2e-fabric-cost-estimation` (microsoft/skills-for-fabric, MIT). Migratieberekeningen (Databricks, Synapse, AWS/GCP), de Azure Cost Management-queries en het kostenwerkblad zijn weggelaten.

## Hoe Fabric rekent

Fabric gebruikt een **uniform capaciteitsmodel**: alle workloads delen één pool **Capacity Units (CU's)**.

| Dimensie | Beschrijving | Afrekening |
|---|---|---|
| **Compute (CU-seconden)** | Rekenkracht van queries, Spark-jobs, pipelines | CU-verbruik tegen de capaciteits-SKU |
| **Opslag (GB/maand)** | OneLake-opslag voor Delta-tabellen, Files, shortcuts | Tarief per GB per maand |
| **Netwerk-egress (GB)** | Data die de Azure-regio verlaat | Per GB |
| **Capaciteitsreservering** | Basis-SKU (F2–F8192) | Maandelijkse of jaarlijkse verplichting |

### CU-verbruik per workload

| Workload | Verbruiksmodel | Belangrijkste factor |
|---|---|---|
| **Power BI** (semantische modellen, rapporten) | CU-seconden per query/refresh | Modelgrootte, verversfrequentie, DAX-complexiteit |
| **Dataflows Gen2** | CU-seconden per refresh | Complexiteit van transformaties, datavolume |
| **Data Pipelines** | CU-seconden per activity-uitvoering | Activity-type, verplaatst volume |
| **SQL DW** (warehousequeries) | CU-seconden per query | Querycomplexiteit × gescande data |
| **Spark** (notebooks, SJD) | CU-seconden tijdens actieve Spark-sessie | vCores × duur |
| **Eventhouse / KQL** | CU-seconden per query + ingestie | Ingestiesnelheid, queryfrequentie |
| **OneLake** | Alleen opslag (geen CU voor data in rust) | GB opgeslagen |

Onderschat Power BI niet: modelverversingen en interactieve queries verbruiken veel CU's.

## SKU-tiers

De **enige geldige** Fabric-capaciteitstiers zijn **F2, F4, F8, F16, F32, F64, F128, F256, F512, F1024, F2048, F4096, F8192**. `F`*n* = *n* CU's; het aantal verdubbelt per stap. Tussenmaten (zoals F48 of F96) bestaan niet.

| Benodigde CU (na groei en 1,2× marge) | SKU | Typisch gebruik volgens bron |
|---|---|---|
| ≤ 2 | F2 | Trial / zeer kleine dev |
| 3–4 | F4 | Dev/test, klein team |
| 5–8 | F8 | Kleine productie |
| 9–16 | F16 | Middelgrote productie |
| 17–32 | F32 | Standaard productie |
| 33–64 | F64 | Grote productie, meerdere teams |
| 65–128 | F128 | Enterprise |
| 129–256 | F256 | Grote enterprise |
| 257–8192 | F512 … F8192 | Zeer groot tot grootste enkele capaciteit |
| > 8192 | Meerdere capaciteiten | Multi-capaciteitsarchitectuur |

### Power BI-SKU's naar Fabric

| Power BI | CU's | Fabric-equivalent |
|---|---|---|
| EM1/A1 | 8 | F8 |
| EM2/A2 | 16 | F16 |
| EM3/A3 | 32 | F32 |
| P1 | 64 | F64 |
| P2 | 128 | F128 |
| P3 | 256 | F256 |
| P4 | 512 | F512 |
| P5 | 1024 | F1024 |

Bij een één-op-één-migratie van één P-SKU is de aanbeveling de directe CU-equivalent (P1 → F64, P2 → F128). Vermenigvuldig de *nominale* grootte niet nog eens met de veiligheidsmarge.

## Grootte bepalen (globaal)

1. Bepaal per tijdvak (bijv. per uur) de som van gelijktijdig CU-verbruik van **alle** workloads; neem het hoogste tijdvak. Niet de hoogste piek per workload los: pieken kunnen samenvallen.
2. Pas groei toe op de **vraag**: `projected_CU = basis_CU × (1 + growth_rate)`.
3. Pas een veiligheidsmarge van **1,2×** toe.
4. Rond **naar boven** af op een bestaande tier.
5. Toets aan het budget; zo niet, optimaliseer workloads of faseer.

Smoothing spreidt korte pieken (interactief ca. 5–64 min, achtergrond tot 24 uur), maar verlaagt de aanhoudende gelijktijdige vraag niet. Valideer schattingen altijd met een pilot en gemeten CU-verbruik in de **Capacity Metrics app**.

## Afrekenmodellen

| Model | Beschrijving | Geschikt voor |
|---|---|---|
| **Reserved Instance (RI)** | Verplichting voor 1 of 3 jaar met korting | Stabiele basislast |
| **Pay-As-You-Go (PAYG)** | Per uur, zonder verplichting, volle prijs | Testen, onvoorspelbare workloads |
| **Autoscale Billing for Spark** | Opt-in: Spark-jobs worden van de capaciteit afgehaald en apart per Spark-CU-uur afgerekend; bursting en smoothing staan dan uit voor Spark | Variabele Spark-kosten scheiden van de basiscapaciteit |
| **Fabric Trial** | Proefcapaciteit (grootte verschilt per tenant, vaak tot F64 voor 60 dagen; actuele voorwaarden controleren) | Alleen evaluatie; nooit productie op baseren |

Pauzeren/hervatten van een capaciteit stopt de facturering zolang hij gepauzeerd is: geschikt voor intermitterend gebruik (dev/test, vaste batchvensters). Adviseer een RI pas na minimaal 30 dagen echte gebruiksdata, en een 3-jaars-RI pas na minimaal 3 maanden stabiel patroon.

## Prijzen: altijd live

- **Noem nooit bedragen uit het hoofd of uit deze skill.** Prijzen verschillen per regio en veranderen.
- Bepaal eerst de **regio**: `GET /v1/capacities` geeft per capaciteit `region`, `sku` en `state` (zie [rest-patronen.md](rest-patronen.md)). Is er nog geen capaciteit, vraag dan naar de geplande Azure-regio. Neem geen standaardregio aan.
- Haal tarieven op uit de publieke **Azure Retail Prices API** (geen authenticatie nodig):

  ```bash
  curl -s "https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&\$filter=serviceName%20eq%20'Microsoft%20Fabric'%20and%20armRegionName%20eq%20'<region>'" | jq '.Items[] | {meterName, retailPrice, unitOfMeasure, type, reservationTerm}'
  ```

- De API geeft een **prijs per CU**, geen prijs per SKU. PAYG staat op Consumption-meters waarvan `meterName` eindigt op `Capacity Usage CU`; reserveringen op `meterName eq 'Fabric Capacity CU'`. De Autoscale-Spark-meter (`autoscale for Spark Capacity Usage CU`) is een **apart** tarief: nooit het PAYG-tarief hergebruiken.
- Omrekenen naar maandbedragen:
  - PAYG per maand = `consumptionCuHourRate × skuCUs × 730`
  - 1-jaars-RI per maand = `reservationRetailPrice × skuCUs ÷ 12` (reserveringsrijen zijn termijntotalen, niet × 730)
  - 3-jaars-RI per maand = `reservationRetailPrice × skuCUs ÷ 36`
- OneLake-opslag is getrapt: meters `OneLake Storage Hot Data Stored`, `OneLake Storage Cool Data Stored`, `OneLake Storage Cold Data Stored` (en `Storage Mirroring Data Stored` voor mirroring). Shortcuts kosten zelf niets; opslagkosten aan de bronkant blijven.
- Vermeld bij elk bedrag de **regio, valuta, bron en datum**. Is de API niet bereikbaar, verwijs naar de [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/).
- Een vraag puur in CU's ("welke SKU past bij 80 CU's?") is rekenwerk en heeft geen prijsopvraag nodig. Zodra er een bedrag bij komt, wel.

## Tips

- Houd capaciteit en opslag in **dezelfde regio**; verkeer binnen een regio is gratis.
- Gebruik **OneLake-shortcuts** in plaats van kopiëren om dubbele opslagkosten te vermijden.
- Monitor maandelijks het verbruik na ingebruikname.
