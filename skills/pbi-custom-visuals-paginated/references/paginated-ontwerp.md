# Gepagineerde rapporten ontwerpen, renderen en publiceren

Een gepagineerd rapport is geen interactief dashboard op papier. Het bestaat om een exact, printgetrouw document van meerdere pagina's te maken: factuur, overzicht, operationele lijst, pakbon. Ontwerpkeuzes volgen uit "dit wordt geprint of geëxporteerd naar PDF/Excel op een vaste breedte, mogelijk over duizenden pagina's", niet uit "dit vult een 16:9-canvas". Algemene visuele ontwerpprincipes vallen onder `fabric-powerbi-report`; hier staat wat specifiek is voor RDL en paginering.

De XML zelf (structuur, tablix, parameters, databronnen) staat in [paginated-rdl.md](paginated-rdl.md).

## Inhoud

1. [Is gepagineerd het juiste middel?](#1-is-gepagineerd-het-juiste-middel)
2. [Intake: vragen vóór je bouwt](#2-intake-vragen-voor-je-bouwt)
3. [Paginaframe](#3-paginaframe)
4. [Structuur, data region en parameters](#4-structuur-data-region-en-parameters)
5. [Paginering](#5-paginering)
6. [Renderers (uitvoerformaten)](#6-renderers-uitvoerformaten)
7. [Uitvoeromgevingen, performance en expressiescope](#7-uitvoeromgevingen-performance-en-expressiescope)
8. [Ontwikkellus en publiceren](#8-ontwikkellus-en-publiceren)
9. [Verschillen met SSRS](#9-verschillen-met-ssrs)
10. [Voorbeeldrapporten](#10-voorbeeldrapporten)

## 1. Is gepagineerd het juiste middel?

Kies **gepagineerd (RDL)** als het eindproduct een van deze dingen nodig heeft:

- pixelperfecte print-/PDF-uitvoer;
- élke detailregel geprint (niet gesampled of geaggregeerd voor het scherm);
- een vast paginaformaat (briefpapier, vaste marges);
- per-ontvanger-distributie (bursting) of abonnementen;
- export naar Excel/Word/CSV als volwaardige uitvoer;
- rijaantallen waar een interactieve visual op vastloopt.

Kies een **interactief Power BI-rapport (PBIR)** als het verkennend, schermgericht en cross-gefilterd moet zijn. Vraagt iemand om "een dashboard", dan bedoelt hij vrijwel zeker PBIR (zie `fabric-powerbi-report`).

Voorbeeld (warehouse): picklijst per order, pakbon, verzendoverzicht per dag, voorraadtelling-lijst per locatie → gepagineerd. OTIF-trend of SQDC-scorebord → interactief rapport.

## 2. Intake: vragen voor je bouwt

Databron, parameters en afleverformaat zijn duur om later te veranderen. Voer daarom eerst een kort gesprek; geen formulier, maar een tweerichtingsgesprek.

**Zo pak je het aan:**

1. Stel een kleine, gerichte set vragen tegelijk en laat de antwoorden de volgende vragen sturen.
2. Zoek zelf uit wat je kunt: bekijk de tabellen/kolommen/measures van het model, probeer een kandidaat-DAX-query, lees een vergelijkbaar voorbeeld-`.rdl`. Kom terug met concrete voorstellen ("het model heeft deze measures en een datumtabel; welke horen op het rapport?").
3. **Stel voor in plaats van alleen te vragen:** maak vroeg een Enter Data-concept en vraag "is dit de juiste vorm en het juiste detailniveau?".
4. Vat een korte brief samen (doel, publiek, bron, kerninhoud, parameters, uitvoer, doel-workspace) en laat die bevestigen. Wijzigingen daarna = brief heropenen, geen stille drift.
5. Zodra de essentie vastligt (waarvoor, welke data, waar gepubliceerd en gedraaid), begin je. Leg aannames vast en ga door.

**Wat je wilt weten** (alleen zo diep als het voor dit rapport ertoe doet):

| Onderwerp | Voorbeeldvragen |
|---|---|
| Doel en succes | Welke taak of beslissing ondersteunt het? Wanneer is het mislukt? |
| Publiek en gebruik | Wie leest het, hoeveel mensen, intern of extern? Bekijken in de Service, PDF per mail, Excel-export, printen? Eén rapport of één document per ontvanger? |
| Data | Welke bron (semantisch model, SQL, Analysis Services, Dataverse, Enter Data voor een mock-up)? Echte tabel-/kolom-/measurenamen, korrel, ruw volume. Model: workspace + model (+ GUID). SQL: server/database, authenticatie, on-premises? |
| Inhoud, lay-out, paginering | Detailtabel, matrix, lijst van blokken, grafiek, KPI's? Groepering, sortering, subtotalen? Formaat en oriëntatie? Wat in kop/voet? Is er een mock-up of bestaand rapport? |
| Parameters | Wat kiest de lezer, wat ligt vast? Enkel- of meervoudig, standaardwaarden, cascade? |
| Vormgeving | Huisstijl, kleuren, lettertypen, logo, toon (compact operationeel vs verzorgd voor management) |
| Uitvoer en distributie | Formaten (PDF, Excel, Word, print, toegankelijke PDF), kanaal (abonnement, app, embed, Power Automate, handmatige export), planning |
| Omgeving en beperkingen | Doel-workspace op Premium/Embedded/Fabric-capaciteit? Report Builder geïnstalleerd? Lokale PBIRS? Publicatierechten? RLS, gateway voor on-prem bronnen, deadlines, taal, toegankelijkheid, beheer achteraf |

**Redelijke standaard als de gebruiker het echt aan jou laat:** staand formaat met `0.5in`-marges (de bron noemt Letter; in Nederland ligt A4 voor de hand), één enkelvoudige, dataset-gestuurde parameter met keuzelijst, PDF bekeken vanuit de Service, rustige opmaak met één accentkleur in Segoe UI en de gekozen parameter in de kop, eerst Enter Data en daarna de echte bron. Benoem de aannames.

## 3. Paginaframe

Leg het fysieke frame vast vóór je iets plaatst; kolombreedtes en lettergroottes hangen ervan af.

| Keuze | Waarden |
|---|---|
| Staand Letter | `8.5in` x `11in` (documenten) |
| Liggend Letter | `11in` x `8.5in` (brede tabellen) |
| A4 | `21cm` x `29.7cm` (buiten Noord-Amerika) |
| Marges | Meestal `0.5in` tot `1in` rondom; ze verkleinen de bruikbare breedte bij harde renderers |
| Bruikbare breedte | `PageWidth` − `LeftMargin` − `RightMargin` |

**De PDF-breedteval:** body-`<Width>` + `LeftMargin` + `RightMargin` moet ≤ `PageWidth` zijn. Anders geven harde renderers (PDF, Image, PowerPoint) lege pagina's rechts van elke pagina. Liggend Letter met `0.5in`-marges geeft `10in` bruikbaar; A4 staand met `1cm`-marges geeft `19cm`.

De starters van de bron zijn op volle bruikbare breedte gemaakt (`7.5in` body in staand Letter met `0.5in`-marges). Voeg je een kolom toe of maak je er een breder, verbreed dan ook de pagina of verklein de marges.

## 4. Structuur, data region en parameters

### Vast skelet

```
Page header   logo, report title, run date (=Globals!ExecutionTime), parameter echo. Repeats every page.
Body          one or more data regions (tablix/chart) plus static labels.
Page footer   page number (=Globals!PageNumber & " of " & Globals!TotalPages), confidentiality, source.
```

- Alles wat op elke geprinte pagina moet staan (paginanummer, tijdstip, vertrouwelijkheid) hoort in kop of voet: alleen daar werken `Globals!PageNumber`/`TotalPages`.
- Titel en gekozen parameters in de kop, zodat een geprinte pagina op zichzelf te begrijpen is.
- Body = alleen de data regions en hun directe labels.

### Data region kiezen

| Region | Wanneer | Voorbeeld |
|---|---|---|
| Tabel (tablix, statische kolommen) | Vaste kolommen, één rij per record | Orderregels, transactielijst, picklijst |
| Matrix (tablix, kolomgroep) | Kolommen uit de data (maanden, categorieën) | Kruistabel, periodevergelijking |
| Lijst (tablix, één herhaalde cel) | Vrije, herhalende lay-out per groep | Brief per klant, blok per order, etiketvel |
| Grafiek | Ondersteunend, boven/naast een tabel, of sparkline per groep in een cel | – |

Alle vier zijn hetzelfde `<Tablix>`-element (grafiek: `<Chart>`); kies op datavorm.

### Parameters: het lastige deel

Drie stukken moeten kloppen: `<ReportParameter>`, `<QueryParameter>` en de `@x` in de query (details in [paginated-rdl.md](paginated-rdl.md#8-rapportparameters)). Ontwerpregels:

1. Geef elke parameter een zinnige `DefaultValue`, zodat het rapport opent zonder keuze. Een dataset-gestuurde standaard (bijv. laatste datum) blijft actueel.
2. Vul keuzelijsten uit een kleine eigen dataset (`ValidValues` → `DataSetReference`), niet uit een getypte lijst.
3. Houd cascades ondiep: elke laag is bij elke wijziging een aparte query en traag in de Service.
4. Toon de selectie in de kop (`=Parameters!Region.Value`), zodat een print vastlegt waarop gefilterd is.
5. Semantisch model: enkelvoudig via `TREATAS({ @x }, 'Table'[Col])` is robuust; meervoudig vraagt het fragiele `RSCustomDaxFilter`.
6. Orden het parametervenster met `<ReportParametersLayout>`; parameters die daar ontbreken, zijn verborgen.

### Werken vanaf een mock-up of screenshot

1. Leid het paginaframe af uit de verhoudingen.
2. Scheid het herhalende deel (tabel/matrix/lijst) van de vaste elementen (titel, logo, totalen).
3. Koppel elke gelabelde waarde aan een veld of expressie; bepaal wat uit de query komt en wat berekend wordt.
4. Start vanaf de dichtstbijzijnde template ([`examples/paginated/enter-data-starter.rdl`](../examples/paginated/enter-data-starter.rdl)) en itereer tegen Enter Data voordat je de live bron koppelt.

Kopieer liever een bekend-goed `.rdl` en pas bron, query, velden en lay-out aan dan de uitgebreide XML (grafieken vooral) zelf te typen.

## 5. Paginering

Paginering is het hele punt; laat het niet aan toeval over.

| Instelling | Waar | Effect |
|---|---|---|
| Paginabreuk `Between` of `End` op een groep | Groep van de natuurlijke documenteenheid (klant, order, regio) | Elke eenheid begint op een nieuwe pagina; bij bursting is de groep de ontvanger |
| `KeepWithGroup` + `RepeatOnNewPage` | Statische members (kop-/voetrijen) | Kolom- en groepskoppen herhalen op elke vervolgpagina |
| `KeepTogether` | Blokken die niet mogen splitsen | Adresblok, handtekeningblok |
| `PageName` | Groep/breuk | Elke groep op een eigen Excel-tabblad |

### Logische paginabreuken (`PageBreak`)

Breuken horen bij rectangles, tablix-data regions en groepen, nooit direct bij een textbox of afbeelding.

| Eigenschap | Detail |
|---|---|
| `BreakLocation` | `Start` \| `End` \| `StartAndEnd` \| `Between` (alleen groepen). **Alleen een constante, nooit een expressie** |
| `Disabled` | Boolean of expressie om een breuk dynamisch uit te zetten |
| `ResetPageNumber` | Zet `Globals!PageNumber` terug op 1 (`OverallPageNumber` reset nooit) |
| `PageName` | Naam van de pagina; beschikbaar als `Globals!PageName` in kop/voet en wordt het Excel-tabblad. `InitialPageName` benoemt de eerste pagina / het standaardtabblad |

Breuken op altijd-verborgen items worden genegeerd; op voorwaardelijk verborgen items gelden ze als het item zichtbaar is. Breuken binnen een tablixcel worden niet gehonoreerd (de tablix bepaalt de breuk).

### Bij elkaar houden

- `KeepTogether` (boolean, op members en report items): item plus geneste members op één pagina als het past; genegeerd als het item groter is dan een pagina (dan wordt het afgekapt).
- `KeepWithGroup` (`Before`/`After`, op statische members): houdt een statische rij bij de aangrenzende dynamische groep.
- `RepeatOnNewPage` (op statische members, vereist `KeepWithGroup`): herhaalt de kop op elke pagina die de groep beslaat.

Prioriteit bij conflicten, hoog naar laag: lijnen/grafieken/afbeeldingen, weduwe-/weeskindcontrole, herhaalde koppen, kleine `KeepTogether`-items, grote `KeepTogether`-items, tablix-`KeepTogether`.

### Fysieke vs interactieve grootte

```
PageHeight / PageWidth   used by hard renderers; where physical breaks occur; fixed (does not grow)
InteractiveHeight        HTML/MHTML soft page height (approximate); Excel/Word ignore it
InteractiveWidth         not used by any renderer
```

Zet `InteractiveHeight` op `0` om automatische zachte breuken in HTML te onderdrukken; dan blijven alleen expliciete breuken over. Standaardpaginaformaat is 8.5in x 11in.

**Test paginering door te exporteren naar het echte afleverformaat**, niet door de HTML-preview te bekijken.

## 6. Renderers (uitvoerformaten)

Twee dingen heten "renderer". Houd ze uit elkaar: **rendering extensions** (uitvoerformaten, dit hoofdstuk) en **uitvoeromgevingen** standard/optimized (§7).

```
Renderer       Category   Pagination     Margins   Interactivity   Notes
─────────────────────────────────────────────────────────────────────────────
PDF            Hard       vertical+horiz Yes       No              fixed page size; clips overflow
Image/TIFF     Hard       vertical+horiz Yes       No              one image per page
PowerPoint     Hard       vertical+horiz Yes       No              one slide per page
HTML           Soft       vertical only  No        Full            preview always uses this
MHTML          Soft       vertical only  No        No              web archive
Excel          Soft       vertical only  No        Partial         ignores InteractiveHeight; PageName -> tab
Word           Soft       vertical only  No        Partial         logical breaks only
CSV / XML      Data       none           No        No              values only, layout stripped
```

| Categorie | Gedrag |
|---|---|
| Hard (PDF, Image, PowerPoint) | Breken op de exacte `PageHeight`/`PageWidth`, passen marges toe, statisch. Te hoge/brede inhoud wordt afgekapt en vervolgd. Kop/voet hebben vaste hoogte en kappen af |
| Zacht (HTML, MHTML, Excel, Word) | Alleen verticaal, zonder paginamarges. HTML/MHTML gebruiken `InteractiveHeight`; Excel en Word breken op logische breuken (`PageName` → Excel-tabblad). Horizontale overloop wordt een schuifbalk. Kop/voet groeien mee in HTML/MHTML |
| Data (CSV, XML) | Geen lay-out; paginabreuken hebben geen effect |

Gevolgen:

1. **Preview ≠ PDF.** Report Builder en de browser in de Service tonen altijd via HTML. Paginatelling, kophoogte en marges verschillen van een PDF. Controleer door echt te exporteren.
2. **PDF-breedteval:** zie [§3](#3-paginaframe).

## 7. Uitvoeromgevingen, performance en expressiescope

In de Power BI-service draait een rapport automatisch en onzichtbaar in een van twee omgevingen. Je kiest niet zelf; het hangt af van de RDL-expressies.

```
Environment   Recommended volume ceiling             Hard abort
──────────────────────────────────────────────────────────────
Standard      1M rows x 15-20 mixed-type cols         2 GB per query
Optimized     2M rows x 15-20 mixed-type cols         2 GB per query
```

- **2 GB per query is de harde grens:** een datasetquery die meer ophaalt, wordt afgebroken en het renderen faalt. De rij-/kolomplafonds zijn Microsofts aanbevolen grenzen; volgens de documentatie is gedrag daarboven "changed to failure by design", dus reken daar op falen, niet alleen op traagheid.
- Geen gedeeltelijke optimalisatie: valt één expressie buiten de ondersteunde subset, dan draait het hele rapport standard.
- Afbeeldingskolommen (`byte[]`) blazen het volume sterk op.

**Wat het kost:** niet-ondersteunde expressies blokkeren een efficiënt initialisatie-/containerhergebruikspad. De kosten vallen bij **openen en parameterverwerking**, niet in de rendering per rij. "Expressies repareren" om weer optimized te draaien maakt een rapport daarom soms niet sneller, of zelfs trager; de rendertijd wordt bepaald door datavolume en lay-out. Jaag optimized na voor opstartlatentie en ruimte, niet als algemene snelheidswinst. Meet voor en na.

**Wat optimalisatie breekt:** Microsoft publiceert geen volledige lijst. Het gedocumenteerde patroon: VB.NET-runtimefuncties die inline in de RDL data berekenen of omzetten. Het enige expliciete voorbeeld:

```vb
=If(Weekday(Fields!SalesDate.Value) > 5, "Relax", "Work")   ' Weekday() is not optimized
```

De oplossing is altijd dezelfde: verplaats de berekening naar de datasetquery (T-SQL `DATEPART`/`CASE`, of DAX), een Power Query-stap of een kolom/measure in het model. Rapporten met alleen veldverwijzingen, eenvoudige aggregaten (`Sum`, `Count`) en opmaak blijven meestal optimized.

**Diagnose:** open het rapport in de Service en ga naar **View > Diagnostics** (minimaal Contributor op de workspace; niet beschikbaar in apps of de paginated-visual).

| Veld | Gebruik |
|---|---|
| Execution environment / Non-optimized expressions | Het tweede veld is alleen gevuld bij standard en noemt de exacte expressies; de gezaghebbende manier om te vinden wat je moet aanpassen |
| Data Retrieval time, Row Count, Processing Time, Rendering Time, Render Format, Content Size, Capacity Throttled | Vind de echte bottleneck (ophalen vs verwerken vs renderen) vóór je optimaliseert |

**Performanceregels voor de Service** (gelden niet voor PBIRS/SSRS):

1. Geen datasetcaches: elke parameterquery en elke cascadewijziging bevraagt de bron opnieuw.
2. Cascades lopen sequentieel, één query per wijziging; houd ze ondiep, zeker via een gateway.
3. Filters in de RDL (dataset/tablix/groep) werken **ná** het volledig ophalen, in het geheugen. Filter in de query.
4. Liever semantische modellen of Azure SQL dan on-prem bronnen via een gateway. Vermijd multi-geo (rapport en bron in verschillende regio's).

### Expressiescope

RDL-expressies zijn VB.NET met prefix `=`. Valkuilen:

| Expressie | Valkuil |
|---|---|
| `=Globals!PageNumber`, `=Globals!TotalPages` | Werken **alleen in kop/voet**; in de body leveren ze niets op |
| `=ReportItems!Box.Value` in kop/voet | Eén textbox per expressie; `#Error` op pagina's waar die box niet gerenderd is |
| `=Sum(Fields!Sales.Value, "DataSet1")`, `=Max(Fields!X.Value, "GroupName")` | Zonder scope geldt de binnenste scope; geef de naam expliciet bij twijfel |
| `=Parameters!Multi.Value(0)`, `.Count`, `.IsMultiValue` | Voor multi-value parameters |
| `=Fields(Parameters!FieldName.Value).Value` | Dynamische veldkeuze |
| `=CDate(Globals!ExecutionTime)` | Cast `Globals`-waarden |

## 8. Ontwikkellus en publiceren

```
1. Pick a starting template       assets/enter-data-starter.rdl | semantic-model-starter.rdl | sql-starter.rdl
2. Iterate layout offline          edit XML; keep an Enter Data dataset so no live source is hit
3. Validate                        python3 scripts/validate_rdl.py report.rdl
4. Wire the real data source       swap <DataSource>/<DataSet><Query>; keep field names so layout is untouched
5. Validate again                  python3 scripts/validate_rdl.py report.rdl
6. Publish to a workspace          scripts/publish_rdl.sh report.rdl <workspaceId>
7. RENDER AND CONFIRM (hard gate)  scripts/export_rdl.sh <reportId> <workspaceId>  ->  open the PDF
```

De paden en scripts in dit blok zijn die van de bronrepo. In deze skill zit alleen de Enter Data-starter ([`examples/paginated/enter-data-starter.rdl`](../examples/paginated/enter-data-starter.rdl)); de scripts zijn niet meegenomen. Wil je ze gebruiken, installeer ze dan zelf uit de bronrepo; anders doe je stap 6–7 met Report Builder (Publish) of uploaden in de Service, en exporteer je daar naar PDF/Excel.

Stap 2–3 zijn lokaal en gratis; daar doe je het meeste werk. Vanaf stap 6 heb je Premium/Embedded/Fabric-capaciteit nodig.

**Stap 7 is de echte lat, niet stap 5.** Een groene validatie controleert structuur, nooit expressies, veldverwijzingen of DAX. Een verkeerd `DataField`, een verkeerd gespelde measure, een `@`-prefixfout of een parameter op de verkeerde kolom komt door de validatie, wordt gepubliceerd en faalt (of rendert leeg/fout) pas bij export. Dus zodra de echte bron gekoppeld is:

1. Render direct en controleer dat de PDF opent met **verwachte, niet-lege inhoud**.
2. Lees bij een fout de foutmelding van de export.
3. Draai exact dezelfde `EVALUATE`/SQL tegen de live bron en controleer dat kolomnamen en typen overeenkomen met de `<Field>`-definities.

### Lokaal renderen met Power BI Report Server (PBIRS)

PBIRS is een on-premises Windows-webserver met dezelfde RDL-processor als de Service. Microsoft raadt aan om tijdens lay-outwerk lokaal te renderen.

| Voordeel | Beperking |
|---|---|
| Direct publiceren via de webportal (`http://localhost/reports`), geen capaciteit nodig | Geen semantische modellen als bron, geen Git-integratie, geen sensitivity labels, geen toegankelijke PDF, geen PPTX-export |
| Zelfde render-engine, dus getrouwe lay-out en paginering | Een rapport op `PBIDATASET` kan er niet end-to-end draaien; test lay-out met Enter Data of een lokale SQL-stand-in |
| Lokale SQL-bronnen zonder gateway | Productie vraagt SQL Server Enterprise + Software Assurance (gratis Developer/Evaluation-edities bestaan) |

Installeer niets zonder overleg. Gotcha: de **Enter Data-extensie is op PBIRS standaard niet geregistreerd.** Voeg haar toe aan de `<Data>`-sectie van `RsReportServer.config`:

```xml
<Extension Name="ENTERDATA" Type="Microsoft.ReportingServices.DataExtensions.XmlDPConnection,Microsoft.ReportingServices.DataExtensions">
  <Configuration><ConfigName>ENTERDATA</ConfigName></Configuration>
</Extension>
```

In de Power BI-service werkt Enter Data zonder configuratie.

### Publiceren naar de Service / Fabric

Programmatisch uploaden loopt via de Power BI **Imports**-API (multipart form post), niet via de Fabric Items-API. De `publish_rdl`-scripts van de bron verpakken dat. Wat je moet weten als je het zelf (of met die scripts) doet:

| Punt | Detail |
|---|---|
| Naam | `datasetDisplayName` moet op `.rdl` eindigen |
| Conflict | `nameConflict` is alleen `Abort` of `Overwrite`, en asymmetrisch: `Overwrite` vereist dat het rapport al bestaat (anders 404); `Abort` maakt een nieuw rapport maar faalt bij een bestaande naam |
| Grootte | Max. 20 MB; import is asynchroon |
| Na publiceren | Authenticatie van de bron instellen: Azure SQL in de workspace-instellingen, on-prem via een gekoppelde gateway. `PBIDATASET` met `Integrated Security=ClaimsToken` vraagt niets; het rendert als de ingelogde gebruiker (SSO) |
| Capaciteit | De workspace moet op Premium/Embedded/Fabric-capaciteit (of PPU) staan. Gedeelde capaciteit accepteert de upload, maar het rapport rendert niet. Bevestig de doel-workspace met de gebruiker |

**Exporteren om te controleren** (wat `export_rdl` van de bron doet): `POST .../ExportTo`, poll `GET .../exports/{id}` tot `Succeeded` (de status-URL is de exportresource zelf, **niet** `.../exports/{id}/status`), dan `GET .../exports/{id}/file`. De export-ID is opaque base64 en moet URL-encoded in het pad. REST-patronen en tokens: zie `fabric-basis`.

### Fabric Git-indeling

Met een workspace gekoppeld aan Git wordt een gepagineerd rapport een map met alleen de `.rdl` en een `.platform`:

```
SalesReport.PaginatedReport/
  SalesReport.rdl
  .platform
```

```json
{
  "version": "2.0",
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/platform/platformProperties.json",
  "config": { "logicalId": "<guid>" },
  "metadata": { "type": "PaginatedReport", "displayName": "SalesReport", "description": "" }
}
```

- Geen `definition/`-submap of JSON-sidecar; het hele rapport is de ene `.rdl`.
- Huidige Fabric Git kan een `<Name>.PaginatedReport/`-map direct importeren, maar dat is preview-niveau: test de round-trip in je eigen tenant voordat je Git-first werkt.
- Verwijderen = hele map weghalen; hernoemen in Git werkt niet (hernoem in de Service en synchroniseer). Git-integratie vereist Fabric-capaciteit en is preview.
- De Fabric Items REST-API kan een PaginatedReport **niet** aanmaken met een definitie-payload en de definitie niet ophalen (alleen metadata bijwerken en lijsten). Gebruik de Imports-API voor aanmaken/bijwerken.

```
fab path extension        .PaginatedReport
Power BI REST reportType   PaginatedReport
Power BI REST format       RDL
Fabric Items API type      PaginatedReport
```

## 9. Verschillen met SSRS

Een Power BI-gepagineerd rapport en een SSRS-rapport zijn **hetzelfde RDL-formaat**, gemaakt in **dezelfde tool** (Report Builder). Tablix, grafieken, parameters, expressies en pagina-instellingen werken gelijk. Het verschil zit in de omgeving:

| Onderwerp | Power BI-service | SSRS |
|---|---|---|
| Hosting en licentie | Workspace op Premium, Embedded, Fabric-capaciteit of PPU | Eigen Windows-reportserver; PBIRS host zowel `.rdl` als `.pbix` |
| Databronnen | Alleen embedded; geen gedeelde `.rds`/`.rsd` | Gedeelde bronnen en datasets mogelijk |
| Semantisch model | `PBIDATASET`-provider met DAX via SSO (`Integrated Security=ClaimsToken`) | Geen equivalent |
| Caches, snapshots, rapportgeschiedenis | Geen; parameterqueries draaien bij elke opening | Wel |
| Abonnementen | Standaardabonnementen | Standaard én data-driven |
| Uitvoeromgevingen | Standard vs optimized (§7) | Geen splitsing |
| Automatisering | REST export-to-file (`ExportTo`) en Fabric Git | URL access, SOAP/REST-endpoints, eigen bronbeheer |
| Uitrollen | Uploaden, Imports-API, Publish in Report Builder | Report Builder of SSDT naar een reportserver |
| Overig | Document maps renderen niet in de browser (wel bij export); report pages pinnen op dashboards kan niet | – |

**Praktisch:** schrijf tegen het 2016-schema, embed elke databron, kies bij voorkeur een semantisch model of cloud-SQL, en mik op een workspace met capaciteit. Gebruikt een voorbeeld-`.rdl` van internet een gedeelde databron of ouder schema (vaak bij SSRS-voorbeelden), zet het dan om naar embedded bronnen en het 2016-schema vóór je het naar de Service publiceert.

## 10. Voorbeeldrapporten

Echte, met Report Builder gemaakte `.rdl`-bestanden op GitHub. Gebruik ze om uitgebreide constructies (grafieken, matrices, sparklines, drill-down, parameterkoppeling) over te nemen in plaats van ze te typen. Ze zijn gelinkt, niet meegeleverd; raadpleeg per repo de eigen licentie. Alle hieronder gebruiken het 2016-schema.

| Bron | Bestand | Laat zien |
|---|---|---|
| MicrosoftLearning PL-300 | `Daily Sales Orders.rdl` | Parameter + tablix; compact, goed eerste voorbeeld |
| MicrosoftLearning DP-500 | `Sales Order Report.rdl` | Groter rapport met embedded image en parameter |
| `microsoft/Reporting-Services` (`PaginatedReportSamples/`) | `Invoice.rdl` | Factuur: kopblok, regeltabel, totalen (model voor pakbon/factuur) |
| idem | `RegionalSales.rdl` | Tabel met grafiek per groep (sparklinepatroon) |
| idem | `CountrySalesPerformance.rdl` | KPI-lay-out met grafieken en indicatoren |
| idem | `OrganizationExpenditures.rdl` | Matrix met kolomgroepen en subtotalen |
| idem | `Transcript.rdl`, `Labels.rdl`, `Letter.rdl` | Lijstlay-out, etiketvel met meerdere kolommen, standaardbrief |
| `PowerBiDevCamp/App-Owns-Data-Starter-Kit` | `SalesSummaryPaginated.rdl` | `PBIDATASET`-connect string en DAX-`DataField`-namen (bevat een placeholder-GUID en hergebruikte `rd:ReportID`; vervang beide) |
| `guyinacube/demo-files` (`video demos/RDL/`) | `20181205 - 1 - Datasource Dataset Params.rdl` | Databron, dataset en parameters koppelen |
| idem | `20181212 - 2 - Matrix.rdl` | Matrix-tablix |
| idem | `20190109 - Final.rdl` | Azure SQL stored procedure, cascadeparameters, sparklines, embedded images |

Links:

- PL-300: `https://github.com/MicrosoftLearning/PL-300-Microsoft-Power-BI-Data-Analyst/blob/Main/Allfiles/Demos/Solutions/Demo-09/Daily%20Sales%20Orders.rdl`
- DP-500: `https://github.com/MicrosoftLearning/DP-500-Azure-Data-Analyst/blob/main/Allfiles/15/Solution/Sales%20Order%20Report.rdl`
- Microsoft-samples: `https://github.com/microsoft/Reporting-Services/tree/master/PaginatedReportSamples` (raw: `https://raw.githubusercontent.com/microsoft/Reporting-Services/master/PaginatedReportSamples/Invoice.rdl`)
- PBIDATASET: `https://github.com/PowerBiDevCamp/App-Owns-Data-Starter-Kit/blob/main/AppOwnsDataAdmin/wwwroot/PBIX/SalesSummaryPaginated.rdl`
- guyinacube: `https://github.com/guyinacube/demo-files/tree/master/video%20demos/RDL`

**Zo gebruik je een voorbeeld:**

1. Bepaal welke constructie je nodig hebt (grafiek, matrix, parametercascade, lijstlay-out).
2. Open het raw-bestand van het passende voorbeeld en lees alleen dat fragment.
3. Kopieer het, pas namen/velden aan, houd de elementvolgorde intact, maak `rd:ReportID` nieuw en zorg dat `Name`-attributen uniek zijn.
4. Valideer, publiceer en exporteer om te controleren.
