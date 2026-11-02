# Een nieuw rapport maken

Het proces van vage vraag tot opgeleverd rapport: verscherpen, ontwerpbrief, akkoord, bouwen, interacties, ontwerppoort. De ontwerpregels zelf staan in [ontwerp-principes.md](ontwerp-principes.md) en [layout-en-visuals.md](layout-en-visuals.md); het schrijven van PBIR-bestanden (`visual.json`, `page.json`, filters, bladwijzers, publiceren) in `fabric-powerbi-report`.

## Inhoud

1. Vage of onvolledige vragen
2. Stappenplan
3. Ontwerpbrief (sjabloon)
4. Standaardlayout en tijdsgranulariteit
5. Interacties en query-reductie
6. Slicers: type, synchronisatie, reset
7. Veldparameters
8. Ontwerppoort (vóór oplevering)
9. Beperkingen van een agent

---

## 1. Vage of onvolledige vragen

Gebruik dit als de vraag **twee of meer** van deze mist: concrete measures/KPI's, doelgroep of beslissingscontext ("voor de weekstart van de warehouse-leads"), structuurvoorkeur (aantal pagina's, visualtypes), opmaakrichting (kleuren, huisstijl). "Maak een mooi dashboard" valt eronder.

1. **Erkennen en herformuleren.** Niet weigeren of preken; zeg kort dat een paar details het resultaat veel beter maken.
2. **Hooguit drie vragen:**
   1. Welke beslissingen ondersteunt dit rapport? (Dat onthult doelgroep, KPI's en detailniveau: een wekelijks operationeel overleg vraagt trends en afwijkingen; een directiepresentatie samenvattende KPI's en weinig detail.)
   2. Welke 2-3 cijfers zijn het belangrijkst? Weet je het niet, verken dan samen het model en stel kandidaten voor.
   3. Huisstijl- of stijlwensen? Kleuren, lettertypen, bestaande rapporten om op aan te sluiten. Zo niet: een professioneel standaardthema (bron: sqlbi).
3. **Verstandige standaarden** voor wat ontbreekt (en zeg erbij dat het een startpunt is):

| Onderwerp | Standaard | Reden |
|---|---|---|
| Thema | sqlbi (in `pbir` standaard bij nieuwe rapporten) | Professionele kleuren en typografie |
| Layout | Executive dashboard: KPI-rij, trend, uitsplitsing, detailtabel | Breed bruikbaar, volgt 3-30-300 |
| Paginaformaat | 1280x720 | Standaard 16:9 |
| KPI-keuze | Belangrijkste measures uit het model | Voorstellen vóór bouwen |
| Tijdsgranulariteit | Maand bij jaarfilter; week/dag bij maandfilter | Korrel past bij beslissingscadans |
| Voorwaardelijke opmaak | Alleen afwijkingskolommen; themakleuren `good`/`bad` | Alles opmaken = niets opmaken |

4. **Voorstellen vóór bouwen**, concreet genoeg voor "ja" of "verander X": welke KPI's en measures, welke grafieken en dimensies, welke tabelkolommen, hoe filters de data afbakenen, thema en kleuraanpak. Een plan herzien is goedkoop; visuals opnieuw bouwen niet.

**Niet doen:** weigeren omdat de vraag vaag is; een interview van tien vragen; een generiek rapport bouwen en het "klaar" noemen; aarzeling opvatten als desinteresse.

## 2. Stappenplan

1. **Business proces begrijpen.** Verken het model: tabellen, kolommen, measures, hiërarchieën. Welk domein (orders, voorraad, leveringen, SQDC)? Welke KPI's tellen? Welke dimensies om te slicen? Welke tijdsgranulariteit (dag, week, maand, kwartaal)?
2. **Voorstel** aan de gebruiker: KPI-kaarten en measures, trendgrafiek(en) en granulariteit, nuttigste uitsplitsingen, detailtabel/matrix met hiërarchieën, filterscope. Itereer op het ontwerp vóór je bouwt.
3. **Ontwerpbrief** opstellen en laten goedkeuren (§3).
4. **Ontbrekende modelobjecten** voorstellen, niet alleen wat gevraagd is: doelen (vorig jaar), baselines (gemiddelde over de periode), trendaggregaties (rollend 14 dagen). Liefst in het model (→ `fabric-semantic-model`, `pbi-model-power-query-dax`), anders als rapportmeasure.
5. **Locatie en verbinding:** de bron werkt met een **gepubliceerd** semantisch model (thin report). Wil je vanuit Power BI Desktop of brondata een rapport, dan moet er eerst een gepubliceerd model in Fabric/Power BI zijn.
6. **Rapport aanmaken** in een eigen projectmap (PBIP), pagina's met elk één doel. Controleer de paginagrootte vóór het plaatsen.
7. **Visuals plaatsen** volgens de layout (§4), binden, sorteren (grafieken aflopend op de eerste measure, tenzij tijd). Paginatitel = onderwerp, visualtitels = onderscheid, subtitels verbergen.
8. **Query-reductie** direct bij het maken instellen, niet achteraf (§5).
9. **Interacties en navigatie** (§5), **filters en slicers** (§6).
10. **Opmaak:** vooral uit het thema ([theme-json.md](theme-json.md)); alleen echte uitzonderingen op de visual. Voorwaardelijke opmaak via measures die themakleuren (`"bad"`) teruggeven.
11. **Valideren**, openen in Desktop, alle pagina's bekijken, **ontwerppoort** (§8).
12. **Publiceren** (→ `fabric-powerbi-report`).

Met `pbir` (optioneel, door jou te draaien; installeren met `uv tool install pbir-cli` of `pip install pbir-cli`) ziet dat er zo uit:

```bash
mkdir -p sales-dashboard && cd sales-dashboard
pbir new report "Sales.Report" -c "MyWorkspace/Sales.SemanticModel"
pbir pages rename "Sales.Report/Page 1.Page" --to "Overview" -f
pbir model "Sales.Report" -d
pbir model "Sales.Report" -q "EVALUATE VALUES('Table'[Column])"
pbir add visual kpi "Sales.Report/Overview.Page" --title "Revenue"
pbir validate "Sales.Report"
pbir publish "Sales.Report" "MyWorkspace.Workspace/Sales.Report"
pbir open "Sales.Report"
```

Bij `pbir new report` krijg je al het sqlbi-thema en een "Page 1" met een titeltekstvak op (20,20) met hoogte 90: hernoem die pagina in plaats van een nieuwe toe te voegen en plaats visuals op y ≥ 120. Draai `pbir validate` na elke wijziging.

## 3. Ontwerpbrief (sjabloon)

De brief bundelt wat je al weet in één goed te keuren specificatie **vóór** er iets gebouwd wordt. Het is geen tweede interview; het legt vast. Een brief herzien is goedkoop, gebonden visuals opnieuw bouwen niet.

Sjabloon uit de bron (sleutels ongewijzigd; waarden als voorbeeld warehouse):

```yaml
audience: warehouse-leads en logistiek manager; kennen de processen, niet het model
purpose: wekelijks bijsturen op leverbetrouwbaarheid en achterstand

decision_questions:        # 2 to 5; the questions a viewer answers at a glance
  - halen we deze week ons OTD-doel en waar niet
  - welke leveranciers veroorzaken de meeste late orderregels
  - wat is er veranderd sinds vorige week

pages:                     # one job per page
  - name: Overzicht
    intent: laten zien of we op koers liggen deze week en markeren wat afwijkt
    serves: [halen we deze week ons OTD-doel en waar niet, wat is er veranderd sinds vorige week]
  - name: Leveranciers
    intent: vinden waar late orderregels vandaan komen per leverancier en artikel
    serves: [welke leveranciers veroorzaken de meeste late orderregels]

design_identity:           # committed once here; propagates to every visual
  tone: restrained
  signature:
    accent: één accentkleur, alleen voor de focus-measure
    kpi: waarde boven doel, afwijking als klein inline getal
    titles: onderwerp op de pagina, onderscheid op de visual
    spacing: gelijke gaten en marges, rekenkundig bepaald

delivery_target:           # where and how it is consumed
  surface: Power BI-app in de werkruimte
  page_size: 1280x720
  mobile: not required
```

Zo vul je de velden:

| Veld | Inhoud |
|---|---|
| `audience`, `purpose` | Uit de verkenning en de antwoorden. Doelgroep bepaalt detailniveau; doel is één uitkomst in één regel. |
| `decision_questions` | 2-5 concrete vragen die een kijker in één oogopslag beantwoordt. Elke pagina en visual herleidt naar minstens één; een visual die geen vraag dient is decoratie en gaat eruit. |
| `pages` | Per pagina één zin met het ene doel en welke vragen ze dient. Layout hier nog niet uitwerken. Paginavorm: [ontwerp-principes.md](ontwerp-principes.md). |
| `design_identity` | Toon en signatuur één keer vastleggen, zodat ze naar elke visual doorwerken (zie [ontwerp-principes.md](ontwerp-principes.md)). |
| `delivery_target` | App, embedded, desktopreview of mobiel. Bepaalt paginaformaat, slicer vs. filterdeelvenster en of een mobiele layout nodig is. |

Is een veld nog een gok, markeer dat en meld het.

**Akkoord = bevroren.** Presenteer de brief als tekst en vraag alleen: goedkeuren of welk veld veranderen. Na akkoord bouw je zonder de scope opnieuw te bespreken. Verandert de scope later, heropen dan de brief, pas aan en laat de gewijzigde velden opnieuw bevestigen; laat visuals niet stilletjes afdrijven.

Daarna: identiteit vastleggen en elk paginadoel naar een layout vertalen ([ontwerp-principes.md](ontwerp-principes.md), [layout-en-visuals.md](layout-en-visuals.md)), en dan bouwen: rapport → pagina's → visuals → binden → opmaken → valideren → publiceren.

## 4. Standaardlayout en tijdsgranulariteit

Executive dashboard op 1280x720 (marge 24, gat 16), uit de bron:

| Element | x | y | Breedte | Hoogte |
|---|---|---|---|---|
| Paginatitel (tekstvak) | 24 | 16 | 1232 | 56 |
| KPI 1 / 2 / 3 | 24 / 440 / 856 | 88 | 400 | 160 |
| Trendgrafiek (lijn) | 24 | 264 | 608 | 220 |
| Uitsplitsing (staaf) | 648 | 264 | 608 | 220 |
| Detailtabel | 24 | 500 | 1232 | 196 |

Rekencontrole en uitlijningsregels: [layout-en-visuals.md](layout-en-visuals.md). KPI's met `Indicator` (measure), `Goal` (bijv. measure 1YP) en `TrendLine` (datumveld).

Ontbreekt een doel, voeg dan een vorig-jaar-measure toe aan het model, bijvoorbeeld in TMDL:

```
# In the relevant table's .tmdl file, add:
measure 'Measure 1YP' = CALCULATE([Measure], DATEADD('Date'[Date], -1, YEAR))
```

Tijdas afleiden uit de filtercontext:

```yaml
Year (e.g. 2021):   Monthly    # Date.Calendar Month (ie Jan) or Date.Calendar Month Year (ie Jan 21)
Quarter:            Monthly or Weekly  # Date.Calendar Month or Date.Calendar Week EU (ie WK25)
Month:              Daily or Weekly    # Date.Date or Date.Calendar Week EU (ie WK25)
No date filter:     Monthly or Quarterly  # Date.Calendar Month Year or Date.Calendar Quarter Year
```

Twijfel je, kies maand. Tooltippagina's: klein (320x240), 2-3 gerichte visuals.

## 5. Interacties en query-reductie

**Query-reductie bij het maken** (achteraf blijven verouderde interactieparen achter). Drie onderdelen:

1. `NoFilter`-paren in `visualInteractions` van elke slicer naar zware visuals (matrixen, kaarten, tabellen met hoge kardinaliteit). Er is geen rapportbrede uit-schakelaar; je schrijft overrides per paar.
2. **Apply-knop** in het filterdeelvenster.
3. **Apply-knop per slicer.** De objectmodellen van `slicer` en `advancedSlicerVisual` verschillen; controleer de eigenschap eerst.

Volgens Microsofts optimalisatierichtlijn verminderen deze drie het aantal visualqueries per pagina sterk. Bij Import-rapporten met goedkope queries: afwegen of je cross-highlight wilt opgeven (een staaf aanklikken dimt de rest dan niet meer).

**Interacties bedraden:**

1. Bepaal per pagina de cross-filtergraaf. Standaard filtert alles alles; schrijf alleen uitzonderingen: KPI-kaarten die stabiel blijven bij een klik in een detailgrafiek, grafieken die een slicer niet terug moeten filteren.
2. Overrides op de visual-`name`, niet op de titel. `Highlight`/`Filter` alleen om een standaard te overschrijven (grafieken standaard Highlight; lijn/spreiding/kaart Filter).
3. Meerdere pagina's: één `pageNavigator`-visual in plaats van losse knoppen (synchroniseert automatisch met de paginalijst).
4. Valideren, herladen en controleren dat een slicerklik de bedoelde visuals filtert en de kaarten met rust laat.

```bash
pbir pages interactions "Sales.Report/Overview.Page" \
  --source "Bar Chart.Visual" --target "Revenue KPI.Visual" --type NoFilter
pbir add visual pageNavigator "Sales.Report/Overview.Page" \
  --x 24 --y 680 --width 400 --height 32
```

Valkuilen: paren zijn richtingsgebonden (`source` filtert `target`); paren naar een hernoemde of opnieuw gegenereerde visual-`name` doen stil niets en geven geen validatiefout; een hardgecodeerd `Highlight`-paar overleeft de preset; onderdruk interactiviteit niet te veel.

## 6. Slicers: type, synchronisatie, reset

**Type kiezen:**

```
low cardinality, single pick   -> slicer (data.mode=Dropdown) or advancedSlicerVisual with singleSelect
measure beside each option     -> listSlicer (Values: Column/Hierarchy; Tooltips: Measure)
date window                    -> slicer (data.mode=Between) or relative-date mode
```

Dwing enkelvoudige selectie af waar de analyse één waarde veronderstelt (`selection.singleSelect`, `selection.strictSingleSelect`). Standaard `strictSingleSelect` voor metriek-kiezers (veldparameters) en slicers op één entiteit; meervoudige selectie daarop is de meest voorkomende stille fout.

**Synchronisatie** is geen slicereigenschap maar een sync-groep op naam in `report.json`. Twee aparte schakelaars: filterstatus synchroniseren (selectie volgt de lezer) en zichtbaarheid (op welke pagina's de slicer getekend wordt). Gebruikelijk: status overal, zichtbaar op één pagina. Eén veld per slicer; een slicer met twee velden doet niet mee. Groepsnamen moeten exact gelijk zijn; een spatie aan het eind ontkoppelt stil.

**Resetknop** (Power BI heeft er geen):

1. Zet alle slicers/filters in de gewenste beginstand.
2. Maak een bladwijzer met **Data**-scope (niet Display).
3. Koppel een knop aan die bladwijzer (actie Bookmark).

Gebruik dezelfde bladwijzer als startbladwijzer, zodat het rapport altijd in de basisstand opent. Een Display-bladwijzer verplaatst/verbergt visuals onverwacht. De knop herstelt alleen wat de bladwijzer vastlegde: opnieuw vastleggen als slicers veranderen.

De rapportinstelling "Don't allow end users to save filters" zet persistentie per lezer uit: kies dat voor gedeelde/kioskrapporten die schoon moeten openen; laat persistentie aan voor persoonlijke analyserapporten. Persistentie aan + startbladwijzer botsen; kies één model per rapport.

## 7. Veldparameters

Een veldparameter is een berekende tabel in het model waarvan elke rij een kolom of measure (`NAMEOF`) plus sorteervolgorde noemt. Bind de waardekolom aan een visual en aan een single-select slicer: de lezer kiest welke measure of dimensie getoond wordt. N bijna-identieke visuals worden er één. De tabel zelf is modelwerk (precies drie kolommen per rij, alle waarden uniek).

Valkuilen aan de rapportkant:

- **Lege selectie = ALLES**, niet niets: strict single-select plus een standaardselectie.
- **Top N** rangschikt op weergavenaam, niet op waarde. Oplossing: hulpmeasure die de actieve rij leest (`SELECTEDVALUE` over de verborgen kolom + `SWITCH`) en Top N daarop.
- **Voorwaardelijke opmaak volgt de wissel niet**: stuur CF met dezelfde `SELECTEDVALUE` + `SWITCH`-hulpmeasure.
- Er moet eerst een expliciete measure bestaan; geen impliciete aggregatie.
- Niet bruikbaar als drillthrough- of tooltip-koppelveld; koppel de onderliggende dimensies.
- Vereist een lokaal model; een pure live-verbinding kan er geen hosten.
- Zet de rapportinstelling voor de matrix "Persist hierarchy level" uit, anders klapt het niveau in bij elke wissel.
- Kolom- vs. measure-type dat niet klopt, valideert als JSON maar faalt bij de query; valideer veldbindingen (met `pbir`: `pbir validate "Sales.Report" --fields`).

## 8. Ontwerppoort (vóór oplevering)

Geen planningschecklist maar de slotcontrole op het afgemaakte rapport: gaat het de deur uit? Een agent ziet het canvas niet; een poort die alleen op JSON is gehaald, is voorlopig tot de gerenderde pagina's het bevestigen.

| # | Controle | Wat |
|---|---|---|
| 1 | Identiteit doorgevoerd | Signatuur op elke pagina op dezelfde plek; één accentkleur; kleuren uit het thema (hex dat een token had moeten zijn = bevinding); toon niet per pagina feller of drukker |
| 2 | Eén doel per pagina | Elke pagina beantwoordt een benoembare vraag; geen pagina met twee vormen (samenvattingsband vastgeniet aan een verkenpagina = splitsen) |
| 3 | Ruimte en marges gelijk | Alle gaten gelijk, alle marges gelijk, op het grid, kolomgrenzen doorlopend |
| 4 | Callouts onderbouwd | Elk genoemd getal, elke ranking of trend gecontroleerd tegen de data (query op het model); een gemarkeerd "hoogste/laagste" punt is echt het uiterste |
| 5 | Toegankelijkheid | Contrast (tekst 4.5:1, groot 3:1); kleur nooit enige signaal; fonts leesbaar op de werkelijke paginagrootte; alt-tekst op datavisuals (→ `pbip-accessibility`) |

Rapporteer per bevinding:

```yaml
issue:    <what is wrong>
location: <page / visual>
severity: critical | warning | suggestion
fix:      <command or pattern>
```

**Critical blokkeert "klaar"**: identiteit niet doorgevoerd, pagina met twee doelen, callout die de data tegenspreekt, contrastfout. Warnings en suggesties mogen mee met akkoord van de gebruiker.

## 9. Beperkingen van een agent

Meld deze aan de gebruiker:

- De bron werkt met rapportmetadata, niet met een verbinding met Power BI Desktop.
- Het oude formaat (`report.json`/layout-JSON) wordt niet ondersteund: open het rapport en sla het op in het PBIR-formaat (PBIP aanbevolen, niet verplicht).
- AppSource-visuals toevoegen lukt niet zonder hun ID; alternatief: Deneb, SVG, Python of R (→ `pbi-custom-visuals-paginated`).
- Zeer gedetailleerde, maatwerkvisualisaties met de standaardvisuals.
- Of een pagina er goed uitziet, kan een agent niet zien: bevestig het altijd in het gerenderde rapport.
