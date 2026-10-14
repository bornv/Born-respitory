# Tabular Editor CLI: naslag

Detail bij [SKILL.md](../SKILL.md). Bronnen: `te2-cli` (SKILL.md, auth-and-cicd) en `te-cli` (SKILL.md, command-reference, gotchas, te2-migration, config-cicd-env, get-te-cli).

Alle commando's hieronder voer je zelf uit in je terminal of pipeline.

## Inhoud

1. [Welke CLI?](#welke-cli)
2. [TE2: TabularEditor.exe](#te2-tabulareditorexe)
3. [te: installeren en basis](#te-installeren-en-basis)
4. [te: BPA](#te-bpa)
5. [te: scripts en macro's](#te-scripts-en-macros)
6. [te: andere commando's](#te-andere-commandos)
7. [Van TE2 naar te](#van-te2-naar-te)
8. [CI/CD](#cicd)
9. [Valkuilen](#valkuilen)

## Welke CLI?

| Situatie | Keuze |
|---|---|
| Bestaande Windows-pipeline met `TabularEditor.exe` die werkt | TE2 CLI mag blijven; die is stabiel en ondersteund |
| Nieuw, of macOS/Linux, of je wilt dry runs, JSON-uitvoer en BPA-gate bij deploy | `te`, met de kanttekening dat de preview na **2026-10-31** stopt; houd TE2 als terugvaloptie |
| Alleen BPA draaien op een lokaal model | Beide: `TabularEditor.exe Model.bim -A rules.json` of `te bpa run --model ./model --rules rules.json` |

## TE2: TabularEditor.exe

Gratis, alleen Windows (op Mac/Linux via een Windows-VM of -container). Download: https://github.com/TabularEditor/TabularEditor/releases of `choco install tabulareditor2`.

### Bronnen

```bash
TabularEditor.exe Model.bim                     # model.bim
TabularEditor.exe definition/                   # TMDL-map
TabularEditor.exe "localhost\tabular" "AdventureWorks"
TabularEditor.exe "powerbi://api.powerbi.com/v1.0/myorg/WorkspaceName" "ModelName"
TabularEditor.exe localhost:PORT DatabaseName   # Power BI Desktop
```

De poort van Power BI Desktop vind je in de diagnostische bestanden van PBIDesktop of met tools zoals DAX Studio.

### Scripts, opslaan, BPA

```bash
TabularEditor.exe Model.bim -S "Info(Model.Name);"            # inline
TabularEditor.exe Model.bim -S script1.csx -S script2.csx     # op volgorde
TabularEditor.exe Model.bim -S script.csx -B Output.bim       # opslaan als .bim
TabularEditor.exe Model.bim -S script.csx -TMDL output/       # opslaan als TMDL
TabularEditor.exe Model.bim -A rules.json                     # BPA
TabularEditor.exe Model.bim -A rules.json -V                  # BPA met Azure DevOps-uitvoer
TabularEditor.exe Model.bim -A rules.json -G                  # BPA met GitHub Actions-uitvoer
TabularEditor.exe Model.bim -AX rules.json                    # BPA zonder regels uit het model
TabularEditor.exe Model.bim -SC                               # schema check tegen de bron
```

BPA met de Microsoft-regelset rechtstreeks van GitHub:

```bash
TabularEditor.exe Model.bim ^
    -A https://raw.githubusercontent.com/microsoft/Analysis-Services/master/BestPracticeRules/BPARules.json ^
    -V
```

### Deploy

```bash
TabularEditor.exe Model.bim -D "powerbi://api.powerbi.com/v1.0/myorg/Workspace" "SemanticModel" -O -C
```

| Flag | Lang | Betekenis |
|---|---|---|
| `-O` | `-OVERWRITE` | Bestaande database overschrijven |
| `-C` | `-CONNECTIONS` | Databronnen deployen/overschrijven |
| `-P` | `-PARTITIONS` | Partities deployen/overschrijven |
| `-R` / `-M` | `-ROLES` / `-MEMBERS` | Rollen / rolleden |
| `-S` | `-SHARED` | Gedeelde expressies (alleen ná `-D`; anders is `-S` een script) |
| `-E` | `-ERR` | Exitcode ≠ 0 bij fouten van AS |
| `-W` | `-WARN` | Waarschuwingen voor niet-verwerkte objecten |
| `-F` | `-FULL` | Volledig (`-O -C -P -S -R -M`) |
| `-X` | `-XMLA` | Alleen XMLA/TMSL-script genereren |
| `-L` | `-LOGIN` | Geen integrated security |
| `-Y` | `-SKIPPOLICY` | Incremental-refresh-partities overslaan |

Exitcode `0` = gelukt; `1` = fout (scriptfout, deploy mislukt, BPA-overtreding met severity ≥ 3).

### Authenticatie

Service principal via omgevingsvariabelen (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`) of in de connection string:

```
Provider=MSOLAP;
Data Source=powerbi://api.powerbi.com/v1.0/myorg/Workspace;
User ID=app:CLIENT_ID@TENANT_ID;
Password=CLIENT_SECRET
```

Problemen: "Database not found" → naam exact, toegang tot de workspace, XMLA-endpoint aan. "Authentication failed" → variabelen, workspace-toegang van de service principal, API-rechten.

## te: installeren en basis

**Preview:** werkt niet meer na 2026-10-31 (00:00 UTC op 1 november); tijdens de preview is geen licentie nodig. Feedback: https://github.com/TabularEditor/CLI.

Installeren: download via https://tabulareditor.com of van de CDN (`https://cdn.tabulareditor.com/files/cli/latest/<archive>`): `te-win-x64.zip`, `te-win-arm64.zip`, `te-osx-x64.tar.gz`, `te-osx-arm64.tar.gz`, `te-linux-x64.tar.gz`, `te-linux-arm64.tar.gz`. Eén binary, geen .NET nodig. Zet de map in je `PATH`.

```powershell
# Windows (PowerShell)
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
$dir  = "$env:LOCALAPPDATA\Programs\te"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Invoke-WebRequest "https://cdn.tabulareditor.com/files/cli/latest/te-win-$arch.zip" -OutFile "$env:TEMP\te.zip"
Expand-Archive -Force "$env:TEMP\te.zip" -DestinationPath $dir
[Environment]::SetEnvironmentVariable('Path', "$([Environment]::GetEnvironmentVariable('Path','User'));$dir", 'User')
& "$dir\te.exe" --version
```

Basisregels:

1. Controleer eerst `te --version` en `te auth status`; aanmelden met `te auth login`.
2. Gebruik `te <command> --help`; flags veranderen nog tijdens de preview.
3. **Het model is altijd een flag**: `--model ./model` (lokaal) of `-s <workspace> -d <model>` (gepubliceerd). Een pad aan het eind wordt geweigerd.
4. **Eigenschappen met `-p Naam=Waarde`**: `te get Sales/Revenue -p Expression`, `te set Sales/Revenue -p FormatString="#,0" --save`. Welke namen er zijn: `te get <pad> --properties`.
5. **Elke wijziging is een dry run tot `--save`** (`set`, `add`, `remove`, `move`, `script`, `macro run`, `bpa run --fix`). Je ziet eerst een voor/na-diff.
6. **`te deploy` en `te refresh` doen niets zonder `--execute`**; ze tonen dan het TMSL. In CI: `--execute --force --non-interactive`.
7. **`--output-format json`** als je de uitvoer in een script verwerkt.
8. **Geen secrets op de command line**: `--auth env` met `AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET`/`AZURE_TENANT_ID`, of stdin (`-p -`).
9. Lokale Analysis Services (Power BI Desktop via `--local`) werkt alleen op Windows.

## te: BPA

```bash
te bpa run --model ./model                                   # met ingebouwde + modelregels
te bpa run --model ./model --rules ./rules/BPARules.json --fail-on warning
te bpa run --fail-on error --ci github --output-format json
te bpa run --rule TE3_BUILT_IN_SET_ISAVAILABLEINMDX_FALSE --path Sales
te bpa run --fix --model ./model                              # fixes in geheugen, diff tonen
te bpa run --fix --save --stat --model ./model                # fixes opslaan
```

| Flag | Betekenis |
|---|---|
| `-r, --rules <file-or-url>` | Regelbestand (herhaalbaar; vervangt de gebruikerslaag) |
| `--no-defaults` | Zonder ingebouwde TE3-regels |
| `--no-model-rules` | Zonder regels uit modelannotaties |
| `--rule <id>` | Alleen deze regel(s) |
| `--path <filter>` | Alleen een deel van het model, bijv. `"Sales/*"` |
| `--vpax <file>` | VertiPaq-statistieken voor regels die cardinaliteit gebruiken |
| `--fail-on error\|warning` | Wanneer de exitcode ≠ 0 wordt (standaard `error`) |
| `--ci github\|vsts`, `--trx <file>` | CI-annotaties en testresultaten |
| `--fix`, `--save` | Fixes toepassen en opslaan |

Regels beheren:

```bash
te bpa rules list --all --no-multiline
te bpa rules add MEASURE_NEEDS_DESCRIPTION --name "Measures need a description" --scope Measure --expression "not IsHidden and string.IsNullOrEmpty(Description)" --severity 2
te bpa rules set MEASURE_NEEDS_DESCRIPTION -p severity=3
te bpa rules ignore <id>          # negeren via modelannotatie
te bpa rules disable TE3_BUILT_IN_DATE_TABLE_EXISTS
```

Alle `bpa rules`-commando's nemen `--rules-file <path>` of `--model-rules`. Ingebouwde regels kun je niet wijzigen: zet de ingebouwde regel uit en voeg een kopie toe onder een nieuwe ID.

Regellagen: gebruikersregels (één bron wint: `--rules` → `TE_BPA_RULES` → config `bpa.rules`), ingebouwde regels (`TE3_BUILT_IN_*`, uit met `--no-defaults` of `bpa.builtInRules=false`) en modelregels. Elke ID wordt één keer geëvalueerd. De CLI leest geen TE3-installatiepad; regels configureer je expliciet (`te config set bpa.rules …` of `te bpa rules init`).

BPA-gate: standaard aan bij `te deploy` en `te save-as`. Uitzetten met `--skip-bpa` (log dat duidelijk), automatisch fixen met `--fix-bpa`, of via config: `te config set bpa.onDeploy false`, `bpa.onSave false`. Config-sleutels staan onder `bpa.` (niet `bpaOnDeploy`).

JSON-uitvoer (`validate`, `bpa run`, `test run`, `query` delen één vorm): `{command, durationMs, summary{errors,warnings,info,total}, findings[]}`; per finding o.a. `severity`, `code` (de regel-ID), `message`, `object`, `objectPath` (direct bruikbaar in `te get`), `fixable`.

## te: scripts en macro's

```bash
te script fix.csx --model ./model                             # dry run
te script fix.csx --model ./model --save
te script --inline "Model.AllMeasures.FormatDax();" --save --model ./model
te script --file fix.csx --validate                           # alleen compileren, geen model nodig
te macro run "Format DAX" --on "Sales/Revenue" --save
```

- Bronnen: `--file` (herhaalbaar) of `--inline` (`-` = stdin); oude flags `-S`, `--script`, `-e` werken niet.
- `te script` geeft exitcode ≠ 0 als het script `Error(...)` aanroept; wijzigingen van vóór de fout worden met `--save` wél opgeslagen.
- In scripts is `TECLI` gedefinieerd; `SelectMeasure()`/`SelectTable()`/`SelectObject(s)()` geven een fout.
- Bulk: één `te script` met een C#-lus is sneller dan veel losse `te set`-aanroepen (elke aanroep start ca. 1–2 s op).
- Windows-beleid `DisableCSharpScripts` blokkeert `te script` en `te bpa run --fix`; `DisableMacros` blokkeert `te macro`; `DisableBpaDownload` blokkeert regels via URL. Dat los je niet op in de CLI; dat is een beheerdersbesluit.

## te: andere commando's

| Taak | Commando |
|---|---|
| Model samenvatten | `te get . --model ./model`, `te list --model ./model`, `te list Measures` |
| Zoeken | `te find "Revenue" --in names --paths-only --model ./model` (`--in expressions|descriptions|displayFolders|formatStrings|annotations|all`) |
| Eigenschap lezen/zetten | `te get Sales/Revenue -p Expression`; `te set Sales/Revenue -p Expression="SUM(Sales[Amount])" --save` |
| Measure toevoegen | `te add "_Measures/Margin" -t Measure -p Expression="[Revenue]-[COGS]" --save` |
| Valideren | `te validate --errors-only --model ./model` |
| DAX formatteren | `te set <pad> --format Expression --save`; los: `te util format-dax "<dax>"` |
| Ongebruikte verborgen objecten | `te deps --unused --hidden --model ./model` |
| Query op gepubliceerd model | `te query "EVALUATE TOPN(10, Sales)" -s ws -d model` |
| Opslaan/omzetten | `te save-as -o ./out --serialization tmdl --model ./model` (`tmdl`, `bim`, `pbip`, `database.json`) |
| Deploy (dry run → echt) | `te deploy --model ./model --target-server ws --target-database model` → `… --execute --force` |

Let op: bij `te deploy` zijn `-s`/`-d` de **bron**; het doel is `--target-server`/`--target-database`. Commando's die DAX uitvoeren (`query`, `vertipaq`, `refresh`, `test run`) hebben een gepubliceerd model nodig; `--model` alleen geeft "No server specified".

## Van TE2 naar te

Compat-modus: `TE_COMPAT=te2 te Model.bim -S fix.csx -D server db -O` (of de binary hernoemen naar `te2`). Volledige tabel: `te util migrate`; één flag: `te util migrate -A`.

| TE2 | te |
|---|---|
| `<file>` positioneel | `--model <path>` |
| `-S <file.csx>` | `te script --file <file.csx> [--save]` |
| `-A <rules>` | `te bpa run --rules <file-or-url>` |
| `-AX <rules>` | `te bpa run --rules <file-or-url> --no-model-rules` |
| `-B <file>` | `te save-as --model <model> -o <file.bim> --serialization bim` |
| `-TMDL <dir>` | `te save-as --model <model> -o <dir> --serialization tmdl` |
| `-D <server> <db>` | `te deploy --model <model> --target-server <server> --target-database <db> --execute` |
| `-O` | standaard bij uitvoeren (`--create-only` om uit te zetten) |
| `-C` / `-P` / `-R` / `-M` | `--deploy-connections` / `--deploy-partitions` / `--deploy-roles` / `--deploy-role-members` |
| `-FULL` (na `-D`) | `--deploy-full` |
| `-X <file>` | `te deploy ... > <file>` (zonder `--execute`) |
| `-V` / `-G` | `--ci vsts` / `--ci github` |
| `-T <file>` | `--trx <file>` |
| `-L <user> <pass>` | nog niet; gebruik `te auth login -u -p -t` of `--auth env` |
| `-SC` | nog niet geïmplementeerd |

Verschillen: `te deploy`/`refresh` zijn standaard een dry run; `te deploy`/`save-as` draaien standaard een BPA-gate (TE2 niet); `te script` faalt bij `Error(...)` (TE2 meldde succes); geen `start /wait` nodig.

Migratiestappen uit de bron: eerst `te` (of `te2`) in plaats van `TabularEditor.exe` en controleren dat de pipeline draait; dan per flaggroep omzetten (`-A/-AX` → `te bpa run`, `-D` → `te deploy --execute --force`, `-V/-G` → `--ci`); tot slot `--non-interactive` overal en service-principal-authenticatie in plaats van `-L`.

## CI/CD

Twee pipelines, één artefact: een PR-validatie die geen workspace raakt (validate + BPA op de TMDL in de repo) en een deploypipeline die dezelfde TMDL via dev → test → prod uitrolt.

GitHub Actions (PR):

```yaml
- name: Validate model
  run: te validate --model ./model --ci github --trx validate.trx --non-interactive
- name: BPA gate
  run: te bpa run --model ./model --rules ./rules/BPARules.json --fail-on error --ci github --trx bpa.trx --non-interactive
- name: Lint C# scripts (no model needed)
  run: te script --file ./scripts/fix.csx --validate
```

Azure DevOps: dezelfde commando's met `--ci vsts`. Deploy met `te deploy --model ./model --target-server "$(WORKSPACE)" --target-database "$(MODEL)" --auth env --execute --force --ci vsts --non-interactive`.

TE2 in Azure DevOps:

```yaml
steps:
  - task: PowerShell@2
    displayName: 'Deploy Semantic Model'
    inputs:
      targetType: 'inline'
      script: |
        TabularEditor.exe "$(Build.SourcesDirectory)/Model.bim" `
          -D "$(XMLA_ENDPOINT)" "$(MODEL_NAME)" -O -C
```

Snelheid in buildscripts: `te config set bpa.onSave false` (één BPA-run aan het eind in plaats van bij elke save) en `te config set spinner false`. Tijdens de preview is er alleen het `latest`-kanaal; commit de binary als je reproduceerbare builds wilt.

## Valkuilen

| Wat je ziet | Oorzaak / oplossing |
|---|---|
| `Unrecognized option '-q'` | `-q`/`-i` bestaan niet meer; gebruik `-p Naam=Waarde` |
| `Unrecognized command or argument './model'` | Model als `--model ./model` meegeven |
| `Dry run - nothing saved. Add --save to persist.` | Zo bedoeld; herhaal met `--save` |
| Deploy/refresh doet niets | `--execute` (en in CI `--force --non-interactive`) |
| `No server specified` | Commando heeft een gepubliceerd model nodig: `-s`/`-d` |
| `Unknown key` bij `bpaOnDeploy` | Gebruik `bpa.onDeploy` |
| `te connect` "vergeten" | Status geldt per shell; geef `--model`/`-s`/`-d` steeds mee of zet `TE_SESSION=<naam>` |
| `Unrecognized option '--vpa-rules'` | Bestaat niet meer; zet `VPA_*`-regels in je eigen regelbestand en gebruik `--vpax <file>` |
| Naam met spatie of `{ } * ?` | Quoten: `"Sales 2024/Revenue"`, `te get "Tables/'{foo}'"` |
| `autoFormat` herformatteert DAX die je niet aanraakte | `te config set autoFormat false` |
| `te validate` slaagt maar partitie is kapot | `validate` controleert geen M; controleer partities apart |
| Exitcode 1 bij deploy terwijl metadata is geschreven | Server heeft objecten met fouten geparkeerd; los het model op in plaats van opnieuw te deployen |

Docs: https://docs.tabulareditor.com/en/features/te-cli/te-cli.html (overzicht), `/te-cli-commands.html`, `/te-cli-auth.html`, `/te-cli-cicd.html`, `/te-cli-limitations.html`. TE2: https://docs.tabulareditor.com/features/Command-line-Options.html.
