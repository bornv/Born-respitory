# Ontwerpprincipes

Het ontwerpkader voor Power BI-rapporten: identiteit, paginavormen, grafiekkeuze, kleur en anti-patronen. Doel: rapporten die specifieke vragen beantwoorden met minimale cognitieve belasting, niet "mooi en indrukwekkend". Wijkt een verzoek af van deze richtlijnen, leg dan uit wat beter werkt; de gebruiker beslist uiteindelijk zelf, maar bewust.

Layout-rekenwerk, KPI-kaarten, tabellen en titels: [layout-en-visuals.md](layout-en-visuals.md). Hoe je dit in `visual.json` vastlegt: `fabric-powerbi-report`.

## Inhoud

1. 3-30-300 en detailgradiënt
2. Ontwerpidentiteit: toon en signatuur
3. Paginavormen
4. Grafiekkeuze
5. Datalabels en small multiples
6. Kleur en voorwaardelijke opmaak
7. Lettertype en opmaak
8. Anti-patronen om te weigeren
9. Custom visuals: bouwen of kopen

---

## 1. 3-30-300 en detailgradiënt

| Tijd | Wat de lezer moet begrijpen | Plaats |
|---|---|---|
| **3 seconden** | Hoofdboodschap | KPI's, kaarten, titels linksboven |
| **30 seconden** | Context en trends | Grafieken en vergelijkingen in het midden |
| **300 seconden** | Detail om te verkennen | Tabellen, matrixen, drillthrough rechtsonder |

```
+------------------+------------------+
|   KPIs/Cards     |   KPIs/Cards     |  <- boven: hoog niveau, belangrijk
+------------------+------------------+
|   Charts/Trends (Analysis)          |  <- midden: context, trends
+-------------------------------------+
|   Tables/Details (Drill-down)       |  <- onder: detail
+-------------------------------------+
```

---

## 2. Ontwerpidentiteit: toon en signatuur

Leg vóór de layout twee beslissingen vast die voor elke pagina en visual gelden. Zonder vaste identiteit wordt een rapport N los opgemaakte pagina's in één bestand.

- Noemt de vraag geen toon of signatuur, leid ze af uit doelgroep en doel, benoem je keuze en vraag bevestiging.
- Leg de identiteit vast in de ontwerpbrief (zie [rapport-maken.md](rapport-maken.md)) en als notitie/comment bij het thema.
- Elke pagina erft de identiteit; niet per pagina opnieuw beslissen.

### Toon = inktbudget (kies er één)

| Toon | Voor | Inkt | Accenten | Annotatie | Neigt naar |
|---|---|---|---|---|---|
| `restrained` | Managers die het getal willen, niet de franje | Laag, veel witruimte, bijna monochroom | Eén tint, lage verzadiging, rest neutraal grijs | Minimaal | summary, monitoring |
| `corporate` | Terugkerende standaardrapportage, huisstijl | Voorspelbaar, consistente conventies | Huisstijlpalet om te coderen (afwijking), niet te decoreren | Conventie (IBCS-achtige afwijkingsmarkeringen) | comparison, monitoring |
| `editorial` | Een bevinding waar je iemand doorheen leidt | Gemiddeld, geconcentreerd op één focuspunt per pagina | Eén highlight-tint tegen neutrale context | Vooruit: labels, callouts, referentielijnen | narrative, comparison |
| `technical` | Analisten die dichtheid willen | Hoge informatie:inkt; tabellen en small multiples | Spaarzaam, voor de ene serie die je bekijkt | Kort; precisie boven framing | exploration, comparison |

| Knop | restrained | editorial | corporate | technical |
|---|---|---|---|---|
| Aantal accenten | 1 | 1 | 2 | 1-2 |
| Gridlijnen | licht | licht | -- | zichtbaar in tabellen |
| Labeldichtheid | spaarzaam | vooruit | -- | kort en dicht |
| Accentverzadiging | laag | middel | middel | gereserveerd |

### Signatuur = terugkerend element (kies er één, max. twee)

| Signatuur | Inhoud |
|---|---|
| Headerband | Titel + filtercontext + refreshstempel, elke pagina op dezelfde plek |
| Single-accent-regel | Precies één tint draagt nadruk; de rest neutraal grijs |
| Vaste navigatierail | Links óf boven; nooit wisselen |
| KPI-silhouet | Eén kaartvorm, -grootte en labelindeling voor elke KPI |
| Callout-stijl | Eén annotatiebehandeling (zelfde font, gewicht, lijnstijl) |
| Doellijnregel | Doelen altijd hetzelfde getoond (bijv. gestippelde grijze referentielijn) |

De signatuur is een contract: een headerband op drie pagina's en niet op de vierde is een gebroken signatuur.

### Identiteit in het thema

- Single-accent-regel → volgorde van `dataColors` (accent eerst, neutralen erna)
- Gridlijngewicht, labeldichtheid, accentverzadiging → thema-wildcards (`visualStyles["*"]["*"]`) of per visualtype, niet per visual
- Sentimentkleuren (`good`/`bad`/`neutral`) in het thema, zodat callouts en CF tokens gebruiken, geen hex

Kan een keuze niet naar de identiteit verwijzen, dan is de identiteit onvolledig: repareer de identiteit, niet de visual. Zie [theme-json.md](theme-json.md).

**Valkuilen:** een toonwoord ("clean", "modern") dat geen knop verandert; meerdere concurrerende signaturen; identiteit kiezen en daarna toch per visual kleuren; verzadiging die per pagina toeneemt.

---

## 3. Paginavormen

Elke pagina beantwoordt **één vraag** en krijgt daarmee één vorm. Een pagina die twee vragen beantwoordt, is twee pagina's. Vorm eerst, daarna grafiekkeuze.

| Vorm | Vraag | Hoort erop | Blijft eraf | Layout |
|---|---|---|---|---|
| **summary** | Waar staan we nu? | Enkele KPI's linksboven met doel en trend; één ondersteunende grafiek | Ruwe detailtabellen; slicermuren | KPI-rij boven, één grafiek eronder |
| **monitoring** | Wat vraagt vandaag aandacht? | Status-eerst, uitzonderingsgedreven (RAG/drempel); triagetabel op ernst; enkele tellingen | Volledige historie; decoratieve trends | Status boven, triagetabel onder, aflopend op ernst |
| **exploration** | Laat me zelf slicen | Slicers en filters vooraan; primaire grafiek die reageert; ruimte | Opgelegde conclusies; volle KPI-rij | Filterrail volgens signatuur, grote grafiek als focus |
| **comparison** | Hoe verschilt A van B? | Gepaarde of small-multiple layout met gedeelde assen; expliciete afwijking | Eigen schaal per paneel; ongerelateerde context | Gelijkwaardige panelen naast elkaar, assen gesynchroniseerd |
| **narrative** | Dit is de bevinding, en waarom | Eén dominante focusvisual; annotatie vooraan | Gelijkwaardige visuals die om de hoofdrol strijden | Eén grote visual, kleinere ondergeschikt |

Voorbeeld (warehouse): "Hoe staan we deze week op leverbetrouwbaarheid?" = summary. "Welke orders lopen vandaag achter?" = monitoring, triagetabel aflopend op dagen vertraging, niet alfabetisch.

**Valkuilen:** een pagina zonder benoembare vraag (moet waarschijnlijk weg); twee vormen op één pagina; vorm kiezen op basis van beschikbare visuals in plaats van de vraag van de lezer; monitoring alfabetisch gesorteerd.

---

## 4. Grafiekkeuze

### Coderingshiërarchie (Cleveland-McGill)

Positie op gemeenschappelijke schaal > lengte > hoek/helling > oppervlak > kleurtint/verzadiging. Codeer wat de lezer het nauwkeurigst moet vergelijken op het sterkste kanaal.

```
ranking / magnitude compare -> length on common axis  -> barChart / columnChart
trend over time             -> position + slope        -> lineChart / areaChart
two measures correlated     -> 2D position             -> scatterChart
part-to-whole, <=3-4 parts  -> angle/area (accept)     -> pie/donut OR stacked bar
part-to-whole, >4 parts     -> length (prefer)         -> stackedBarChart, not pie
single value vs target      -> position vs marker      -> kpi / card + reference line
```

### Visual vocabulary

| Vraag | Aanbevolen | Vermijden |
|---|---|---|
| Wat is de huidige waarde? | Card, KPI | Gauge, taart |
| Hoe verhoudt dit zich? | Staafdiagram (horizontaal: beter leesbare labels) | Taart (>3 segmenten), donut |
| Trend over tijd? | Lijn, vlak | Staaf (suggereert discreet) |
| Samenstelling? | Gestapelde staaf, treemap | Taart (>5 segmenten) |
| Verdeling? | Histogram, boxplot (Deneb/SVG), swarm | Standaardvisuals (beperkt) |
| Relatie? | Spreidingsdiagram | Lijn (suggereert volgorde) |
| Twee perioden vergelijken? | Slope chart, dumbbell (Deneb/SVG) | Staven naast elkaar |
| Deel van geheel? | 100% gestapelde staaf, waterval | Taart |
| Variatie per categorie? | Small multiples, matrix met voorwaardelijke opmaak | Eén overvolle grafiek |

### Regels

- Assen beginnen bij 0, behalve bij lijngrafieken over de totaaltrend; vermeld dat dan in de subtitel.
- Horizontale staven zijn meestal beter dan verticale.
- Sorteer standaard aflopend op de kernwaarde; oplopend als negatieve getallen meer aandacht vragen; categorisch voor datumvelden.
- **Steekproefcontrole:** een type kan technisch kloppen en toch verkeerd zijn omdat de data het niet draagt. Twee punten = geen trendlijn; één dominant segment met een lange staart = gesorteerde staaf met "Overig".
- Los een vergelijkingsprobleem nooit op met meer kleuren.

---

## 5. Datalabels en small multiples

**Datalabels** verdienen hun plek alleen als de exacte waarde ertoe doet en niet van de as af te lezen is: eindpunt van een lijn, één gemarkeerde staaf, KPI-afwijkingen. Labels op staven kunnen de as vervangen (houd de astitel voor context). Dichte labels geven rommel. Voorkeur: een measure die alleen op het laatste/relevante punt een waarde geeft en elders BLANK, in plaats van overal labels plus voorwaardelijk verbergen. Weergave-eenheden van labels moeten bij de as passen.

**Small multiples** kies je boven een legenda als de vraag is "geldt dit patroon over een dimensie heen" en er meer dan 3-4 series zijn. Alleen op staaf-, kolom-, lijn- en vlakdiagram. Gebruikt de rol `SmallMultiples` (niet `Series`/`Legend`). Assen zijn gesynchroniseerd; dat is de bedoeling. Werken **niet** meer zodra een visual small multiples heeft: totaallabels bij stapels, trendlijnen en forecast, zoomschuif, high-density sampling, hiërarchische as, scroll-to-load-more, opmaak van celtitels (via formaatstring van het model). Een raster van 6×6 dichte grafieken mist het doel: Top N op het partitieveld plus "Overig".

---

## 6. Kleur en voorwaardelijke opmaak

Kleur is een coderingskanaal, geen decoratie.

1. **Gedempt palet**; verzadigde kleuren alleen voor nadruk en signalen.
2. **Bewust coderen**: elke kleur betekent iets en wijst op belangrijke of actiegerichte elementen.
3. **Semantisch consistent**: is "Omzet" blauw op pagina 1, dan overal.
4. **Sentimentkleuren** (rood/oranje/geel = slecht, groen/blauw = goed) alleen voor sentiment, nooit voor categorieën.
5. **Toegankelijk**: test op rood-groen-kleurenblindheid; liever blauw-oranje of blauw-rood. Nooit kleur als enige signaal; combineer met icoon, label, vorm of patroon.
6. **Beperkt palet**: 5-7 kleuren; max. 6-8 per visual.
7. Geen puur zwart (gebruik donkergrijs `#333`), geen neon, geen regenboogverloop, geen rood voor positief.
8. **Themakleuren boven hex**: `{"ThemeDataColor": {"ColorId": 1, "Percent": 0}}` in plaats van een literal `'#118DFF'`. Hex alleen in measures die een kleurtoken teruggeven.

### Contrast (WCAG 2.1)

| Element | Minimum |
|---|---|
| Normale tekst | 4.5:1 |
| Grote tekst (18pt+) | 3:1 |
| UI-componenten | 3:1 |

| Achtergrond | Tekst | Ratio | Status |
|---|---|---|---|
| Wit `#FFF` | Donkergrijs `#333` | 12.6:1 | OK |
| Wit `#FFF` | Middengrijs `#777` | 4.5:1 | Net OK |
| Wit `#FFF` | Lichtgrijs `#AAA` | 2.9:1 | Fout |

### Semantische kleurnamen

Een kleurmeasure geeft een themanaam terug in plaats van hex, zodat een themawissel doorwerkt:

| Naam | Betekenis |
|---|---|
| `"good"` / `"bad"` / `"neutral"` | Op doel / onder doel / onveranderd |
| `"minColor"` / `"midColor"` / `"maxColor"` | Uiteinden en midden van een kleurverloop |

```dax
// Voorbeeld (warehouse): orderregels op tijd geleverd
OTD Color = IF([OTD % (Lines)] >= 0.9, "good", IF([OTD % (Lines)] >= 0.8, "neutral", "bad"))
```

Controleer of `good`, `bad` en `neutral` in het thema staan voordat je ze gebruikt.

### Basis voor voorwaardelijke opmaak kiezen

| Basis | Claim over de data | Gebruik |
|---|---|---|
| **Gradient** | Continu en vergelijkbaar ("meer = donkerder") | Alleen voor een grootte op één schaal. Een afwijking met teken zonder expliciet midden kleurt nul als grijs ruis en verschuift bij elke refresh: zet midden op 0 of gebruik regels |
| **Rules** | Vaste banden uit beleid (RAG, SLA gehaald/niet) | Grenzen uit de business, niet uit min/max; blijven stabiel bij refresh. Let op overlappende of gatenvallende grenzen |
| **Field value** (measure) | De kleur/het icoon is zelf data | Meest flexibel; kies dit bij meer dan twee drempels of afhankelijkheid van een andere measure; testbaar |
| **Icons** | Status sneller te scannen dan een getal | Spaarzaam, op een status-/triagekolom, nooit op de hoofdwaarde. `IconOnly` verbergt het getal |

CF op het secundaire signaal (afwijking, gat, status), niet op de hoofdwaarde. Databalken op de ene hoofdgrootte, kleurschaal op de afwijkingskolom; nooit beide op dezelfde kolom. Alles opmaken = niets valt op.

---

## 7. Lettertype en opmaak

- **Segoe UI** of **Segoe UI Semibold** (of andere ingebouwde Power BI-fonts). Custom fonts renderen niet gegarandeerd op elk apparaat.
- Familie, grootte, gewicht en kleur consistent; variatie signaleert hiërarchie, geen toeval.
- Bron noemt als minimum 9pt voor datawaarden en 12pt voor labels/titels (elders 12pt als absolute leesbaarheidsgrens, 14pt aanbevolen voor grafieken, titels 16-24pt, KPI-waarden 24-48pt). **Laat leesbaarheid altijd door de gebruiker bevestigen.**
- Opmaak is geen decoratie: hoge informatie:inkt-ratio; opmaak gaat meer over weglaten dan toevoegen.
- Vaste opmaak in het thema, niet per visual. Sommige overrides zijn onvermijdelijk, maar het thema draagt de basis.
- Containers eenvoudig; titels/subtitels niet redundant en niet te groot.
- Minimaal schaduwen en animaties (vestibulaire klachten); `dropShadow.show: false` in de thema-wildcard.

---

## 8. Anti-patronen om te weigeren

Plausibel ogende standaardkeuzes die de lezer tegenwerken. Vraagt iemand erom: niet stil uitvoeren, maar het betere alternatief noemen, de kosten in één zin, en de reparatie aanbieden.

| Anti-patroon | Waarom fout | Reparatie |
|---|---|---|
| Gauge als KPI | Veel ruimte voor één waarde op een gebogen schaal; hoek leest slechter dan positie | `kpi` of `card` met doel en expliciet verschil |
| Monochrome categoriestaven | Eén tint over ongeordende categorieën zegt niets | Sorteer aflopend; één accent voor de ene staaf die opvalt |
| Ontbrekende sortering | Laad- of alfabetische volgorde verslaat de lengtevergelijking | Aflopend op de measure, tenzij de as tijd is |
| Kaartenmuur | Tien losse getallen zonder hiërarchie | Beperk tot de paar die een beslissing sturen ("20%-test"); rest naar tabel/grafiek |
| Ruwe veldnamen als titel | `Sum of SalesAmount` beschrijft de query, niet de vraag | Titel = vraag ("Omzet vs. doel per regio"); modelveld ongemoeid |
| Hex in plaats van themaverwijzing | Kleur vastgepind op één visual; overleeft geen themawissel | `ThemeDataColor` of semantisch token |
| Off-grid drift | 4-8px verschil in posities of gaten oogt slordig | Alles op de gridunit; gaten rekenkundig bepalen |
| Dubbele y-as | Lijnen kruisen of wijken uiteen door de askeuze, niet door de data | Alleen bij echt verschillende eenheden op één categorie-as; anders splitsen of indexeren |
| 3D | Perspectief vervormt lengte en oppervlak | Altijd plat 2D |
| Taart met veel segmenten | Hoek en oppervlak zijn de zwakste kanalen; na ~4 niet te onderscheiden | Gesorteerde staaf met de staart als "Overig" |
| Te veel macgyvered visuals | SVG/R/Python of zwaar aangepaste core visuals met atypische eigenschappen | Onderhoudslast weegt zwaar; alleen als het echt nodig is |
| Afwijkende standaardinteracties | Verwart gebruikers en andere ontwikkelaars | Alleen afwijken met expliciete reden |

---

## 9. Custom visuals: bouwen of kopen

Volgorde van voorkeur:

```
1. Core Power BI visual       -- no dependencies, fastest
2. Deneb (Vega/Vega-Lite)     -- declarative; preferred for advanced interactive charts
3. SVG-via-DAX measure        -- preferred for table/card inline graphics; no row cap issues
4. Python/R script visual     -- statistical plots that must compute at render time
5. Packaged AppSource visual  -- only when the interaction model genuinely needs it
6. Private .pbiviz            -- avoid; external risk plus you own the build pipeline
```

Een AppSource-visual is een externe afhankelijkheid (code van derden, beschikbaarheid, drie tenantinstellingen) en kan verdwijnen, certificering verliezen of geblokkeerd worden. Als het toch moet: liever de organisatiestore, liever gecertificeerd, en leg naam, bron, certificeringsstatus en goedkeurder vast. Gelicentieerde AppSource-visuals handhaven geen licentie in Report Server, app-owns-data embedding en publish-to-web; in Report Server zijn ze helemaal niet beschikbaar. Uitwerking van Deneb, SVG en Python/R: `pbi-custom-visuals-paginated`.
