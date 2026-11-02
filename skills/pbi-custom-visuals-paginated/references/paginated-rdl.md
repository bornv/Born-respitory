# RDL-formaat en databronnen

Een gepagineerd rapport is één `.rdl`-bestand: gewone, met de hand te bewerken XML zonder binaire container. Het bevat databronnen, datasets, parameters, pagina-instellingen, lay-out en expressies. Power BI Report Builder is een GUI over dezelfde XML. De fragmenten hieronder komen uit echte `.rdl`-bestanden (Microsoft-samples, PowerBiDevCamp, guyinacube) en volgen de volgorde die Report Builder schrijft en de engine verwacht.

Ontwerp, renderers, paginering en publiceren staan in [paginated-ontwerp.md](paginated-ontwerp.md).

## Inhoud

1. [De hoofdregel: volgorde telt](#1-de-hoofdregel-volgorde-telt)
2. [Root en namespaces](#2-root-en-namespaces)
3. [Volgorde onder `<Report>`](#3-volgorde-onder-report)
4. [Datasets](#4-datasets)
5. [ReportSections, pagina, kop- en voettekst](#5-reportsections-pagina-kop--en-voettekst)
6. [Tablix (tabel, matrix, lijst)](#6-tablix-tabel-matrix-lijst)
7. [Textbox, afbeeldingen, grafieken](#7-textbox-afbeeldingen-grafieken)
8. [Rapportparameters](#8-rapportparameters)
9. [Databronnen](#9-databronnen)
10. [Enter Data](#10-enter-data)
11. [Ongeschreven regels en veelvoorkomende breuk](#11-ongeschreven-regels-en-veelvoorkomende-breuk)

## 1. De hoofdregel: volgorde telt

Report Builder en de report processor verwachten de conventionele volgorde die Report Builder schrijft. Kinderen in een andere volgorde laden als "invalid report definition", zonder bruikbaar regelnummer. De fout komt uit de reader van de processor, niet uit schemavalidatie, dus een XSD-validator vangt een herschikking niet betrouwbaar. Houd bij handmatig bewerken de volgorde hieronder aan. Dit is de nummer-één-oorzaak van een kapot handgeschreven `.rdl`.

De bronrepo bevat een structurele validator, `validate_rdl.py` (alleen Python-standaardbibliotheek). Die controleert well-formed XML, de 2016-namespace, een geldige `rd:ReportID`-GUID, de volgorde van de top-level-elementen, unieke `Name`s, tablix-tellingen, verwijzingen dataset→databron en tablix→dataset, embedded images en eenheden op afmetingen. Expressies en veldnamen controleert hij níet. Wil je hem gebruiken, installeer hem dan zelf uit de bronrepo en draai hem na elke structurele wijziging:

```bash
python3 scripts/validate_rdl.py report.rdl
```

## 2. Root en namespaces

```xml
<?xml version="1.0" encoding="utf-8"?>
<Report MustUnderstand="df"
  xmlns="http://schemas.microsoft.com/sqlserver/reporting/2016/01/reportdefinition"
  xmlns:rd="http://schemas.microsoft.com/SQLServer/reporting/reportdesigner"
  xmlns:cl="http://schemas.microsoft.com/sqlserver/reporting/2010/01/componentdefinition"
  xmlns:df="http://schemas.microsoft.com/sqlserver/reporting/2016/01/reportdefinition/defaultfontfamily">
```

| Punt | Detail |
|---|---|
| Schema | `.../2016/01/reportdefinition` is actueel; gebruik het altijd voor nieuwe bestanden. `2010` en `2005` renderen nog, maar kennen geen `<ReportSections>` (daar staan `<Body>`/`<Page>` direct onder `<Report>`). |
| Prefixen | `rd:` (designer-metadata), `df:` (standaardlettertype), `cl:` (report parts), `am:` (authoring tool + tijdstempel). Declareer alleen wat het bestand gebruikt; `cl:` en `am:` ontbreken vaak. |
| `MustUnderstand="df"` | Verplicht zodra `<df:DefaultFontFamily>` aanwezig is. Haal je er één weg zonder de ander, dan negeren sommige renderers het lettertype. |
| BOM | Microsoft-tools schrijven een UTF-8 BOM. Onschadelijk; de bron raadt aan hem over te nemen als je bestanden programmatisch genereert. |
| `am:` | Optioneel (Report Builder 15.x / SSDT 17.x): `xmlns:am="http://schemas.microsoft.com/sqlserver/reporting/authoringmetadata"`. |

## 3. Volgorde onder `<Report>`

```
rd:ReportUnitType        Inch | Mm  (rd: position varies; see note below)
rd:ReportID              fresh GUID, unique per file
am:AuthoringMetadata     optional
df:DefaultFontFamily     e.g. Segoe UI  (requires MustUnderstand="df")
Description              optional
Author                   optional
AutoRefresh              integer seconds; 0 = off
DataSources
DataSets
ReportSections           the visual content (2016 schema)
ReportParameters         optional; AFTER ReportSections, not before
ReportParametersLayout   optional
--- trailing optional metadata (after ReportParametersLayout, mutual order not load-bearing) ---
Variables                report-scope variables
Code                     embedded VB function library (Code/CodeModules/Classes)
EmbeddedImages           base64 image blobs
CustomProperties         name/value metadata
ConsumeContainerWhitespace
```

Wat écht telt is de structurele reeks: `DataSources` → `DataSets` → `ReportSections` → `ReportParameters` → `ReportParametersLayout`. De metadata ervoor (`rd:ReportUnitType`, `rd:ReportID`, `am:AuthoringMetadata`, `df:DefaultFontFamily`) en de optionele metadata erna hebben geen vaste positie: Report Builder zet `rd:`-elementen soms vooraan en soms achteraan (na `EmbeddedImages`). Herschik metadata die je aantreft niet.

## 4. Datasets

```xml
<DataSet Name="CustomerSales">
  <Query>
    <DataSourceName>SqlDatabase</DataSourceName>
    <QueryParameters>                <!-- before CommandType/CommandText -->
      <QueryParameter Name="@Year">
        <Value>=Parameters!Year.Value</Value>
      </QueryParameter>
    </QueryParameters>
    <CommandType>Text</CommandType>  <!-- omit for inline SQL/DAX; StoredProcedure switches to proc name -->
    <CommandText>SELECT ... WHERE Year = @Year</CommandText>
  </Query>
  <Fields>
    <Field Name="State">           <!-- Name = identifier used in =Fields!State.Value -->
      <DataField>State</DataField> <!-- DataField = column returned by the query -->
      <rd:TypeName>System.String</rd:TypeName>
    </Field>
  </Fields>
</DataSet>
```

- `Name` (de veldnaam in expressies) mag geen spaties bevatten; `DataField` (de teruggegeven kolom) wel. Kolom `Sales Revenue` wordt `Name="Sales_Revenue"`, `DataField="Sales Revenue"`.
- `@param` in `CommandText` bindt aan een `<QueryParameter>` waarvan de `<Value>` een `=Parameters!X.Value`-expressie is. De naam van query- en rapportparameter hoeven niet gelijk te zijn.
- **Escape SQL/DAX in `<CommandText>`:** `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`. DAX `&&` wordt `&amp;&amp;`, `<=` wordt `&lt;=`.
- `<rd:DesignerState>`-blobs in `<Query>` zijn alleen voor de designer; je mag ze weglaten in handgeschreven bestanden.

## 5. ReportSections, pagina, kop- en voettekst

```xml
<ReportSections>
  <ReportSection>
    <Body>
      <ReportItems><!-- Tablix, Chart, Textbox, Image --></ReportItems>
      <Height>3.5in</Height>     <!-- design-time minimum; body grows to fit content -->
      <Style><Border><Style>None</Style></Border></Style>
    </Body>
    <Width>10.5in</Width>        <!-- body width; see the PDF width trap below -->
    <Page>
      <PageHeader>...</PageHeader>
      <PageFooter>...</PageFooter>
      <PageHeight>11in</PageHeight>
      <PageWidth>8.5in</PageWidth>
      <InteractiveHeight>11in</InteractiveHeight>
      <InteractiveWidth>8.5in</InteractiveWidth>
      <LeftMargin>0.5in</LeftMargin>
      <RightMargin>0.5in</RightMargin>
      <TopMargin>0.5in</TopMargin>
      <BottomMargin>0.5in</BottomMargin>
      <Style />
    </Page>
  </ReportSection>
</ReportSections>
```

| Element | Volgorde / regel |
|---|---|
| `<ReportSection>` | `Body`, `Width`, `Page` |
| `<Page>` | `PageHeader`, `PageFooter`, `PageHeight`, `PageWidth`, `InteractiveHeight`, `InteractiveWidth`, marges, `Style` |
| `<PageHeader>`/`<PageFooter>` | `<Height>`, `<PrintOnFirstPage>`, `<PrintOnLastPage>`, dan `<ReportItems>`, dan `<Style>` |
| Afmetingen | Altijd met eenheid (`in`, `cm`, `pt`); een kaal getal is een parse-fout |
| Formaten | Letter = `8.5in` x `11in`; A4 = `21cm` x `29.7cm` |
| Globals | Alleen kop/voet mag `=Globals!PageNumber`, `=Globals!TotalPages` en `=Globals!ExecutionTime` gebruiken |

Let op de **PDF-breedteval**: body-`<Width>` + `LeftMargin` + `RightMargin` moet ≤ `PageWidth` zijn (het fragment hierboven is een liggend formaat met `10.5in` body; bij `8.5in` staand zou dat lege pagina's geven). Zie [paginated-ontwerp.md](paginated-ontwerp.md#3-paginaframe).

## 6. Tablix (tabel, matrix, lijst)

Tabel, matrix en lijst zijn allemaal hetzelfde `<Tablix>`-element; de hiërarchieën maken het verschil. Minimale platte tabel:

```xml
<Tablix Name="Detail">
  <TablixBody>
    <TablixColumns>
      <TablixColumn><Width>1.4in</Width></TablixColumn>
      <TablixColumn><Width>1.4in</Width></TablixColumn>
    </TablixColumns>
    <TablixRows>
      <TablixRow>                       <!-- header row: same shape; Textbox hdrState/hdrSales with literal <Value>State</Value> / <Value>Sales</Value> -->
        ...
      </TablixRow>
      <TablixRow>                       <!-- data row -->
        <Height>0.25in</Height>
        <TablixCells>
          <TablixCell><CellContents>
            <Textbox Name="State"><CanGrow>true</CanGrow><KeepTogether>true</KeepTogether>
              <Paragraphs><Paragraph><TextRuns><TextRun><Value>=Fields!State.Value</Value><Style/></TextRun></TextRuns><Style/></Paragraph></Paragraphs>
              <Style><Border><Style>None</Style></Border></Style></Textbox>
          </CellContents></TablixCell>
          <TablixCell><CellContents>
            <Textbox Name="Sales"><CanGrow>true</CanGrow><KeepTogether>true</KeepTogether>
              <Paragraphs><Paragraph><TextRuns><TextRun><Value>=Sum(Fields!Sales.Value)</Value>
                <Style><Format>'$'#,0.00;('$'#,0.00)</Format></Style></TextRun></TextRuns><Style/></Paragraph></Paragraphs>
              <Style><Border><Style>None</Style></Border></Style></Textbox>
          </CellContents></TablixCell>
        </TablixCells>
      </TablixRow>
    </TablixRows>
  </TablixBody>
  <TablixColumnHierarchy>
    <TablixMembers><TablixMember /><TablixMember /></TablixMembers>  <!-- one per column -->
  </TablixColumnHierarchy>
  <TablixRowHierarchy>
    <TablixMembers><TablixMember /><TablixMember /></TablixMembers>  <!-- one per row -->
  </TablixRowHierarchy>
  <DataSetName>CustomerSales</DataSetName>
  <Top>0.6in</Top><Left>0.2in</Left><Height>0.5in</Height><Width>2.8in</Width>
  <Style><Border><Style>None</Style></Border></Style>
</Tablix>
```

**Telregels die de engine afdwingt** (de meest gemaakte fout bij handwerk, vaak off-by-one):

1. Aantal `TablixColumnHierarchy/TablixMembers`-kinderen = aantal `<TablixColumn>`.
2. Aantal `TablixRowHierarchy/TablixMembers`-kinderen = aantal `<TablixRow>`.
3. Elke `<TablixRow>` heeft evenveel `<TablixCell>` als er kolommen zijn. `<ColSpan>` in `<CellContents>` is een merge-hint en verandert de telling niet.

Positie en grootte (`Top`, `Left`, `Height`, `Width`) komen ná de hiërarchieën en `<DataSetName>`.

### Groeperen en drill-down

Een rijgroep voegt `<Group>` toe en nest onderliggende members:

```xml
<TablixRowHierarchy>
  <TablixMembers>
    <TablixMember />                          <!-- static header -->
    <TablixMember>
      <Group Name="ByCountry">
        <GroupExpressions><GroupExpression>=Fields!Country.Value</GroupExpression></GroupExpressions>
      </Group>
      <SortExpressions><SortExpression><Value>=Fields!Country.Value</Value></SortExpression></SortExpressions>
      <TablixMembers>
        <TablixMember><KeepWithGroup>After</KeepWithGroup></TablixMember>
        <TablixMember>
          <Group Name="BySalesperson">
            <GroupExpressions><GroupExpression>=Fields!Salesperson.Value</GroupExpression></GroupExpressions>
          </Group>
          <TablixMembers><TablixMember /></TablixMembers>
          <Visibility><Hidden>true</Hidden><ToggleItem>ByCountry</ToggleItem></Visibility>  <!-- drill-down -->
        </TablixMember>
      </TablixMembers>
    </TablixMember>
  </TablixMembers>
</TablixRowHierarchy>
```

- `<Group Name>` moet uniek zijn binnen de data region. Report Builder maakt groepsnamen rapportbreed uniek; hernoem dus groepen als je een tablix in een bestaand rapport kopieert.
- `<Visibility><Hidden>true</Hidden><ToggleItem>` geeft klik-om-uit-te-klappen.
- `<KeepWithGroup>` (`After`/`Before`) plus `<RepeatOnNewPage>` houdt groepskoppen en -voeten vast over pagina-einden.

Voorbeeld (warehouse): voor een picklijst groepeer je op `=Fields!Ordernummer.Value` in plaats van `Country` en laat je de drill-down weg; de sortering op picklocatie doe je in de query.

## 7. Textbox, afbeeldingen, grafieken

**Textbox:** een `<Textbox>` bevat `<Paragraphs>` → `<Paragraph>` → `<TextRuns>` → `<TextRun>`, elk met een eigen `<Style>`. Gemengde opmaak in één cel = meerdere text runs. Een `<Value>` die met `=` begint is een VB.NET-expressie, anders een letterlijke tekst. `xml:space="preserve"` op `<Value>` bewaart witruimte; `<CanGrow>true</CanGrow>` laat de box verticaal groeien; `<ZIndex>` bepaalt de stapelvolgorde.

**Afbeeldingen:**

```xml
<EmbeddedImages>
  <EmbeddedImage Name="Logo">
    <MIMEType>image/png</MIMEType>
    <ImageData>iVBORw0KGgo...base64...</ImageData>
  </EmbeddedImage>
</EmbeddedImages>
```

Een `<Image>`-item verwijst ernaar met `<Source>Embedded</Source>` en `<Value>Logo</Value>`. `<Source>`: `Embedded` | `External` (URL) | `Database` (veld). `<Sizing>`: `AutoSize` | `Fit` | `FitProportional` | `Clip`.

**Grafieken:** `<Chart>` volgt het tablix-idee: `<ChartCategoryHierarchy>` (x), `<ChartSeriesHierarchy>` (reeksen) en `<ChartData><ChartSeriesCollection><ChartSeries>` met `<ChartDataPoints>` en `<ChartDataPointValues><Y>=Sum(...)</Y>`. `<Type>` (`Line`, `Column`, `Bar`) en `<Subtype>` (`Smooth`, `Stacked`) staan op `<ChartSeries>`. Een sparkline is een `<Chart>` in een `<TablixCell>` met `<Visible>False</Visible>` en `<Margin>False</Margin>` op de assen. Grafiek-XML is zeer uitgebreid: **kopieer een werkende `<Chart>` uit een voorbeeldrapport** in plaats van hem te typen (zie [paginated-ontwerp.md](paginated-ontwerp.md#10-voorbeeldrapporten)).

## 8. Rapportparameters

```xml
<ReportParameters>
  <ReportParameter Name="Year">
    <DataType>Integer</DataType>          <!-- String|Integer|Float|DateTime|Boolean -->
    <DefaultValue>                         <!-- static, or use <DataSetReference> for dynamic -->
      <Values><Value>2025</Value></Values>
    </DefaultValue>
    <Prompt>Year:</Prompt>
    <ValidValues>                          <!-- populate dropdown from a dataset -->
      <DataSetReference>
        <DataSetName>dsYears</DataSetName>
        <ValueField>CalendarYear</ValueField>
        <LabelField>CalendarYear</LabelField>
      </DataSetReference>
    </ValidValues>
  </ReportParameter>
</ReportParameters>
```

- Volgorde zoals Report Builder schrijft: `DataType`, `DefaultValue`, `Prompt`, `ValidValues`, dan `MultiValue` als die er is. De XSD dwingt het niet af, maar zo laadt het schoon.
- `<MultiValue>true</MultiValue>` voor meervoudige selectie; `<Nullable>true</Nullable>` en `<AllowBlank>true</AllowBlank>` waar nodig.
- `<ReportParametersLayout>` (een `<GridLayoutDefinition>` met `<CellDefinition>` en `ColumnIndex`/`RowIndex`/`ParameterName`) bepaalt het raster van het parametervenster. Een leeg element is geldig; parameters die er niet in staan, zijn verborgen.
- **Cascade:** de `ValidValues`-dataset van een kindparameter krijgt de ouder als queryparameter. Elke stap is bij elke wijziging een aparte query; in de Service sequentieel en traag. Houd cascades ondiep.

### Drie plekken die moeten kloppen

1. De `<ReportParameter>` (type, multi-value, standaardwaarde, keuzelijst).
2. De `<QueryParameter>` in de dataset met `<Value>=Parameters!X.Value</Value>`.
3. De verwijzing `@x` in de query.

**`@`-prefix verschilt per provider** (veelvoorkomende bindfout):

| Provider | `<QueryParameter Name>` | In de query |
|---|---|---|
| DAX / `PBIDATASET` | Zonder `@`: `Name="Category"` | `@Category` |
| SQL / Azure SQL | Met `@`: `Name="@Category"` | `@Category` |

## 9. Databronnen

Een gepagineerd rapport in de Power BI-service bevat zijn databronnen en datasets zelf; gedeelde `.rds`/`.rsd` worden niet ondersteund (`<DataSourceReference>` werkt dus niet in de Service). `<DataSource Name>` moet een geldige XML-NCName zijn (geen spaties).

| Bron | `DataProvider` | Query | Opmerkingen |
|---|---|---|---|
| Power BI semantisch model | `PBIDATASET` | DAX (`EVALUATE`) | Kolom = `Table[Col]`, measure = `[Measure]`; measures komen terug als `System.String` |
| SQL Server (on-prem) | `SQL` | T-SQL of stored procedure | Gateway nodig in de Service |
| Azure SQL | `SQLAZURE` | T-SQL of stored procedure | Authenticatie na upload instellen in workspace-instellingen |
| Analysis Services | `OLEDB-MD` | MDX | Geëscapete XML-veldverwijzingen; liever een tabular DAX-pad |
| Inline testdata | `ENTERDATA` | Embedded `<XmlData>` | Geen bron; alle velden `System.String` |
| Snowflake, Databricks, Redshift e.v.a. | via Power Query Online ("Get Data") | – | Draait als rekenlaag |

`rd:SecurityType`: `Integrated` (serviceaccount), `DataBase` (opgeslagen gebruiker/wachtwoord), `None` (tokenauth / `PBIDATASET`).

### Semantisch model (`PBIDATASET`, DAX)

```xml
<DataSource Name="PowerBiDataset">
  <ConnectionProperties>
    <DataProvider>PBIDATASET</DataProvider>
    <ConnectString>Data Source=pbiazure://api.powerbi.com/;Identity Provider="https://login.microsoftonline.com/organizations, https://analysis.windows.net/powerbi/api, f0b72488-7082-488a-a7e8-eada97bd842d";Initial Catalog=sobe_wowvirtualserver-REPLACE_WITH_DATASET_GUID;Integrated Security=ClaimsToken</ConnectString>
  </ConnectionProperties>
  <rd:SecurityType>None</rd:SecurityType>
  <rd:DataSourceID>3e55b9bf-61f0-43eb-ab21-db8881352d00</rd:DataSourceID>
  <rd:PowerBIWorkspaceName>REPLACE_WITH_WORKSPACE_NAME</rd:PowerBIWorkspaceName>
  <rd:PowerBIDatasetName>REPLACE_WITH_DATASET_NAME</rd:PowerBIDatasetName>
</DataSource>
```

Niet-onderhandelbare delen van de connect string:

| Deel | Regel |
|---|---|
| `Data Source=pbiazure://api.powerbi.com/` | Altijd precies zo |
| `Identity Provider="<authority>, https://analysis.windows.net/powerbi/api, f0b72488-7082-488a-a7e8-eada97bd842d"` | De GUID `f0b72488-...` is in elk bestand gelijk. Authority: `https://login.microsoftonline.com/organizations` voor organisatieaccounts, `.../common` voor multi-tenant |
| `Initial Catalog=sobe_wowvirtualserver-<datasetGUID>` | Prefix heeft geen gedocumenteerd alternatief; de GUID is de object-ID van het semantische model |
| `Integrated Security=ClaimsToken` | Altijd precies zo; gebruikt het OAuth-token van de kijker (SSO) |

`rd:PowerBIWorkspaceName`/`rd:PowerBIDatasetName` zijn alleen labels voor Report Builder; de GUID in `Initial Catalog` bindt echt. De GUID is de item-ID van het semantische model; hoe je items in een workspace opzoekt staat in `fabric-basis`.

**Veldnamen in DAX-datasets:**

```xml
<DataSet Name="Sales">
  <Query>
    <DataSourceName>PowerBiDataset</DataSourceName>
    <CommandText>EVALUATE SUMMARIZECOLUMNS('Customers'[State], "Sales Revenue", [Sales Revenue])</CommandText>
  </Query>
  <Fields>
    <Field Name="State">
      <rd:TypeName>System.String</rd:TypeName>
      <DataField>Customers[State]</DataField>     <!-- column: Table[Column] -->
    </Field>
    <Field Name="Sales_Revenue">
      <rd:TypeName>System.String</rd:TypeName>     <!-- measures come back as String -->
      <DataField>[Sales Revenue]</DataField>       <!-- measure: [Measure] (no table) -->
    </Field>
  </Fields>
</DataSet>
```

- Kolom: `DataField` = `TableName[ColumnName]` (tabelnaam mag spaties hebben). Tabelprefix vergeten = "field not found" bij runtime.
- Measure: `DataField` = `[MeasureName]`, zonder tabel. Een gealiaste measure (`"Sales", [Sales Amount]`) komt terug als `[Sales]`.
- `rd:TypeName`: kolommen houden hun type (integer → `System.Int64`, decimaal → `System.Decimal`, datum → `System.DateTime`, tekst → `System.String`). **Measures zijn altijd `System.String`** (voorgeformatteerd); cast met `=CDbl(Fields!X.Value)` voordat je rekent.
- Schrijf en test de DAX eerst tegen het live model (DAX-queryweergave in Desktop, of zie `fabric-semantic-model`) en plak dan de `EVALUATE` geëscapet in `<CommandText>`. Geen ongeteste DAX in een rapport.

**Robuust patroon: enkelvoudige parameter via `TREATAS`** (render-bewezen in de `semantic-model-starter.rdl` van de bron):

```xml
<QueryParameters>
  <QueryParameter Name="Category"><Value>=Parameters!Category.Value</Value></QueryParameter>
</QueryParameters>
<CommandText>EVALUATE
SUMMARIZECOLUMNS (
  'Product'[Category],
  TREATAS ( { @Category }, 'Product'[Category] ),
  "Sales", [Sales Amount]
)
ORDER BY [Sales] DESC</CommandText>
```

De engine vervangt `@Category` door de gekozen waarde; `{ @Category }` wordt een tabel van één rij die `TREATAS` als filter toepast.

Voorbeeld (warehouse), zelfde patroon voor een picklijst per order; tabel- en kolomnamen zijn fictief, vervang ze door die van je model:

```xml
<QueryParameters>
  <QueryParameter Name="Ordernummer"><Value>=Parameters!Ordernummer.Value</Value></QueryParameter>
</QueryParameters>
<CommandText>EVALUATE
SUMMARIZECOLUMNS (
  'Orderregel'[Ordernummer],
  'Orderregel'[Picklocatie],
  'Artikel'[Artikelnummer],
  'Artikel'[Omschrijving],
  TREATAS ( { @Ordernummer }, 'Orderregel'[Ordernummer] ),
  "Aantal", [Te picken aantal]
)
ORDER BY 'Orderregel'[Picklocatie]</CommandText>
```

**Meervoudige selectie is fragiel: `RSCustomDaxFilter`.** Multi-value parameters expanderen niet netjes in gewone DAX; Report Builder gebruikt daarom het token `RSCustomDaxFilter(@param, EqualToCondition, [Table].[Column], DataType)`, gemarkeerd met `<rd:UserDefined>true</rd:UserDefined>`. Het is geen standaard-DAX; de processor herschrijft het. Het is gevoelig voor opmaak en spaties in kolomnamen: met de hand geschreven over `[Customers].[Account Type]` faalde het renderen met "Failed to resolve name ." Laat Report Builder het genereren (of kopieer een geverifieerd voorbeeld), houd de spatiëring exact, en render om te testen. Is multi-select niet essentieel, kies dan `TREATAS`.

Overige regels: DirectQuery op een semantisch model heeft een vaste query-time-out van 10 minuten; gebruik voor langere queries het XMLA-endpoint als brontype. Data source rules (connectie-overrides bij publiceren) werken niet voor Direct Lake-modellen.

### SQL Server en Azure SQL

```xml
<!-- Azure SQL with stored credentials -->
<DataSource Name="SqlDatabase">
  <ConnectionProperties>
    <DataProvider>SQLAZURE</DataProvider>
    <ConnectString>Data Source=server.database.windows.net;Initial Catalog=SalesDB;Encrypt=True;TrustServerCertificate=False;Authentication="Sql Password"</ConnectString>
    <Prompt>Specify a user name and password for data source SqlDatabase:</Prompt>
  </ConnectionProperties>
  <rd:SecurityType>DataBase</rd:SecurityType>
  <rd:DataSourceID>6df07dcb-6238-496d-bfc8-d9fe88df9029</rd:DataSourceID>
</DataSource>

```

- On-prem SQL Server: `<DataProvider>SQL</DataProvider>`, `<IntegratedSecurity>true</IntegratedSecurity>` en `<rd:SecurityType>Integrated</rd:SecurityType>`.
- Inline T-SQL (`<CommandType>` weg of `Text`) of stored procedure (`<CommandType>StoredProcedure</CommandType>`, `<CommandText>` = procnaam).
- `rd:TypeName` volgt het SQL-type (`System.String`, `System.Decimal`, `System.Int32`, `System.DateTime`); numerieke velden accepteren direct een numerieke `<Format>`.
- On-prem SQL Server heeft in de Service een enterprise data gateway nodig. Azure SQL is direct bereikbaar, maar het authenticatietype stel je na de eerste upload in bij de workspace-instellingen.

### Analysis Services en overige bronnen

`OLEDB-MD` verbindt met SSAS / Azure AS via MDX. De MDX-designer schrijft `<DataField>`-waarden als geëscapete XML-fragmenten (`Level` of `Measure` met unieke naam); met de hand foutgevoelig. Genereer ze in Report Builder of kies een tabular DAX-pad. Azure AS is voor gepagineerde rapporten niet via een gateway bereikbaar.

Direct Lake / SQL-endpoint: SSO + OAuth2, behandel als semantisch model of Azure SQL. Dataverse: SSO/OAuth2, geen gateway mogelijk. Oracle, Teradata, ODBC: alleen via enterprise gateway.

### Welke bron kies je

| Situatie | Bron |
|---|---|
| Model met businesslogica, RLS en measures bestaat al (bijv. naast een bestaand Power BI-rapport) | `PBIDATASET`; hergebruik de measures |
| Operationele detaildata, hoge rijaantallen (pakbonnen, overzichten, exports), sterschema overbodig | Azure SQL / SQL Server; filter en aggregeer in de query |
| Alleen lay-out, demo of zelfstandig voorbeeld | Enter Data |

Welke bron ook: **filter en aggregeer in de query.** Filters in de RDL (dataset/tablix) werken pas ná het volledig ophalen.

## 10. Enter Data

Enter Data zet een vaste, getypeerde dataset direct in de `.rdl`: geen verbinding, geen gateway. Gebruik het om lay-out en paginering af te maken vóórdat je de echte bron koppelt, en voor kleine statische keuzelijsten.

```xml
<DataSource Name="EnterDataDS">
  <ConnectionProperties>
    <DataProvider>ENTERDATA</DataProvider>
    <ConnectString/>
  </ConnectionProperties>
  <rd:SecurityType>None</rd:SecurityType>
  <rd:DataSourceID>00000000-0000-0000-0000-0000000000ed</rd:DataSourceID>
</DataSource>

<DataSet Name="SalesData">
  <Query>
    <DataSourceName>EnterDataDS</DataSourceName>
    <CommandText>&lt;Query&gt;&lt;XmlData&gt;&lt;Rows&gt;
      &lt;Row&gt;&lt;Country&gt;USA&lt;/Country&gt;&lt;Year&gt;2024&lt;/Year&gt;&lt;Sales&gt;125000&lt;/Sales&gt;&lt;/Row&gt;
      &lt;Row&gt;&lt;Country&gt;UK&lt;/Country&gt;&lt;Year&gt;2024&lt;/Year&gt;&lt;Sales&gt;87000&lt;/Sales&gt;&lt;/Row&gt;
    &lt;/Rows&gt;&lt;/XmlData&gt;&lt;/Query&gt;</CommandText>
  </Query>
  <Fields>
    <Field Name="Country"><DataField>Country</DataField><rd:TypeName>System.String</rd:TypeName></Field>
    <Field Name="Year"><DataField>Year</DataField><rd:TypeName>System.String</rd:TypeName></Field>
    <Field Name="Sales"><DataField>Sales</DataField><rd:TypeName>System.String</rd:TypeName></Field>
  </Fields>
</DataSet>
```

- Het binnenste `<Query><XmlData><Rows><Row>`-document staat geëscapet in `<CommandText>`; elk kindelement van `<Row>` koppelt op naam aan een veld.
- Alle velden zijn `System.String`; cast voor rekenen of opmaak: `=Sum(CDbl(Fields!Sales.Value))`.
- Werkt zonder configuratie in de Power BI-service. Op Power BI Report Server (PBIRS) moet de `ENTERDATA`-extensie eerst geregistreerd worden; zie [paginated-ontwerp.md](paginated-ontwerp.md#8-ontwikkellus-en-publiceren).
- [`examples/paginated/enter-data-starter.rdl`](../examples/paginated/enter-data-starter.rdl) is zo opgezet: kopieer het, geef `rd:ReportID` een nieuwe GUID, en geef de Enter Data-velden dezelfde namen als de velden van je latere echte query. Dan raakt het omwisselen alleen `<DataSource>` en `<DataSet><Query>`, nooit de lay-out. Let op: de starter is staand **Letter** met `7.5in` body; voor A4 pas je `PageHeight`/`PageWidth` en de breedtes aan.

## 11. Ongeschreven regels en veelvoorkomende breuk

| Regel | Detail |
|---|---|
| Volgorde telt | `ReportParameters` ná `ReportSections`; `QueryParameters` vóór `CommandText`; `EmbeddedImages` ná `ReportParametersLayout` |
| Nieuwe `rd:ReportID` per bestand | Hergebruikte GUID's botsen in de servercatalogus. Templates met vaste GUID (app-owns-data) altijd vernieuwen |
| `Name` uniek per namespace | Namespace = het binnenste omhullende element met een `Name`. Twee tablixen mogen elk een groep "Detail" hebben; alleen dubbele namen in dezelfde scope breken |
| Tablix-tellingen | Zie [§6](#6-tablix-tabel-matrix-lijst); `ColSpan` verandert de celtelling niet |
| `rd:`-kinderen | Mogen voor of na schema-elementen staan (`rd:TypeName` voor of na `<DataField>`); positie is niet bepalend |
| Escape in `<CommandText>` | Ongeëscapete `<`, `>`, `&` maken het document kapot |
| Eenheden verplicht | `0.5in`, niet `0.5`. Uitzondering: de interne coördinaten van charts, gauges en maps zijn eenheidloos |
| NCNames | `<DataSource Name>` en veld-`Name` beginnen met letter/underscore, geen spaties |
| `<Language>` optioneel | Report Builder laat hem meestal weg (locale van de kijker). Een vaste cultuur (bijv. `en-US`) overschrijft die voor opmaak; een `=`-expressie overschrijft de browser-/Power BI-taal niet. Niet toevoegen als verplicht, maar ook niet weghalen uit een bestaand rapport |
