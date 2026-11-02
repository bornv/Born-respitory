---
name: fabric-powerbi-report
description: "Power BI-rapporten plannen, ontwerpen, bouwen en beheren in PBIR/PBIP-formaat: rapportpagina's, visuals (visual.json), kaarten, tabellen/matrix, grafieken, filters, slicers, knoppen, bladwijzers/bookmarks, thema (theme.json), voorwaardelijke opmaak, controle vóór oplevering, publiceren naar Fabric, definitie downloaden en rebind naar een ander semantisch model. Gebruik bij 'maak een rapportpagina', 'voeg een visual toe aan mijn PBIP', 'waarom is mijn kaart leeg', 'zet een slicer in visual.json', 'publiceer dit rapport', 'build a Power BI report', 'edit PBIR', 'rebind report'. Voor model, measures en DAX: fabric-semantic-model. Voor Power Query/Dataflow Gen2: fabric-dataflows. Voor authenticatie, werkruimtes/items vinden en REST-basis: fabric-basis. Voor alt-tekst en tabvolgorde: pbip-accessibility."
---

# Power BI-rapporten (PBIR/PBIP)

Gebaseerd op [microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric) (MIT, © Microsoft Corporation), skill `powerbi-report-cli`, commit bc42aaf. Vertaald en ingekort; zonder MCP-servers, lokale preview-tools en telemetrie-headers.

Deze skill helpt je een Power BI-rapport te maken of aan te passen als **bestanden**: een PBIP-project waarvan het rapport in PBIR-formaat is opgeslagen (een map met losse JSON-bestanden per pagina en per visual). Jij opent het project in Power BI Desktop, controleert het resultaat en publiceert; de skill zegt welke bestanden je aanpast, met welke JSON, en waarop je moet letten.

> Het origineel stuurt daarnaast een lokale CLI (`powerbi-report-author`) en preview-/screenshot-hosts aan die de agent zelf draait. Die zijn hier weggelaten. De handmatige route: bestanden bewerken → openen/herladen in Power BI Desktop → zelf controleren → publiceren via Desktop of de Service. De CLI blijft een **optie die jij zelf kunt installeren** voor validatie (zie [beheer-en-publiceren.md](references/beheer-en-publiceren.md)).

## Uitgangspunten

- **Rapport ≠ model.** Deze skill bewerkt alleen de `.Report`-map. Measures, kolommen, relaties en sorteerkolommen horen in het semantisch model → `fabric-semantic-model`.
- **Niets uit het hoofd raden.** Visualtypes, rolnamen, objecten, propertynamen en enum-waarden variëren per visualtype. Gebruik alleen wat in deze skill staat of wat al in een bestaand, werkend `visual.json` van hetzelfde rapport staat. Twijfel? Maak de visual één keer in Desktop en kopieer de structuur.
- **`$schema` nooit zelf ophogen.** Kopieer de `$schema`-URL uit een bestaand bestand van hetzelfde type in hetzelfde rapport.
- **Veldnamen moeten exact kloppen met het model.** `Entity` = tabelnaam, `Property` = kolom- of measurenaam, hoofdlettergevoelig zoals in het model.
- **Lokaal blijft lokaal.** Publiceren of een bestaand rapport overschrijven gebeurt alleen als je daar expliciet om vraagt, en overschrijven pas na een aparte bevestiging.
- **Nieuw rapport: eerst plan, dan bouwen.** Leg het plan (`_brief/report-spec.md`) vast en wacht op akkoord voordat er bestanden worden gemaakt.
- **JSON-bestanden niet met regex of zoek-en-vervang bewerken.** Lees in → parse → wijzig object → schrijf terug. In PowerShell: `ConvertTo-Json` altijd met `-Depth 20` (standaard is 2 en kapt de structuur af).
- **Toegankelijkheid (alt-tekst, tabvolgorde, knop-tooltips)** → skill `pbip-accessibility`. Hier alleen de structuur waarin die eigenschappen staan.

## Werkwijze

| Vraag of taak | Aanpak | Laad |
|---|---|---|
| Nieuw rapport/dashboard vanaf een model | Rondes: doelgroep → model → pagina-plan → stijl → spec → akkoord | [planning-en-ontwerp.md](references/planning-en-ontwerp.md) |
| Welke grafiek, welke indeling, welk paginatype? | Archetype per pagina + grafiekkeuze + grid | [planning-en-ontwerp.md](references/planning-en-ontwerp.md) |
| Mapstructuur, pagina toevoegen, `definition.pbir` koppelen aan model | Bestanden en ID's volgens het PBIR-patroon | [pbir-structuur.md](references/pbir-structuur.md) |
| Velden/measures in een visual binden, sorteren, drillthrough | Expressies en projecties | [pbir-structuur.md](references/pbir-structuur.md) |
| Kaart, KPI, tabel, matrix, staaf/lijn, tekstvak toevoegen | Sjabloon per visualtype | [visuals.md](references/visuals.md) |
| Filter op rapport/pagina/visual, Top N, relatieve datum | `filterConfig.filters` | [filters-en-slicers.md](references/filters-en-slicers.md) |
| Slicer toevoegen, vooraf selecteren, synchroniseren | Slicersjabloon + hoogteformule | [filters-en-slicers.md](references/filters-en-slicers.md) |
| Kleuren, titels, achtergrond, randen, thema | Cascade, encodering, selectors, theme.json | [opmaak-en-thema.md](references/opmaak-en-thema.md) |
| Kleur op basis van waarde, iconen, databalken, links | `FillRule` / `Conditional.Cases` | [voorwaardelijke-opmaak.md](references/voorwaardelijke-opmaak.md) |
| Navigatieknoppen, terugknop, bladwijzers, tonen/verbergen | `actionButton` + `visualLink`, bookmark-bestanden | [knoppen-en-bladwijzers.md](references/knoppen-en-bladwijzers.md) |
| Controleren, Git, publiceren, downloaden, rebind | Handmatige route + REST-route | [beheer-en-publiceren.md](references/beheer-en-publiceren.md) |
| Alt-tekst, tabvolgorde, schermlezer | Andere skill | `pbip-accessibility` |
| Measure ontbreekt / klopt niet, DAX | Andere skill | `fabric-semantic-model` |

**Volgorde bij een nieuw rapport:** plannen → ontwerpen → bouwen → controleren → (alleen op verzoek) publiceren. Eén fase tegelijk; bouw pas na een expliciet akkoord op de spec.

## PBIP in één oogopslag

```text
<Rapport>.pbip
├── <Rapport>.Report/
│   ├── .platform                    # Fabric-metadata
│   ├── definition.pbir              # koppeling rapport → semantisch model
│   ├── definition/
│   │   ├── version.json
│   │   ├── report.json              # thema's, instellingen, resources, rapportfilters
│   │   ├── bookmarks/               # optioneel
│   │   └── pages/
│   │       ├── pages.json           # paginavolgorde (pageOrder) + actieve pagina
│   │       └── <pageId>/
│   │           ├── page.json        # naam, grootte, paginafilters, interacties
│   │           └── visuals/<visualId>/visual.json
│   └── StaticResources/RegisteredResources/   # eigen thema, afbeeldingen
└── <Rapport>.SemanticModel/         # model (TMDL) — andere skill
```

Een visual heeft altijd deze vorm (details in [pbir-structuur.md](references/pbir-structuur.md)):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json",
  "name": "<20 hex-tekens>",
  "position": { "x": 0, "y": 0, "z": 1000, "height": 300, "width": 400, "tabOrder": 1000 },
  "visual": {
    "visualType": "<type>",
    "query": { "queryState": { "<Rol>": { "projections": [ { "field": {}, "queryRef": "<Tabel>.<Veld>", "nativeQueryRef": "<Veld>" } ] } } },
    "objects": {},
    "visualContainerObjects": {}
  }
}
```

## Moderne visualtypes

Maak nooit legacy-types. Repareer je een bestaande legacy-visual, migreer dan naar het moderne type.

| Niet maken | Gebruik |
|---|---|
| `card`, `multiRowCard` | `cardVisual` (meerdere KPI's = één `cardVisual` met meerdere projecties in `Data`) |
| `table` | `tableEx` |
| `matrix` | `pivotTable` |
| `map`, `filledMap` | `azureMap` |

## Veelgemaakte fouten

| Fout | Gevolg | Oplossing |
|---|---|---|
| Rollen direct onder `query` i.p.v. onder `query.queryState` | Schemafout | Alle rollen onder `queryState` |
| `visualContainerObjects` naast `visual` i.p.v. erin | Schemafout in Desktop | Binnen `visual`, naast `objects` |
| `"Fields"` als rol bij `cardVisual` | Lege kaart | Rol heet `"Data"` |
| Kolom en measure verwisseld (`Column` vs `Measure`) | Visual geeft fout | Kolommen `Column`, measures `Measure` |
| Aggregatie met `nativeQueryRef` = kolomnaam | Lege visual zonder foutmelding | `"Sum of <Kolom>"` |
| Pagina niet in `pages.json` → `pageOrder` | Pagina onzichtbaar | Toevoegen aan `pageOrder` |
| Dubbele visual- of filternamen | Onvoorspelbaar gedrag | Altijd unieke ID's genereren |
| `"Entity"` binnen filter-`Where` | Filter werkt stil niet | `"Source"` met alias uit `From` |
| Getal zonder suffix | Typefout | `D` = decimaal, `L` = geheel getal |
| `paragraphs` in tekstvak als string | Tekstvak leeg | Echte JSON-array |
| Tekstvak als dunne scheidingslijn | Wordt ~24 px hoog | `shape` (rechthoek) gebruiken |
| `tableEx` met dimensies én measures in `Values` | Kop zonder rijen | `pivotTable`: dimensies in `Rows`, measures in `Values` |
| `dataPoint.fill` zonder selector op 1-reeksgrafiek | Staven onzichtbaar | `dataPoint.defaultColor` |
| `defaultColor` op grafiek met meerdere reeksen | Alles één kleur | `fill` met `metadata`-selector per reeks |
| Eigen tabelkleuren zonder `stylePreset: 'None'` | Witte rijen | `stylePreset` op `'None'` zetten |
| `sortDefinition` in `visual` of op root | Genegeerd/schemafout | `visual.query.sortDefinition` |
| `$schema`-versie aangepast | Desktop weigert bestand | Bestaande waarde behouden |
| Paginaachtergrond met `show` | Schemafout | Pagina-`background` kent alleen `color`, `image`, `transparency` |
| Opmaakobject zonder `{ "id": "default" }` waar nodig (kaart, knop, slicer) | Valideert, maar geen effect | id-selector toevoegen |
| Thema gewijzigd zonder harde kleuren in visuals mee te nemen | Oude kleuren blijven | Hele `definition/` doorzoeken op oude hex-waarden |

## Literal-waarden in PBIR

In `visual.json` en `page.json` is elke waarde in een expressie verpakt; in `theme.json` niet.

| Type | PBIR | Voorbeeld |
|---|---|---|
| Boolean | `{"expr":{"Literal":{"Value":"true"}}}` | geen suffix |
| Decimaal | `{"expr":{"Literal":{"Value":"12D"}}}` | `D` |
| Geheel getal | `{"expr":{"Literal":{"Value":"3L"}}}` | `L` |
| Tekst | `{"expr":{"Literal":{"Value":"'Dropdown'"}}}` | enkele quotes binnen dubbele |
| Kleur | `{"solid":{"color":{"expr":{"Literal":{"Value":"'#118DFF'"}}}}}` | hex met `#` |
| Themakleur | `{"solid":{"color":{"expr":{"ThemeDataColor":{"ColorId":0,"Percent":0}}}}}` | index in `dataColors` |

## Controle voor oplevering

Loop dit na elke logische batch wijzigingen na. Validatie op schema is nooit genoeg: open het rapport ook echt.

**Bestanden**

- [ ] Elk bestand is geldige JSON (UTF-8), geen afgekapte nesting.
- [ ] Elk nieuw bestand heeft een `$schema` gekopieerd van hetzelfde bestandstype in hetzelfde rapport; bestaande `$schema`-waarden ongewijzigd.
- [ ] Nieuwe pagina staat in `pages.json` → `pageOrder`; `activePageName` ongewijzigd tenzij gevraagd.
- [ ] Visualnamen uniek per pagina, paginanamen uniek in het rapport, filternamen uniek in het hele rapport; mapnaam = `name` in het bestand.
- [ ] `definition.pbir` heeft precies één vorm (`byPath` óf `byConnection`) en wijst naar het juiste model.

**Binding**

- [ ] Elke `Entity`/`Property` bestaat in het model (tabel-, kolom- en measurenamen exact).
- [ ] `Column` alleen voor kolommen, `Measure` alleen voor measures, `Aggregation` rond kolommen die opgeteld moeten worden.
- [ ] Rolnamen kloppen per visualtype (`Data` voor `cardVisual`, `Category`/`Y` voor staaf/lijn, `Values` voor tabel en slicer, `Rows`/`Values` voor matrix).
- [ ] `queryRef` uniek per visual; `metadata`-selectors verwijzen naar de `queryRef`, niet naar `nativeQueryRef`.
- [ ] Bladwijzers en knoppen verwijzen naar bestaande pagina-, visual- en bladwijzer-`name`'s (niet naar `displayName`).

**Weergave (in Power BI Desktop)**

- [ ] Rapport opent zonder foutmelding; elke gewijzigde pagina bekeken.
- [ ] Geen lege grafieken, tabellen met alleen koppen, foutpictogrammen of "Can't display".
- [ ] Niets afgekapt of overlappend: kaartwaarden, slicers (ook de onderste rij), knoplabels, tekstvakken zonder scrollbalk.
- [ ] Leesbare namen op assen, kolomkoppen en legenda's (geen `Sum of order_id`); percentages als `%`.
- [ ] Kleuren hebben contrast met de achtergrond; dezelfde measure heeft overal dezelfde kleur.
- [ ] Voorwaardelijke opmaak zichtbaar waar verwacht; slicers tonen waarden; knoppen en bladwijzers werken heen én terug.
- [ ] Alt-tekst en tabvolgorde gecontroleerd met `pbip-accessibility`.

**Publiceren** (alleen op verzoek)

- [ ] Expliciete opdracht om te publiceren; bij overschrijven aparte bevestiging.
- [ ] Bindingen gecontroleerd tegen het doelmodel in de werkruimte (namen kunnen afwijken van lokaal).
- [ ] Na publicatie het rapport in de browser geopend en gecontroleerd.

## Grenzen

- Geen PBIR-Legacy (één groot `report.json`-bestand) en geen `.pbix`: sla het rapport eerst op als PBIP in PBIR-formaat.
- Aangepaste visuals (AppSource, organisatie, `.pbiviz`) vallen buiten deze ingekorte versie.
- Rapportpagina's in Fabric renderen kan alleen in de browser; er is geen betrouwbare programmatische controle na publicatie.
