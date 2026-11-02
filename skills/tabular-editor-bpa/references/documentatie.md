# Documentatie en configbestanden: naslag

Detail bij [SKILL.md](../SKILL.md). Bron: `te-docs` (SKILL.md, references/doc-structure, references/url-redirects, schema/, bin/README) en verwijzingen uit `te-cli`/`te2-cli`.

## Inhoud

1. [Documentatie zoeken](#documentatie-zoeken)
2. [pbi-search (optioneel hulpmiddel)](#pbi-search-optioneel-hulpmiddel)
3. [Indeling van docs.tabulareditor.com](#indeling-van-docstabulareditorcom)
4. [Oude URL's die 404 geven](#oude-urls-die-404-geven)
5. [.tmuo: gebruikersopties per model](#tmuo-gebruikersopties-per-model)
6. [Preferences.json en andere TE3-bestanden](#preferencesjson-en-andere-te3-bestanden)
7. [Configbestanden valideren](#configbestanden-valideren)
8. [Handige links](#handige-links)

## Documentatie zoeken

| Onderwerp | Waar zoeken |
|---|---|
| Tabular Editor (TE2, TE3, `te`-CLI) | https://docs.tabulareditor.com/ |
| DAX-functies | `https://dax.guide/<functie>/` |
| Diepgaande DAX- en modelartikelen | https://www.sqlbi.com/articles/ |
| Power BI en Fabric | Microsoft Learn |
| Data Goblins-blogs | https://data-goblins.com/ |
| TE-blog | https://tabulareditor.com/blog/ |

Werkwijze:

1. Zoek eerst in de Tabular Editor-docs op het onderwerp (bijv. "BPA rules", "workspace mode").
2. Krijg je een 404 op een oude link: zoek het nieuwe pad op in [Oude URL's die 404 geven](#oude-urls-die-404-geven).
3. Geen resultaat: verbreed naar alle bronnen. Bij DAX-vragen altijd ook dax.guide.

## pbi-search (optioneel hulpmiddel)

[`pbi-search`](https://github.com/data-goblin/pbi-search) is een command-line zoektool van de auteur van de bron. Hij doorzoekt Tabular Editor-docs, DAX.guide, SQLBI, Microsoft Learn (Power BI + Fabric), de TE-blog en Data Goblins tegelijk en geeft schone markdown terug. Niet nodig: je kunt de sites ook gewoon in de browser doorzoeken.

Installeren (zelf uitvoeren):

```bash
# Vanaf broncode, vereist Rust (https://rustup.rs/)
cargo install --git https://github.com/data-goblin/pbi-search
pbi-search sync        # ~13s, eenmalig de lokale index vullen
```

Of download de binary van de [releases-pagina](https://github.com/data-goblin/pbi-search/releases), zet hem op je `PATH` en draai `pbi-search sync`. Voor betere resultaten bij conceptuele zoekvragen: `pbi-search sync --descriptions` (~30s extra).

Gebruik:

```bash
pbi-search search "BPA rules" --source te-docs
pbi-search search "incremental refresh" --source te-docs --source te-blog
pbi-search search "calculated columns" --source te-docs --excerpts
pbi-search fetch features/Best-Practice-Analyzer --section "Creating rules"
pbi-search fetch https://dax.guide/calculate/
pbi-search fetch features/creating-measures --max-chars 3000 --json
```

| Bron-ID | Inhoud |
|---|---|
| `te-docs` | Tabular Editor-docs (features, how-tos, KB, references) |
| `dax-guide` | ~480 DAX-functiepagina's |
| `te-blog` | Tabular Editor-blog |
| `ms-learn` | Microsoft Learn, Power BI + Fabric (live, geen sync nodig) |
| `sqlbi` | ~370 SQLBI-artikelen |
| `data-goblins` | Data Goblins-posts |

## Indeling van docs.tabulareditor.com

De docs komen uit de repository TabularEditorDocs (`content/`-map). Handig om te weten waar iets staat:

| Sectie | Wat je er vindt | Belangrijke pagina's |
|---|---|---|
| `features/` | Functies van TE2 en TE3 | `Best-Practice-Analyzer`, `using-bpa-sample-rules-expressions`, `csharp-scripts`, `CSharpScripts/` (scriptbibliotheek), `views/` (o.a. BPA-view), `dax-editor`, `dax-scripts`, `dax-debugger`, `tmdl`, `deployment` |
| `getting-started/` | Installatie en introductie | `bpa`, `installation`, `cs-scripts-and-macros`, `migrate-from-desktop`, `migrate-from-te2`, `workspace-mode` |
| `tutorials/` | Stap-voor-stap | `data-security/` (RLS/OLS), `incremental-refresh/`, `calendars`, `udfs`, `direct-lake-guidance`, `powerbi-xmla` |
| `how-tos/` | Taakgerichte handleidingen | `Advanced-Scripting`, `Importing-Tables`, `Master-model-pattern`, `xmla-as-connectivity` |
| `references/` | Naslag | `preferences` (alle TE3-instellingen), `shortcuts3`, `downloads`, `release-history`, `FAQ`, `release-notes/` |
| `kb/` | Kennisbank | `bpa-*` (uitleg per BPA-regel), foutcodes `DI*` (data import), `DR*` (data refresh), `RW*` (read/write) |
| `troubleshooting/` | Problemen oplossen | `licensing-activation`, `proxy-settings`, `direct-lake-entity-updates-reverting` |

Een pagina `features/tmdl.md` in de repository is online `/features/tmdl.html`.

## Oude URL's die 404 geven

Na een reorganisatie geeft de site voor oude URL's een **404 in plaats van een redirect**. Oude links in blogs, forums of oudere regelbestanden werken dus niet meer. Vervang het pad:

| Oud patroon | Nieuw patroon |
|---|---|
| `/common/*` | `/features/*` of `/getting-started/*` |
| `/onboarding/*` | `/getting-started/*` |
| `/te2/*` | wisselend (`/features/`, `/how-tos/`, `/references/`) |
| `/te3/features/*` | `/features/*` |
| `/te3/views/*` | `/features/views/*` |
| `/te3/tutorials/*` | `/tutorials/*` |
| `/te3/other/release-notes/*` | `/references/release-notes/*` |

Veelgebruikte BPA- en scriptinglinks:

| Oude URL | Nieuwe URL |
|---|---|
| `/common/using-bpa.html` | `/getting-started/bpa.html` |
| `/onboarding/bpa.html` | `/getting-started/bpa.html` |
| `/te3/views/bpa-view.html` | `/features/views/bpa-view.html` |
| `/te2/Best-Practice-Analyzer.html` | `/features/Best-Practice-Analyzer.html` |
| `/te2/Best-Practice-Analyzer-Improvements.html` | `/features/Best-Practice-Analyzer.html` |
| `/common/using-bpa-sample-rules-expressions.html` | `/features/using-bpa-sample-rules-expressions.html` |
| `/common/CSharpScripts/*` | `/features/CSharpScripts/*` |
| `/common/script-helper-methods.html` | `/features/script-helper-methods.html` |
| `/te2/Advanced-Scripting.html` | `/how-tos/Advanced-Scripting.html` |
| `/te2/Useful-script-snippets.html` | `/features/Useful-script-snippets.html` |
| `/onboarding/cs-scripts-and-macros.html` | `/getting-started/cs-scripts-and-macros.html` |
| `/te3/features/csharp-scripts.html` | `/features/csharp-scripts.html` |
| `/te2/Command-line-Options.html` | `/features/Command-line-Options.html` |

Overige:

| Oude URL | Nieuwe URL |
|---|---|
| `/common/desktop-limitations.html` | `/getting-started/desktop-limitations.html` |
| `/common/policies.html` | `/references/policies.html` |
| `/common/save-to-folder.html` | `/features/save-to-folder.html` |
| `/common/xmla-as-connectivity.html` | `/how-tos/xmla-as-connectivity.html` |
| `/onboarding/installation.html` | `/getting-started/installation.html` |
| `/onboarding/migrate-from-desktop.html` | `/getting-started/migrate-from-desktop.html` |
| `/onboarding/migrate-from-te2.html` | `/getting-started/migrate-from-te2.html` |
| `/onboarding/parallel-development.html` | `/getting-started/parallel-development.html` |
| `/onboarding/personalizing-te3.html` | `/getting-started/personalizing-te3.html` |
| `/onboarding/refresh-preview-query.html` | `/getting-started/refresh-preview-query.html` |
| `/te2/FAQ.html` | `/references/FAQ.html` |
| `/te2/Getting-Started.html` | `/getting-started/Getting-Started-te2.html` |
| `/te2/Importing-Tables.html` | `/how-tos/Importing-Tables.html` |
| `/te2/Keyboard-Shortcuts.html` | `/references/Keyboard-Shortcuts2.html` |
| `/te2/Master-model-pattern.html` | `/how-tos/Master-model-pattern.html` |
| `/te2/Workspace-Database.html` | `/features/Workspace-Database.html` |
| `/te3/features/deployment.html` | `/features/deployment.html` |
| `/te3/features/diagram-view.html` | `/features/views/diagram-view.html` |
| `/te3/features/preferences.html` | `/references/preferences.html` |
| `/te3/features/shortcuts.html` | `/references/shortcuts3.html` |
| `/te3/features/tmdl.html` | `/features/tmdl.html` |
| `/te3/getting-started.html` | `/getting-started/getting-started.html` |
| `/te3/tutorials/workspace-mode.html` | `/features/workspace-mode.partial.html` |

De volledige lijst staat in `redirects.json` in de TabularEditorDocs-repository.

## .tmuo: gebruikersopties per model

Een `.tmuo`-bestand bewaart in TE3 de instellingen van **één ontwikkelaar voor één model**: workspace-database, deploydoel en overschreven verbindingen.

**Belangrijk:**

- Bestandsnaam: `<ModelFileName>.<WindowsUserName>.tmuo`, naast het modelbestand.
- Wachtwoorden en verbindingen zijn versleuteld met de **Windows User Key** en dus **niet uitwisselbaar** tussen gebruikers.
- **Nooit in versiebeheer.** Zet `*.tmuo` in `.gitignore` van elk project.

```json
{
  "UseWorkspace": true,
  "WorkspaceConnection": "localhost",
  "WorkspaceDatabase": "MyModel_Workspace_JohnDoe",
  "Deployment": {
    "TargetConnectionString": "powerbi://api.powerbi.com/v1.0/myorg/Workspace",
    "TargetDatabase": "MyModel",
    "DeployPartitions": false,
    "DeployModelRoles": true
  },
  "DataSourceOverrides": {
    "SQL Server": {
      "ConnectionString": "Data Source=localhost;Initial Catalog=DevDB"
    }
  }
}
```

| Sectie | Doel |
|---|---|
| `UseWorkspace` | Workspace-databasemodus aan; TE3 deployt de metadata naar de workspace bij openen |
| `WorkspaceConnection` | Server van de workspace-database (string of versleuteld object) |
| `WorkspaceDatabase` | Naam van de workspace-database; uniek per ontwikkelaar en model |
| `Deployment` | Doelserver, -database en deployopties |
| `DataSourceOverrides` | Andere verbindingen voor de workspace, per databronnaam (`ConnectionString`, `ImpersonationMode`, `Username`, `Password`, …) |
| `TableImportSettings` | Instellingen voor de functie Import Tables |
| `RefreshOverrides` | Profielen voor geavanceerde refresh-overrides |

Deployopties onder `Deployment`:

| Veld | Type | Standaard (schema) | Betekenis |
|---|---|---|---|
| `TargetConnectionString` | string | – | Doelserver |
| `TargetDatabase` | string | – | Naam van de doeldatabase |
| `TargetCredentials` | object | – | `UserName`, `EncryptedPassword` |
| `DeployDataSources` | bool | `false` | Databronnen meedeployen |
| `DeployPartitions` | bool | `false` | Partitiedefinities meedeployen |
| `DeployRefreshPolicyPartitions` | bool | `true` | Incremental-refresh-partities meedeployen |
| `DeployModelRoles` | bool | `true` | Beveiligingsrollen meedeployen |
| `DeployModelRoleMembers` | bool | `false` | Rolleden meedeployen |
| `DeploySharedExpressions` | bool | `true` | Gedeelde M-expressies meedeployen |

**Voorbeeld (magazijnmodel):** ontwikkelen tegen een eigen workspace-database en deployen naar een testwerkruimte, zonder rolleden.

```json
{
  "UseWorkspace": true,
  "WorkspaceConnection": "localhost",
  "WorkspaceDatabase": "Voorraad_Workspace_Born",
  "Deployment": {
    "TargetConnectionString": "powerbi://api.powerbi.com/v1.0/myorg/Magazijn-Test",
    "TargetDatabase": "Voorraad",
    "DeployPartitions": false,
    "DeployModelRoles": true,
    "DeployModelRoleMembers": false
  }
}
```

## Preferences.json en andere TE3-bestanden

TE3 bewaart toepassingsinstellingen in `%LocalAppData%\TabularEditor3\`. Anders dan `.tmuo` mogen deze bestanden tussen gebruikers gedeeld worden.

| Bestand | Inhoud |
|---|---|
| `Preferences.json` | Toepassingsinstellingen (proxy, updates, telemetrie, BPA, opslaan, deploy) |
| `UiPreferences.json` | UI: vensters, editorinstellingen, sneltoetsen, zoek/vervang |
| `Layouts.json` | Opgeslagen vensterindelingen en menu-aanpassingen |
| `RecentFiles.json` | Recent geopende scripts, queries, diagrammen, modellen |
| `RecentServers.json` | Recent gebruikte AS-, Power BI- en Fabric-servers |
| `MacroActions.json` | Macro's (zie [csharp-scripting.md](csharp-scripting.md#macros)) |
| `BPARules.json` | BPA-regels van de gebruiker (zie [bpa-regels.md](bpa-regels.md#locaties-en-volgorde)) |

Een greep uit `Preferences.json` (namen uit het schema van de bron):

| Instelling | Waarden | Betekenis |
|---|---|---|
| `BackgroundBpa` | bool | BPA op de achtergrond laten draaien |
| `BuiltInBpaRules` | `"Enable"`, `"Disable"` | Ingebouwde BPA-regels aan/uit (de `bpa-rules`-bron noemt ook `"EnableWithWarnings"`) |
| `DisabledBuiltInRuleIds` | array | IDs van uitgezette ingebouwde regels |
| `DefaultSaveMode` | `"TMDL"`, `"BIM"`, `"Folder"` | Standaardformaat bij opslaan |
| `SaveToFolder_UseTmdl` | bool | TMDL gebruiken bij Save to Folder |
| `PbiDefaultAuthMode` | `"Integrated"`, `"UsernamePassword"`, `"ServicePrincipal"` | Standaardauthenticatie voor Power BI |
| `BackupOnSave`, `BackupOnDeploy`, `SaveBackupLocation` | bool / string | Back-ups bij opslaan en deployen |
| `CreateUserOptionsForNewModels` | bool | Automatisch een `.tmuo` maken voor nieuwe modellen |
| `ProxyType`, `ProxyAddress`, `ProxyBypassList` | `"None"`, `"System"`, `"Manual"` / string | Proxy-instellingen |
| `CheckForUpdatesOnStartup`, `CollectTelemetry` | bool | Updates en telemetrie |

Alle instellingen met uitleg: https://docs.tabulareditor.com/references/preferences.html. Werk je met het bedrijfs-proxy en lukt aanmelden niet, zie `/troubleshooting/proxy-settings.html`.

**Beheerdersbeleid (Windows).** TE3 en de `te`-CLI lezen registerpolicies uit `Software\Policies\Tabular Editor ApS` (en het oudere `Software\Policies\Kapacity\Tabular Editor`), HKLM vóór HKCU. Bijvoorbeeld `DisableCSharpScripts` blokkeert `te script` en `te bpa run --fix`, `DisableMacros` alle `te macro`-commando's en `DisableBpaDownload` BPA-regels via URL. Werkt een script of URL-regelset bij jou niet terwijl het bij een collega wel werkt, vraag dan IT of zo'n policy actief is. Docs: https://docs.tabulareditor.com/en/references/policies.html

## Configbestanden valideren

De bron levert JSON-schema's voor `Preferences.json`, `UiPreferences.json`, `Layouts.json`, `RecentFiles.json`, `RecentServers.json` en `*.tmuo` (tijdelijk in de bronrepository onder `plugins/tabular-editor/skills/te-docs/schema/`). Met een algemene JSON-schemavalidator controleer je zelf een bestand, bijvoorbeeld:

```bash
check-jsonschema --schemafile schema/tmuo-schema.json Model.Username.tmuo
ajv validate -s schema/preferences-schema.json -d Preferences.json
```

Het `.tmuo`-schema staat extra velden toe; een geldige validatie zegt dus vooral dat de bekende velden het juiste type hebben.

## Handige links

| Onderwerp | Link |
|---|---|
| BPA introductie | https://docs.tabulareditor.com/getting-started/bpa.html |
| BPA-functie en voorbeeldexpressies | https://docs.tabulareditor.com/features/Best-Practice-Analyzer.html, `/features/using-bpa-sample-rules-expressions.html` |
| Ingebouwde BPA-regels (TE3) | https://docs.tabulareditor.com/en/features/built-in-bpa-rules.html |
| C# scripts en macro's | https://docs.tabulareditor.com/getting-started/cs-scripts-and-macros.html, `/features/creating-macros.html` |
| Scriptbibliotheek | https://docs.tabulareditor.com/features/CSharpScripts/csharp-script-library.html |
| User options (`.tmuo`) | https://docs.tabulareditor.com/references/user-options.html |
| Workspace mode | https://docs.tabulareditor.com/features/workspace-mode.partial.html |
| Preferences | https://docs.tabulareditor.com/references/preferences.html |
| TE2 command line | https://docs.tabulareditor.com/features/Command-line-Options.html |
| `te`-CLI | https://docs.tabulareditor.com/en/features/te-cli/te-cli.html (zie ook [cli.md](cli.md)) |
| Community-regels | https://github.com/TabularEditor/BestPracticeRules |
