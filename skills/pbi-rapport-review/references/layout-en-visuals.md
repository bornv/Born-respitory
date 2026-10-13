# Layout en visuals

Rekenwerk en regels per onderdeel van de pagina: canvas, ruimte, uitlijning, titels, KPI-kaarten, tabellen en matrixen, slicers, filterdeelvenster, tooltips en annotaties, mobiel. Waarom (3-30-300, identiteit, kleur, grafiekkeuze): [ontwerp-principes.md](ontwerp-principes.md). Hoe je posities en opmaak in `visual.json`/`page.json` schrijft: `fabric-powerbi-report`.

## Inhoud

1. Canvas en paginaformaat
2. Marges, tussenruimtes en grid
3. Uitlijning: gelijke ruimte en doorlopende kolommen
4. Zones en standaardmaten
5. Titels
6. KPI's en kaarten
7. Tabellen en matrixen
8. Slicers en filterdeelvenster
9. Tooltips en annotaties
10. Mobiele layout

---

## 1. Canvas en paginaformaat

**Controleer altijd eerst de werkelijke paginagrootte** (`width`/`height` in `page.json`) voordat je visuals plaatst of verschuift. Ga niet uit van 1280x720; sjablonen en bestaande rapporten verschillen. Bij het vergroten/verkleinen: eerst `width`/`height`, dan `x`/`y`, zodat een visual nooit tijdelijk buiten de pagina valt.

| Type | Breedte | Hoogte | Gebruik |
|---|---|---|---|
| Standard | 1280 | 720 | Desktop (PBI-standaard, 16:9) |
| Full HD | 1920 | 1080 | Hoge resolutie, presentaties |
| Letter | 816 | 1056 | Print, staand |
| 4:3 | 1280 | 960 | Oudere schermen |
| Custom | Variabel | Variabel | Specifieke eisen |

## 2. Marges, tussenruimtes en grid

Op een vast canvas is witruimte een eindig budget dat je bewust uitgeeft via de gaten tussen `position`-rechthoeken. Twee faalvormen komen beide doordat gaten als restpost worden behandeld: proppen (groepen lezen niet meer als groep) of verstrooien (de pagina oogt leeg).

Geef ruimte uit op drie niveaus, allemaal veelvouden van de gridunit:

```yaml
intra-group:  ~8-16px   # within a group (a KPI row)
inter-group:  ~24-32px  # between groups; this gap creates visual proximity grouping
margin:       ~24-32px  # canvas edge to first/last visual, all four sides
```

- Het gat **tussen** groepen moet strikt groter zijn dan het gat **binnen** een groep; die ongelijkheid maakt van ruimte hiërarchie.
- Reserveer eerst de marge: bruikbare ruimte = `canvas - 2*margin`.
- Gebruik niet een gat én een rand voor dezelfde scheiding; liever het gat.
- Padding (binnen een visualcontainer) en gaten (tussen containers) zijn aparte budgetten; de een aanscherpen levert de ander niets op.
- Grid van 8 of 16px: posities 0, 16, 32, 48, 64, 80, ...
- Minimaal gat tussen visuals in de bron: 16px; marges 24-32px.

## 3. Uitlijning: gelijke ruimte en doorlopende kolommen

1. Linkerranden van visuals in dezelfde kolom liggen gelijk.
2. Bovenranden van visuals in dezelfde rij liggen gelijk.
3. **Alle gaten tussen visuals zijn gelijk** en alle marges zijn gelijk. Ongelijke ruimte valt direct op, ook bij 4-8px verschil; het is een van de meest zichtbare kwaliteitssignalen.

Posities in een rij rekenkundig bepalen:

1. Kies marge (bijv. 24px) en gat (bijv. 16px).
2. Inhoudsbreedte = `page_width - (2 * margin)`.
3. Totale gatruimte = `gap * (num_visuals - 1)`.
4. Breedte per visual = `(content_width - total_gaps) / num_visuals`.

Voorbeeld: 4 gelijke visuals op 1280px, marge 24, gat 16:

```
content_width = 1280 - 48 = 1232
total_gaps = 16 * 3 = 48
visual_width = (1232 - 48) / 4 = 296

x positions: 24, 336, 648, 960
```

Bij ongelijke breedtes (KPI + grafiek in één rij) moet het gat hetzelfde blijven. Controleer: `visual_B.x - (visual_A.x + visual_A.width)` is gelijk voor alle buren.

**Kolomgrenzen lopen door over rijen.** Delen visuals in verschillende rijen een verticale splitsing, dan ligt het gat in rij 2 precies onder het gat in rij 1:

```
WRONG (misaligned vertical split):
+------ 648px ------+--16--+---- 584px ----+   Row 1
+------- 632px ------+--16--+--- 600px ----+   Row 2

RIGHT (aligned vertical split):
+------ 648px ------+--16--+---- 584px ----+   Row 1
+------ 648px ------+--16--+---- 584px ----+   Row 2
```

Visuals mogen elkaar niet overlappen. Z-volgorde in de bron: basisvisuals 0-999, overlays/highlights 1000-1999, tooltips/popups 2000+.

**Controle van een layout** (voorbeeld 1280x720, marge 24, gat 16, uit de bron):

```
Title bottom:  16+56  = 72.   Gap to KPIs:   88-72   = 16  [ok]
KPI bottom:    88+160 = 248.  Gap to charts:  264-248 = 16  [ok]
Chart bottom:  264+220= 484.  Gap to table:   500-484 = 16  [ok]
Table bottom:  500+196= 696.  Bottom margin:  720-696 = 24  [ok]
Left margin:   24.  Right edge: 24+1232=1256.  Right margin: 1280-1256 = 24  [ok]
```

(Let op: hier is de bovenmarge 16 en de rest 24; houd bij je eigen layout alle marges gelijk.)

## 4. Zones en standaardmaten

| Zone | Doel | Hoogte | Visualtypes |
|---|---|---|---|
| 1 | Samenvatting | 150-200px | Kaarten, KPI's, slicers |
| 2 | Analyse | 350-450px | Grafieken, kaarten (maps) |
| 3 | Detail | 350-450px | Tabellen, matrix, lijsten |

| Element | Maat |
|---|---|
| Kaart/KPI | B 200-300, H 100-150 (kaart met waarde + label: min. 130-150) |
| Grafiek | Klein 400x300, middel 600x400, groot 900x500, vol 1872x500 (op 1920 breed) |
| Tabel | Beschikbare breedte, H 300-500 (min. 180-200 voor 5-8 rijen) |
| Slicer | Horizontaal 200-400 x 60-80; verticaal 150-200 x 200-400 |
| Paginatitel | x 24, y 24, B 400-600, H 48-64, 24pt vet |
| Subtitel | x 24, y 72, B 400-600, H 32-48, 14pt regular |

Veelgebruikte compositie voor 1280x720 (executive dashboard):

```
+--------------------------------------------------+
|  Title                            [Slicer]       |
+--------+--------+--------+--------+--------------+
|  KPI   |  KPI   |  KPI   |  KPI   |              |
+--------+--------+--------+--------+              +
|     Line Chart          |     Bar Chart          |
+-------------------------+------------------------+
|                    Table                         |
+--------------------------------------------------+
```

Rij 1: 2-3 KPI's met doel en trendlijn. Rij 2: trend (lijn/vlak, ~60% breed) + uitsplitsing (staaf, ~40%). Rij 3: tabel of matrix over de volle breedte. Detailanalyse: slicerbalk boven, grote tabel/matrix als hoofdinhoud, enkele KPI's als context.

**Aantal visuals** is een benadering; de **querykosten per visual** zijn de echte drijfveer (12 goedkope kaarten zijn prima, 8 matrixen met totalen en measure-filters misschien niet). Tekstvakken, afbeeldingen, vormen en knoppen sturen geen query. Zie performance in [review-checklists.md](review-checklists.md).

## 5. Titels

**Elke pagina heeft een titel**: een tekstvak (`textbox`) of een titel in een achtergrondafbeelding. Op elke pagina dezelfde positie, maat en lettergrootte; linksboven binnen de marge, hoog genoeg om niet af te snijden.

Titelhiërarchie zonder herhaling:

| Niveau | Inhoud | Voorbeeld (warehouse) |
|---|---|---|
| Paginatitel | Onderwerp/metriek | "Orderregels" |
| Visualtitel | Wat deze visual onderscheidt | "per leverancier", "maandtrend", "leverbetrouwbaarheid" |
| Subtitel | Bijna altijd overbodig | Standaard verbergen |

Fout: pagina "Orderregels per klant" + visual "Orderregels per klant" + subtitel "Orderregels per klantnaam". Een tabel met dezelfde titel als de pagina is ook herhaling. Asstitels weg als het label voor zich spreekt (maandnamen hebben geen "Maand" nodig).

**Toegankelijke titels.** Een schermlezer leest titel en visualtype vóór de alt-tekst.

- Schrijf het onderwerp uit ("Omzet dit jaar vs. vorig jaar", niet "CY Sales vs PY"); afkortingen alleen in aslabels.
- Zet het grafiektype niet in de titel; dat wordt al voorgelezen.
- Een dynamische titel wordt bij elke filterwijziging voorgelezen: houd het een gewone zin zonder symbolen.
- Verborgen titel (`title.show=false`) → de lezer valt terug op "chart 4"; geef dan alt-tekst in `general.altText`.
- Decoratieve tekstvakken (sectiekoppen) uit de tabvolgorde (`tabOrder` -1). Uitwerking: `pbip-accessibility`.

**Dynamische titels** (via een measure):

```dax
Title Text =
"Sales by Region - " &
SELECTEDVALUE('Date'[Year], "All Years")
```

- `SELECTEDVALUE(..., "<fallback>")` is verplicht; zonder fallback verdwijnt de titel bij meervoudige selectie.
- Houd tekst-measure en kleur-measure gescheiden (één geeft de tekst, één een themakleur als `"good"`/`"bad"`).
- Een measure-titel en een letterlijke titel kunnen niet naast elkaar bestaan; wis eerst de letterlijke.
- Test bij geen, één en meerdere selecties.

Thema voor titeltekstvakken: `title`, `background`, `border`, `dropShadow` op `show: false` onder `visualStyles.textbox["*"]`.

## 6. KPI's en kaarten

Een kaal getal zegt niets. Elke KPI beantwoordt zonder nadenken:

1. **"Goed of slecht?"** → doel en verschil
2. **"Beter of slechter?"** → trend

**Aantal:** het werkgeheugen houdt 3-4 brokken vast; **5 is een praktisch plafond** per pagina. Elke KPI dient de centrale vraag van de pagina.

**Actiegericht, geen ijdelheid:** "Als dit getal 20% verandert, moet iemand dan iets anders doen?" Zo niet, dan verdient het geen plek. Vergelijkende metrieken (vs. vorig jaar) werken beter dan absolute.

**Doel kiezen:**

| Bron | Wanneer | DAX |
|---|---|---|
| Vorig jaar (1YP) | Standaard als er geen budget is | `CALCULATE([Measure], DATEADD('Date'[Date], -1, YEAR))` |
| Vorige maand/periode | Operationele kortetermijnmetrieken | `CALCULATE([Measure], DATEADD('Date'[Date], -1, MONTH))` |
| Budget/forecast | Als budget in het model zit | Directe measure-verwijzing |
| Rollend gemiddelde | Volatiele metrieken afvlakken | `CALCULATE([Measure], DATESINPERIOD('Date'[Date], MAX('Date'[Date]), -3, MONTH))` |

Doelen bij voorkeur in het **model** (herbruikbaar); een rapportmeasure alleen als het doel echt rapportspecifiek is. Geen duidelijk doel? Vraag het; laat de KPI niet kaal.

**Drie elementen:** werkelijke waarde (518M), doel met label (bijv. `goals.goalText` "1YP", "Budget", "3M Avg"), en verschil **absoluut én in %** (+35.4M (+7.3%)).

```dax
// Variance measure
Revenue vs Target =
VAR _actual = [Actuals MTD]
VAR _target = [Sales Target MTD]
VAR _gap = _actual - _target
RETURN FORMAT(_gap, "+#,##0;-#,##0") & " (" & FORMAT(DIVIDE(_gap, _target), "+0.0%;-0.0%") & ")"

// Conditional formatting measure for the gap color
Revenue vs Target Color = IF([Actuals MTD] >= [Sales Target MTD], "good", "bad")
```

**Trend toevoegen:** `kpi`-visual (rol `TrendLine`), een SVG-sparkline-measure (`pbi-custom-visuals-paginated`) of een kleine lijngrafiek ernaast.

**Opmaak:**

- Groottehiërarchie: hoofdgetal (grootst, vetst) > oordeel/verschil (middel, gekleurd) > doel/trend (klein, gedempt).
- Voorwaardelijke kleur op het **verschil**, niet op de hoofdwaarde; combineer met pijl/icoon. Blauw/oranje is toegankelijker dan groen/rood.
- Rond af: "518M", niet "517,893,412". Zelfde eenheden en decimalen op alle kaarten van een pagina.
- **Weergave-eenheid "Auto" werkt niet betrouwbaar** bij measures met een eigen formaatstring (bijv. `#,##0`): je ziet dan ruwe getallen. Vraag de waarde op met de actieve filters en kies de eenheid expliciet: de grootste eenheid waarbij het gehele deel ≥ 1 is. 1 cijfer (3.8M) → precisie 1; 2+ cijfers (35bn, 338K) → precisie 0. Percentages: eenheid None, precisie 1.

| `indicatorDisplayUnits` (`kpi`) | Label |
|---|---|
| 0 | Auto (onbetrouwbaar bij eigen formaatstring, vermijden) |
| 1 | None |
| 1000 | Thousands |
| 1000000 | Millions |
| 1000000000 | Billions |
| 1000000000000 | Trillions |

- **Titel óf categorielabel, niet beide.** Voorkeur: visualtitel verbergen, categorielabel onder het getal ("3.8M Order Lines"). Automatische subtitels verbergen.
- Kaart te laag (< 130px) → waarde of label wordt afgesneden; eerst hoger maken, niet het lettertype verkleinen.
- Iconen alleen als ze informatie toevoegen; in Power BI als SVG-measure (`ImageUrl`), zie `pbi-custom-visuals-paginated`.

| Scenario | Visualtype |
|---|---|
| Waarde + doel + trendlijn | `kpi` (voorkeur als er een doel is) |
| Eenvoudig kopgetal | `card` + measures voor verschil en kleur |
| Meerdere verwante metrieken | `multiRowCard` |
| Eigen layout met sparkline/iconen | `card` + SVG-measure |

**Checklist KPI-kaarten:** dient de paginavraag; max. 5; doel aanwezig; verschil absoluut en %; CF op verschil; kleur + tweede signaal; afgerond; subtitels weg; hiërarchie waarde > verschil > label > trend; eenheden consistent.

## 7. Tabellen en matrixen

Tabellen staan onderaan de detailgradiënt. "Makkelijk te maken" is niet "makkelijk te lezen". **Eerst beslissen, dan opmaken:**

1. Welke vraag beantwoordt de tabel? (voorbeeld: "Welke leveranciers lopen achter op leverbetrouwbaarheid?")
2. Wie leest hem en welke actie volgt?
3. Welke kolommen zijn nodig? De rest eruit (geen ID's, sleutels, afgeleide kolommen).
4. Wat moet de lezer eerst zien? → sortering en nadruk.

| Situatie | Type |
|---|---|
| Platte lijst records, geen groepering | `tableEx` |
| Hiërarchie (Regio > Land > Stad), kruistabel, of 2+ categoriekolommen die ouder-kind zijn | `matrix` (`pivotTable`) |

Een platte tabel met herhaalde ouderwaarden is een van de meest voorkomende anti-patronen; gebruik dan een matrix (standaard ingeklapt; subtotalen per niveau, bij 4+ niveaus tussentotalen eventueel weg).

**Kolomvolgorde:** rijlabels/hiërarchie → primaire measure → secundaire measures → afwijkingskolommen. **Sortering:** op de belangrijkste measure of afwijking aflopend, niet alfabetisch; tijdtabellen oplopend op datum.

**Weglaten, niet toevoegen:**

| Eigenschap | Aanbevolen |
|---|---|
| Gridlijnen | Alleen horizontaal of geen |
| Banding | Uit of heel subtiel (2-3%) |
| Rij-padding | 6-10px; witruimte scheidt rijen |
| Kopfont | Segoe UI Semibold, 10-12pt |
| Waardefont | Segoe UI, 10-12pt |
| Kolombreedte | Auto of proportioneel; geen afkapping |
| Randen | Minimaal of geen |

- Opmaak zoveel mogelijk uit het thema (`tableEx` en `pivotTable` in `visualStyles`, zie [theme-json.md](theme-json.md)).
- **Volledige precisie** in tabellen: formaatstring van het model, geen weergave-eenheden. Getallen rechts, tekst links.

**Voorwaardelijke opmaak per kolomtype:**

| Kolom | Opmaak |
|---|---|
| Primaire measure | Databalken |
| Afwijking/verschil | Kleurschaal of tekstkleur (rood/warm = onder, blauw/koel = boven; liever geen groen) |
| Status (OTD %, kwaliteit) | Kleur bij drempel, alleen als de drempel ertoe doet |
| Dimensiekolommen | Geen |
| Secundaire measures | Geen; alles opmaken is niets opmaken |

Sparklines geven tijdcontext ("verbetert of verslechtert?"). Rijkere inline graphics (dumbbell, bullet, voortgangsbalk) via SVG-measures, alleen als de meerwaarde het onderhoud rechtvaardigt.

**Auto-size width uitzetten** (`columnHeaders.autoSizeColumnWidth = false`) als de tabel een rij deelt met een andere visual; anders ontstaat een horizontale schuifbalk die kolommen verstopt. Over de volle breedte is auto-size meestal prima.

| Anti-patroon | Oplossing |
|---|---|
| Geen vraag gedefinieerd | Vraag, doelgroep en actie eerst |
| Te veel kolommen (>8) | Niet-essentiële kolommen weg |
| Zware gridlijnen + banding | Witruimte gebruiken |
| Weergave-eenheden in tabel | Volledige precisie |
| Werkelijk + doel + afwijking als alleen afwijking de vraag beantwoordt | Alleen afwijking tonen |
| Ongeformatteerde datadump | Volledige werkwijze hierboven toepassen |

## 8. Slicers en filterdeelvenster

**Slicers:** max. 3 per pagina, consistent boven of links, rest naar het filterdeelvenster; overweeg synchronisatie tussen pagina's. Type, sync en resetknop: [rapport-maken.md](rapport-maken.md).

**Filterkaart: vergrendelen of verbergen?** Ze zijn niet uitwisselbaar:

| Keuze | Gebruik | Voorbeeld (warehouse) |
|---|---|---|
| **Lock** (zichtbaar, alleen-lezen) | Scopegrens die de lezer moet kennen | "Magazijn = Hoofdmagazijn", "Status = Actief" |
| **Hide** (weg) | Opschoonfilter waar de lezer niets mee hoeft | Lege artikelnummers, testartikelen uitsluiten |

Regel: **lock om te informeren, hide om op te schonen.** Verberg nooit een bedrijfsfilter die de lezer verwacht; dan snapt niemand waarom de cijfers gefilterd zijn.

- **Hernoem filterkaarten** naar leesbare labels (`D_SHOP[Reporting Row Name]` → "Rapportregel"); het modelveld verandert niet. Een slicer op hetzelfde veld hernoemt niet mee: pas ook de slicerkop aan.
- **Volgorde:** het deelvenster groepeert altijd rapport → pagina → visual; eigen volgorde alleen binnen een niveau. Moet een paginafilter als eerste gepakt worden, maak er een slicer op het canvas van.
- **Applied vs. Available** visueel verschillend maken via `filterCard` met `$id` in het thema (zie [theme-json.md](theme-json.md)).
- **Rapportinstellingen:** zoeken in het deelvenster aan bij veel kaarten, uit bij 2-3; "Allow users to change filter types" uit als een kaart bewust Top-N of relatieve datum is; **Apply-knop** aan bij trage DirectQuery of grote Import-modellen, uit bij snelle Import-modellen.
- Publish-to-web toont het filterdeelvenster niet; essentiële filters dan als slicer op het canvas.

## 9. Tooltips en annotaties

**Tooltippagina** = een ontworpen mini-canvas, geen grotere hoverlijst. Drie legitieme doelen: ander perspectief (hover op een maandstaaf → jaartrend), extra detail op hetzelfde niveau, of hulp (statische uitleg via het headericoon).

- Niet bouwen voor één of twee extra getallen (gebruik het Tooltip-veld) of voor iets waarmee de gebruiker moet interacteren (drillthrough).
- Klein en `ActualSize` (320x240 standaard; 240x180 voor één grafiek); ontwerp op de echte pixels. Titels uit, achtergronden uit, één focusvisual plus hooguit een kaart of twee. Hergebruik één tooltippagina voor meerdere bronvisuals.
- Tooltippagina's tellen mee in het pagina-/visualbudget, ook al zijn ze verborgen. Een tooltip die alleen het zichtbare datapunt herhaalt kost een query per hover voor niets: weg ermee.
- Nooit een paginafilter op een tooltippagina; de hover is het filter.

**Annotaties** dragen het analytische verhaal:

| Bouwsteen | Hoe |
|---|---|
| Doel/drempel | Referentielijn op een getal of model-measure, met `dataLabel` aan ("Plan: 11.0M") |
| Highlight-and-grey | Hoofdserie in themakleur, rest grijs; liefst via een CF-measure (robuuster dan selectors per serie) |
| Callout | Tekstvak zonder chrome + dunne vorm als verbindingslijn; als losse visuals |
| Stapsgewijs onthullen | Paginareeks + paginanavigator in plaats van bladwijzers (bladwijzers zijn kwetsbaar) |
| Leesvolgorde | `tabOrder`: kop → hoofdvisual → callouts → detail |

Zwak verhaal herkennen: koptekst is een grafieklabel ("Bar Chart: Revenue") in plaats van een bevinding; alle series volle verzadiging zonder grijze context; referentielijn zonder label; `tabOrder` volgt het verhaal niet; verhaal hangt volledig aan een Copilot-narrative zonder vaste terugval. Een muur van callouts schaadt toegankelijkheid.

## 10. Mobiele layout

Power BI herschikt een desktoppagina niet voor een telefoon. De staande weergave is een **handmatig gekozen deelverzameling**: een visual verschijnt alleen als er een `mobile.json` naast zijn `visual.json` staat. Zonder enige `mobile.json` valt de pagina terug op gedraaide liggende weergave, meestal onleesbaar.

- Kies de paar visuals die de hoofdvraag voor de mobiele lezer beantwoorden: KPI-kaarten, de ene hoofdgrafiek, de belangrijkste slicer. Brede tabellen, spreidingsdiagrammen en dichte matrixen overleven het smalle grid zelden.
- Rangschik, plaats de top 4-8 in één kolom met het antwoord bovenaan; slicers en navigatieknoppen horizontaal in één korte band. Noteer wat je bewust weglaat. Alles plaatsen ("te getrouwe miniatuur") scrolt eindeloos.
- `mobile.json` vereist `$schema` en `position` (`x, y, z, height, width, tabOrder, angle`), in een eigen coördinatenstelsel los van desktop.
- Bouw de telefoonlayout mee met de desktoppagina, niet achteraf.
- Mobiel geoptimaliseerde weergave rendert alleen in de iOS/Android-apps; een browser toont altijd liggend. Controleer dus op een telefoon.
- Geen `mobile.json` is niet automatisch een fout: koppel ernst aan het doel (KPI-pagina voor onderweg zonder mobiele layout = hoog; detailpagina voor de backoffice = meestal prima).
