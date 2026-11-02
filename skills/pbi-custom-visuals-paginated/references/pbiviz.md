# Eigen custom visual met pbiviz

Een developer visual is een TypeScript/D3-visual, geschreven tegen `powerbi-visuals-api`, gebouwd met de `pbiviz`-CLI (`powerbi-visuals-tools`) en verpakt als `.pbiviz`. Herbruikbaar in alle rapporten, deelbaar via AppSource, volledig interactief, met eigen opmaakvenster en optionele certificering.

**Wanneer:** een herbruikbare, interactieve, distribueerbare visual met eigen opmaakvenster. Voor één grafiek in één rapport zijn Deneb, een SVG-measure of een scriptvisual vrijwel altijd sneller.

## Vereisten

| Wat | Detail |
|---|---|
| Node.js | 20.19 of hoger |
| `pbiviz`-CLI | `npx -y powerbi-visuals-tools <command>` of globaal installeren |
| Live preview | Developer visual inschakelen in Power BI Desktop, of developer mode in de Power BI-service |

## Werkwijze

1. **Scaffold:** `pbiviz new <VisualName>` maakt `src/visual.ts`, `capabilities.json`, `pbiviz.json`, `tsconfig.json`, `package.json`, `style/`, `assets/`.
2. **Visual-klasse:** implementeer `IVisual` in `src/visual.ts`. De klassenaam moet gelijk zijn aan `visualClassName` in `pbiviz.json`. Precies één zo'n klasse per project.
3. **Data en opmaak declareren** in `capabilities.json`: `dataRoles`, `dataViewMappings`, `objects`.
4. **Opmaakmodel** bouwen met `powerbi-visuals-utils-formattingmodel`. Kaartnaam = objectnaam in `capabilities.json`; slicenaam = eigenschapsnaam.
5. **Live preview:** `pbiviz start`, de developer visual aan een rapport toevoegen en itereren met echte data. (`pbiviz install-cert` installeert het SSL-certificaat dat live preview nodig heeft.)
6. **Verpakken:** `pbiviz package` maakt de `.pbiviz` in `dist/`; importeer die in een rapport.

## CLI

| Commando | Doel |
|---|---|
| `pbiviz new <Name>` | Nieuw project |
| `pbiviz start` | Compileren en serveren voor live preview |
| `pbiviz package` | `.pbiviz` bouwen in `dist/` |
| `pbiviz package --certification-audit` | Onveilige `fetch`/`XMLHttpRequest`/`eval` signaleren |
| `pbiviz package --certification-fix` | Verboden aanroepen uit **bibliotheken** strippen (eigen code zelf aanpassen) |
| `pbiviz info` | Metadata van het project tonen |
| `pbiviz install-cert` | SSL-certificaat voor live preview |

Na `--certification-fix`: werk het `npm run package`-script bij zodat de pakkethash bij de certificeringsreview klopt.

De bron noemt ook een MCP-server in `powerbi-visuals-tools` (`pbiviz mcp`) met hulp voor API's, best practices en certificering; die is optioneel en deze skill hangt er niet van af.

## Projectstructuur

```
MyVisual/
  pbiviz.json            visual metadata: visualClassName, displayName, guid, author, supportUrl, gitHubUrl
  capabilities.json      data roles, dataView mappings, formatting objects, feature flags
  package.json           dependencies + scripts (must expose an eslint script for certification)
  tsconfig.json          TypeScript config
  src/
    visual.ts            the IVisual implementation (class name == visualClassName)
    settings.ts          formatting settings model (optional split)
  style/
    visual.less          styles
  assets/
    icon.png             20x20 visuals-pane icon
```

Zet `node_modules`, `.tmp` en `dist` in `.gitignore`; certificering weigert een repo die ze meecommit.

## IVisual-levenscyclus

```typescript
export class Visual implements IVisual {
    constructor(options: VisualConstructorOptions) {
        // create the root element, instantiate services (selection, tooltip, formatting)
    }
    public update(options: VisualUpdateOptions): void {
        // read options.dataViews, options.viewport, then render
    }
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        // return the format-pane model (API v5+; replaces enumerateObjectInstances)
    }
    public destroy(): void {
        // optional cleanup
    }
}
```

`update` vuurt bij nieuwe data, formaatwijziging, filter, cross-highlight en bookmark. Vertak op `options.type` als het werk per trigger verschilt.

## capabilities.json

| Sleutel | Inhoud |
|---|---|
| `dataRoles` | Veldbakken: `name`, `kind` (`Grouping` / `Measure` / `GroupingOrMeasure`), `displayName` |
| `dataViewMappings` | Hoe rollen de dataView vullen (`categorical`, `table`, `matrix`, `single`); condities voor min/max velden |
| `objects` | Eigenschappen in het opmaakvenster (text, numeric, bool, fill, …); zie `examples/pbiviz/capabilities-objects.json` |
| `privileges` | Benodigde rechten (`WebAccess`, `ExportContent`, `LocalStorage`); lege array als geen |

Optionele vlaggen: `supportsHighlight`, `supportsKeyboardFocus`, `sorting`, `drilldown`, `tooltips`, `supportsLandingPage`, `advancedEditModeSupport`.

Opmaakmodel: een `Model` bevat `cards`; verberg kaarten/groepen/slices dynamisch met `visible: false`; `analyticsPane: true` zet een kaart in het analysevenster.

Belangrijke npm-pakketten: `powerbi-visuals-api` (pin op de API-versie van de host), `powerbi-visuals-tools`, `powerbi-visuals-utils-formattingmodel`, de `powerbi-visuals-utils-*`-helpers (chart, dataview, svg, type, interactivity, tooltip), en `eslint-plugin-powerbi-visuals` (vereist voor certificering).

## Certificering en publiceren

Publiceren naar AppSource is optioneel; certificering is een verdere optionele stap. Gecertificeerde visuals kunnen geëxporteerd worden naar PowerPoint en renderen in e-mailabonnementen.

| Eis | Detail |
|---|---|
| Repository | Eén visual per repo; een lowercase `certification`-branch die overeenkomt met het pakket; reviewers leestoegang |
| Bestanden | `.gitignore` (zonder `node_modules`, `.tmp`, `dist`), `capabilities.json`, `pbiviz.json`, `package.json`, `package-lock.json`, `tsconfig.json` |
| Afhankelijkheden | `typescript`, `eslint`, `eslint-plugin-powerbi-visuals`; `package.json` bevat `"eslint": "npx eslint . --ext .js,.jsx,.ts,.tsx"` |
| Moet slagen | `npm install`, `pbiviz package`, `npm audit` (geen high/moderate), eslint zonder fouten |
| Code | Geen `eval`, `fetch`, `XMLHttpRequest`, geen externe services; laatste `powerbi-visuals-api`; geen R-visual |

Publiceren naar AppSource:

1. Vul `pbiviz.json` aan: `description`, `supportUrl`, `author`, `name`, `email`.
2. `pbiviz package` en een voorbeeld-`.pbix` maken.
3. Beide indienen in Partner Center als Power BI visual-aanbieding.
4. Voor certificering de optie aanvinken, notities en de `certification`-branch opgeven.
5. Eerst publiceren, dan certificering aanvragen; de review duurt even.

## Leren van bestaande visuals

Microsoft publiceert de broncode van officiële en gecertificeerde visuals. Begin met de tutorials `circlecard` en `sampleBarChart`, en lees een productievisual die op je doel lijkt: `gantt`, `sankey`, `sunburst`, `timeline`, `ChicletSlicer`.
