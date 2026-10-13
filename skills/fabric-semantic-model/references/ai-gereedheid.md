# AI-gereedheid van een semantisch model

Richtlijnen om een Power BI semantisch model klaar te maken voor conversationele BI in Microsoft Fabric: Copilot in Power BI, Data Agents en andere toepassingen die vragen in gewone taal beantwoorden.

## Gebruik bepaalt de investering

Vraag eerst hoe het model gebruikt gaat worden; dat bepaalt de omvang van de review.

| Gebruik | Nodige investering in het model |
|---|---|
| Rapporten of ad-hoc verkennen | Sterschema en expliciete metingen (zie [modelleren.md](modelleren.md)). |
| Conversationele BI / Copilot | Al het bovenstaande **plus**: bedrijfsvriendelijke namen, synoniemen, beschrijvingen voor AI, AI instructions en AI data schema. |
| Beide | Volledige investering in rapportontwerp én Copilot-gereedheid. |

## Kernprincipes

- **Eerst het fundament.** AI instructions redden geen zwak model. Sterschema, expliciete metingen en juiste datatypes zijn voorwaarden, geen afwerking.
- **Letterlijke interpretatie.** Copilot leest namen en beschrijvingen letterlijk. `AMT` is voor een taalmodel niet hetzelfde als `Sales Amount`.
- **Expliciet boven impliciet.** Impliciete metingen, metingen die alleen in een rapport zijn gedefinieerd en verborgen bedrijfslogica ziet AI niet. Moet iets via gewone taal bereikbaar zijn, dan hoort het als expliciete meting met metadata in het model.
- **Verbeteren op basis van waarneming.** Schrijf beschrijvingen en AI instructions op basis van echte vragen van gebruikers en echte Copilot-antwoorden. Niet gokken.

## Wie past wat aan?

Dit is productbeleid, geen uitspraak over wat technisch mogelijk is in de opgeslagen modelformaten.

| Onderdeel | Route | Label in bevindingen |
|---|---|---|
| **Modelmetadata (TOM)**: namen, beschrijvingen, relaties, metingen, verborgen-vlag, datatypes, `summarizeBy` | Claude past goedgekeurde wijzigingen toe via TMDL (of levert ze aan voor Desktop). | **Door Claude aan te passen** |
| **"Prep data for AI"-onderdelen**: AI instructions, AI data schema en synoniemen, Verified Answers | Claude beoordeelt het model en stelt teksten voor; **jij** controleert en past ze toe in de Power BI-ervaring "Prep data for AI". | **Zelf instellen in "Prep data for AI"** |

> **Behouden.** Bestaande "Prep data for AI"-onderdelen zijn door jou gemaakte modelstatus. Laat ze ongewijzigd bij elke andere TMDL-, deploy- of metadatawijziging. Verwijder, regenereer, normaliseer of herschrijf geen onbekende of ondoorzichtige metadata. Kan een werkwijze dat behoud niet garanderen, stop dan vóór het schrijven en voer de wijziging uit via de ondersteunde Power BI-tools.

Kan metadata niet worden aangepast, verwijs dan naar de documentatie [Prepare your data for AI](https://learn.microsoft.com/power-bi/create-reports/copilot-prepare-data-ai).

## Voorwaarden

Controleer vóór de review:

1. Copilot is ingeschakeld voor de organisatie.
2. Power BI Q&A is ingeschakeld voor het semantisch model.
3. Bij een PBIP-project: `definition.pbism` heeft `settings.qnaEnabled` op `true`.

## Checklist

Loop de onderdelen **op volgorde** door. Faalt onderdeel 1, dan helpt het niet om onderdeel 4 te verbeteren.

### 0. Bedrijfscontext verzamelen

Verzamel context vóór je beschrijvingen of AI instructions schrijft. Niets aannemen.

1. Vraag naar het bedrijfsproces, de kern-KPI's, veelgestelde vragen en bekende onduidelijkheden.
2. Bekijk bestaande rapporten op het model: de vragen die zij beantwoorden zijn de vragen die Copilot krijgt.
3. Zoek in bestaande metingnamen naar patronen met bedrijfslogica (`YTD`, `MTD`, `vs Plan`, `vs LY`).
4. Zoek omstreden metingen. Marges, budgetten en forecasts hebben vaak meerdere definities per team; dat zijn de waardevolste onderwerpen voor AI instructions.
5. Leg het vakjargon vast. Afdelingen gebruiken verschillende woorden voor hetzelfde begrip; die worden synoniemen.

### 1. Modelarchitectuur (fundament)

Zonder dit geeft Copilot slechte antwoorden, hoe goed de rest ook is ingesteld. Volledige regels: [modelleren.md](modelleren.md).

**Doen**
- Sterschema met duidelijke feit- en dimensietabellen; geen platte, gedenormaliseerde of gepivoteerde structuren.
- Juist `dataType` op elke kolom. Copilot leidt samenvattings- en filtergedrag af van het datatype.
- Een expliciete DAX-meting voor elke kern-KPI. Impliciete aggregaties zijn voor Copilot niet betrouwbaar bereikbaar.
- Veelgevraagde metingen vooraf maken (bijv. `YTD Sales`, `MoM Growth`). Copilot antwoordt betrouwbaarder als de meting al expliciet bestaat.
- Dubbele of overlappende metingen samenvoegen of duidelijk onderscheiden.
- Logische hiërarchieën op dimensies voor drill-down (bijv. `Year > Quarter > Month > Day` op de datumtabel).
- `summarizeBy` goed zetten op numerieke kolommen, vooral `None` voor ID's, jaar, maandnummer, postcodes enz., zodat ze niet per ongeluk worden opgeteld.
- `isDefaultLabel` zetten op de kolom die de natuurlijke naam van een dimensie is (bijv. **Product Name** in **Product**), zodat Copilot de standaard-"naam"-kolom herkent.

**Vermijden**
- Ongebruikte kolommen of tabellen in het model laten staan; ze vervuilen het schema dat Copilot ziet en vergroten de kans op een verkeerd veld.

### 2. Naamgeving

Bedrijfsvriendelijke namen zijn een van de wijzigingen met de meeste impact. Volledige regels: [naamgeving.md](naamgeving.md).

**Doen**
- Leesbare namen op elke zichtbare tabel, kolom en meting (bijv. `Transaction Amount`, niet `TR_AMT` of `tr_amt`).
- Zichtbare namen in de taal waarin Copilot bevraagd wordt (meestal Engels), ook als het bronsysteem een andere taal gebruikt.

**Vermijden**
- CamelCase, snake_case, HOOFDLETTERS of technische afkortingen op zichtbare objecten.
- Eén naam als gebruikers meerdere termen gebruiken; voeg synoniemen toe (onderdeel 5).

### 3. Beschrijvingen

Beschrijvingen geven context die een naam niet kan geven. Een beschrijving voor AI is anders dan een beschrijving voor mensen.

**Doen**
- Een `description` op elke zichtbare tabel, kolom en meting.
- **Kort houden: Copilot leest alleen de eerste 200 tekens.** Zet het belangrijkste vooraan: voorkeursgebruik, onderscheid met vergelijkbare velden, eenheid.
- Impliciete kennis expliciet maken; de veldnaam niet herhalen.
- Voor Copilot bij voorkeur: wanneer dit veld te gebruiken, het verschil met vergelijkbare velden, de korrel (grain) en de eenheid.
- Calculation groups: de calculation *items* worden niet als modelmetadata getoond. Zet in de beschrijving van de calculation-group-**kolom** welke items er zijn en hoe je ze gebruikt (bijv. "Use with measures and date table for: Current, MTD, QTD, YTD, PY, YOY, YOY%"). Ook hier de grens van 200 tekens.
- Hebben mensen én Copilot uitleg nodig: menselijke details in de `description`, Copilot-routeringsregels in de AI instructions (onderdeel 4).

**Vermijden**
- Beschrijvingen alleen door AI laten genereren zonder bedrijfscontext; die herhalen vooral wat de modelstructuur al laat zien. Laat ze altijd controleren door jou of een vakexpert.
- Tegenstrijdige beschrijvingen bij verwante velden (kolom en meting moeten overeenkomen).

*Voorbeeld (warehouse):* voor een meting `OTIF %`: "Share of order lines delivered complete and on the promised date. Use for delivery reliability; not for supplier performance (use Supplier OTIF %)." Het eerste deel valt binnen de 200 tekens.

### 4. AI instructions

AI instructions zijn vrije tekst die Copilot automatisch leest; een van de krachtigste knoppen voor de kwaliteit van conversationele BI.

> **Route:** Claude analyseert het model en stelt AI instructions voor; jij past de goedgekeurde tekst toe in "Prep data for AI". Claude bewerkt de opgeslagen vorm niet en laat bestaande instructions ongemoeid bij andere modelwijzigingen.

**Doen**
- Routering voor dubbelzinnige termen ("when users ask about margin, use `[Standard Margin]`").
- Bedrijfstermen en afkortingen gekoppeld aan modelobjecten (bijv. "TMS = Total Media Spend, use measure `[Total Media Spend]`").
- Periodedefinities (start boekjaar, piekseizoen, rapportagecyclus).
- Onderscheid tussen datumvelden ("`Order Date` is the primary date; `Ship Date` is only for logistics analysis").
- Standaardgroeperingen of analysevoorkeuren ("always analyze sales on a quarterly basis").
- Voorkeurstabellen per soort vraag.
- Regels om door te vragen ("when a user asks about product sales, always ask for clarification on location").
- Richting van "goed" ("a lower attrition % is positive").
- Uitleg over calculation groups, DAX UDF's of veldparameters als die er zijn.
- Visualisatievoorkeuren (welke grafiektypen wel of niet).
- Beknopt en niet tegenstrijdig met beschrijvingen of met elkaar.
- Velden met hun volledige, juiste naam noemen.

**Vermijden**
- Grote blokken bedrijfslogica herhalen die al in beschrijvingen staan.
- Iets vastleggen dat eigenlijk een meting, synoniem of relatie hoort te zijn.
- Herhalen wat beschrijvingen en metadata al zeggen.
- Op instructions vertrouwen voor harde regels; het taalmodel kan ze negeren. Niet-onderhandelbaar gedrag los je op in het model zelf.
- Meer dan 10.000 tekens.

*Voorbeeld (warehouse, alleen als tekstvoorstel):*

```text
"Delivered on time" means OTIF: use [OTIF %]. Order Date is the primary date; use Ship Date only for logistics questions. A higher OTIF % is better. When a user asks about stock without a location, ask which warehouse.
```

### 5. AI data schema

Het AI data schema bepaalt welke tabellen, kolommen en metingen Copilot ziet, en bevat de synoniemen. Een goede afbakening voorkomt dat hulpobjecten Copilot in de war brengen.

> **Route:** Claude stelt het AI data schema voor; jij past het toe in "Prep data for AI". Stel alleen een zichtbaarheidswijziging voor als de gewenste AI-zichtbaarheid afwijkt van de standaardzichtbaarheid in het model (bijv. een meting die zichtbaar blijft voor rapporten maar niet voor AI-agents). Neem de rapportzichtbaarheid niet één-op-één over als AI-schemawijziging.

**Doen**
- Alleen tabellen, kolommen en metingen opnemen waar een gebruiker zinvol naar vraagt.
- Alle afhankelijke objecten van gekozen metingen opnemen (elke kolom of meting waar een gekozen meting naar verwijst, moet ook zichtbaar zijn voor Copilot).
- Hulpmetingen, tussenberekeningen en technische brugtabellen uitsluiten.
- Dubbele of overlappende metingen uitsluiten.

**Vermijden**
- Standaard "alles tonen"; dat verdunt het signaal waarmee Copilot het juiste veld kiest.

### 6. Verified Answers

Verified Answers zijn vooraf gemaakte rapportvisuals die Copilot bij bepaalde vragen teruggeeft. Het uitwerken ervan valt buiten deze skill: het is rapportwerk met live testen in Power BI.

> **Route:** Claude bewerkt Verified Answers nooit zelf. Claude stelt kandidaten voor; jij stelt ze in via "Prep data for AI". Zie [Verified answers](https://learn.microsoft.com/power-bi/create-reports/copilot-prepare-data-ai-verified-answers).

1. Bekijk de metingen in het model en hun namen en beschrijvingen.
2. Stel op basis daarvan de vijf beste vragen voor om als Verified Answer in te stellen.
3. Vraag je die in te stellen in de "Prep data for AI"-UI van Power BI.

## Bevindingen presenteren

1. Groepeer per ernst (kritiek, aanbevolen, optioneel) en volg de volgorde van de checklist.
2. Label elk punt: **Door Claude aan te passen** of **Zelf instellen in "Prep data for AI"**.
3. Wacht op akkoord voordat je modelwijzigingen doorvoert.
4. Test daarna met echte vragen in Copilot of de Data Agent en verbeter op basis van de antwoorden.
