# Skillcatalogus

Dit overzicht bevat de geïnstalleerde skills en de hieronder opgenomen
aanbevelingen uit het aangeleverde projectoverzicht. Een aanbeveling of
besproken bouwpakket is geen bevestiging van installatie of productiegebruik.

## Geïnstalleerde skills

De repository bevat nu 30 lokale skillingangen. De bestaande Home
Assistant-skill is bijgewerkt van versie 49 naar **53**. De eerdere wijzigingen
aan de warmtepompregeling staan hier los van.

| Skill | Bron | Licentie |
|---|---|---|
| Skill Creator | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/skill-creator) | Apache-2.0 |
| SQL Object Impact Analysis | [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/b1a00457c0b8794243883f387e7de71e88800e3e/skills/sql-object-impact-analysis) | MIT |
| Spreadsheet Auditor | [petehottelet/spreadsheet-auditor](https://github.com/petehottelet/spreadsheet-auditor/tree/9930ae779c68f05cdd7520092bcad5aa2c4c497b) | MIT |
| Data Quality Frameworks | [wshobson/agents](https://github.com/wshobson/agents/tree/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins/data-engineering/skills/data-quality-frameworks) | MIT |
| Node-RED | [tonylofgren/aurora-smart-home](https://github.com/tonylofgren/aurora-smart-home/tree/8ffe3f7b0c15bf239447f7de27270174fd6c3f3a/node-red) | MIT |
| Power Platform Architect | [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/b1a00457c0b8794243883f387e7de71e88800e3e/skills/power-platform-architect) | MIT |
| Home Assistant Best Practices v53 | [homeassistant-ai/skills](https://github.com/homeassistant-ai/skills/tree/6d7fc785a4263eee46e808ce33f1f3603122be7b/skills/home-assistant-best-practices) | MIT |
| Canvas App en Canvas MCP-configuratie | [microsoft/power-platform-skills](https://github.com/microsoft/power-platform-skills/tree/a887c53f100f30c7882f567c5e480b91fe3312a/plugins/canvas-apps) | MIT |
| Power Automate-flowworkflows | [microsoft/power-platform-skills](https://github.com/microsoft/power-platform-skills/tree/a887c53f100f30c7882f567c5e480b91fe3312a/plugins/power-automate) | MIT |
| Power BI Modeling, DAX, rapportontwerp en performance | [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/b1a00457c0b8794243883f387e7de71e88800e3e/skills) | MIT |
| Home Assistant Dashboard Design | [tonylofgren/aurora-smart-home](https://github.com/tonylofgren/aurora-smart-home/tree/8ffe3f7b0c15bf239447f7de27270174fd6c3f3a/ha-dashboard-design) | MIT |
| Systematic Debugging en Verification Before Completion | [obra/superpowers](https://github.com/obra/superpowers/tree/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/skills) | MIT |
| Webapp Testing | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing) | Apache-2.0 |
| Victron Modbus | [extsps/Victron-Modbus-Skill](https://github.com/extsps/Victron-Modbus-Skill/tree/c17478315bbbfe09c9235645004a473d413215ef) | GPL-3.0-only |
| Odoo 19 | [mart337i/odoo-skills](https://github.com/mart337i/odoo-skills/tree/634b2db69c0ffb9766a5d16cff09a81ff1df54f4/skills/odoo-19.0) | MIT (package metadata) |
| Scientific database lookup en literature review | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills/tree/5f2bc0341354fd5590aef76a533ada1e1e5b4e62/skills) | MIT |

## Aanvullingen uit het gezamenlijke projectoverzicht

De aanbevelingen en vereisten in deze sectie komen uit het projectoverzicht dat
Born in de chat heeft aangeleverd. De bronnen die nu als geïnstalleerd staan,
zijn op vaste commits opgenomen, lokaal gevalideerd en als repository-ingang
beschikbaar. Een skillbestand geeft op zichzelf geen verbinding met Power Apps,
Power Automate, Power BI Desktop of een doelsysteem.

| Skill of pakket | Prioriteit | Passende projecten en meerwaarde | Vereisten en huidige status |
|---|---|---|---|
| [Microsoft Canvas Apps](https://github.com/microsoft/power-platform-skills/tree/main/plugins/canvas-apps) | Zeer hoog | ArtikelAanvragen, Machine Code, Inbound Deviations, Repairs, MCR en Modularization; Canvas-apps en `.pa.yaml` ontwikkelen en controleren. | **Geïnstalleerd.** Live authoring vereist .NET 10, de Canvas Authoring MCP-server en een geopende Power Apps Studio-sessie met coauthoring. |
| [Microsoft Power Automate](https://github.com/microsoft/power-platform-skills/tree/main/plugins/power-automate) | Zeer hoog | Supplier Follow-Up, escalaties, imports, goedkeuringen en SharePoint-migraties; onder meer build-flow, debug-flow en diagnose-flow. | **Geïnstalleerd.** De FlowAgent-bundle is lokaal meegeleverd; live toegang vereist Azure CLI-aanmelding en de juiste omgeving. |
| [Power BI Modeling](https://github.com/github/awesome-copilot/tree/main/skills/powerbi-modeling) | Zeer hoog | Romeo, orderanalyses en transportdata; relaties, stermodellen, DAX, modelkwaliteit en performance. | **Geïnstalleerd.** Voor rechtstreeks modelonderzoek is een Power BI Modeling MCP-server of actuele modelmetadata nodig. |
| [Power BI DAX Optimization](https://github.com/github/awesome-copilot/tree/main/skills/power-bi-dax-optimization) | Aanvullend op Power BI Modeling | DAX-metingen, berekeningslogica en prestaties van inkoop- en transportanalyses. | **Geïnstalleerd.** Metingen op het werkelijke model blijven nodig. |
| [Power BI Report Design Consultation](https://github.com/github/awesome-copilot/tree/main/skills/power-bi-report-design-consultation) | Aanvullend op Power BI Modeling | SQDC, orderanalyses en andere rapporten; rapportopbouw en presentatie. | **Geïnstalleerd.** De aanbevelingen moeten met doelgroep, datagrain en toegankelijkheid worden getoetst. |
| [Home Assistant Best Practices](https://github.com/homeassistant-ai/skills) | Zeer hoog | Intergas Xtend, woning- en energieautomatisering; triggers, helpers, modi en veilig wijzigen van bestaande configuratie. | **Al geïnstalleerd: versie 53.** Communityproject; geen tweede installatie nodig. Zie de geïnstalleerde lijst hierboven. |
| [Aurora Home Assistant Dashboard Design](https://github.com/tonylofgren/aurora-smart-home/tree/main/ha-dashboard-design) | Hoog | Dashboard voor batterij, zonnepanelen, EV, energieprijzen en verwarming; layouts, thema's, CSS, card-mod en button-card. | **Geïnstalleerd.** Vereiste custom cards en gedeelde referenties hangen af van het gekozen ontwerp. |
| [Systematic Debugging](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) | Hoog | Importfouten, witte schermen, verkeerde velden, kapotte koppelingen en terugkerende softwareproblemen; eerst de oorzaak vaststellen. | **Geïnstalleerd.** De werkwijze is afgestemd op de project- en verificatieafspraken. |
| [Verification Before Completion](https://github.com/obra/superpowers/tree/main/skills/verification-before-completion) | Hoog | Verbeteringen aantoonbaar controleren voordat ze als opgelost worden gemeld. | **Geïnstalleerd.** Live of externe controles blijven expliciet als niet-uitgevoerd gemeld worden. |
| [Webapp Testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Hoog | SABA-gespreksblad en toekomstige webapps; knoppen, navigatie, browserfouten en schermweergave controleren. | **Geïnstalleerd.** Playwright, een geschikte browser en een bereikbare testapp zijn nodig; Playwright is aanwezig, Chromium is aanwezig. |
| [Victron Modbus](https://github.com/extsps/Victron-Modbus-Skill) | Gericht nuttig | Victron uitlezen of aansturen via Modbus TCP; registerkeuze, unit-ID's, schaalfactoren en gegevenstypen. | **Geïnstalleerd.** Registerdetails moeten tegen apparaat en firmware worden geverifieerd; de eigen MQTT/Node-RED-ESS-aanpak blijft aanvullend nodig. |
| [Odoo 19 Development](https://github.com/mart337i/odoo-skills/tree/main/skills/odoo-19.0) | Gericht nuttig | Eigen Odoo 19-modules, rapporten, Python/XML en prestatieverbeteringen. | **Geïnstalleerd.** Communityskill; bepaal een aparte Odoo-ontwikkel- en testomgeving vóór databasewijzigingen. |
| [K-Dense Scientific Agent Skills](https://github.com/K-Dense-AI/scientific-agent-skills) | Hoog voor onderzoeksbriefings | Wetenschappelijke literatuur en trials, waaronder Huntington; zoekfilters en herleidbare bronnen. De ingangen `database-lookup` en `literature-review` zijn opgenomen. | **Geïnstalleerd.** API's, actuele brondekking en eventuele optionele CLI's worden per onderzoek gecontroleerd. |
| [Anthropic-documentvaardigheden: XLSX, DOCX, PDF en PPTX](https://github.com/anthropics/skills) | Breed nuttig | Inkoopanalyses, planningen, overeenkomsten, rapporten en presentaties. | Aanbevolen ter vergelijking, nog niet geïnstalleerd. Eigen licentievoorwaarden per documentvaardigheid controleren. Het aangeleverde overzicht meldt vergelijkbare mogelijkheden in ChatGPT; dat bevestigt geen beschikbaarheid in deze cloudomgeving. |

### Eigen projectskills

| Projectskill | Meerwaarde | Status |
|---|---|---|
| Eigen Power Platform-skill | Bevestigde lijstschema's, interne kolomnamen, bestaande flowaanroepen, personenvelden, bijlagen, delegatie en CT45-schermmaten vastleggen. Het eerdere onderzoeksrapport kan als bron dienen zodra het beschikbaar is. | Voorstel; nog niet aangemaakt. Geen onbekende schema's of appcontracten invullen op basis van aannames. |
| Eigen Victron/Node-RED-skill | Minimum-SoC, avondreserve, kwartierprijzen, EV-laadvoorwaarden en samenwerking met Dynamic ESS voor de eigen installatie vastleggen en testen. | De persoonlijke `victron-node-red`-skill is in deze sessie beschikbaar. Hij staat niet als eigen repo-ingang in de geïnstalleerde lijst; de algemene Node-RED-skill staat daar wel. Actuele exports en installatiegegevens blijven nodig. |
| Eigen Huntington-briefingskill | Vaste tabel met middel, onderzoeksfase, werkingsmechanisme, regio, nieuwe resultaten en onderscheid tussen onderzoeksresultaten en verwachtingen. | Voorstel; nog niet aangemaakt. Selectie, peildatum en herleidbare bronnen expliciet vastleggen. |

### Aanbevolen startselectie uit het aangeleverde overzicht

1. Microsoft Canvas Apps — geïnstalleerd; live MCP-configuratie blijft taakafhankelijk.
2. Microsoft Power Automate — geïnstalleerd; live Azure-aanmelding blijft taakafhankelijk.
3. Power BI Modeling — geïnstalleerd; live modelmetadata blijft taakafhankelijk.
4. Home Assistant Best Practices — al geïnstalleerd als versie 53.
5. Home Assistant Dashboard Design — geïnstalleerd.
6. Systematic Debugging — geïnstalleerd.
7. Verification Before Completion — geïnstalleerd.

Deze selectie vult de bestaande projectkennis aan. De bestaande Fabric-, Power
BI- en finance-projectskills staan nog op een andere Git-branch en zijn niet
door deze catalogusaanvulling samengevoegd of geïnstalleerd.

## Locaties en gebruik

- Codex-ingangen: `.agents/skills/<naam>/SKILL.md`.
- Claude-ingangen: `.claude/skills/<naam>/SKILL.md`.
- Ongewijzigde uitbreidingsbronnen met scripts en referenties: `vendor/skills/`.
- De Home Assistant-bron blijft op de bestaande plaats in `.claude/skills/`.
- Exacte commits en SHA-256-controlesommen: `vendor/skills/upstream-lock.json` en `vendor/skills/upstream-lock-extra.json`.

De kleine Codex-ingangen verwijzen naar de volledige bronskills en voegen
toepassingsafspraken voor dit project toe. Claude deelt dezelfde repository-lokale ingangen
via relatieve symlinks. De bestaande Home Assistant-ingang blijft beschikbaar.
De ingangen zijn repository-lokaal: kopieer ze niet als losse zelfstandige skill
zonder de gekoppelde bronbestanden en referenties.
Start taken in deze repository en lees `AGENTS.md`. Een client die zijn
skillcatalogus alleen bij sessiestart leest, heeft een nieuwe sessie nodig voor
automatische herkenning; de bestanden kunnen direct worden gelezen.

Voorbeeldvragen: "gebruik spreadsheet-auditor om dit Excel-bestand te controleren",
"gebruik sql-object-impact-analysis vóór deze kolomwijziging" of
"gebruik skill-creator om mijn Victron-skill met testvragen te verbeteren".

## Python-hulpmiddelen

Voer uit vanuit de hoofdmap van de repository:

```bash
bash tools/setup-skills.sh
bash tools/skills-python tools/check-installed-skills.py
bash tools/spreadsheet-auditor --help
bash tools/skill-creator quick_validate .agents/skills/skill-creator
```

Het setupscript gebruikt de beschikbare `uv` en Python 3.11+ en een aparte
omgeving in `../.venvs/born-skills`. `BORN_SKILLS_VENV` kan die locatie wijzigen.
De lockfile bevat exacte dependencyversies en artefactcontrolesommen. Bestaande
Python-omgevingen voor Home Assistant blijven gescheiden. Spreadsheet Auditor
wordt als lokaal Python-pakket geïnstalleerd, zodat ook `python -m spreadsheet_auditor`
en de meegeleverde CLI-tests vanuit andere mappen werken.

De bestaande tests van de auditor uitvoeren:

```bash
bash tools/skills-python -m pytest vendor/skills/spreadsheet-auditor/tests -q -n 4
```

Een audit met nieuwe uitvoerpaden:

```bash
bash tools/spreadsheet-auditor werkboek.xlsx --out audit.md --json bevindingen.json --summary
```

Let op de gedocumenteerde exitstatus: 1 betekent bevindingen boven de ingestelde
ernstdrempel, 6 een onvolledige audit. Een nulstatus is geen bewijs dat alle
bedrijfslogica of Excel-formules juist zijn. Indien beschikbaar kan LibreOffice
een tijdelijke kopie herberekenen; controleer de gerapporteerde dekking en
beperkingen. Het oorspronkelijke werkboek blijft intact.

## Reikwijdte

- Skill Creator kan lokaal valideren, verpakken en beoordelingsrapporten maken.
  Gebruik `bash tools/skill-creator <scriptnaam_zonder_py> ...`, bijvoorbeeld
  `bash tools/skill-creator package_skill vendor/skills/anthropics/skill-creator /tmp/skillpakketten`.
  De optionele geautomatiseerde Claude-benchmarkrunner vereist een eigen Claude
  CLI met authenticatie. In Codex kunnen testvragen met de huidige tools worden
  uitgevoerd en vergeleken.
- Node-RED is hier een skill met documentatie en templates. De targetversies,
  palettes, Victron-nodes en werkelijke entiteiten moeten bij een concrete
  flowopdracht worden gecontroleerd. Er is geen server of flow gedeployd.
- Great Expectations en dbt zijn voorbeelden in de datakwaliteitsskill; deze
  frameworks zijn niet nodig om de skill te lezen of controles te ontwerpen.
- De Fabric/Power BI-projectskills op de andere Git-branch zijn niet samengevoegd.

## Bijwerken en herstel

Werk bronnen bewust per commit bij, behoud lokale toepassingsafspraken en
licenties, en vernieuw daarna de manifestcontrolesommen. Het setupscript haalt
geen nieuwe upstreamversies op. De oude Home Assistant-skill is in deze machine
bewaard in `/workspace/.backups/born-home-assistant-skill-v49.tar.gz`; versie 49
staat ook nog in de oorspronkelijke Git-commit. De wijzigingen staan lokaal
ter beoordeling; publicatie van de cloudomgeving is een afzonderlijke stap.

## Gecontroleerd bij installatie

- Alle 30 Codex-ingangen voldoen aan de skillmetadata-controle; Claude-ingangen
  en bronverwijzingen zijn aanwezig.
- Alle 757 overgenomen bronbestanden komen overeen met de vastgelegde SHA-256-controlesommen.
- Spreadsheet Auditor: **404 tests geslaagd**, uitgevoerd met vier testprocessen.
  De afzonderlijke praktijktest vond 13 bevindingen in het meegeleverde foutieve
  voorbeeldwerkboek, schreef nieuwe rapporten en liet het origineel ongewijzigd.
- Skill Creator: validatie en verpakking getest; het `.skill`-pakket bevat alle
  18 bronbestanden, waaronder scripts en licentie.
- Herhaalde installatie en de 15 bestaande Home Assistant-regressietests geslaagd.
- De actieve clientcatalogus vernieuwde niet tijdens deze sessie. De ingangen
  zijn direct via bestanden leesbaar; automatische ontdekking in een nieuwe taak
  is niet in deze sessie getest.
