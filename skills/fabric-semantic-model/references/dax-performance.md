# DAX-performance: aanpak en diagnose

Beslisraamwerk voor het versnellen van DAX-query's: fasen, hoe de engine werkt, traces lezen en doorverwijzen naar de patronen in [dax-performance-patronen.md](dax-performance-patronen.md).

**Altijd lezen vóór je optimaliseert:** [Raamwerk](#raamwerk), [Fase 1](#fase-1-baseline), [Fase 2](#fase-2-iteraties), [Hoe de engine werkt](#hoe-de-engine-werkt), [Traces lezen](#traces-lezen).
**Alleen op aanwijzing:** de patronen (Tier 1: DAX001–DAX021; Tier 2: QRY001–QRY004; Tier 3: MDL001–MDL009; Tier 4: DL001–DL002).

## Beslistabel (naar Tier 1-patronen)

Kies op basis van trace-bewijs als je dat hebt; anders op basis van de DAX-vorm, en zie de match als hypothese tot de meting het bevestigt. Laad eerst alleen de aangewezen patronen.

| Trace toont | Of de DAX bevat | Begin met |
|---|---|---|
| `CallbackDataID` / callback-achtig rij-voor-rij-werk in de FE | `IF`/`SWITCH` of `DIVIDE()` in rij-iterators; contextovergang per rij in iterators; `ADDCOLUMNS`/`SUMMARIZE`-extensies | DAX002, DAX007, DAX008, DAX018 |
| Hoge FE-tijd, veel korte SE-events of herhaalde cache-hits | herhaalde meting-/expressieverwijzingen; `SUMX(VALUES(col), CALCULATE(...))`; iterator met hoge kardinaliteit en afhankelijkheid met lage | DAX003, DAX006, DAX015 |
| SE-rijen veel meer dan resultaatrijen, of FE filtert een breed SE-resultaat | `FILTER(Table, ...)` als filterargument; gecombineerde predicaten; complexe `SUMMARIZE`-bron; filters binnen `SUMMARIZECOLUMNS` | DAX001, DAX005, DAX009, DAX010 |
| Meerdere SE-scans over hetzelfde feit met vergelijkbare joins | broer/zus-metingen met tijdvensters; slice-metingen; `SWITCH`/`IF` die metingen kiest | DAX019, DAX020, DAX013 |
| Bijna identieke SE-scans die alleen in filterwaarde verschillen | broer/zus-metingen met elk een eigen filter op hetzelfde feit | DAX017 |
| Grote `IN`/`INB`, `ININDEX` of samengestelde tuple-predicaten | `TREATAS`/`IN` filtert hetzelfde feit opnieuw met berekende sleutels | DAX021 |
| `DCOUNT` in xmSQL | `DISTINCTCOUNT`, ook over een bekende unieke sleutel | DAX011, DAX014 |
| Resultaat verandert met groepering/filtercontext, of predicaten herhalen zich | `ALLEXCEPT`; `ALL/REMOVEFILTERS + VALUES`; dubbele predicaten | DAX012, DAX004 |
| Onverwachte joins of uitgebreide bridge/M2M-paden | bidirectionele/M2M-relatie in het filterpad; `TREATAS`/`CROSSFILTER` in de meting | DAX016 |

Geen match? Lees alle Tier 1-patronen.

### Escalatie (alleen met jouw akkoord)

| Signaal | Naar |
|---|---|
| `__ValueFilterDM` in de gegenereerde query | QRY002 |
| Groepering op een kolom met hoge kardinaliteit (bijv. `Calendar[Date]`) | QRY003 |
| Tier 1 uitgeput; ander resultaat acceptabel | QRY001–QRY004 |
| Weinig SE-query's, lage parallelliteit, schone xmSQL, hoge SE-duur | Datalayout (Tier 3/4) |
| Overhead door many-to-many of bidirectioneel | MDL001 |
| Direct Lake + lage parallelliteit of koude cache | DL001–DL002 |

## Raamwerk

| Tier | Bereik | Autonomie |
|---|---|---|
| **1 — DAX-patronen** | Meting-/UDF-definities herschrijven | Mag direct; `EVALUATE`/groepering blijft identiek |
| **2 — Querystructuur** | `EVALUATE`, grain, filters wijzigen | Voorstel doen; wachten op expliciet akkoord |
| **3 — Modelwijzigingen** | Relaties, kolommen, aggregatietabellen, datatypes | Grote voorzichtigheid; afwegingen bespreken; kopie van het model voorstellen; waarschuwen voor gevolgen voor rapporten |
| **4 — Direct Lake** | OneLake-layout, V-Order, rowgroups | Grote voorzichtigheid; vraagt ETL/pipelinewijzigingen buiten het model |

**Geslaagd (Tier 1):** sneller **én** semantisch gelijk (zelfde aantal rijen en kolommen, zelfde waarden).
**Geslaagd (Tier 2–4):** sneller **én** expliciet akkoord op de gewijzigde uitvoer of structuur.

### Wat je nodig hebt

- Een verbinding met het model die queries met **trace** kan uitvoeren en de metadata (metingen, functies, calculation groups, tabellen, relaties) kan lezen.

| Methode | Bereik | Hoe | Opmerkingen |
|---|---|---|---|
| **DAX Studio** | Lokaal Power BI Desktop + remote (Fabric XMLA) | Interactieve UI | Het paneel Server Timings toont FE/SE al uitgerekend. Beste voor handmatig onderzoek. |
| **TOM Trace API (ADOMD.NET / PowerShell)** | Lokaal Desktop + remote (XMLA) | Scripts | Abonneer op `QueryEnd`, `VertiPaqSEQueryEnd`, `VertiPaqSEQueryCacheMatch`; FE = TotalDuration − vereniging van de `VertiPaqSEQueryEnd`-intervallen. Direct Lake-databases zijn niet zichtbaar via de lokale Desktop-proxy; gebruik het XMLA-endpoint van de workspace. |
| **Fabric Workspace Monitoring** (`SemanticModelLogs` in Eventhouse) | Workspaces met Workspace Monitoring aan | KQL-query's achteraf | `OperationName`, `DurationMs`, `CpuTimeMs`; koppel events via `OperationId`. Voor productieanalyse achteraf, niet voor snel itereren. |

## Fase 1: baseline

### Stap 1: alle definities oplossen

1. Zoek alle metingverwijzingen (`[Naam]`) in de query.
2. Haal de expressie van elke meting op.
3. Los recursief afhankelijke metingen op.
4. Haal gebruikte UDF's op.
5. Bouw een `DEFINE`-blok waarin alles expliciet staat.
6. Controleer calculation groups: welke items kunnen actief zijn in de query? Die beïnvloeden het queryplan van elke meting.

```dax
DEFINE
    MEASURE 'Sales'[Total Revenue] = SUM('Sales'[Revenue])
    MEASURE 'Sales'[Total Profit]  = SUM('Sales'[Revenue]) - SUM('Sales'[Cost])
    MEASURE 'Sales'[Profit Margin] = DIVIDE([Total Profit], [Total Revenue])

EVALUATE
SUMMARIZECOLUMNS ( 'Product'[Category], "Profit Margin", [Profit Margin] )
```

### Stap 2: modelcontext

Tabellen (en opslagmodi) en relaties opvragen. Zo onderscheid je modelproblemen (geen sterschema, bidirectionele relaties) van DAX-problemen.

### Stap 3: baseline uitvoeren (1 opwarmrun + 2 of meer meetruns)

Per run:
1. **VertiPaq-cache legen** (alleen de SE-querycache; kolommen blijven geladen). Opwarmrun: koud → warm. Meetruns: warm + zonder cache.
2. Query uitvoeren met trace.
3. Meten: totale duur, FE/SE-verdeling, aantal SE-query's, piekgeheugen, aantal resultaatrijen.
4. Alles vastleggen, inclusief het resultaat (voor de gelijkheidscontrole).

Gooi de opwarmrun weg. Liggen de twee meetruns dicht bij elkaar (bijv. < 20% spreiding), neem de snelste geldige als baseline. Bij grotere spreiding: meer runs tot het normale bereik duidelijk is.

**Metingen isoleren:** bij veel metingen in één query, alles op één (of een kleine groep) na uitcommentariëren en vergelijken.

### Stap 4: analyseren

Interpreteer met [Traces lezen](#traces-lezen) en kies patronen met de [beslistabel](#beslistabel-naar-tier-1-patronen).

## Fase 2: iteraties

1. **Toepassen.** Eén of meer Tier 1-patronen. **Wijzig alleen de metingdefinities in het `DEFINE`-blok**; `EVALUATE` en de groeperingskolommen blijven gelijk.
2. **Uitvoeren en vergelijken.** Cache legen, 2 meetruns (geen opwarmrun nodig), snelste geldige duur.
   - Verbetering = (Baseline − Geoptimaliseerd) / Baseline × 100.
   - **Semantische gelijkheid:** zelfde rijen, kolommen en waarden als de baseline. Anders: terugdraaien. Controleer dit na **elke** iteratie.
3. **Doorgaan of escaleren.**
   - Duidelijk sneller (buiten de ruisband van de baseline, bijv. baseline 1200/1280/1310 ms → 900 ms is echt, 1200 ms is ruis) en gelijk → succes; gebruik als nieuwe baseline voor een volgende ronde.
   - Binnen de ruis → ander patroon of combinatie proberen.
   - Ander resultaat → terugdraaien.
   - Tier 1 uitgeput (alle passende patronen los en gecombineerd geprobeerd, metingen geïsoleerd, laatste pogingen op ruisniveau) → Tier 2, met akkoord.

## Fase 3: querystructuur (Tier 2, akkoord nodig)

**Wijzig de querystructuur niet zonder jouw expliciete akkoord.** Leg eerst uit: de concrete wijziging (bijv. "groeperen op JaarMaand in plaats van Datum: van 365K naar 12K rijen"), wat er in de uitvoer verandert en wat het oplevert. Na akkoord: wijzigen, volledige baselinecyclus, resultaten tonen.

## Fase 4: model en datalayout (Tier 3/4, akkoord nodig)

**Wijzig het model niet zonder jouw expliciete akkoord.** Eerst:
1. Diagnose en voorgestelde wijziging tonen.
2. Uitleggen waarom het modelontwerp de bottleneck is.
3. Waarschuwen dat rapporten en visuals kunnen breken.
4. Een kopie van het model voorstellen om op te experimenteren.
5. Aangeven of wijzigingen in de bron nodig zijn (Lakehouse, Warehouse, Power Query); die kunnen niet via het model alleen.
6. Na akkoord: afstemmen met je CI/CD-proces, toepassen en de hele baseline opnieuw meten.

## Foutafhandeling

- **Verbinding mislukt:** controleer datasetnaam, workspacenaam of XMLA-endpoint. Voor Desktop: draait Desktop en wat is de lokale poort? Voor de Service: staat XMLA lezen/schrijven aan op de capaciteit?
- **Syntaxisfout:** valideer de DAX vóór uitvoeren.
- **Resultaat wijkt af:** filtercontext, aggregatieniveau en `CALCULATE`-filters nalopen; terugdraaien.
- **Geen verbetering:** de DAX is misschien al goed; kijk naar datalayout (fase 4) of querystructuur (fase 3).
- **Lege trace:** server timings/trace aanzetten vóór de query; abonneren op `QueryEnd`, `VertiPaqSEQueryEnd`, `VertiPaqSEQueryCacheMatch`.

## Hoe de engine werkt

Elke DAX-query gaat door twee onderdelen:

- **Formula Engine (FE):** verwerkt alle DAX (vertakkingen, contextovergangen, complexe rekenkunde). **Single-threaded**; de bottleneck in de meeste slechte query's.
- **Storage Engine (SE):** leest gecomprimeerde kolomdata uit VertiPaq. **Multi-threaded** en snel, maar kan alleen: de vier basisbewerkingen, GROUP BY, LEFT OUTER JOIN en basisaggregaties (SUM, COUNT, MIN, MAX, DISTINCTCOUNT).
- Bij **DirectQuery** speelt de gegevensbron de rol van de SE: de FE stuurt SQL door.

De FE vraagt data op via SE-scans; elk resultaat is een **datacache**. Kan de SE een expressie niet zelf uitrekenen, dan volgt een **callback** naar de FE, rij voor rij, en is die scan feitelijk single-threaded.

**Kernprincipe:** zoveel mogelijk werk naar de SE, zo min mogelijk SE-scans, geen callbacks.

### xmSQL

De leesbare vorm van SE-scans in de trace. Belangrijk:
- Elke kolom in de SELECT is automatisch een groeperingskolom.
- Rij-berekeningen staan in een `WITH`-blok (`$Expr0 := ...`), gebruikt via `@`.
- Relatiejoins zijn LEFT OUTER, tenzij anders vermeld.
- Semi-joins: `DEFINE TABLE $Filter0 ... ININDEX`.
- Callbacks: `CallbackDataID` (meest voorkomend) en gespecialiseerde varianten.

```
WITH $Expr0 := ( 'Sales'[UnitPrice] * 'Sales'[OrderQuantity] )
SELECT Product[Category], SUM ( @$Expr0 )
FROM Sales
    LEFT OUTER JOIN Product ON 'Sales'[ProductKey] = Product[ProductKey]
```

### Compressie, segmenten en parallelliteit

- **Segmenten** zijn kolomblokken van vaste grootte; de SE gebruikt één thread per segment. Meer (gelijk verdeelde) segmenten = meer parallel werk.
- **Scheve segmenten** (één groot, rest klein) remmen af.
- **SE-parallelliteitsfactor** = SE CPU-tijd ÷ SE-duur. Rond 1,0 = single-threaded; 8–16 = goed. Weinig SE-query's (1–4), hoge SE-duur, factor ≈ 1,0 en schone xmSQL: datalayoutprobleem, geen DAX-probleem.

### SE-fusie

- **Verticale fusie:** meerdere aggregaties met dezelfde filtercontext in één scan.
- **Horizontale fusie:** scans die alleen in filterwaarde van één kolom verschillen, samengevoegd.

Fusie breekt door: FE die een tak kiest (`SWITCH`/`IF` tussen metingen; per-meting-filters) → DAX017; tijdfilters (DATESYTD, DATEADD, ...) per meting → DAX019; de slicekolom staat niet in de groepering; een filterwaarde die pas tijdens uitvoering bekend is (variabele); calculation group items.

## Traces lezen

| Metriek | Afleiding | Doel |
|---|---|---|
| Totale duur | `QueryEnd.Duration` | Lager |
| FE-duur | Totaal − SE-wandkloktijd | Lager (bottleneck nr. 1) |
| SE-duur | Vereniging van overlappende `VertiPaqSEQueryEnd`-intervallen | Hoger aandeel is beter |
| Aantal SE-query's | Aantal `VertiPaqSEQueryEnd` | Minder |
| SE CPU-tijd | Som van `VertiPaqSEQueryEnd.CpuTime` | Hoge verhouding tot SE-duur |
| Parallelliteitsfactor | SE CPU ÷ SE-duur | Hoger (> 1 = multi-threaded) |
| Cache-hits | Aantal `VertiPaqSEQueryCacheMatch` | Alleen relevant bij warme cache |
| Piekgeheugen | Uitvoeringssamenvatting | Lager; hoog = te veel materialisatie |
| Rijen per scan | `volume` uit `[Estimated size (volume, marshalling bytes): X, Y]` | Groot = te veel materialisatie |

SE-duur is de **vereniging** van overlappende intervallen: drie gelijktijdige scans van 100 ms ≈ 100 ms.

Belangrijke events: `VertiPaqSEQueryBegin`/`End` (xmSQL in `TextData`), `VertiPaqSEQueryCacheMatch`, `QueryBegin`/`End`, `AggregateTableRewriteQuery` (aggregatietabel gebruikt). Negeer `VertiPaqScanInternal`, `CommandBegin`/`CommandEnd`.

**FE-gaten:** de tijd tussen SE-events is FE-werk. Een gat > 100 ms wijst op dure FE-berekening; bekijk de SE-query vlak vóór het gat.

### Waar je op let (in volgorde)

1. Callbacks (`CallbackDataID`, `EncodeCallback`) → DAX002, DAX007, DAX008, DAX018.
2. Hoog FE-percentage, vaak met veel korte SE-query's.
3. Veel SE-query's / herhaalde scans van hetzelfde feit → geblokkeerde fusie.
4. Grote materialisaties (SE-rijen ≫ resultaat, of SE-query's zonder WHERE) → DAX009.
5. Lage parallelliteit op trage scans → datalayout.
6. Veel KB per SE-event → minder kolommen of eerder aggregeren.
7. Tweestaps-dimensiescans → herstructureren tot één scan.
8. Grote semi-join-indextabellen → DAX021.
9. Geen `AggregateTableRewriteQuery` terwijl er aggregatietabellen zijn → mapping en grain controleren.

**Vuistregel:** veel SE-query's + hoge FE-tijd + korte scans = DAX-probleem. Weinig SE-query's + lage FE-tijd + hoge SE-duur + lage parallelliteit = datalayoutprobleem.

## Verder lezen

- [Analysis Services trace events](https://learn.microsoft.com/analysis-services/trace-events/analysis-services-trace-events)
- [Understand Direct Lake query performance](https://learn.microsoft.com/fabric/fundamentals/direct-lake-understand-storage)
