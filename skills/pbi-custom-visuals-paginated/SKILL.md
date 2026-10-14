---
name: pbi-custom-visuals-paginated
description: Kiezen en bouwen van visuals buiten de standaardset in Power BI én gepagineerde rapporten. Keuzetabel Deneb (Vega/Vega-Lite) vs SVG-via-DAX-measure (Image URL) vs Python/R-visual vs eigen custom visual (pbiviz), met limieten, licenties en interactiviteit; Deneb-specpatronen, SVG-measurepatronen (bullet, voortgangsbalk, sparkline, statuspil), Python/R-basis, en paginated reports (RDL-structuur, parameters, export, valkuilen). Gebruik bij: Deneb, Vega-Lite, Vega, SVG, DAX SVG, image URL, ImageUrl, sparkline in tabel, Python visual, R visual, ggplot2, matplotlib, custom visual, pbiviz, AppSource, paginated report, gepagineerd rapport, RDL, Report Builder, pakbon, picklijst, afdrukbaar, PDF-export. Niet voor rapportontwerp/PBIR-bewerking (fabric-powerbi-report), DAX/modellen (fabric-semantic-model) of alt-tekst (pbip-accessibility).
---

# Custom visuals en gepagineerde rapporten

> Bewerking van [data-goblin/power-bi-agentic-development](https://github.com/data-goblin/power-bi-agentic-development) (auteur Kurt Buhler, GPL-3.0), skills `deneb-visuals`, `svg-visuals`, `python-visuals`, `r-visuals`, `powerbi-custom-visuals`, `paginated-report`, commit 4936264. Vertaald, ingekort en aangepast. Deze skill valt daardoor ook onder GPL-3.0; zie `LICENSE` in deze map.

Deze skill helpt je kiezen tussen vier manieren om een visual te maken die Power BI standaard niet heeft, en bij het bouwen van een afdrukbaar, gepagineerd rapport (RDL). Een deel van de SVG-voorbeelden komt uit de PowerBI MacGuyver Toolbox (Kurt Buhler / Data Goblins); de bullet chart komt uit het SpaceParts-model.

**Buiten scope, gebruik de zus-skills:**

| Onderwerp | Skill |
|---|---|
| Rapportontwerp, PBIR/visual.json, filters, thema's, conditionele opmaak | `fabric-powerbi-report` |
| DAX-measures en -performance, semantisch model, TMDL | `fabric-semantic-model` |
| Workspaces, capaciteit, REST, deployment | `fabric-basis` |
| Alt-tekst en tabvolgorde | `pbip-accessibility` |

## Werkwijze

| Je vraag | Doe dit | Laad |
|---|---|---|
| "Welke techniek moet ik gebruiken?" | Loop de [keuzetabel](#keuzetabel) en de [beslisregels](#beslisregels) door | – |
| Klein grafiekje in een tabel-/matrixcel of kaart (bullet, voortgangsbalk, sparkline, pil) | SVG-measure vanuit een template | [references/svg-dax.md](references/svg-dax.md), `examples/svg/` |
| Interactieve, afwijkende grafiek (cross-filter, tooltips) | Deneb met Vega-Lite | [references/deneb.md](references/deneb.md), `examples/deneb/` |
| Statistiek die bij het renderen moet rekenen (regressie, dichtheid, forecastband) | Python- of R-visual | [references/python-r-visuals.md](references/python-r-visuals.md) |
| Herbruikbare visual voor veel rapporten of AppSource | Eigen custom visual (pbiviz) | [references/pbiviz.md](references/pbiviz.md) |
| Pakbon, picklijst, factuur, lijst die over pagina's doorloopt, PDF/Excel-export | Gepagineerd rapport (RDL) | [references/paginated-rdl.md](references/paginated-rdl.md), [references/paginated-ontwerp.md](references/paginated-ontwerp.md), `examples/paginated/` |

## Keuzetabel

Alle limieten hieronder staan zo in de bron; staat er "–", dan zegt de bron er niets over.

| | SVG via DAX-measure | Deneb (Vega/Vega-Lite) | Python-visual | R-visual | Custom visual (pbiviz) |
|---|---|---|---|---|---|
| Wat is het | Measure die SVG-tekst teruggeeft met `dataCategory` `ImageUrl` | Gecertificeerde custom visual die Vega/Vega-Lite-specs rendert | matplotlib/seaborn-script, rendert een PNG | ggplot2-script, rendert een PNG | Eigen TypeScript/D3-visual, verpakt als `.pbiviz` |
| Waar te tonen | Tabel, matrix, nieuwe kaart (`cardVisual`), image-visual, nieuwe knop-slicer | Eigen visual op het canvas | Eigen visual | Eigen visual | Eigen visual, in elk rapport te importeren |
| Interactiviteit | Geen (geen hover, klik, tooltip) | Tooltips, contextmenu, cross-filter, cross-highlight | Ontvangt cross-filter; kan zelf **niet** filteren | Idem Python | Volledig (selectie, tooltips, drill-down, opmaakvenster) |
| Rijlimiet | Geen rijlimiet; wel 32K tekens per gerenderde cel | 10.000 rijen standaard (`dataLimit.override`) | 150.000 (na ontdubbeling), input max 250 MB | 150.000, input max 250 MB, output 2 MB (Desktop) | – |
| Time-out | Geen | – | 5 min Desktop, 1 min Service | 5 min Desktop, 1 min Service | – |
| Licentie/regio | Geen licentie- of regiodrempel | Gecertificeerde visual uit AppSource | Pro/PPU of hoger, regio met Fabric | Idem Python | Certificering optioneel; R-visuals kunnen niet gecertificeerd worden |
| Publish to web / app-owns-data embed | Werkt bij publish to web | – | Niet ondersteund | Niet ondersteund | – |
| Gateway | – | – | Alleen personal | Alleen personal | – |
| Netwerk | Geen JavaScript | Geen externe URL's (AppSource-certificering) | Geblokkeerd in Service | Geblokkeerd in Service | Geen `eval`/`fetch`/`XMLHttpRequest` voor certificering |
| Toegankelijkheid | Schermlezer leest niets uit de cel; zet getallen ernaast | – | Statisch beeld | Statisch beeld | Eigen verantwoordelijkheid |
| Inspanning | Laag–middel (DAX-strings) | Middel (JSON-spec) | Middel (script) | Middel (script) | Hoog (Node.js, TypeScript, build) |

En voor de vraag "rapport of gepagineerd rapport":

| | Interactief rapport (PBIR) | Gepagineerd rapport (RDL) |
|---|---|---|
| Doel | Verkennen op scherm, cross-filteren | Printgetrouw document, elke detailregel geprint |
| Typisch | Dashboard, KPI-pagina | Pakbon, picklijst, factuur, overzicht van duizenden regels, export naar Excel/Word/CSV |
| Capaciteit | – | Workspace op Premium, Embedded, Fabric-capaciteit of PPU nodig om te renderen |
| Bouwen in | Power BI Desktop | Power BI Report Builder of direct in de `.rdl`-XML |

### Beslisregels

1. **Klein en inline** (sparkline, databalk, voortgangsbalk, statuspil) in een tabel/matrix/kaart → **SVG-measure**. Geen registratie van een custom visual nodig, geen rijlimiet, geen time-out.
2. **Interactie nodig** (cross-filter vanuit de visual, tooltips, hover) of een afwijkend diagramtype (bullet, beeswarm, sankey) → **Deneb**. Een statische PNG kan nooit selectiebron zijn.
3. **Python/R alleen als alles klopt:** geen native of Deneb-alternatief, de waarde zit in een berekening tijdens het renderen (modelfit, kernel density, forecastband), geen cross-filterbron/tooltips/publish to web nodig, en de omgeving is Pro/PPU of hoger in een regio met Fabric. Een boxplot, lollipop of dumbbell is werk voor SVG of Deneb, geen script.
4. **Python of R?** Python als je scikit-learn, statsmodels of scipy nodig hebt of het rapport al Python gebruikt; R voor statistische standaardplots en pakketten zonder Python-tegenhanger (`forecast`, `corrplot`, `pheatmap`). Bij twijfel: dezelfde taal als de andere scripts in het rapport.
5. **Herbruikbaar over veel rapporten, eigen opmaakvenster, eventueel AppSource** → **pbiviz**. Voor één grafiek in één rapport is een van de andere opties sneller.
6. **Moet het geprint of als PDF/Excel verstuurd worden, of alle regels tonen** → **gepagineerd rapport**. Wil de gebruiker "een dashboard", dan is het vrijwel zeker een gewoon rapport.

## SVG via DAX-measure (kern)

Zo werkt het:

1. Een measure geeft een SVG-string terug die begint met `data:image/svg+xml;utf8,`.
2. Zet de gegevenscategorie van de measure op `ImageUrl` (Image URL).
3. Power BI toont het als afbeelding in tabel, matrix, nieuwe kaart, image-visual of knop-slicer. Klassieke `card` ondersteunt het **niet**; gebruik `cardVisual`.

De bron adviseert SVG-measures als rapportmeasure (extension measure in `reportExtensions.json`) op te slaan, niet in het semantische model, en ze in een weergavemap zoals `SVG Charts` te zetten.

Vaste regels:

| Regel | Waarom |
|---|---|
| VAR-structuur: CONFIG (invoer, scope, kleuren) → NORMALIZATION → één VAR per SVG-element → ASSEMBLY | Gebruikers passen alleen CONFIG aan |
| Normaliseer naar een vast bereik (`viewBox='0 0 100 25'`) met `ALLSELECTED`-scope en `* 1.1` marge | Ruwe waarden zijn geen pixelcoördinaten |
| `HASONEVALUE` (of `ISINSCOPE` bij hiërarchieën) als guard | Anders onzinnige SVG op (sub)totaalregels |
| `<desc>` met `FORMAT(_Actual, "000000000000")` | Kolom sorteert op de onderliggende waarde |
| Enkele quotes voor attributen, kleuren als `#` hex | `%23` breekt kleuren; geen kleurnamen |
| `xmlns` op `<svg>`, geen JavaScript | Scripts worden gestript |
| Y=0 is boven; eerste element = achterste laag | Waarden omkeren: `_Height - _Value` |
| Rond coördinaten af op gehele getallen, `<polyline>` i.p.v. losse vormen | Kortere strings, minder werk per cel |
| Max. 32K tekens per gerenderde cel | Daarboven wordt de cel stil leeg |
| Getallen in een aangrenzende kolom + alt-tekst op de visual | SVG-cel is onleesbaar voor schermlezers |

Controleer eerst of een UDF-bibliotheek het al heeft: **DaxLib.SVG** (Jake Duddy), **PowerofBI.IBCS** (Andrzej Leszkiewicz), **PowerBI MacGuyver Toolbox** (Stepan Resl / Data Goblins). Templates en details: [references/svg-dax.md](references/svg-dax.md).

### Voorbeeld: OTIF-voortgangsbalk (warehouse)

Aanpassing van `examples/svg/progress-bar-measure.dax`; vervang `[OTIF %]` door je eigen measure (waarde 0–1). Drempels zijn een voorbeeld.

```dax
OTIF Progress SVG =
VAR _Pct = MIN ( [OTIF %], 1 )  -- 0 to 1, afgekapt op 100%
VAR _W = 100
VAR _H = 20
VAR _FillW = _Pct * _W
VAR _Label = FORMAT ( _Pct, "0%" )

VAR _Color =
    SWITCH (
        TRUE (),
        _Pct < 0.9, "#F44336",
        _Pct < 0.95, "#FF9800",
        "#4CAF50"
    )

VAR _Prefix = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " & _W & " " & _H & "'>"
VAR _Background = "<rect width='" & _W & "' height='" & _H & "' fill='#E0E0E0' rx='" & ( _H / 2 ) & "'/>"
VAR _Fill = "<rect width='" & _FillW & "' height='" & _H & "' fill='" & _Color & "' rx='" & ( _H / 2 ) & "'/>"
VAR _Text = "<text x='" & ( _W / 2 ) & "' y='" & ( _H / 2 + 5 ) & "' font-size='11' text-anchor='middle' fill='white' font-weight='bold'>" & _Label & "</text>"
VAR _Suffix = "</svg>"

RETURN
    _Prefix & _Background & _Fill & _Text & _Suffix
```

Kleur is hier de enige statusdrager plus het percentage als tekst; dat label houdt hem bruikbaar voor kleurenblinden.

### Voorbeeld: voorraaddekking-bullet (warehouse)

Neem `examples/svg/bullet-chart-measure.dax` en pas alleen de CONFIG aan:

| In de template | Vervang door (voorbeeld) |
|---|---|
| `[MTD Turnover]` (ook in `_MaxActual` en `_AxisMax`) | `[Voorraaddekking dagen]` |
| `[MTD Turnover 1YP]` (ook in `_MaxTarget` en `_AxisMax`) | `[Norm dekking dagen]` |
| `'Customers'[Key Account Name]` (overal) | `'Artikel'[Artikelgroep]` |
| Drempels `_VeryBad` … `_VeryGood` | Je eigen marges rond de norm |

Let op: bij voorraaddekking is "boven de norm" niet per se goed (te veel voorraad). Pas de `SWITCH` voor `_ActionDotFill` daarop aan.

## Deneb (kern)

- `visualType`: `deneb7E15AEF80B9E4D4F8E12924291ECE89A`; gebundeld Vega 6.2.0 / Vega-Lite 6.4.1 (sinds Deneb 1.8; gebruik `v6.json`-schema-URL's).
- Eén datarol `dataset` ("Values"): alle kolommen en measures daarin. Veldnamen in de spec = weergavenaam (`nativeQueryRef`); `.`, `[`, `]`, `\`, `"` worden `_`, spaties blijven.
- **Kies Vega-Lite** tenzij je Vega-only nodig hebt (signals, event streams, force/voronoi, geavanceerde cross-filter). Vega-Lite: `"data": {"name": "dataset"}`; Vega: `"data": [{"name": "dataset"}]`.
- Altijd een aparte config met `autosize: fit` (zie `examples/deneb/standard-config.json`).
- Themakleuren via `pbiColor(0)`, `pbiColor("negative")`, schema's `pbiColorNominal`/`pbiColorLinear`.
- Cross-filter staat standaard **uit** (`enableSelection`), net als cross-highlight (`enableHighlight`); tooltips en contextmenu staan aan.
- Sinds 1.9 zijn `__identity__` en `__key__` verwijderd: gebruik `__row__`.
- Aggregeer in DAX, niet in Vega; veel marks → `renderMode: canvas`.

Specpatronen, escaping en interactiviteit: [references/deneb.md](references/deneb.md).

## Python- en R-visuals (kern)

| | Python | R |
|---|---|---|
| `visualType` | `pythonVisual` | `scriptVisual` |
| Data | `dataset` (pandas DataFrame, automatisch) | `dataset` (data.frame, automatisch) |
| Verplichte laatste regel | `plt.show()` | `print(p)` |
| Runtime Service | Python 3.11 | R 4.3.3 |
| Niet in Service | plotly, bokeh, altair (netwerk geblokkeerd) | Pakketten met netwerk (RgoogleMaps, mailR) |

Grootste valkuil: `dataset` is **ontdubbeld** zoals een tabelvisual. Wil je per regel data (strip, jitter, ruwe scatter), bind dan een unieke sleutelkolom (geen measure). Meer: [references/python-r-visuals.md](references/python-r-visuals.md).

## Custom visual met pbiviz (kern)

Vereist Node.js 20.19+ en de `pbiviz`-CLI (`powerbi-visuals-tools`). Stappen: `pbiviz new <Naam>` → `IVisual` in `src/visual.ts` → `capabilities.json` (`dataRoles`, `dataViewMappings`, `objects`) → opmaakmodel → `pbiviz start` (developer visual) → `pbiviz package`. Certificering geeft export naar PowerPoint en weergave in e-mailabonnementen. Details: [references/pbiviz.md](references/pbiviz.md).

## Gepagineerd rapport / RDL (kern)

Een gepagineerd rapport is één `.rdl`-XML-bestand met databronnen, datasets, parameters, pagina-instellingen, lay-out en expressies. Report Builder is een GUI over dezelfde XML.

**Drie regels die de meeste schade voorkomen:**

1. **Volgorde van elementen telt.** Report Builder en de report processor laden een rapport met elementen in afwijkende volgorde niet ("invalid report definition", zonder regelnummer). Een XSD-validator vangt dat niet betrouwbaar. Structurele volgorde: `DataSources` → `DataSets` → `ReportSections` → `ReportParameters` → `ReportParametersLayout`.
2. **Valideer na elke structurele wijziging** en **render daarna echt** naar het doelformaat. Een groene validatie zegt niets over expressies, veldnamen of DAX.
3. **Begin vanaf een template**, typ niet vanaf nul. Kopieer `examples/paginated/enter-data-starter.rdl` en maak `rd:ReportID` een nieuwe GUID.

**Werkwijze:**

1. Leg het paginaframe vast: formaat, oriëntatie, marges, bruikbare breedte (A4 = `21cm` x `29.7cm`).
2. Bouw de lay-out tegen een **Enter Data**-dataset (vaste rijen in de `.rdl`), met dezelfde veldnamen als de echte query.
3. Valideer de structuur.
4. Wissel databron en query in (semantisch model via `PBIDATASET` + DAX, of SQL); de lay-out blijft gelijk.
5. Publiceer naar een workspace op Premium/Embedded/Fabric-capaciteit.
6. **Exporteer naar het echte formaat (PDF/Excel) en controleer** dat er verwachte, niet-lege inhoud staat.

**Valkuilen in het kort:**

| Valkuil | Gevolg / oplossing |
|---|---|
| Preview ≠ PDF | Preview gebruikt altijd de HTML-renderer; exporteer om te testen |
| Body-`Width` + linker- + rechtermarge > `PageWidth` | Lege pagina's rechts in PDF |
| `Globals!PageNumber`/`TotalPages` in de body | Werkt alleen in kop-/voettekst |
| Filters in de RDL (dataset/tablix) | Pas ná het ophalen; filter in de query |
| Measures uit `PBIDATASET` | Komen terug als `System.String`; `CDbl()` voor rekenen |
| Meervoudige parameter op semantisch model | `RSCustomDaxFilter` is fragiel; liever enkelvoudig via `TREATAS` |
| `@`-prefix | DAX: `QueryParameter Name` zonder `@`; SQL: met `@` |
| VB-functies zoals `Weekday()` in expressies | Rapport valt terug naar de "standard" omgeving; reken in de query |
| Ongeëscapete `<`, `>`, `&` in `<CommandText>` | Kapot document; `&&` wordt `&amp;&amp;` |
| Afmetingen zonder eenheid (`0.5`) | Parse-fout; altijd `in`, `cm`, `pt` |

### Voorbeeld: picklijst of pakbon (warehouse)

| Onderdeel | Keuze |
|---|---|
| Pagina | A4 staand, marges `1cm`; bruikbare breedte `19cm` |
| Paginakop | Titel, ordernummer, klant/afleveradres, `=Globals!ExecutionTime`, gekozen parameter |
| Body | Tabel (tablix) met locatie, artikel, omschrijving, aantal, eenheid; gegroepeerd per order |
| Paginering | Paginabreuk tussen ordergroepen, kolomkoppen herhalen (`RepeatOnNewPage`), adresblok `KeepTogether` |
| Voettekst | `=Globals!PageNumber & " of " & Globals!TotalPages` |
| Parameter | Eén order of één verzenddatum, met standaardwaarde (bijv. vandaag) |
| Bron | Semantisch model (`PBIDATASET`) of SQL, sorteren op picklocatie in de query |
| Export | PDF voor print; Excel met `PageName` per order als tabblad |

Uitwerking en XML-fragmenten: [references/paginated-rdl.md](references/paginated-rdl.md) en [references/paginated-ontwerp.md](references/paginated-ontwerp.md).

## Bestanden

| Bestand | Inhoud | Wanneer laden |
|---|---|---|
| [references/svg-dax.md](references/svg-dax.md) | SVG-conventies, normalisatie, templates per host, sparkline, performance, toegankelijkheid | Bij het schrijven of reviewen van een SVG-measure |
| [references/deneb.md](references/deneb.md) | Vega-Lite-patronen, escaping in PBIR, interactiviteit, runtimevelden, performance, templates | Bij het maken of debuggen van een Deneb-visual |
| [references/python-r-visuals.md](references/python-r-visuals.md) | Scriptsjablonen, pakketten, limieten, datamodelvalkuilen, R-specifieke flags | Bij een Python- of R-visual |
| [references/pbiviz.md](references/pbiviz.md) | CLI, projectstructuur, `IVisual`, `capabilities.json`, certificering, AppSource | Bij het ontwikkelen van een eigen visual |
| [references/paginated-rdl.md](references/paginated-rdl.md) | RDL-structuur, datasets, tablix, groepen, parameters, databronnen, Enter Data | Bij het schrijven of aanpassen van een `.rdl` |
| [references/paginated-ontwerp.md](references/paginated-ontwerp.md) | Wanneer gepagineerd, intake, paginaframe, renderers, paginering, uitvoeromgevingen, publiceren/exporteren, verschillen met SSRS | Bij ontwerp, paginering, export of performance |
| `examples/svg/*.dax` | Bullet chart, voortgangsbalk, sparkline, statuspil (letterlijk uit de bron) | Als startpunt voor een SVG-measure |
| `examples/deneb/*.json` | Standaardconfig, Vega-Lite bullet chart en KPI-kaart | Als startpunt voor een Deneb-spec |
| `examples/paginated/enter-data-starter.rdl` | Staand Letter-rapport met kop, paginanummer en tabel op Enter Data | Als startpunt voor een gepagineerd rapport |
| `examples/pbiviz/capabilities-objects.json` | `objects`-blok gekoppeld aan opmaakkaarten | Bij het opmaakvenster van een pbiviz-visual |

## Controle voor oplevering

- [ ] Keuze onderbouwd met de keuzetabel (interactiviteit, licentie/capaciteit, publish to web, rijlimieten).
- [ ] **SVG:** `ImageUrl` gezet, prefix `data:image/svg+xml;utf8,`, `xmlns` aanwezig, hex-kleuren met `#`, `HASONEVALUE`/`ISINSCOPE`-guard, genormaliseerde as, `<desc>`-sortering, lengte < 32K tekens in het slechtste geval, getallen in aangrenzende kolom, alt-tekst op de visual.
- [ ] **Deneb:** Vega-Lite tenzij nodig, `v6`-schema, veldnamen = weergavenamen, juiste escaping, config met `autosize: fit`, themakleuren, geen `__identity__`, geen externe data-URL, cross-filter bewust aan/uit.
- [ ] **Python/R:** `plt.show()`/`print(p)` als laatste, lege-data-guard, alleen Service-pakketten, unieke sleutel als je per regel data nodig hebt, R-tekst in Service met `powerbi_rEnableShowText = 1`, getest binnen 1 minuut.
- [ ] **pbiviz:** klassenaam = `visualClassName`, `node_modules`/`.tmp`/`dist` in `.gitignore`, `pbiviz package --certification-audit` schoon als je wilt certificeren.
- [ ] **RDL:** elementvolgorde intact, nieuwe `rd:ReportID`, eenheden op alle afmetingen, body + marges ≤ paginabreedte, parameters met standaardwaarde en `@`-prefix correct, filteren in de query, gevalideerd én geëxporteerd naar het doelformaat met niet-lege inhoud.
- [ ] Gepagineerd rapport staat in een workspace op Premium/Embedded/Fabric-capaciteit (of PPU).
