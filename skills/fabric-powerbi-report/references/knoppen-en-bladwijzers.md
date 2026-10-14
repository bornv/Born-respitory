# Knoppen en bladwijzers

Knoppen (`actionButton`) voor navigatie en acties, en rapportbladwijzers (bookmarks) voor tonen/verbergen, grafiek wisselen, resetten en verhaalstappen. Persoonlijke bladwijzers zijn gebruikersstatus in de Service en vallen hierbuiten. Knop-tooltips en tabvolgorde → `pbip-accessibility`.

## Inhoud

- [Knop: basissjabloon](#knop-basissjabloon)
- [Actietypes](#actietypes)
- [Twee-entry-patroon](#twee-entry-patroon)
- [Statussen (hover, selected, disabled)](#statussen-hover-selected-disabled)
- [Vorm en icoon](#vorm-en-icoon)
- [Grootte en plaatsing](#grootte-en-plaatsing)
- [Veelgebruikte knoppen](#veelgebruikte-knoppen)
- [Data Function-knop](#data-function-knop)
- [Bladwijzers: werkwijze](#bladwijzers-werkwijze)
- [Bestanden en index](#bestanden-en-index)
- [Bladwijzerstatus en opties](#bladwijzerstatus-en-opties)
- [Tonen/verbergen en grafiek wisselen](#tonenverbergen-en-grafiek-wisselen)
- [Huidige pagina](#huidige-pagina)
- [Filter- en slicerstatus](#filter--en-slicerstatus)
- [Knop naar bladwijzer en bladwijzernavigator](#knop-naar-bladwijzer-en-bladwijzernavigator)
- [Controle in Desktop](#controle-in-desktop)
- [Problemen](#problemen)

## Knop: basissjabloon

Een `actionButton` heeft **geen datarollen**: alles is opmaak (`objects`) plus de actie in `visualContainerObjects.visualLink`. Verwante types: `pageNavigator` (automatische paginatabs) en `bookmarkNavigator` (automatische bladwijzertabs).

```json
{
  "$schema": "<kopieer uit een bestaande visual in hetzelfde rapport>",
  "name": "<20 hex-tekens>",
  "position": { "x": 40, "y": 600, "z": 1000, "height": 44, "width": 150, "tabOrder": 1000 },
  "visual": {
    "visualType": "actionButton",
    "objects": {
      "text": [
        { "properties": { "show": { "expr": { "Literal": { "Value": "true" } } } } },
        { "properties": { "text": { "expr": { "Literal": { "Value": "'Button Label'" } } }, "fontSize": { "expr": { "Literal": { "Value": "11D" } } }, "fontColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#FFFFFF'" } } } } }, "horizontalAlignment": { "expr": { "Literal": { "Value": "'center'" } } } }, "selector": { "id": "default" } }
      ],
      "icon": [
        { "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } },
        { "properties": { "shapeType": { "expr": { "Literal": { "Value": "'rightArrow'" } } }, "placement": { "expr": { "Literal": { "Value": "'left'" } } } }, "selector": { "id": "default" } }
      ],
      "fill": [
        { "properties": { "show": { "expr": { "Literal": { "Value": "true" } } } } },
        { "properties": { "fillColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#0078D4'" } } } } } }, "selector": { "id": "default" } }
      ],
      "outline": [
        { "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } }
      ],
      "shape": [
        { "properties": { "tileShape": { "expr": { "Literal": { "Value": "'rectangleRounded'" } } }, "roundEdge": { "expr": { "Literal": { "Value": "8L" } } } } },
        { "properties": { "tileShape": { "expr": { "Literal": { "Value": "'rectangleRounded'" } } } }, "selector": { "id": "default" } }
      ]
    },
    "visualContainerObjects": {
      "background": [ { "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } } ],
      "border":     [ { "properties": { "show": { "expr": { "Literal": { "Value": "false" } } } } } ],
      "visualLink": [ { "properties": {
        "show": { "expr": { "Literal": { "Value": "true" } } },
        "type": { "expr": { "Literal": { "Value": "'<ActionType>'" } } }
      } } ]
    },
    "drillFilterOtherVisuals": true
  },
  "howCreated": "InsertVisualButton"
}
```

Vier instellingen in dit sjabloon zijn **verplicht** voor een nette weergave:

| # | Instelling | Waarom |
|---|---|---|
| 1 | `visualContainerObjects.background.show = false` | Anders witte containerbox; vulling lijkt ingesprongen |
| 2 | `visualContainerObjects.border.show = false` | Anders vage containerrand |
| 3 | `shape.tileShape = 'rectangleRounded'` (+ `roundEdge`), **niet** `'pill'` | `pill` tekent de vulling ingesprongen |
| 4 | `icon.placement = 'left'` (of `'right'`), ook als `icon.show = false` | Standaard icoonplek bovenaan duwt het label omlaag |

`text.verticalAlignment` wordt door `actionButton` **genegeerd**; niet gebruiken als "oplossing" en de hoogte niet verkleinen om te compenseren.

## Actietypes

In `visualLink` bepaalt `type` de actie; een begeleidende eigenschap geeft het doel. Altijd `show: true`, anders gebeurt er niets bij klikken.

| Actie | `type` | Extra eigenschap | Gebruik |
|---|---|---|---|
| Terug | `'Back'` | — | Terug naar vorige pagina (drillthrough) |
| Paginanavigatie | `'PageNavigation'` | `navigationSection`: `'<pageId>'` | Naar een vaste pagina |
| Bladwijzer | `'Bookmark'` | `bookmark`: `'<bookmarkName>'` | Bladwijzerstatus toepassen |
| Drillthrough | `'Drillthrough'` | `drillthroughSection`: `'<pageId>'` | Naar detailpagina met filtercontext |
| Weblink | `'WebUrl'` | `webUrl`: `'<url>'` | Externe link openen |
| Q&A | `'Qna'` | — | Q&A openen |
| Slicers toepassen | `'ApplyAllSlicers'` | — | Wachtende slicerselecties toepassen |
| Slicers wissen | `'ClearAllSlicers'` | — | Alle slicers op de pagina resetten |
| Data Function | `'DataFunction'` | `dataFunction`: gestructureerde verwijzing | Fabric User Data Function aanroepen |

- `navigationSection`, `drillthroughSection` en `bookmark` zijn de **ruwe** `name` (pagina-ID of bladwijzer-ID) als tekst-literal, nooit de `displayName`.
- `tooltip` (tekst bij hover) staat ook in `visualLink`; inhoud en controle → `pbip-accessibility`.
- `webUrl` mag ook een measure zijn die een URL teruggeeft: `"webUrl": { "expr": { "Measure": { "Expression": { "SourceRef": { "Entity": "<Tabel>" } }, "Property": "<Measure>" } } }`.

**Voorbeeld — naar de pagina Voorraad:**

```json
"visualLink": [{
  "properties": {
    "show": { "expr": { "Literal": { "Value": "true" } } },
    "type": { "expr": { "Literal": { "Value": "'PageNavigation'" } } },
    "navigationSection": { "expr": { "Literal": { "Value": "'<pageId van Voorraad>'" } } },
    "tooltip": { "expr": { "Literal": { "Value": "'Naar voorraadoverzicht'" } } }
  }
}]
```

## Twee-entry-patroon

Opmaakobjecten van een knop gebruiken **twee entries**:

1. Entry zonder selector: alleen de schakelaar `show` (geldt voor alle statussen).
2. Entry met `{ "id": "<status>" }`: de opmaak voor die status.

Zie `fill`, `text` en `icon` in het [basissjabloon](#knop-basissjabloon). Alles in één entry (met of zonder selector) = opmaak valt stil weg; de knop toont standaardwaarden.

| Object | Afwijking |
|---|---|
| `outline` met `show: false` | Mag één entry zonder selector zijn |
| `rotation` | Nooit een selector; alle eigenschappen in één entry zonder selector |
| `shape` | Eigen twee-entry-vorm zonder `show`, zie [Vorm en icoon](#vorm-en-icoon) |
| `shadow`, `glow` | Gewone regel: `show` zonder selector, opmaak (`color`, `shadowBlur`, `shadowPositionPreset`, `shadowDistance`, `angle`) met `{ "id": "default" }` |

## Statussen (hover, selected, disabled)

| Selector | Status | Actief wanneer |
|---|---|---|
| `{ "id": "default" }` | Normaal | Niet aangewezen of ingedrukt |
| `{ "id": "hover" }` | Aangewezen | Muis op de knop |
| `{ "id": "selected" }` | Ingedrukt | Knop wordt geklikt |
| `{ "id": "disabled" }` | Uitgeschakeld | Actie niet beschikbaar |

Per status één extra opmaak-entry:

```json
"fill": [
  { "properties": { "show": { "expr": { "Literal": { "Value": "true" } } } } },
  { "properties": { "fillColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#0078D4'" } } } } } }, "selector": { "id": "default" } },
  { "properties": { "fillColor": { "solid": { "color": { "expr": { "Literal": { "Value": "'#005A9E'" } } } } } }, "selector": { "id": "hover" } }
]
```

- Altijd `{ "id": … }`, nooit `{ "metadata": "default" }` (wordt genegeerd).
- `shape` (inclusief `tileShape`) accepteert ook deze statusselectors.
- In de bewerkweergave van Desktop zie je alleen `default`; `hover`/`selected` zie je in de leesweergave.
- `disabled` verschijnt in de praktijk alleen bij een `Drillthrough`-knop zonder geselecteerd datapunt.
- Kleuren, `text.text` en `webUrl` kunnen ook voorwaardelijk: zie [voorwaardelijke-opmaak.md](voorwaardelijke-opmaak.md) (selector `{ "id": "<state>" }`).

## Vorm en icoon

**Vorm** (`objects.shape`) altijd met twee entries, anders tekent Desktop stil een platte rechthoek:

- Entry 1 (geen selector): `tileShape` + geometrie (`roundEdge`, `parallelogramSlant`, `speechBubbleHeight`, …), gehele getallen met `L`.
- Entry 2 (`{ "id": "default" }`): **alleen** `tileShape`.

```json
"shape": [
  { "properties": { "tileShape": { "expr": { "Literal": { "Value": "'parallelogram'" } } }, "parallelogramSlant": { "expr": { "Literal": { "Value": "20L" } } } } },
  { "properties": { "tileShape": { "expr": { "Literal": { "Value": "'parallelogram'" } } } }, "selector": { "id": "default" } }
]
```

- **Nooit `tileShape: 'line'`**: staat in de enum maar niet in Desktop; bijna onzichtbaar en laat het opmaakvenster crashen.
- Knoppen met echte tekst: houd het bij `rectangle`, `rectangleRounded` of `pill` (met de kanttekening uit het sjabloon). Pijlen, driehoeken, `heart`, `oval`, `hexagon` e.d. hebben een niet-rechthoekig tekstvlak; het label loopt dan buiten de vulling. Oplossing in deze volgorde: rechthoekige vorm kiezen → `text.horizontalAlignment` naar het brede deel zetten (bijv. `'left'` bij een pijl naar rechts) → label inkorten of alleen icoon → in Desktop controleren.

**Icoon** (`objects.icon`): `show` zonder selector; `shapeType`, `placement`, `lineColor`, `iconSize`, `image` met `{ "id": "default" }`.

```json
"icon": [
  { "properties": { "show": { "expr": { "Literal": { "Value": "true" } } } } },
  { "properties": { "shapeType": { "expr": { "Literal": { "Value": "'information'" } } }, "placement": { "expr": { "Literal": { "Value": "'left'" } } } }, "selector": { "id": "default" } }
]
```

- `shapeType: 'blank'` = geen icoon.
- `iconSize` is een decimaal (`28D`), geen geheel getal.
- `shapeType: 'custom'`: afbeelding uit `StaticResources/RegisteredResources/`, opgenomen in `resourcePackages` van `report.json`, met `image.url` naar die resource. Geen inline `data:`-URI's (kunnen Desktop instabiel maken).

## Grootte en plaatsing

Een knoplabel is één regel tekst die niet scrollt, krimpt of afbreekt: te smal = afgekapt ("Income…").

1. **Breedte:** ruim genoeg voor het langste label plus marge. Een rij knoppen krijgt één gezamenlijke breedte, gebaseerd op het langste label. Heb je de CLI: `powerbi-report-author text measure "<label>" --font "Segoe UI" --size 11 --bold` en neem `recommendedButtonWidthPx`. Anders: in Desktop controleren en verbreden tot niets meer wordt afgekapt.
2. **Hoogte:** `fontSize × 4`, begrensd tussen 40 en 56 px (11 pt → 44, 12 pt → 48). Onder ~36 px wordt het label altijd afgekapt.
3. **Rij past:** som van breedtes + tussenruimtes ≤ beschikbare ruimte. Past het niet: kleiner lettertype, tweede rij of ruimte vrijmaken; de knop nooit smaller maken dan het label.
4. **Binnen het canvas:** `x`, `y` ≥ marge (16–32 px); `x + width` en `y + height` ≤ canvasmaat − marge. ≥ 8 px tussen knoppen.
5. **Rotatie:** `rotation.angle` draait knop + label samen (geef de `position` extra ruimte voor de gedraaide omhullende); `shapeAngle` draait alleen de vorm (label loopt eruit, label inkorten); `textAngle` draait alleen het label (extra hoogte).
6. Open de pagina in Desktop en controleer elke knop op afgekapte labels; geldig JSON is geen bewijs.

**Voorbeeld — navigatierij van 3 knoppen, 11 pt vet, langste label "Inbound & Putaway", beschikbaar 888 px:** gemeten breedte bijv. 170 → alle drie `width` 170, `height` 44; 3 × 170 + 2 × 16 = 542 ≤ 888.

## Veelgebruikte knoppen

### Terugknop

Elke drillthrough-doelpagina krijgt een `actionButton` met `type: 'Back'` (zie [Actietypes](#actietypes)). Test hem door vanaf de bronpagina via een geselecteerd datapunt naar de doelpagina te gaan en dan op de knop te klikken.

### Overzicht

| Knop | `type` | Let op |
|---|---|---|
| Terugknop | `'Back'` | Zie hierboven |
| Navigatiebalk | `'PageNavigation'` | Eén knop per pagina, horizontaal, elk met eigen `navigationSection` |
| Slicers wissen | `'ClearAllSlicers'` | Geldt voor de huidige pagina |
| Drillthrough | `'Drillthrough'` | `drillthroughSection` = pagina-ID van de doelpagina |

Gebruik een `shape` met actie alleen als je geen knopstatussen (hover/selected/disabled) nodig hebt; anders `actionButton`.

## Data Function-knop

Roept een gepubliceerde Fabric **User Data Function** aan (translytical task flow, bijv. terugschrijven). `dataFunction` is geen tekst-literal maar een gestructureerde verwijzing:

```json
"visualLink": [{
  "properties": {
    "show": { "expr": { "Literal": { "Value": "true" } } },
    "type": { "expr": { "Literal": { "Value": "'DataFunction'" } } },
    "tooltip": { "expr": { "Literal": { "Value": "'Run data function'" } } },
    "dataFunction": {
      "kind": "ItemLocation",
      "byReference": {
        "itemId":      { "expr": { "Literal": { "Value": "'<userDataFunctions_item_id>'" } } },
        "workspaceId": { "expr": { "Literal": { "Value": "'<workspace_id>'" } } }
      },
      "metadata": {
        "dataFunction": {
          "name": "<function_name>",
          "autoRefresh": true,
          "parameters": [
            { "name": "<param_name>", "dataType": "string", "isOptional": false, "defaultValue": null,
              "type": "SlicerParameter", "slicer": "<slicer_visual_name>", "autoClear": false }
          ]
        }
      }
    }
  }
}]
```

| Veld | Betekenis |
|---|---|
| `byReference.workspaceId` | GUID van de werkruimte met de functie (opzoeken: `fabric-basis`) |
| `byReference.itemId` | GUID van het item van type `UserDataFunctions` |
| `metadata.dataFunction.name` | Naam van de functie binnen dat item |
| `parameters[]` | Kopie van de functiesignatuur + binding per parameter |

1. Bekijk de signatuur. Elke **verplichte** parameter (`isOptional: false`, geen `defaultValue`) moet aan een invoer op de pagina gekoppeld zijn; optionele mogen leeg blijven.
2. Bij een slicer als bron: `type: "SlicerParameter"`, `slicer` = `name` van de slicer-visual (die moet op de pagina staan), `autoClear` = slicer na uitvoeren resetten.
3. Bron is een veld of measure? Dan een ander `type` en andere bindingseigenschap: maak zo'n knop eenmaal in Desktop en kopieer de exacte `parameters[]`-vorm.
4. Publiceer; de functie draait in de Service. De functie moet een **string** teruggeven. Ontbreekt de verwijzing of een verplichte binding, dan valideert de knop maar blijft hij uitgeschakeld.

## Bladwijzers: werkwijze

1. Noteer de bestaande pagina-, visual- en filternamen (`name`, niet `displayName`).
2. Kopieer `$schema` uit bestaande bladwijzerbestanden in hetzelfde rapport. Zijn er nog geen: gebruik de schema's uit de sjablonen hieronder; Desktop werkt ze bij het opslaan bij.
3. Maak per bladwijzer `definition/bookmarks/<bookmarkName>.bookmark.json`.
4. Neem elke bladwijzer op in `definition/bookmarks/bookmarks.json` (direct of als kind van een groep).
5. Koppel knoppen aan de exacte bladwijzer-`name`.
6. Open in Desktop en test elke overgang heen én terug (zie [Controle in Desktop](#controle-in-desktop)).

## Bestanden en index

```text
definition/
├── bookmarks/
│   ├── bookmarks.json
│   ├── <bookmarkName>.bookmark.json
│   └── <bookmarkName>.bookmark.json
└── pages/
```

Bestandsnaam en `name` moeten gelijk zijn: `32e6a5dec73817815177.bookmark.json` ↔ `"name": "32e6a5dec73817815177"`.

**Index** (één losse bladwijzer en één groep):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/bookmarksMetadata/1.0.0/schema.json",
  "items": [
    { "name": "a1c94e07d2b35f6e8812" },
    {
      "displayName": "View selector",
      "name": "b95e490160978ca1c3d9",
      "children": [ "32e6a5dec73817815177", "b7082154158c6ccc84be" ]
    }
  ]
}
```

- Elk kind verwijst naar een bestaand `.bookmark.json`-bestand.
- Elke bladwijzer staat precies één keer in de index; niet geïndexeerd = niet zichtbaar in de bladwijzerlijst.
- De groep-`name` is een eigen unieke ID zonder eigen bestand; `displayName` mag spaties bevatten.

## Bladwijzerstatus en opties

Een bladwijzerbestand heeft `$schema` (`.../item/report/definition/bookmark/2.1.0/schema.json` als er nog geen bladwijzers zijn), `displayName`, `name`, `options` en `explorationState` (`version: "1.3"`, `activeSection`, `sections`). Volledig voorbeeld: [Tonen/verbergen en grafiek wisselen](#tonenverbergen-en-grafiek-wisselen).

PBIR slaat het **omgekeerde** op van de meeste vinkjes in Desktop:

| Optie in Desktop | PBIR-veld | Waarde als aangevinkt |
|---|---|---|
| Data | `suppressData` | `false` |
| Display | `suppressDisplay` | `false` |
| Current page | `suppressActiveSection` | `false` |
| Selected visuals | `applyOnlyToTargetVisuals` | `true` |

| Doel | Data | Display | Current page | Selected visuals |
|---|---|---|---|---|
| Tonen/verbergen, grafiek wisselen | Uit | Aan | Meestal uit | Meestal uit |
| Filters/slicers resetten | Aan | Optioneel | Uit | Meestal uit |
| Verhaalstap over pagina's | Naar behoefte | Aan | Aan | Meestal uit |

**Doelvisuals:** zet in `targetVisualNames` de exacte visual-ID's, geef elk daarvan een status-entry in `visualContainers` en houd `applyOnlyToTargetVisuals` op `false`. Neem bij een wissel **beide kanten** op, niet alleen de visual die zichtbaar wordt. `applyOnlyToTargetVisuals: true` alleen als je uitdrukkelijk "Selected visuals" wilt, en dan in Desktop testen: sommige versies negeren dan de opgeslagen weergave- of filterstatus.

## Tonen/verbergen en grafiek wisselen

Zichtbaarheid staat onder `explorationState.sections.<pageName>.visualContainers.<visualName>`:

| Status | JSON |
|---|---|
| Zichtbaar | `"singleVisual": {}` |
| Verborgen | `"singleVisual": { "display": { "mode": "hidden" } }` |

**Voorbeeld — "Toon grafiek" (grafiek zichtbaar, tabel verborgen):**

```json
{
  "displayName": "Show chart",
  "name": "32e6a5dec73817815177",
  "options": {
    "targetVisualNames": [ "f0b7a9e5317ef5d3cb16", "9f489283587461417621" ],
    "suppressData": true,
    "suppressDisplay": false,
    "suppressActiveSection": true,
    "applyOnlyToTargetVisuals": false
  },
  "explorationState": {
    "version": "1.3",
    "activeSection": "fb1f349df66655761237",
    "sections": {
      "fb1f349df66655761237": {
        "visualContainers": {
          "f0b7a9e5317ef5d3cb16": { "singleVisual": {} },
          "9f489283587461417621": { "singleVisual": { "display": { "mode": "hidden" } } }
        }
      }
    }
  }
}
```

De tegenhanger "Toon tabel" slaat voor **beide** visuals de omgekeerde status op. Bij een detailpaneel (bijv. *voorbeeld:* uitklappaneel met orderregels per locatie) horen vorm, tekst, bedieningselementen én sluitknop in zowel de toon- als de verberg-bladwijzer.

## Huidige pagina

- Pagina meenemen: `"suppressActiveSection": false` + `"activeSection": "<pageId>"`.
- Gebruiker op de huidige pagina laten: `"suppressActiveSection": true` (`activeSection` mag dan blijven staan, maar wordt niet toegepast).
- Elke sleutel onder `explorationState.sections` moet een bestaande pagina-ID zijn.

## Filter- en slicerstatus

Bladwijzers met Data aan kunnen filters op alle drie de niveaus herstellen, in `byExpr`-arrays:

| Niveau | Pad in de bladwijzer |
|---|---|
| Rapport | `explorationState.filters.byExpr[]` |
| Pagina | `explorationState.sections.<pageId>.filters.byExpr[]` |
| Visual | `explorationState.sections.<pageId>.visualContainers.<visualId>.filters.byExpr[]` |

Neem `name`, `type`, expressie en predicaat over van het bijbehorende item in `filterConfig.filters[]` op dat niveau:

```json
"filters": {
  "byExpr": [
    {
      "name": "Filter4f088dcd17c3495bb785",
      "type": "Categorical",
      "filter": {
        "Version": 2,
        "From": [ { "Name": "c", "Entity": "Company", "Type": 0 } ],
        "Where": [ { "Condition": { "In": {
          "Expressions": [ { "Column": { "Expression": { "SourceRef": { "Source": "c" } }, "Property": "Company" } } ],
          "Values": [ [ { "Literal": { "Value": "'Contoso'" } } ] ]
        } } } ]
      },
      "expression": { "Column": { "Expression": { "SourceRef": { "Entity": "Company" } }, "Property": "Company" } },
      "howCreated": 1
    }
  ]
}
```

- Bovenste `expression`: `SourceRef.Entity`; binnen `filter.Where`: `SourceRef.Source` met de alias uit `From` (zoals bij gewone filters, zie [filters-en-slicers.md](filters-en-slicers.md)).
- `howCreated: 1` = door gebruiker gemaakte filterkaart. Door Desktop vastgelegde `howCreated: 0`-items laten staan bij kopiëren, maar niet zelf als filter schrijven.
- **Geen `filters.byName`** voor nieuwe bladwijzers: valideert, maar Desktop herstelt het filter stil als `(All)`.
- Een Data-bladwijzer herstelt de **hele** datastatus. Leg de andere niveaus expliciet vast (geselecteerde waarden of `(All)`); bladwijzers per niveau stapelen niet.
- Desktop-bladwijzers kunnen filters bevatten waarvan de filterkaart inmiddels weg is; dat is geen fout.
- Slicerselecties staan in `singleVisual.objects.merge.general[].properties.filter.filter` van de slicer.
- Alleen tonen/verbergen: geen filterstatus, `suppressData: true`.

## Knop naar bladwijzer en bladwijzernavigator

```json
"visualLink": [{
  "properties": {
    "show": { "expr": { "Literal": { "Value": "true" } } },
    "type": { "expr": { "Literal": { "Value": "'Bookmark'" } } },
    "bookmark": { "expr": { "Literal": { "Value": "'32e6a5dec73817815177'" } } }
  }
}]
```

Doel = bladwijzer-`name`, niet `displayName` (anders blijft de knop uitgeschakeld).

**`bookmarkNavigator`:** de koppeling aan een bladwijzergroep (`bookmarks.bookmarkGroup`) is niet in alle Desktop-versies een gewone tekst-literal. Daarom:

- Bestaande navigator uit Desktop laten staan.
- Alleen kopiëren binnen hetzelfde rapport met dezelfde groepsstructuur.
- De vorm van `bookmarks.bookmarkGroup` niet raden.
- Voor nieuw werk liever losse `actionButton`'s met `type: 'Bookmark'`.

## Controle in Desktop

1. Rapport opnieuw openen in Desktop.
2. Alle bladwijzers staan in de verwachte volgorde/groep.
3. Elke bladwijzer vanuit een neutrale status uitproberen.
4. Elk paar in beide richtingen: A → B → A.
5. Slicer wijzigen vóór een tonen/verbergen-bladwijzer: de slicer moet gewijzigd blijven.
6. Tonen/verbergen-groepen bevatten alle onderdelen van het paneel.
7. Current page-gedrag klopt met de bedoelde navigatie.
8. Elke knop aanklikken (in leesweergave of met Ctrl+klik) en controleren dat hij actief is.
9. Opslaan, opnieuw openen en de ronde herhalen (Desktop normaliseert soms bij opslaan).

Heb je de CLI, dan controleert `powerbi-report-author validate "<Rapport>.Report"` ook bladwijzers: ontbrekende `bookmarks.json`, `name` ≠ bestandsnaam, dubbele namen, ontbrekende of dubbele indexverwijzingen, niet-geïndexeerde bestanden, verwijzingen naar ontbrekende pagina's/visuals en knopacties zonder (geldig) doel (codes `PBIR_BOOKMARK_*`).

## Problemen

| Symptoom | Oorzaak | Oplossing |
|---|---|---|
| Knop zonder vulling/tekstkleur/icoonopmaak | `show` en opmaak in één entry | Twee-entry-patroon |
| Vorm wordt platte rechthoek | `shape` met één entry zonder selector | Tweede entry met alleen `tileShape` en `{ "id": "default" }` |
| Opmaakvenster crasht bij selecteren knop | `tileShape: 'line'` | Andere `tileShape` |
| Opmaak per status genegeerd | `{ "metadata": "default" }` | `{ "id": "<status>" }` |
| Klikken doet niets | `visualLink.show` ontbreekt | `show: true` toevoegen |
| Icoon toch zichtbaar in sommige statussen | `icon.show: false` in de entry met selector | `show` in de entry zonder selector |
| Label afgekapt of te laag, witte box om knop | Te klein, of renderafspraken ontbreken | [Grootte en plaatsing](#grootte-en-plaatsing) + de vier verplichte instellingen |
| Grijze **See details**-overlay | Kleurmeasure ontbreekt of geeft geen geldige kleur | Measure repareren (`fabric-semantic-model`) |
| Knop naar bladwijzer uitgeschakeld | Doel is `displayName` of bladwijzer bestaat niet | Bladwijzer-`name` gebruiken |
| Slicers resetten bij tonen/verbergen | Data staat aan | `suppressData: true` |
| Terugwisselen laat beide visuals zichtbaar/verborgen | Bladwijzer slaat maar één kant op | Status voor beide visuals vastleggen |
| Bladwijzer niet in de lijst | Ontbreekt in `bookmarks.json` | Toevoegen aan `items` of `children` |
| Filter herstelt als `(All)` | `filters.byName` gebruikt | `filters.byExpr` |
