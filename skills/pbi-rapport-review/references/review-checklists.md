# Review-checklists per dimensie

Volledige checklists voor een rapportreview, plus performance- en toegankelijkheidsaudit en de interactie-/navigatiecheck. Gebruik en governance staan in [gebruik-en-governance.md](gebruik-en-governance.md). Gebaseerd op de [Data Goblins Report Checklist](https://data-goblins.com/power-bi/report-checklist).

## Inhoud

1. Reviewhouding en businesscontext
2. Ontwerp en layout
3. Modelbinding (+ modelsymptomen)
4. Performance
5. Interacties en navigatie
6. Toegankelijkheid
7. Standaarden en documentatie

---

## 1. Reviewhouding en businesscontext

**Houding.** Een agent kan niet vaststellen dat een rapport "er goed uitziet". Geef evaluatie en verbetervoorstellen en spar met de gebruiker. Best practices zijn standaarden; optimalisaties zijn situatie-afhankelijk. Vraag bij afwijkingen of ze bewust zijn.

Bekijk je het rapport (screenshot, browser), let dan op afwijkingen zoals `(Blank)`, herhaalde waarden of queryfouten, maar gebruik één screenshot niet als bewijs van goed ontwerp. Laat leesbaarheid van lettergroottes altijd door de gebruiker bevestigen.

**Context vóór oordeel:**

1. Over welk bedrijfsproces gaat het? Lees de rapportdefinitie én het semantisch model.
2. Welke vragen moet het beantwoorden: beschrijvend, verkennend of voorschrijvend?
3. Wie is de doelgroep en wat moeten ze met de data doen? *Vraag het.*
4. Is het rapport redundant? Bestaan er rapporten met dezelfde vragen of data?
5. Vervangt het een bestaande oplossing, en werd die gebruikt? *Vraag het.*

Je mag hypotheses vormen, maar leid het doel niet alleen af uit layout of metadata.

---

## 2. Ontwerp en layout

Detailregels: [ontwerp-principes.md](ontwerp-principes.md) en [layout-en-visuals.md](layout-en-visuals.md).

- [ ] Paginatitels aanwezig en beschrijvend
- [ ] Gelijke tussenruimtes tussen visuals en gelijke marges
- [ ] Detailgradiënt gevolgd (KPI's linksboven, detail rechtsonder)
- [ ] Kleurgebruik bewust en toegankelijk (geen overbodige kleur, geen rood/groen-combinatie voor kleurenblinden)
- [ ] Lettertype, grootte en opmaak consistent
- [ ] Aantal visuals redelijk (losjes 12-15 max., afhankelijk van complexiteit)
- [ ] Geen lege visuals (alle visuals hebben veldbindingen)
- [ ] Eigen thema toegepast (niet het standaardthema van Power BI)
- [ ] Assen beginnen bij nul (tenzij bewust; bij een lijngrafiek die niet bij 0 begint: vermeld dat in de subtitel)
- [ ] Standaardsortering ingesteld op alle visuals
- [ ] Visuals duidelijk benoemd in het selectievenster (gegroepeerd met beschrijvende namen)
- [ ] Mobiele layout aanwezig als de doelgroep dat nodig heeft
- [ ] Visual headers ingesteld (uit als drill-down/-through niet nodig is)
- [ ] Interacties bewust ingesteld (cross-filter/-highlight)
- [ ] 'Apply'-knoppen op slicers overwogen bij performancegevoelige pagina's
- [ ] Gelijke slicers op meerdere pagina's gesynchroniseerd
- [ ] Datum van laatste verversing zichtbaar (bijv. kaart met laatste refresh)

**Objectieve ontwerpcriteria** (wat een agent uit bestanden kan tellen):

| # | Criterium | Signaal |
|---|---|---|
| 1 | Aantal pagina's | Meer dan 5-8 is meestal te veel |
| 2 | Visuals per pagina | Aantal is een proxy; querykosten per visual zijn de echte driver. Tekstvakken, afbeeldingen, vormen en knoppen doen geen query |
| 3 | Thema | Eigen thema voor consistente opmaak |
| 4 | Layout | Gelijke ruimte, titel, detailgradiënt, kaarten boven/links en minder dan 4-6, minder dan 3 slicers, hulpelementen (refreshdatum, links) |
| 5 | Kleur | Voorwaardelijke opmaak spaarzaam, kleuren gedempt, rood/oranje alleen voor negatieve waarden |
| 6 | Informatie-inktratio | Lichte gridlijnen, overbodige assen/labels uit |
| 7 | Leesbaarheid | Lettergroottes voldoende voor alle elementen |
| 8 | Toegankelijkheid | Minimale schaduwen (vestibulaire klachten) |
| 9 | Lettertypeconsistentie | Weinig groottes, eenvoudige lettertypen die overal werken |
| 10 | Sortering | Aflopend tenzij er een reden is (tijd e.d.) |

---

## 3. Modelbinding

- [ ] Rapport is verbonden met een gepubliceerd semantisch model ("thin report"), niet met een eigen ingebed model ("thick report")
- [ ] Alle veldbindingen verwijzen naar bestaande kolommen/measures
- [ ] Rapportmeasures (extension measures / thin report measures) spaarzaam en alleen voor rapportspecifieke logica; nuttig voor meer rapporten → naar het model
- [ ] Visual calculations alleen voor logica van één visual; nuttig voor meer visuals → naar rapport- of modelmeasure
- [ ] Geen kapotte of verweesde veldverwijzingen
- [ ] Juist gebruik van measures vs. kolommen in visuals (aggregatiecontext)
- [ ] Geen losse filters actief op visualniveau (visual-level filters zijn onzichtbaar voor gebruikers; documenteer ze of verplaats naar pagina/rapport)
- [ ] Geen verborgen visuals of verborgen slicers die verwarring geven

### Modelsymptomen die je in het rapport ziet

Vraag eerst of je toegang hebt tot het model en wie het ontwikkelt. Is het model in scope, gebruik dan `fabric-semantic-model` of `pbi-model-power-query-dax` erbij.

| Symptoom in rapport | Waarschijnlijke oorzaak in model |
|---|---|
| `(Blank)`-waarden | Referentiële integriteit (ontbrekende sleutels) of verkeerde relaties |
| Herhaalde of opgeblazen waarden | Many-to-many of bidirectionele relaties |
| Trage visuals | Dure DAX, groot model, ontbrekende aggregaties |
| Ontbrekende velden in bindingen | Hernoemde of verwijderde kolommen/measures |
| RLS werkt niet zoals verwacht | Rolconfiguratie per gebruikerscontext |
| Data niet actueel genoeg | Verversfrequentie past niet bij de business |
| Groot model | Ongebruikte kolommen/tabellen |
| Stapeltotaal "klopt niet" | Niet-additieve measure (ratio, distinct count, time intelligence); het label is eerlijk, de measure heeft een expliciete aggregatiestrategie nodig |

---

## 4. Performance

### Laadtijden lezen

| Metriek | Betekenis | Doel | Onderzoeken |
|---|---|---|---|
| P10 | Snelste 10% | <1s | -- |
| P50 (mediaan) | Typische gebruikerservaring | <3s | >5s |
| P90 | Traagste 10% | <8s | >15s |

Een groot verschil P50-P90 wijst op inconsistente performance: locatie van gebruikers t.o.v. de dataregio, browser/apparaat (mobiel), dure slicercombinaties, cache-misses (eerste view na refresh).

### Kostenmodel

Bij het openen van een pagina ververst elke visual; elke visual doet minstens één DAX-query. Parallelisme is begrensd (DirectQuery `Maximum Connections per Data Source` standaard 10; capaciteit heeft eigen limieten), dus laadtijd groeit niet-lineair zodra die grens bereikt is. **12 goedkope kaarten kunnen prima zijn; 8 matrixen met totalen en measure-filters misschien niet.** Verborgen en buiten-canvas visuals doen ook een query.

Visuals die meer dan één query doen (vermenigvuldigers):

- Tabellen/matrixen met (sub)totalen: één query per band; DistinctCount en Median het zwaarst
- Measure-filters: twee queries
- Top N-filters: twee queries; kan onder DirectQuery de limiet van 1M rijen tussenresultaat raken
- Veldparameters: extra fase voor geëvalueerde parameters
- Custom/Deneb/Python/R-visuals: de weergavefase domineert

### Verborgen query-overhead

| Bron | Effect |
|---|---|
| Voorwaardelijke opmaak | Measure-gestuurd (`objects.dataPoint.fill` met `expr.Measure`) is het duurst: extra querykolommen per datapunt. Regels en kleurverloop zijn lichter maar verhogen renderkosten |
| Tooltipvelden | Extra measures die niet in de visual zichtbaar zijn |
| Sort-by-column | De sorteerkolom wordt automatisch aan de query toegevoegd |
| Datalabels | Dynamische formaten/waarden voegen evaluaties toe |
| Tooltip-pagina's | Extra queries bij hover |
| Cross-filtering | Ketens van filters veroorzaken herhaalde queries |

### Query per visual afleiden

Power BI vertaalt de veldbindingen van een visual naar een `SUMMARIZECOLUMNS`-query: groeperingskolommen (Category/Rows/Series/Columns) eerst, measures (Y/Values) als `"alias", Tabel[Measure]`. Voorbeeld (staafdiagram met maand op de as, twee measures):

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Date'[Month],
    "Revenue", 'Sales'[Revenue],
    "Margin", 'Sales'[Margin %]
)
```

Draai zulke queries in DAX Studio om per visual de duurste te vinden. Gangbare oplossingen: minder groeperingskolommen of data filteren (pagina-/rapportfilter), voorwaardelijke opmaak vereenvoudigen, te complexe custom visuals vermijden, DAX en model auditen.

### Performance Analyzer (Desktop)

De export van Performance Analyzer (JSON) splitst de tijd per visual in fases:

| Fase | Betekenis |
|---|---|
| `DAX query` | Werk in het model (of bronquery bij DirectQuery); oplossing hoort bij de modelleur |
| `Direct query` | Alleen bij DirectQuery-tabellen; bevestigt live bronverkeer |
| `Visual display` | Rendertijd; hoog hier + lage DAX = kosten in de rapportlaag (oplosbaar in het rapport) |
| `Other` | Wachtrij/serialisatie |
| `Evaluated parameters` | Overhead van veldparameters |

Tijden zijn inclusief wachtrij: een hoge waarde bewijst niet dat de visual zelf traag is. Ververs één visual apart voordat je conclusies trekt. Gebruik de export om de *relatief* slechtste visual te vinden, niet om exacte milliseconden in de Service te beloven.

### DirectQuery: hefbomen in de rapportlaag

Alleen toepassen bij DirectQuery (elke interactie is een live bronvraag; 4 minuten time-out in de Service; in de praktijk 5s bruikbaar / 30s onbruikbaar). Niet blind toepassen op Import: daar kost het interactiviteit zonder winst.

- Filters instellen vóór het binden van velden (anders kan een ongefilterd tussenresultaat de 1M-rijenlimiet raken)
- Ongebruikte totalen/subtotalen uitzetten
- Measure-filters en Top N op kolommen met hoge cardinaliteit vermijden; Top N strak afbakenen of een aggregatie in het model gebruiken
- Slicers single-select, of multi-select achter een Apply-knop (de grootste hefboom)
- Cross-highlight van slicers naar dure visuals uitzetten (interactie `NoFilter`)
- Weinig visuals per pagina: boven de verbindingsgrens worden visuals geserialiseerd en kunnen ze tijd-inconsistente resultaten tonen (een correctheidsargument)
- Niet vanuit het rapport: `Maximum Connections per Data Source` is een modelinstelling; aanbevelen, niet zelf zetten. Automatische paginavernieuwing vermenigvuldigt alles met frequentie × gelijktijdige gebruikers; markeer het als het aanstaat.

---

## 5. Interacties en navigatie

Fouten die je niet op een screenshot ziet en die geen validatiefout geven.

**Cross-filtergraaf** (`visualInteractions` per pagina):

- Geen enkele override op een pagina met slicers én KPI-kaarten → kaarten springen waarschijnlijk mee bij klikken op grafieken (meestal onbedoeld)
- Overal `NoFilter` → interactiviteit is misschien uitgezet in plaats van ontworpen
- Overrides die verwijzen naar visual-`name`'s die niet meer bestaan (stil, geen effect)
- Een `NoFilter`-paar kan bewust zijn (stabiele KPI): markeer patronen en vraag naar de bedoeling

**Drill:** `drillFilterOtherVisuals` (hiërarchie-drill op dezelfde pagina) is iets anders dan drillthrough. Markeer drillbare visuals waar paginabrede respons bedoeld was maar `false` staat, en andersom.

**Navigatie-integriteit:** controleer elke `visualLink` met `navigationSection`/`drillthroughSection`/`bookmark` tegen de echte page-/bookmark-`name` (niet `displayName`):

- Doelen die niet bestaan
- `WebUrl` naar niet-HTTPS of lege URL
- Een rij bijna identieke `PageNavigation`-knoppen die één `pageNavigator` zou vervangen

**Drillthrough-hygiëne:** drillthrough-pagina's verborgen of met filterreset; `Back`-knop aanwezig. Ontbrekende lokale doelpagina bij cross-report drillthrough is normaal.

**Bladwijzers:** minimaal gebruiken; bladwijzerstatussen zijn kwetsbaar.

---

## 6. Toegankelijkheid

Het eigenlijke herstel (alt-tekst, tabvolgorde, knop-tooltips in `visual.json`) doe je met `pbip-accessibility`. Hier de reviewkant.

Samenvattende checklist:

- [ ] Alt-tekst op alle datavisuals (ook visuals met SVG-measures en scriptvisuals)
- [ ] Decoratieve items uit de tabvolgorde (`tabOrder = -1`)
- [ ] Tabvolgorde volgt het leespatroon (boven→onder, links→rechts)
- [ ] Geen informatie alleen via kleur (combineer met vorm, icoon of tekst)
- [ ] Contrast WCAG 2.1 AA: 4.5:1 tekst, 3:1 UI-elementen en grote tekst (18pt+)
- [ ] Lettergroottes leesbaar
- [ ] Mobiele layout op pagina's die voor consumptie bedoeld zijn
- [ ] Toetsenbordnavigatie live gecontroleerd (niet uit bestanden te bevestigen)

### Statische controles (uit bestanden)

| Controle | Hoe | WCAG |
|---|---|---|
| Uitlijning | Vergelijk linker-, rechter-, boven- en onderranden van alle `position`-blokken; bijna-gelijke waarden = kandidaat voor misuitlijning. Bij een `visualGroup` is de positie van een kind relatief aan de groep | -- |
| Alt-tekst ontbreekt | `general.altText` leeg op een datavisual (sluit `basicShape`, decoratieve `image`/`textbox`, `actionButton` uit) | 1.1.1 |
| Decoratief in tabvolgorde | `basicShape`, logo, scheidingslijn met `tabOrder >= 0` | 1.3.2 |
| Tabvolgorde vs. geometrie | Sorteer op (rijband, x); wijkt de `tabOrder`-rang af, dan vecht de voorleesvolgorde met de layout. Overal `tabOrder` 0 = nooit bewust ingesteld (risico, geen harde fout) | 1.3.2 / 2.4.3 |
| Onbereikbare datavisual | Negatieve `tabOrder` op een betekenisvolle visual | 2.1.1 |
| Alleen kleur | Serie-/CF-kleur zonder label, icoon of markervorm | 1.4.1 |

`position.z` (stapelvolgorde) staat los van `tabOrder`; gebruik z nooit om de leesvolgorde te herstellen.

**SVG-measures:** visuals met een measure die een `image/svg+xml`-URI teruggeeft hebben alt-tekst nodig én de getallen uit de SVG moeten ook als leesbare kolom ernaast staan. Markeer SVG's waarin alleen een `fill`/`stroke`-kleur varieert (kleur als enige signaal) en SVG's die zware aggregaties binnen de stringopbouw doen of geen `HASONEVALUE`/`ISINSCOPE`-guard voor totalen hebben.

**Python/R-visuals:** renderen een statische PNG zonder tabelalternatief. Alt-tekst verplicht. Ze renderen leeg bij publish-to-web en werken niet bij app-owns-data embedding. "Show visuals as tables" (`Ctrl+Shift+F11`) neemt ze niet mee. Een niet-gereviewd script van derden is een beveiligingsbevinding.

**Mobiel:** een pagina heeft een telefoonlayout als minstens één visual een `mobile.json` heeft. Geen enkele = gekantelde landschapsweergave op de telefoon. Weinig geplaatst op een kernpagina = gat; bijna alles geplaatst = te getrouwe miniatuur. Ernst hangt af van het doel: een KPI-pagina in een app zonder telefoonlayout is high; een detailpagina voor de backoffice meestal prima.

### Alleen live te controleren

- Tab/Shift+Tab-focus tussen regio's (`Ctrl+F6`)
- Schermlezer via "Show data" (`Alt+Shift+F11`) en "Show visuals as tables" (`Ctrl+Shift+F11`); kaarten, slicers, smart narrative, Q&A, Key Influencers en paginated vallen buiten die tabelweergave
- Mobiele weergave: alleen in de iOS/Android-app, niet in de browser

Zeg nooit "voldoet aan toegankelijkheid" op basis van alleen een bestandsscan.

---

## 7. Standaarden en documentatie

**Standaarden:**

- [ ] Gevoeligheidslabels toegepast als het beleid dat vraagt
- [ ] Naamgevingsconventies gevolgd (rapportnaam, paginanamen, visualtitels)
- [ ] Link voor gebruikers om problemen of feedback te melden
- [ ] Filtercombinaties grondig getest (ook buiten de standaardscenario's)

**Documentatie (overdracht/productie):**

- [ ] Doel: welke bedrijfsvragen beantwoordt het rapport?
- [ ] Doelgroep en gebruikersgroepen benoemd
- [ ] Afwijkende functies gedocumenteerd (visual-level filters, verborgen slicers, bladwijzers, custom visuals)
- [ ] Support-personen en -procedures bekend
- [ ] Training-/adoptiemateriaal voor gebruikers
- [ ] Organisatiepagina of (?)-knop met uitleg: data, model, hulp, hoe grafieken te lezen, berekeningen

**Voor agents en opvolgers:** leg uitleg vast in annotaties op rapport/pagina/visual of in een notitiebestand in de `.Report`-map: lessen voor de volgende keer en impliciete kennis vanuit de business.
