# Projectskills

Gebruik de bestaande checkout; een cloudtaak is al geïsoleerd. Maak geen extra
Git-worktree zonder verzoek van de gebruiker.

De geïnstalleerde skills staan in `.agents/skills/`; Claude-ingangen staan in
`.claude/skills/`. Lees alleen de toepasselijke `SKILL.md` en de daarin gelinkte
bronskill en referenties. Laad niet de hele verzameling tegelijk.

| Onderwerp | Skill |
|---|---|
| Home Assistant | `home-assistant-best-practices` |
| Skills schrijven, uitbreiden of evalueren | `skill-creator` |
| Gevolgen van SQL-wijzigingen | `sql-object-impact-analysis` |
| Bestaande Excel-bestanden controleren | `spreadsheet-auditor` |
| Controles op datakwaliteit | `data-quality-frameworks` |
| Node-RED-flows | `node-red` |
| Power Platform-architectuur | `power-platform-architect` |
| Canvas Apps en `.pa.yaml` | `canvas-app`, `configure-canvas-mcp` |
| Power Automate-cloudflows | `power-automate`, `build-flow`, `create-flow`, `browse-flows`, `debug-flow`, `diagnose-flow`, `manage-flows`, `route-environments` |
| Power BI-modellen, DAX en rapporten | `powerbi-modeling`, `power-bi-dax-optimization`, `power-bi-model-design-review`, `power-bi-performance-troubleshooting`, `power-bi-report-design-consultation` |
| Power BI/Penta-context, datavalidatie en PBIP-oplevering | `penta-powerbi-lcv`, `data-context-extractor`, `validate-data`, `pbip-delivery-check` |
| Terugkerende incidenten en herstelstappen | `runbook` |
| Home Assistant-dashboard | `ha-dashboard-design` |
| Fouten onderzoeken en afronden met bewijs | `systematic-debugging`, `verification-before-completion` |
| Webapps testen | `webapp-testing` |
| Victron-registers | `victron-modbus` |
| Odoo 19 | `odoo-19` |
| Wetenschappelijke trials en literatuur | `database-lookup`, `literature-review` |

Projectspecifieke bedrijfsregels gaan vóór generieke voorbeelden uit deze
verzameling. Controleer de werkelijke softwareversies en databronnen voordat
je voorbeelden toepast. Een bronskill levert geen bewijs dat een live systeem
werkt of dat een wijziging daaraan is toegestaan.

Lees `SKILLS.md` voor installatie en gebruik. Python-hulpmiddelen draaien via
`bash tools/skills-python`; voer de registratiecontrole uit met
`bash tools/skills-python tools/check-installed-skills.py`.
