---
name: pbi-rapport-review
description: "Power BI-rapporten reviewen en ontwerpen: review/audit/health check van een bestaand rapport (gebruik en adoptie, ontwerp en layout, modelbinding, performance, governance, toegankelijkheid) met checklists, ernstniveaus en een vast reviewformaat; ontwerpprincipes (3-30-300, ontwerpidentiteit, paginavormen, grafiekkeuze, kleur, KPI-kaarten, tabellen, anti-patronen, ontwerppoort); het proces voor een nieuw rapport (eisen → ontwerpbrief → bouwen); en theme.json aanpassen (structuur, cascade, stijlpresets, valkuilen, veilige werkwijze). Triggers: rapport reviewen, review report, rapport beoordelen, audit, wordt dit rapport gebruikt, ontwerp, design, layout, uitlijning, kleuren, thema aanpassen, theme.json, rapport maken, dashboard opzetten. PBIR/visual.json bouwen: fabric-powerbi-report. Model/DAX: fabric-semantic-model of pbi-model-power-query-dax. Alt-tekst/tabvolgorde: pbip-accessibility. Deneb/SVG/custom visuals: pbi-custom-visuals-paginated."
---

# Power BI-rapporten reviewen, ontwerpen en thema's aanpassen

> Bewerking van [data-goblin/power-bi-agentic-development](https://github.com/data-goblin/power-bi-agentic-development) (auteur Kurt Buhler, GPL-3.0), skills `review-report`, `pbi-report-design`, `create-pbi-report`, `modifying-theme-json`, commit 4936264. Vertaald, ingekort en aangepast. Deze skill valt daardoor ook onder GPL-3.0; zie `LICENSE` in deze map.

Deze skill geeft je het **oordeel** over een rapport: wat je controleert bij een review, welke ontwerpregels gelden, hoe je een nieuw rapport opzet voordat je bouwt en hoe je een thema beheert. Het **bouwen** in PBIR-bestanden (`visual.json`, `page.json`, filters, bladwijzers) staat in `fabric-powerbi-report`; hier wordt daarnaar verwezen in plaats van het te herhalen.

## Uitgangspunten

- **Een agent kan niet zien of een rapport "goed" is.** Lees bestanden en cijfers, doe voorstellen en spar met je; bevestig het oordeel altijd in het gerenderde rapport (Desktop of Service). Vraag expliciet of lettergroottes leesbaar zijn; Claude onderschat dat vaak.
- **Best practices zijn standaarden, geen verplichtingen.** Presenteer afwijkingen als observatie met de vraag of ze bewust zijn. Trek geen conclusies over doelgroep of doel zonder het te vragen.
- **Gebruik is de enige objectieve maatstaf.** Een rapport dat niemand opent is onderhoudslast, hoe mooi het ook is. Ontwerp, performance en structuur kun je vooraf reviewen; of het rapport werkt, zie je alleen aan gebruik.
- **Geen performance-advies zonder bewijs.** Stel een wijziging voor, test die meerdere keren, en draai terug als het niets oplevert.
- **Thema eerst, visual-overrides alleen voor uitzonderingen.** Vaste opmaak hoort in het thema, zodat een nieuwe huisstijl overal doorwerkt.
- **Veel rapportproblemen komen uit het model** ((Blank), dubbele waarden, trage visuals). Noteer ze als symptoom en verwijs door naar `fabric-semantic-model` / `pbi-model-power-query-dax`.

## Werkwijze

| Vraag of taak | Aanpak | Laad |
|---|---|---|
| "Review dit rapport", audit, health check | Fase bepalen → dimensies kiezen → checklists → bevindingen per ernst | [review-checklists.md](references/review-checklists.md) |
| "Wordt dit rapport gebruikt?", behouden of uitfaseren | Bereik, trend, venster vs. cadans → oordeel keep/investigate/redesign/retire | [gebruik-en-governance.md](references/gebruik-en-governance.md) |
| Wie heeft toegang, thin/thick, endorsement, export naar Excel | Distributie- en metadatacheck | [gebruik-en-governance.md](references/gebruik-en-governance.md) |
| Rapport traag, te veel visuals | Kostenmodel per visual, Performance Analyzer, DirectQuery-hefbomen | [review-checklists.md](references/review-checklists.md) |
| Ontwerp beoordelen of kiezen: toon, paginadoel, grafiektype, kleur | Identiteit vastleggen → paginavorm → grafiekkeuze → anti-patronen | [ontwerp-principes.md](references/ontwerp-principes.md) |
| Layout, uitlijning, marges, KPI-kaarten, tabellen, titels, mobiel | Grid-rekenwerk en per-visual regels | [layout-en-visuals.md](references/layout-en-visuals.md) |
| Nieuw rapport of dashboard maken | Vage vraag verscherpen → ontwerpbrief → akkoord → bouwen | [rapport-maken.md](references/rapport-maken.md) |
| Interacties, slicers synchroniseren, resetknop, veldparameters | Query-reductie en interactieontwerp | [rapport-maken.md](references/rapport-maken.md) |
| Thema aanpassen, kleuren/lettertypen, theme.json, stijlpresets | Cascade begrijpen → auditen → veilig wijzigen → valideren | [theme-json.md](references/theme-json.md) |
| `visual.json`/`page.json` schrijven, filters, bladwijzers, publiceren | Andere skill | `fabric-powerbi-report` |
| Alt-tekst, tabvolgorde, schermlezer | Andere skill | `pbip-accessibility` |
| Measure ontbreekt of klopt niet, DAX traag | Andere skill | `fabric-semantic-model`, `pbi-model-power-query-dax` |
| Deneb, SVG-measures, Python/R-visuals, AppSource-visuals | Andere skill | `pbi-custom-visuals-paginated` |

**Over `pbir`:** de bron gebruikt overal `pbir` (pbir-cli), een command-line tool van data-goblin om PBIR-rapporten te inspecteren, op te maken, te valideren en te publiceren (installeren met `uv tool install pbir-cli` of `pip install pbir-cli`). Die tool is optioneel: waar deze skill een `pbir`-commando noemt, is dat iets wat jij zelf kunt draaien. Zonder `pbir` doe je hetzelfde in Power BI Desktop of via de bestanden (zie `fabric-powerbi-report`).

## Review in het kort

### 1. Fase bepalen

| Fase | Gebruiksdata? | Wat je reviewt |
|---|---|---|
| **Ontwikkeling** | Nee | Ontwerp, modelbinding, performance, toegankelijkheid, structuur |
| **Test** | Deels | Bovenstaande + testen de testers echt (views van de testgroep)? |
| **Productie** | Ja | Alle dimensies, inclusief gebruik, distributie en export |

Vraag daarnaast: één rapport of hele werkruimte? Welke dimensies zijn belangrijk? Is er een concrete aanleiding? Heb je toegang tot het semantisch model en ben je ontwikkelaar van rapport, model of beide?

### 2. Zes dimensies

| # | Dimensie | Kernvragen | Details |
|---|---|---|---|
| 1 | Gebruik en adoptie | Welk deel van de mensen met toegang opende het rapport (7/28/60 dagen)? Trend? Laadtijd P50/P90? | [gebruik-en-governance.md](references/gebruik-en-governance.md) |
| 2 | Ontwerp en layout | Paginatitels, gelijke tussenruimtes, detailgradiënt, kleurgebruik, eigen thema, sortering | [review-checklists.md](references/review-checklists.md) |
| 3 | Modelbinding | Thin report? Alle velden bestaan? Rapportmeasures spaarzaam? | [review-checklists.md](references/review-checklists.md) |
| 4 | Performance | Querykosten per visual, totalen, measure-filters, Top N, slicers | [review-checklists.md](references/review-checklists.md) |
| 5 | Metadata en governance | Endorsement, gevoeligheidslabel, deployment pipeline, distributie via app en groepen | [gebruik-en-governance.md](references/gebruik-en-governance.md) |
| 6 | Toegankelijkheid, standaarden, documentatie | Alt-tekst, tabvolgorde, contrast, kleur niet als enige signaal, doel en doelgroep beschreven | [review-checklists.md](references/review-checklists.md) |

Niet elke review heeft alle zes nodig; stem af op wat je wilt weten.

### 3. Ernst toekennen

| Ernst | Wanneer |
|---|---|
| **Critical** | Kapotte functionaliteit, beveiligingsrisico (bijv. publish-to-web met interne data), of volledig ongebruikt rapport dat capaciteit verbruikt |
| **High** | Performanceproblemen die gebruikers raken, grote ontwerpfouten, ontbrekende/kapotte veldbindingen |
| **Medium** | Inconsistent ontwerp, matige performancezorgen, gedeeltelijke toegankelijkheidsgaten |
| **Low** | Polish, stijlvoorkeuren, optimalisatiekansen |

### 4. Rapporteren

Begin met de bevindingen met de meeste impact. Vast formaat (voorbeeld, warehouse):

```
REPORT REVIEW: Orderpicking Dashboard
===============================

USAGE SIGNAL
  Views (30d): 47  |  Viewers: 8  |  Rank: #3/22
  Top pages: Overzicht (60%), Detail (30%), Trends (10%)
  Load time P50: 3.2s  |  P90: 7.1s

CRITICAL
  - [Performance] P90 laadtijd boven 7s door 14 visuals op pagina Overzicht

HIGH
  - [Design] Geen paginatitel op 2 van 3 pagina's
  - [Binding] 3 visuals verwijzen naar niet-bestaande velden

MEDIUM
  - [Design] Ongelijke marges (24px links, 32px rechts)
  - [Accessibility] Alt-tekst ontbreekt op 5 datavisuals

LOW
  - [Design] Standaardthema van Power BI; overweeg een eigen thema
  - [Standards] Rapportnaam volgt naamgevingsconventie niet
```

Voor een ontwerpbeoordeling per bevinding: **issue, locatie (pagina/visual), ernst (critical/warning/suggestion), fix**.

## Ontwerp in het kort

| Regel | Inhoud |
|---|---|
| **3-30-300** | 3 seconden: hoofdboodschap (KPI's linksboven). 30 seconden: context en trends (midden). 300 seconden: detail (tabellen rechtsonder). |
| **Identiteit eerst** | Kies vóór de layout één *toon* (restrained, corporate, editorial, technical) en één *signatuur* (bijv. headerband of één accentkleur) die op elke pagina terugkomt. Leg ze vast in het thema. |
| **Eén vraag per pagina** | Elke pagina krijgt één vorm: summary, monitoring, exploration, comparison of narrative. Twee vragen = twee pagina's. |
| **Titels** | Elke pagina een titel (tekstvak). Paginatitel = onderwerp, visualtitel = onderscheid ("per klant", "maandtrend"). Geen ruwe veldnamen als titel. |
| **Gelijke ruimte** | Alle tussenruimtes gelijk, alle marges gelijk, op een grid van 8 of 16px. Kolomgrenzen lopen door over rijen. |
| **Aantallen** | Richtlijn max. 12-15 visuals, 4-6 KPI's (praktisch max. 5), max. 3 slicers per pagina; rest naar het filterdeelvenster. Rapporten met meer dan 5-8 pagina's zijn meestal te veel. |
| **Kleur** | Gedempt, uit het thema, één accent voor nadruk. Rood/groen alleen voor sentiment, nooit als categoriekleur; liever blauw/oranje. Kleur nooit als enige signaal. |
| **Lettertype** | Segoe UI / Segoe UI Semibold; geen custom fonts. Bron noemt min. 9pt voor datawaarden en 12pt voor labels/titels; controleer met de gebruiker. |
| **KPI's** | Elke KPI beantwoordt "goed of slecht?" (doel + verschil absoluut en %) en "beter of slechter?" (trend). Kleur het verschil, niet de hoofdwaarde. |
| **Tabellen** | Eén vraag, alleen nodige kolommen, gesorteerd op belangrijkste measure, gridlijnen weg, databalken op hoofdmeasure, kleur alleen op afwijkingskolom. |
| **Weigeren** | Gauge als KPI, 3D, taart met >4 segmenten, dubbele y-as, ontbrekende sortering, kaartenmuur, hex-kleuren in visuals. |

Details en onderbouwing: [ontwerp-principes.md](references/ontwerp-principes.md) en [layout-en-visuals.md](references/layout-en-visuals.md).

## Nieuw rapport in het kort

1. **Business proces begrijpen.** Verken het model: welke tabellen, measures, hiërarchieën, welke tijdsgranulariteit?
2. **Vage vraag verscherpen** met hooguit drie vragen: welke beslissingen ondersteunt het rapport, welke 2-3 cijfers zijn het belangrijkst, zijn er huisstijlwensen?
3. **Ontwerpbrief** opstellen: doelgroep, doel, 2-5 beslisvragen, pagina's met elk één doel, ontwerpidentiteit, opleverdoel (app, paginaformaat, mobiel). Sjabloon: [rapport-maken.md](references/rapport-maken.md).
4. **Akkoord vragen** en de brief daarna als bevroren behandelen; scope-wijziging = brief heropenen.
5. **Ontbrekende modelobjecten** voorstellen: doel (vorig jaar, budget), baseline, rollend gemiddelde. Liefst in het model, niet als rapportmeasure.
6. **Bouwen**: pagina's, visuals, binding, sortering, interacties, filters, opmaak → met `fabric-powerbi-report` (bestanden) of in Desktop.
7. **Ontwerppoort** draaien voor oplevering (identiteit, één doel per pagina, gelijke ruimte, onderbouwde callouts, toegankelijkheid).

Details: [rapport-maken.md](references/rapport-maken.md).

## Thema in het kort

```text
Power BI-standaard
  -> thema wildcard           visualStyles."*"."*"
  -> thema per visualtype     visualStyles.<type>."*"
  -> gekozen stijlpreset      visualStyles.<type>.<preset>
  -> override op de visual zelf
```

De laatste laag wint. Zie je onverwachte opmaak, kijk dan eerst of een visual-override het thema overschrijft. Ontwerpregels: beperk het palet tot wat nodig is, één vaste betekenis per semantische kleur (`good`/`neutral`/`bad`), rustige structuurkleuren, één lettertypefamilie met een kleine schaal. Details, structuur en valkuilen (`pivotTable` i.p.v. `matrix`, `textSize` bij slicers, `trendline` bij KPI): [theme-json.md](references/theme-json.md). Voorbeeldthema: [examples/DataGoblins2021.json](examples/DataGoblins2021.json).

## Controle voor oplevering

**Review**

- [ ] Fase (ontwikkeling/test/productie) en scope bepaald; gebruikersvragen over doelgroep gesteld in plaats van aangenomen.
- [ ] Gebruiksconclusies passen bij de cadans van het rapport (geen "ongebruikt" op basis van één venster van 30 dagen); ontwikkelaars en service principals uit de cijfers gehaald.
- [ ] Elke bevinding heeft dimensie, ernst, locatie en concrete aanbeveling; de belangrijkste bovenaan.
- [ ] Modelsymptomen gemarkeerd als modelprobleem, niet als rapportfout.
- [ ] Performance-aanbevelingen hebben bewijs of een testvoorstel.
- [ ] Wat niet uit bestanden te verifiëren is (toetsenbordnavigatie, schermlezer, mobiele weergave) staat er expliciet bij als "niet vanuit bestanden te controleren".

**Ontwerp / nieuw rapport**

- [ ] Toon en signatuur gekozen en zichtbaar op elke pagina; kleuren uit het thema.
- [ ] Elke pagina beantwoordt één benoembare vraag en heeft een titel.
- [ ] Tussenruimtes en marges gelijk en op het grid; kolomgrenzen doorlopend.
- [ ] Elke KPI heeft een doel, verschil en trend; elke visual is gesorteerd.
- [ ] Callouts en "hoogste/laagste"-markeringen gecontroleerd tegen de data.
- [ ] Contrast (tekst 4.5:1, grote tekst 3:1), kleur gecombineerd met icoon/label, alt-tekst aanwezig (→ `pbip-accessibility`).

**Thema**

- [ ] Kopie of versie van het oude thema bewaard vóór de wijziging.
- [ ] JSON geldig; typenamen en eigenschapsnamen gecontroleerd tegen de valkuilentabel.
- [ ] Rapport gesloten en opnieuw geopend in Desktop, alle pagina's bekeken (voor- en achtergrondkleur nog leesbaar).
- [ ] Overgebleven visual-overrides en hex-kleuren bewust behouden of opgeruimd (na akkoord; voorwaardelijke opmaak behouden).
