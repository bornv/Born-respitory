# Born-respitory

Persoonlijke verzameling Claude-skills voor werk in warehouse/supply chain (Power BI, Microsoft Fabric, Power Platform, M365).

## Skills

| Skill | Gebruik voor | Bron |
|---|---|---|
| [fabric-basis](skills/fabric-basis/SKILL.md) | Fabric-concepten, workspaces/items en ID's vinden, authenticatie en tokens, REST-patronen (paginering, LRO, 429), item-definities, deployment pipelines, Git-integratie, capaciteit | `common/*`, `search-consumption-cli`, `fabriciq`, `deployment-pipelines-authoring-cli`, `git-integration-operations-cli`, `e2e-fabric-cost-estimation` |
| [fabric-semantic-model](skills/fabric-semantic-model/SKILL.md) | Semantische modellen: DAX, metingen, relaties, TMDL, PBIP, Direct Lake, refresh, verbindingen, DAX-performance | `semantic-model-authoring` |
| [fabric-powerbi-report](skills/fabric-powerbi-report/SKILL.md) | Power BI-rapporten: planning en ontwerp, PBIR/visual.json, filters, slicers, thema's, voorwaardelijke opmaak, publiceren en rebinden | `powerbi-report-cli` |
| [fabric-dataflows](skills/fabric-dataflows/SKILL.md) | Dataflow Gen2 en Power Query M: verbindingen, uitvoerbestemmingen, refresh, upgrade Gen1 → Gen2 | `dataflows-cli` |

Aanvullende skills (GPL-3.0, zie hieronder):

| Skill | Gebruik voor | Bron |
|---|---|---|
| [pbi-rapport-review](skills/pbi-rapport-review/SKILL.md) | Rapporten reviewen, ontwerpprincipes, nieuw rapport opzetten, theme.json aanpassen | `review-report`, `pbi-report-design`, `create-pbi-report`, `modifying-theme-json` |
| [pbi-model-power-query-dax](skills/pbi-model-power-query-dax/SKILL.md) | Power Query in modellen, DAX schrijven en optimaliseren, model organiseren, lineage, refresh-problemen | `power-query`, `dax`, `organize-semantic-model`, `lineage-analysis`, `refresh-semantic-model` |
| [tabular-editor-bpa](skills/tabular-editor-bpa/SKILL.md) | Tabular Editor, Best Practice Analyzer-regels, C#-scripts, TE-CLI | `bpa-rules`, `c-sharp-scripting`, `te-cli`, `te2-cli`, `te-docs` |
| [pbi-custom-visuals-paginated](skills/pbi-custom-visuals-paginated/SKILL.md) | Deneb, SVG-metingen, Python-/R-visuals, custom visuals, paginated reports (RDL) | `deneb-visuals`, `svg-visuals`, `python-visuals`, `r-visuals`, `powerbi-custom-visuals`, `paginated-report` |

## Herkomst en licentie

De Fabric-skills zijn Nederlandse, ingekorte bewerkingen van [microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric) (commit `bc42aaf`, 5 oktober 2026), MIT-licentie © Microsoft Corporation. De volledige licentietekst staat in [skills/THIRD-PARTY-LICENSE-skills-for-fabric.txt](skills/THIRD-PARTY-LICENSE-skills-for-fabric.txt).

Verschillen met het origineel:

- Nederlands, met Engelse code, API-paden, eigenschapsnamen en UI-labels ongewijzigd.
- Zonder MCP-servers, lokale preview-/grafiekscripts en de verplichte telemetrie-header `x-ms-fabric-skill`.
- Alleen de onderdelen die relevant zijn voor Power BI, Dataflows en algemeen Fabric-werk; migratie- (Synapse, Databricks, HDInsight), Spark-, Eventhouse-, Eventstream- en SQL-skills zijn niet overgenomen.

### data-goblin/power-bi-agentic-development (GPL-3.0)

De vier aanvullende skills zijn Nederlandse bewerkingen van [data-goblin/power-bi-agentic-development](https://github.com/data-goblin/power-bi-agentic-development) (commit `4936264`, 11 oktober 2026), © Kurt Buhler, GPL-3.0. Daardoor vallen deze bewerkingen ook onder GPL-3.0; elke map bevat de volledige licentietekst in `LICENSE`. Voor eigen en intern gebruik heeft dat geen gevolgen. Geef je zo'n skillmap aan anderen, lever dan de licentie en de (bewerkte) bron mee. Ze bevatten bewust alleen wat de Microsoft-skills niet dekken; overlappende onderwerpen verwijzen naar de `fabric-*`-skills.

## Installeren

Kopieer een skillmap (bijvoorbeeld `skills/fabric-semantic-model/`) naar `~/.claude/skills/` voor Claude Code, of zip de map en upload hem in Claude.ai als eigen skill.
