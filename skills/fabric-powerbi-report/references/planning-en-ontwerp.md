# Planning en ontwerp

Voor een nieuw rapport of een grote herinrichting. Eerst plannen en een ontwerpkeuze per pagina vastleggen, pas daarna bestanden maken.

## Inhoud

- [Plannen in rondes](#plannen-in-rondes)
- [Report-spec en akkoord](#report-spec-en-akkoord)
- [Archetype per pagina](#archetype-per-pagina)
- [Operationele monitor](#operationele-monitor)
- [Managementsamenvatting](#managementsamenvatting)
- [Grafiekkeuze](#grafiekkeuze)
- [Indeling en grid](#indeling-en-grid)
- [Interactie en navigatie](#interactie-en-navigatie)
- [Kleur](#kleur)
- [Ontwerpcontrole](#ontwerpcontrole)

## Plannen in rondes

Stel één vraag tegelijk, maximaal 3–5 rondes. Wat al in de vraag, het model of een bestaand PBIP staat, vraag je niet opnieuw.

| Ronde | Doel | Vastleggen |
|---|---|---|
| 0 — Uitgangssituatie | Welk model, waar staat het, wat is beschikbaar | Lokaal model (`.SemanticModel` op schijf), model in een werkruimte, of nog geen model |
| 1 — Doelgroep en taak | Voor wie, welke beslissing | Doelgroep, hoofddoel, toon, succescriterium |
| 2 — Model en scope | Tabellen, measures, dimensies, risico's | Feiten/dimensies, ontbrekende measures, eerste-bouw-scope |
| 3 — Verhaal en pagina's | Pagina-indeling en interactie | Per pagina: archetype, doel, visuals, velden, slicers |
| 4 — Stijl en oplevering | Uitstraling, toegankelijkheid, eindbestemming | Thema-richting, alleen lokaal / publiceren |

**Ronde 0 — modelvormen**

| Startpunt | Aanpak |
|---|---|
| Lokaal model | `.pbip`/`.SemanticModel` in de map; TMDL-bestanden lezen voor tabel-, kolom- en measurenamen |
| Model in werkruimte | Werkruimtenaam + -ID, modelnaam + -ID nodig (opzoeken via `fabric-basis`). URL-vorm: `.../groups/<workspace-id>/.../<model-id>/...`; `/groups/me` = Mijn werkruimte. Niet raden welke GUID wat is: vragen. |
| Geen model | Buiten scope: eerst model maken (`fabric-semantic-model`), daarna verder plannen |

**Ronde 1 — doelgroepen** (als het niet al duidelijk is):

1. Management — beknopte KPI's, trends, risico's
2. Analisten — verkennen, doorklikken, vergelijken
3. Operators/teamleiders — bewaken, uitzonderingen, status, actielijsten
4. Externe lezers — gestuurd verhaal, weinig slicers

**Ronde 2 — modelinventaris** (samenvatten, niet alles opsommen):

```markdown
Feiten: tabel, korrel, sleutels, bruikbare measures
Dimensies: datum/tijd, locatie, entiteit, categorie, eigenaar, status
Bestaande measures: ...
Waarschijnlijk ontbrekend: measures, berekende kolommen, relaties, sorteerkolommen
Risico's: lege waarden, inactieve relaties, slicers met hoge kardinaliteit, velden die niet filteren
```

**Ronde 3 — interactie vastleggen:** globale en paginaslicers, zoekbare slicers voor velden met veel waarden, drillthrough-pagina's, één primair navigatiemodel, benodigde knopacties, bladwijzers.

**Ronde 4 — standaardkeuzes** tenzij je iets anders wilt: WCAG AA-contrast, geen rood-op-rood, `azureMap` i.p.v. oude kaarten, zoekbare dropdown-slicers voor veel waarden, tegel/lijst-slicers alleen voor korte lijstjes, detailtabellen onderaan, voorspelbare interacties.

## Report-spec en akkoord

Na de rondes één bestand: `./_brief/report-spec.md`. Daarna precies één vraag: *"Akkoord met deze spec, zodat ik kan gaan bouwen?"* — en stoppen tot je antwoordt. Ook als de oorspronkelijke vraag "bouw en publiceer" was.

```markdown
# Report Spec
## Report identity
- Report name / Semantic model / Audience / Primary purpose / Delivery target
## Semantic model binding
- Entry mode: <Local Model | Live Connected Model>
- Workspace name / Workspace ID / Model name / Model ID
- connectionString: <byPath ../<Project>.SemanticModel | byConnection-string>
## User decisions and constraints
- Scope / Page count / Interactivity / Design direction / Publishing / Accessibility / Data caveats
## Page plan
1. <Paginanaam>
   - Archetype / Layout variant (A/B/C) + reden / Purpose / Visuals / Fields/measures / Slicers/interactions
## Design system summary
- Thema + basispalet / kleurbetekenis per measure / typografie / grid en dichtheid / toegankelijkheid
## Model requirements
- Bestaande measures / Nieuwe measures / Nieuwe berekende kolommen / Relaties en sortering
## Canonical design contract
<YAML-blok "Design Brief:" — zie hieronder>
```

**Design Brief (minimale vorm)** — het YAML-blok is leidend bij het bouwen; spreken tekst en YAML elkaar tegen, eerst de spec repareren.

```yaml
Design Brief:
  generated_by: powerbi-report-cli
  contract_version: 1
  mode: greenfield
  design_identity: { tone: <toon>, signature: <terugkerend visueel kenmerk> }
  navigation_model: <page_navigator | buttons | bookmark_navigator | none>
  color_map:
    - { measure: Orders[Open Orders], color: "#0072B2", tint: "#DEEFFF" }   # voorbeeld
  pages:
    - name: <beschrijvende titel>
      role: <landing | detail | drillthrough | tooltip>
      archetype: <Executive | Analytical | Operational | Narrative | Comparative>
      layout_variant: <A | B | C>
      variant_rationale: <welk datasignaal de keuze bepaalde>
      layout_contract:
        canvas: { width: 1920, height: 1080, margin: 32, gutter: 24, snap: 8 }
        grid:
          columns: 12
          rows: 12
          regions: { header: [1,1,9,2], filters: [9,1,13,2], body: [1,2,13,13] }
        placements:
          - { id: page_title, region: header, kind: textbox, text: <titel> }
          - { id: <id>, region: <regio>, kind: <cardVisual|barChart|tableEx|slicer|...>, purpose: <één vraag>, field_bindings: <Tabel[Veld]> }
        space_audit: { unplaced_regions: [], balance_rationale: <waarom deze verdeling> }
```

Eisen vóór de akkoordvraag: elke pagina in de tekst heeft een `pages[]`-item; elke pagina heeft `canvas`, `grid.regions`, `placements` en `space_audit` met lege `unplaced_regions`; elke pagina heeft een `page_title`-tekstvak met tekst; slicers in een `filters`-regio rechtsboven of een verantwoorde filterbalk; geen kale enkelvoudige `cardVisual` als grootste regio; geen `...` of placeholders.

Voor kleine wijzigingen volstaat:

```yaml
Design Brief:
  mode: brownfield
  design_identity: { tone: unchanged, signature: unchanged }
  change: "<één concrete wijziging>"
```

**Na akkoord, in deze volgorde:** spec opnieuw lezen → ontbrekende measures laten maken (`fabric-semantic-model`) → PBIP-structuur opzetten → pagina's en visuals schrijven → JSON controleren → openen in Desktop → elke pagina bekijken en fouten herstellen → alleen publiceren als dat in de spec staat.

## Archetype per pagina

Kies per pagina, niet per rapport. Bij twijfel: Analytical Canvas.

| Signaal | Archetype |
|---|---|
| Directie/MT; scan ≤ 10 s; "liggen we op koers?" | **Executive Summary** |
| Teamleider, ploegleider, wandscherm; "is er iets mis?" | **Operational Monitor** |
| Analist; "waarom gebeurde X?" | **Analytical Canvas** |
| Gestuurd betoog; "dit is wat er gebeurde" | **Narrative Story** |
| Ranking, benchmark, afwijking; "ten opzichte van wat?" | **Comparative Benchmark** |

Is de vraag vaag (doelgroep, doel, aantal pagina's of filterdiepte ontbreekt), bied dan 2–3 concrete opties in gewone woorden aan in plaats van te gokken. Zones in een archetype zijn advies: elke kaart of callout moet een eigen vraag beantwoorden; anders weglaten. Rapporten met meerdere onderwerpen mixen archetypes; pagina's met hetzelfde archetype wisselen van variant als de data dat rechtvaardigt.

## Operationele monitor

Voor dagelijkse sturing: orders, voorraad, leveringen, SQDC. Kernvraag: *"Is er iets mis?"* — afwijking zien binnen 5 seconden, zonder te klikken.

| # | Principe |
|---|---|
| 1 | **Versheid eerst** — zichtbare "laatst bijgewerkt" + markering als data verouderd is |
| 2 | **Drempels zijn het ontwerp** — expliciete goed/waarschuwing/slecht-grenzen per metriek |
| 3 | **Uitzonderingen bovenaan** — sorteren op ernst aflopend, nooit alfabetisch |
| 4 | **Dicht mag, versiering niet** |
| 5 | **Meldingen via mail/flow, niet via het dashboard** — het dashboard toont status |
| 6 | **Vier kernsignalen** — fysiek: doorvoer / wachtrij / uitzonderingsratio / staat van middelen |

| Variant | Wanneer | Opbouw |
|---|---|---|
| **A — 4-up status** (standaard) | Bureauscherm, bewaken én afhandelen | Kop 56 px (selectors, laatst bijgewerkt) · 4 statustegels 120 px · tijdreeks 280 px (gedeelde X-as) · uitzonderingenlijst + kaart 240 px · voettekst 24 px (bron, ververstempo) |
| **B — Wandscherm** | TV op ≥ 3 m, perifeer kijken | Kop 64 px · 2 grote samengestelde statustegels 440 px (waarde + statuskleur + drempel/sparkline) · 4 subtegels 160 px · voettekst. Geen uitzonderingentabel. Donkere achtergrond aanbevolen. |
| **C — Uitzonderingen eerst** | Actief afhandelen | Statusstrook 56 px · volle breedte uitzonderingentabel 400 px (ernst, wanneer, wat, waar, actie) · correlatierij 200 px · voettekst |

| Gebruiken | Rol |
|---|---|
| `cardVisual` (+ `shape` + icoon) | Statustegel; voorwaardelijke opmaak stuurt kleur |
| `lineChart` | Tijdreeks met referentielijnen voor drempels; sparkline in tabel |
| `tableEx` met iconen + databalken | Uitzonderingenlijst, ernst aflopend |
| `pivotTable` met achtergrond-CF | Heatstrip tijd × entiteit |
| `azureMap` | Ruimtelijke status; lukt dat niet, dan tabel of `clusteredBarChart` per regio |

**Niet gebruiken:** `pieChart`/`donutChart` (geen afwijking zichtbaar), `scatterChart`, `treemap`, `decompositionTree`, veel analytische slicers.

**Semafoorkleuren** — nooit alleen kleur: altijd ook vorm/icoon (WCAG 1.4.1).

| Status | Hex |
|---|---|
| Goed | `#107C10` |
| Waarschuwing | `#FF8C00` |
| Kritiek | `#D13438` |
| Onbekend/verouderd | `#797775` |

| Kijkafstand | Tekst | Tegelkop | Kaartwaarde | Aslabels |
|---|---|---|---|---|
| Laptop (0,5 m) | 14 pt | 18 pt | 24 pt | 10 pt |
| TV (3 m) | 18 pt | 24 pt | 36 pt | 14 pt |

**Versheid:**

| Middel | Opmerking |
|---|---|
| `autoPageRefreshInterval` | Alleen DirectQuery; Premium min. 1 s, shared 30 min |
| `changeDetection` | Ververst alleen als brondata wijzigt |
| Laatst-bijgewerkt-measure (`MAX(timestamp)`) | Prominent in de kop |
| Verouderd-markering | Voorwaardelijke opmaak als verstreken tijd > 2× verwachte cyclus |

| Verwachte cyclus | Verouderd na | Actie |
|---|---|---|
| Elk uur (batch) | > 3 uur | Grijs + "Wacht op verversing" |
| 30 s | > 90 s | Rood icoon + KPI-waarden onderdrukken |

**Interactie:** normaal geen klikken nodig; tooltip-pagina (320 × 240) op statustegel; drillthrough van rode tegel naar detailpagina; eventueel ploegbladwijzers (dag/nacht).

**Checklist:** laatst-bijgewerkt zichtbaar · verouderd-markering werkt · drempels per metriek · status = kleur + vorm/icoon · uitzonderingen op ernst · lettergrootte past bij kijkafstand · nul klikken voor normaalbeeld · drillthrough van rood naar detail.

## Managementsamenvatting

Kernvraag: *"Liggen we op koers, en waarom?"* — begrijpen binnen 10 seconden.

| # | Principe |
|---|---|
| 1 | Titel is een stelling ("Leverbetrouwbaarheid 4% boven doel"), geen label |
| 2 | Maximaal 3–6 KPI's |
| 3 | Elke KPI met absolute waarde + verschil + richting |
| 4 | Sparklines i.p.v. volledige trendgrafieken |
| 5 | Eén hoofdgrafiek die de kop onderbouwt |
| 6 | Drie semantische kleuren + grijs (`#107C10` positief, `#D13438` negatief, `#605E5C` neutraal, `#E1DFDD` lijnen/randen) |
| 7 | Detail achter drillthrough |

| Variant | Wanneer |
|---|---|
| **A — Hero rechts** (standaard) | 3–4 KPI's + één duidelijke hoofdmetriek met trend |
| **B — KPI-strook** | 5–6 even belangrijke KPI's, geen hoofdmetriek; sparklines uit |
| **C — Kop + hoofdgrafiek** | 1–2 KPI's + sterke verhaalgrafiek (waterval, sterke trend) |

Gebruik `cardVisual`, `lineChart` als sparkline (assen, labels en markers uit), `barChart` gesorteerd op verschil, `actionButton` voor drillthrough. Vermijd `scatterChart`, `treemap`, `pivotTable`/matrix, gauge en donut. Maximaal één slicer (datum, rechtsboven). Voettekst met bron en verversmoment.

## Grafiekkeuze

Kies op de **vraag**, niet op het datatype.

| Vraag | Eerste keuze | Vermijd |
|---|---|---|
| Vergelijken | Horizontale staaf (`barChart`/`clusteredBarChart`) | Taart, 3D |
| Samenstelling | 100%-gestapeld, treemap | Taart met > 5 delen |
| Trend | `lineChart` (≥ 7 punten); `columnChart` bij ≤ 6 perioden | Gladgestreken lijn |
| Ranking | Gesorteerde horizontale staaf | Ongesorteerde staven |
| Afwijking | Divergerende staaf, waterval | Willekeurige basislijn |
| Eén KPI | `cardVisual` + sparkline/context | Gauge, grote kale kaart als hoofdelement |
| Exacte waarden | `tableEx` / `pivotTable` | — |
| Locatie | `azureMap`; gesorteerde staaf als het alleen om ranking gaat | Oude kaarten |

Vuistregels: staven ≤ 15 categorieën, lijnen ≤ 5 reeksen, taart ≤ 5 delen. Andere eenheden (stuks vs. %) → aparte visuals, geen dubbele as. Staven beginnen bij 0. Sorteer staven op waarde, behalve bij natuurlijke volgorde (maanden, processtappen). Gebruik voor een tijd-as een datum- of numerieke kolom, geen tekstmaandnamen.

## Indeling en grid

- Nieuwe rapporten: canvas **1920 × 1080** (FHD), tenzij anders gevraagd. Bestaande rapporten: canvasgrootte behouden.
- Alles op een **8 px-grid**: 8 = minimale padding, 16 = binnen een groep, 24 = tussen groepen en paginamarge, 32 = sectiescheiding.
- 12 kolommen: FHD met 32 px marge en 24 px goot → ±132,7 px per kolom; breedte van N kolommen = `N × 132,7 + (N − 1) × 24`, afgerond op 8.
- Linksboven draagt de belangrijkste boodschap: titel, belangrijkste KPI of hoofdgrafiek. Geen slicer op x < 200, y < 100.
- 1–3 slicers: rechts in de titelrij. 4 of meer: verticale filterbalk (± 2 kolommen). Reserveer de hele titel/slicerband vóór je iets eronder plaatst; z-volgorde lost overlap niet op.
- Geen overlappende visuals (behalve bewuste achtergrondvormen). Maximaal 7 ± 2 visuele groepen per pagina; > 12 visuals is te veel.

Voorbeeldindeling op een bestaand 1280 × 720-canvas:

```text
KPI-strook:  x=20,  y=20,  w=1240, h=82   (één multi-value cardVisual)
Grafiek:     x=20,  y=118, w=610,  h=582
Tabel:       x=650, y=118, w=610,  h=582
```

## Interactie en navigatie

| Model | Beste voor | Vermijd bij |
|---|---|---|
| Page Navigator (automatische tabs) | Gelijkwaardige pagina's | > 7 pagina's |
| Eigen knoppen | Gestuurde flow; acties zoals Terug, drillthrough, slicers wissen, URL | Gewoon wisselen tussen pagina's |
| Bookmark Navigator | Verhaalstappen, weergave A/B op één pagina | Wisselen tussen pagina's; > 8 bladwijzers |

Regels: één primair model per rapport; drillthrough-doelpagina heeft altijd een Terug-knop; labels beschrijven de bestemming ("Leveringen per vervoerder", niet "Pagina 2"); hoofdinzicht zichtbaar zonder klikken.

Kruisfilteren: grafieken standaard **markeren** (highlight), kaarten/KPI's **filteren**, referentievisuals **geen** interactie. Mechaniek in [pbir-structuur.md](pbir-structuur.md#visualinteracties).

Bladwijzers: beschrijvende namen, alleen wat verandert vastleggen, elke overgang testen, altijd een "reset"-bladwijzer, 5–8 per rapport.

## Kleur

| Kleur | Betekenis |
|---|---|
| Groen | Goed / op doel — alleen gunstige status |
| Rood | Slecht / kritiek — alleen ongunstige status |
| Amber | Waarschuwing |
| Grijs | Neutraal, context, benchmark |
| Blauw | Informatief, merkaccent |

- Rood/groen nooit als enige signaal (kleurenblindheid): icoon of tekst erbij.
- Tekstcontrast minimaal 4,5:1 (op wit minstens `#767676`).
- Geen pastel voor kritiek; maximaal 7–8 categoriekleuren.
- **Kleurkaart per measure:** dezelfde measure krijgt in elke kaart, lijn, staaf en tabel dezelfde kleur. Leg de toewijzing vast vóór je visuals maakt.
- Kleurenblind-veilig categoriepalet (Okabe-Ito): `#E69F00` `#56B4E9` `#009E73` `#F0E442` `#0072B2` `#D55E00` `#CC79A7` `#000000`.

## Ontwerpcontrole

- [ ] Elke pagina heeft een beschrijvende titel (stelling of vraag), geen "Overzicht".
- [ ] Elke grafiek heeft een expliciete titel; ondertitel alleen als die context toevoegt (periode, eenheid, filter).
- [ ] KPI's tonen context (verschil, doel of vorige periode).
- [ ] Staven gesorteerd; geen taart met > 5 delen; geen tekstmaanden op tijd-as.
- [ ] Leesbare veldnamen; percentages als `0%`/`0.0%`.
- [ ] Slicers passen bij de korrel: jaar/periode-dropdown voor managementpagina's; datumbereik alleen als dagverkenning nodig is.
- [ ] Coördinaten op 8 px-grid, geen overlap, geen lege band > 20%.
- [ ] Bewuste paginaachtergrond (bijv. `#F3F2F1`) zodat witte visuals niet wegvallen.
- [ ] Kleurkaart toegepast; contrast in orde; toegankelijkheid via `pbip-accessibility`.
