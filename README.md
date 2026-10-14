# Born-respitory

Persoonlijke verzameling Claude-skills voor werk in warehouse/supply chain (Power BI, Microsoft Fabric, Power Platform, M365).

## Skills

| Skill | Gebruik voor | Bron |
|---|---|---|
| [fabric-basis](skills/fabric-basis/SKILL.md) | Fabric-concepten, workspaces/items en ID's vinden, authenticatie en tokens, REST-patronen (paginering, LRO, 429), item-definities, deployment pipelines, Git-integratie, capaciteit | `common/*`, `search-consumption-cli`, `fabriciq`, `deployment-pipelines-authoring-cli`, `git-integration-operations-cli`, `e2e-fabric-cost-estimation` |
| [fabric-semantic-model](skills/fabric-semantic-model/SKILL.md) | Semantische modellen: DAX, metingen, relaties, TMDL, PBIP, Direct Lake, refresh, verbindingen, DAX-performance | `semantic-model-authoring` |
| [fabric-powerbi-report](skills/fabric-powerbi-report/SKILL.md) | Power BI-rapporten: planning en ontwerp, PBIR/visual.json, filters, slicers, thema's, voorwaardelijke opmaak, publiceren en rebinden | `powerbi-report-cli` |
| [fabric-dataflows](skills/fabric-dataflows/SKILL.md) | Dataflow Gen2 en Power Query M: verbindingen, uitvoerbestemmingen, refresh, upgrade Gen1 → Gen2 | `dataflows-cli` |

| [powerbi-modeling-mcp](skills/powerbi-modeling-mcp/SKILL.md) | Power BI Authoring MCP Server installeren, configureren en veilig gebruiken (Desktop, Fabric, PBIP) | `microsoft/powerbi-modeling-mcp` README en TROUBLESHOOTING |

Aanvullende skills (GPL-3.0, zie hieronder):

| Skill | Gebruik voor | Bron |
|---|---|---|
| [pbi-rapport-review](skills/pbi-rapport-review/SKILL.md) | Rapporten reviewen, ontwerpprincipes, nieuw rapport opzetten, theme.json aanpassen | `review-report`, `pbi-report-design`, `create-pbi-report`, `modifying-theme-json` |
| [pbi-model-power-query-dax](skills/pbi-model-power-query-dax/SKILL.md) | Power Query in modellen, DAX schrijven en optimaliseren, model organiseren, lineage, refresh-problemen | `power-query`, `dax`, `organize-semantic-model`, `lineage-analysis`, `refresh-semantic-model` |
| [tabular-editor-bpa](skills/tabular-editor-bpa/SKILL.md) | Tabular Editor, Best Practice Analyzer-regels, C#-scripts, TE-CLI | `bpa-rules`, `c-sharp-scripting`, `te-cli`, `te2-cli`, `te-docs` |
| [pbi-custom-visuals-paginated](skills/pbi-custom-visuals-paginated/SKILL.md) | Deneb, SVG-metingen, Python-/R-visuals, custom visuals, paginated reports (RDL) | `deneb-visuals`, `svg-visuals`, `python-visuals`, `r-visuals`, `powerbi-custom-visuals`, `paginated-report` |

Finance en accounting (Apache-2.0, zie hieronder):

| Skill | Gebruik voor | Bron |
|---|---|---|
| [finance-journaalposten](skills/finance-journaalposten/SKILL.md) | Journaalposten: reserveringen (accruals), overlopende posten, afschrijving, periodeafgrenzing, debet/credit, onderbouwing en review | `journal-entry`, `journal-entry-prep` |
| [finance-reconciliatie](skills/finance-reconciliatie/SKILL.md) | Aansluitingen: grootboek tegenover subadministratie, bank, intercompany; verschillen indelen en ouderdom bewaken | `reconciliation` |
| [finance-maandafsluiting](skills/finance-maandafsluiting/SKILL.md) | Maandafsluiting plannen en bewaken: afsluitkalender, taken per dag, afhankelijkheden, status en knelpunten | `close-management` |
| [finance-overzichten](skills/finance-overzichten/SKILL.md) | Winst-en-verliesrekening, balans en kasstroomoverzicht met periodevergelijking en toelichting op verschillen | `financial-statements` |
| [finance-variantieanalyse](skills/finance-variantieanalyse/SKILL.md) | Budget tegenover werkelijk, prijs-, volume- en mixeffect, materialiteit, watervalgrafiek, toelichting voor het management | `variance-analysis` |
| [finance-interne-controle](skills/finance-interne-controle/SKILL.md) | Beheersmaatregelen testen, steekproeven, werkdocumenten, tekortkomingen indelen, auditdossier en accountantsvragen | `sox-testing`, `audit-support` |

## Herkomst en licentie

De Fabric-skills zijn Nederlandse, ingekorte bewerkingen van [microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric) (commit `bc42aaf`, 5 oktober 2026), MIT-licentie © Microsoft Corporation. De volledige licentietekst staat in [skills/THIRD-PARTY-LICENSE-skills-for-fabric.txt](skills/THIRD-PARTY-LICENSE-skills-for-fabric.txt).

Verschillen met het origineel:

- Nederlands, met Engelse code, API-paden, eigenschapsnamen en UI-labels ongewijzigd.
- Zonder MCP-servers, lokale preview-/grafiekscripts en de verplichte telemetrie-header `x-ms-fabric-skill`.
- Alleen de onderdelen die relevant zijn voor Power BI, Dataflows en algemeen Fabric-werk; migratie- (Synapse, Databricks, HDInsight), Spark-, Eventhouse-, Eventstream- en SQL-skills zijn niet overgenomen.

De skill `powerbi-modeling-mcp` is gebaseerd op de documentatie van [microsoft/powerbi-modeling-mcp](https://github.com/microsoft/powerbi-modeling-mcp) (commit `2b25def`, MIT). De MCP-server zelf valt onder een aparte Microsoft-EULA en zit niet in deze repo.

### data-goblin/power-bi-agentic-development (GPL-3.0)

De vier aanvullende skills zijn Nederlandse bewerkingen van [data-goblin/power-bi-agentic-development](https://github.com/data-goblin/power-bi-agentic-development) (commit `4936264`, 11 oktober 2026), auteur Kurt Buhler (data-goblins.com), GPL-3.0. Daardoor vallen deze bewerkingen ook onder GPL-3.0; elke map bevat de volledige licentietekst in `LICENSE`. Voor eigen en intern gebruik heeft dat geen gevolgen. Geef je zo'n skillmap aan anderen, lever dan de licentie en de (bewerkte) bron mee. Ze bevatten bewust alleen wat de Microsoft-skills niet dekken; overlappende onderwerpen verwijzen naar de `fabric-*`-skills.

## Installeren

Kopieer een skillmap (bijvoorbeeld `skills/fabric-semantic-model/`) naar `~/.claude/skills/` voor Claude Code, of zip de map en upload hem in Claude.ai als eigen skill.

### anthropics/knowledge-work-plugins (Apache-2.0)

De zes finance-skills zijn Nederlandse bewerkingen van de finance-plugin uit [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (commit `02ffa99`, 11 oktober 2026), Apache-2.0 © Anthropic. De volledige licentietekst staat in [skills/THIRD-PARTY-LICENSE-knowledge-work-plugins.txt](skills/THIRD-PARTY-LICENSE-knowledge-work-plugins.txt).

Verschillen met het origineel:

- Nederlands, met vaktermen in het Nederlands en de Engelse term één keer tussen haakjes. Code, veldnamen en ERP-termen blijven ongewijzigd.
- Bedragen in euro's, datums als dd-mm-jjjj en perioden als jjjjMM in plaats van dollars en Amerikaanse datumnotatie.
- Afgestemd op de eigen situatie: SAP met resultatendata via de Oracle-view `LCV_KPTM` in schema `LCV_DATA`, Power BI, SharePoint en Excel. De tool-placeholders (`~~erp`, `~~data warehouse`) en de MCP-/connector-opzet van de plugin zijn eruit.
- De acht bronskills zijn samengevoegd tot zes: `journal-entry` + `journal-entry-prep` en `sox-testing` + `audit-support` overlapten te veel.
- Slash-commando's (`/journal-entry`, `/sox-testing`) zijn niet overgenomen; dit zijn naslagskills.
- US GAAP en SOX 404 zijn Amerikaans. Waar de bron die regels geeft, staat dat er nu expliciet bij, met de opmerking dat onder RJ of IFRS en bij de accountantscontrole in Nederland iets anders kan gelden.

Deze skills geven geen fiscaal, accounting- of auditadvies. Laat uitkomsten controleren door een bevoegde collega of accountant.
