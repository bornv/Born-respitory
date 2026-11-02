# Gebruik, distributie en governance

Hoe je bepaalt of een rapport gebruikt wordt, hoe je de cijfers correct leest, en hoe je toegang, metadata en export naar Excel beoordeelt. Authenticatie en REST-basis: `fabric-basis`.

## Inhoud

1. Gebruiksdata ophalen (en welke rechten je nodig hebt)
2. Bereik, trend en abonnementen
3. Valkuilen bij het lezen van Usage Metrics
4. Oordeel: keep / investigate / redesign / retire
5. Distributie en toegang
6. Rapportmetadata
7. Export naar Excel

---

## 1. Gebruiksdata ophalen

De praktische route zonder beheerdersrechten: open in de Service bij het rapport het ingebouwde **Usage Metrics**-rapport (modern). De bron onderscheidt vier niveaus:

| Niveau | Bron | Minimaal recht | Bereik | Views | Paginaviews | Laadtijden |
|---|---|---|---|---|---|---|
| 1 | WABI-metrics-endpoints (ongedocumenteerd) | Workspace Viewer | Werkruimte | Ja | Ja | Ja |
| 2 | Usage Metrics-model (ongedocumenteerd genereren, officieel bevragen) | Workspace Contributor | Werkruimte | Ja | Ja | Ja |
| 3 | DataHub V2 (ongedocumenteerd) | Elke ingelogde gebruiker | Over werkruimtes heen | Nee (wel `lastVisitedTimeUTC`) | Nee | Nee |
| 4 | Activity Events API (officieel) | Fabric Admin (tenant) | Hele tenant | Ja | Nee | Nee |

- Ongedocumenteerde API's kunnen zonder aankondiging veranderen; vermeld dat bij conclusies die erop leunen.
- Distributie-, abonnement- en `admin/*`-controles vereisen **Fabric Admin**. Ben je dat niet (waarschijnlijk), vraag dan de beheerder of beperk je tot wat jouw werkruimterol toont.
- De bron bevat Python-scripts die deze API's bevragen (`get_report_usage.py`, `get_report_detail.py`, `get_report_distribution.py`, `performance_audit.py`). Die zijn hier niet overgenomen; je kunt ze zelf uit de bronrepository halen en draaien als je dat wilt (vereist `az login`, `fab auth login` en Python `requests`).

---

## 2. Bereik, trend en abonnementen

### Bereik (belangrijkste metriek)

```
Bereik % = (unieke consumenten die keken / totaal consumenten met toegang) × 100
```

Meet over 7, 28 en (indien mogelijk) 60 dagen. Indicatie uit de bron:

| Bereik | Interpretatie |
|---|---|
| >80% | Sterke adoptie; goed gericht |
| 50-80% | Matig; sommigen kennen het rapport niet of vinden het niet nuttig |
| 20-50% | Laag; doelgroep te breed of rapport moet beter |
| <20% | Zeer laag; distributie versmallen of uitfaseren overwegen |

Gebruik zulke drempels niet blind: wat gezond is hangt af van doelgroep, doel en levensfase. Een rapport voor 3 analisten heeft andere verwachtingen dan een voor 300 managers.

Kanttekeningen: retentie 30 dagen; embedded en API-gebruik ontbreekt mogelijk; security groups worden niet uitgevouwen (werkelijk publiek kan groter zijn); gastgebruikers (B2B) ontbreken soms; RLS beperkt wat mensen zien, niet of ze toegang hebben.

### Kijkers filteren

Haal vóór het tellen weg:

| Categorie | Herkennen aan |
|---|---|
| Service principals | `principalType: App` |
| Rapportontwikkelaars | Admin/Member/Contributor-rol plus `UpdateReportContent`/`CreateReport`-activiteit |
| IT/support | Alleen onderhoudsactiviteit (`UpdateReportContent`, `SetScheduledRefresh`) |
| Testers | Eén of twee views rond de aanmaakdatum, daarna niets |

Is het onderscheid onduidelijk, geef dan twee cijfers:

```
Audience reach (all users):     75% (6/8)
Audience reach (viewers only):  60% (3/5)  [excl. 3 workspace admins]
```

### Trend

Gebruik een **rollend 7-daags gemiddelde**; ruwe dagcijfers zijn te grillig (weekenden, feestdagen).

| Trend 7D-gemiddelde | Signaal |
|---|---|
| Stabiel of stijgend | Gezonde, consistente adoptie |
| 2+ weken dalend | Adoptie neemt af; oorzaak zoeken |
| Piek, dan daling | Eenmalige interesse (lancering, presentatie) |
| Vlak bij nul | Ongebruikt of alleen sporadisch |

### Abonnementen

**Abonnementen zijn geen views.** E-mailabonnementen leveren snapshots zonder view-event. Een rapport met 0 views en actieve abonnementen wordt passief gebruikt, niet ongebruikt. Kijken abonnees nooit interactief, dan past een paginated report of geautomatiseerde e-mail misschien beter.

---

## 3. Valkuilen bij Usage Metrics

- **Report View** (server-side) = één event per keer openen, betrouwbaar. **Report Page View** (client-side) = één per gerenderde pagina. Openen telt alleen de landingspagina; minder paginaviews dan rapportviews is normaal.
- **Paginaviews worden structureel ondergeteld** (adblockers, firewalls, offline, embedded). Lage aantallen zijn een ondergrens. Noem een pagina pas ongebruikt als het hele rapport ongebruikt is, en controleer eerst of het een tooltip- of drillthrough-pagina is (die hebben geen directe views) en of de pagina bereikbaar is via navigatie.
- **`Blank` in de paginaslicer** is geen echte pagina (pagina's van de laatste 24 uur of verwijderd). Negeren.
- **Venster:** 30 dagen, dagelijkse verversing met tot 24 uur vertraging. Verkeerd venster voor kwartaal- of jaarrapporten. Archiveer (Analyze in Excel of geplande extract) voor langere trends.
- **Blinde vlekken:** app-rapportpagina's en paginated reports staan niet in de tabel Report pages; mobiel/embedded wordt onderschat.
- `Unnamed Users` is een privacy-instelling van de tenant, geen ontbrekende data.
- Een "daling" van legacy naar modern is een definitiewijziging, geen regressie.

**Vertrouwen labelen:** rapportniveau (views, kijkers, rang) = hoog; paginaniveau = lager, altijd met kanttekening over telemetrieverlies; "geen views in 30 dagen" = middel, eerst venster vs. cadans checken.

---

## 4. Oordeel: keep / investigate / redesign / retire

Weinig gebruik is een vraag, geen antwoord.

1. **Venster afstemmen op cadans.** Lees datumslicers, "per"-titels en periodefilters. Een jaarlijks auditrapport dat 11 maanden niet geopend is, behoud je; een wekelijks operationeel rapport zonder views in 30 dagen is een echt signaal.
2. **Bereik scheiden van adoptie.** Een groep van 500 met 8 kijkers is een adoptieprobleem (distributie, onboarding), niet per se een rapportprobleem.
3. **Kijkerslijst filteren** (zie hierboven).
4. **Uitzonderingen respecteren.** Niet uitfaseren: managementscorecards voor een paar belangrijke gebruikers, compliance-/auditcontent, seizoensrapporten buiten het venster.
5. **Trend boven niveau.** Dalend gebruik bij een eerder gebruikt rapport is sterker signaal dan vlak-laag zonder historie.
6. **Oordeel geven:**

| Oordeel | Wanneer |
|---|---|
| **Keep** | Actief bereik, trend stabiel/stijgend, uitzonderingsklasse of cadans buiten venster |
| **Investigate-distribution** | Laag werkelijk bereik t.o.v. potentieel bereik |
| **Redesign** | Gebruikt maar slecht (lage frequentie per kijker, dalende trend, ontwerpproblemen) |
| **Retire** | Laag bereik + dalende trend + geen uitzondering + bevestigd door eigenaar |

7. **Zacht uitfaseren.** Hernoem met een deprecatie-prefix in plaats van verwijderen; bewaar de definitie in versiebeheer.

Nooit verwijderen op basis van één keer "geen views in 30 dagen". Brede rechten zijn geen gebruik. Een klein, trouw publiek (team-BI) is een geldig scenario. Eigenaar/inhoudsdeskundige bevestigt altijd als laatste.

---

## 5. Distributie en toegang

### Kanalen

| Kanaal | Advies | Waarom |
|---|---|---|
| **Workspace App / Org App** | Voorkeur | Centraal beheerd, per doelgroep, gebruikers hebben geen werkruimtetoegang nodig. Org apps vervangen naar verwachting workspace apps (Fabric-only) |
| Werkruimterol Viewer | Acceptabel voor kleine teams | Eenvoudig, maar gebruikers zien alle inhoud van de werkruimte |
| Directe deellink | Vermijden voor structurele distributie | Moeilijk te auditen; prima voor eenmalig |
| **Publish-to-web** | Vermijden tenzij bewust openbaar | Geen authenticatie; iedereen met de URL kijkt mee. Bij interne data: **critical**. Intrekken kan alleen via het beheerportal ("Embed codes") |
| Organisatiebrede link | Vermijden tenzij echt voor iedereen | Te breed; gebruik security groups |

### Regels

- **Security groups** in plaats van losse gebruikers (centraal beheer, schaalbaar, auditbaar). Markeer individuele toewijzingen.
- **Kijken vs. bewerken** scheiden: consumenten krijgen Viewer (of Read/ReadReshare bij direct delen); Contributor/Member/Admin (ReadWrite/Owner) alleen voor ontwikkelaars. 50 kijkers en 15 bewerkers = onderzoeken.

### Zes toegangspaden

Werkruimterol · direct gedeeld rapport · workspace app · org app · publish-to-web · organisatiebrede link. Een volledige distributie-audit controleert ze alle zes. Groepen verschijnen als één regel (`principalType: Group`); leden uitvouwen kan alleen via Microsoft Graph (`/members`, of `/transitiveMembers` voor geneste groepen) met `GroupMember.Read.All` of `Group.Read.All`. Lukt dat niet, noteer de groepsnamen en meld dat de werkelijke omvang onbekend is.

Voorbeelden die je zelf kunt draaien met de Fabric CLI (`fab`), rechten tussen haakjes:

```bash
fab api -A powerbi "groups/{workspaceId}/users"                         # werkruimterollen (Workspace Admin)
fab api -A powerbi "groups/{workspaceId}/reports/{reportId}/users"      # direct gedeeld (Workspace Admin, onvolledig)
fab api -A powerbi "admin/widelySharedArtifacts/publishedToWeb"         # publish-to-web (Fabric Admin)
```

---

## 6. Rapportmetadata

```
Report:      <naam>
Format:      PBIR / PBIX
Type:        Thin / Thick
Model:       <modelnaam> (Import / DirectQuery / Direct Lake)
Model size:  <n> MB
Endorsed:    Certified / Promoted / None
Sensitivity: <label> / None
Pipeline:    <pipelinenaam> stage <n> / None
Capacity:    <SKU>
Owner:       <e-mail>
```

| Onderwerp | Waar je op let |
|---|---|
| **Thin vs. thick** | Thin (verbonden met gepubliceerd model) heeft de voorkeur: één bron van waarheid, wijzigingen werken door, scheiding model/rapport. Er is geen API-veld; aanwijzingen voor thick: rapport en model met dezelfde naam in dezelfde werkruimte, `datasetWorkspaceId` gelijk aan de werkruimte van het rapport, verhouding rapporten:modellen 1:1 (gezond = meer rapporten dan modellen) |
| **Endorsement** | Certified = hogere kwaliteitseisen; Promoted = eigenaar vindt het klaar voor breder gebruik; ongeëndorsed in een productiewerkruimte = review nodig |
| **Gevoeligheidslabel** | Ontbreekt terwijl beleid het vraagt → markeren. Hoog label + publish-to-web → nooit. Label moet passen bij de classificatie van het model |
| **Deployment pipeline** | Productierapport buiten een pipeline mist mogelijk wijzigingsbeheer; noteer in welke stage de werkruimte zit |
| **Formaat** | `PBIR` (nieuw, bestandsgebaseerd, Git-vriendelijk), `PBIT` (template), leeg = legacy PBIX |

---

## 7. Export naar Excel

Veel exporteren betekent vaak dat het rapport niet doet wat gebruikers nodig hebben, en is een governancerisico: geëxporteerde data valt buiten labels, RLS en audit.

**Activiteiten** (Activity Events, Fabric Admin; verschijnen na 30-60 minuten):

| Activiteit | Wat |
|---|---|
| `ExportReport` | Data-export uit een visual (Excel, CSV) én hele rapport (PDF, PPTX, PNG). Formaat staat in `ExportEventPropertyList` |
| `ExportArtifact` / `ExportArtifactDownload` | Item geëxporteerd / gedownload |
| `DownloadReport` | Rapport als .pbix gedownload: bij Import mogelijk alle data, lokaal zonder RLS. Tenantinstelling "Download reports" kan dit uitzetten |
| `ExportTile` | Data van een dashboardtegel |

"Analyze in Excel" (`AnalyzeInExcel`, `AnalyzedByExternalApplication`) is een **live verbinding**, geen export; niet op één hoop gooien.

| Patroon | Signaal | Aanbeveling |
|---|---|---|
| Dezelfde gebruikers exporteren dagelijks | Rapport is een datapijplijn | Dataflow, lakehouse of directe Excel-verbinding met het model |
| Velen exporteren dezelfde tabel/matrix | Tabel geeft niet de nodige aggregatie | Measures, voorwaardelijke opmaak of drillthrough toevoegen |
| Exporteren en dan mailen | Distributie werkt niet | E-mailabonnement met PDF/Excel-bijlage |
| Exporteren om met andere data te combineren | Model is onvolledig | Model uitbreiden met die bron |
| Af en toe voor ad-hocanalyse | Normaal | Geen actie; zorg dat RLS geldt |

PDF/PPTX-export is meestal onschuldig (presentaties); vaak = overweeg een abonnement.
