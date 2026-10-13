# Naamgevingsregels

Referentie voor pass 2 van [model-organiseren.md](model-organiseren.md). Dit zijn standaarden; de eigen, gedocumenteerde conventies en termen van de organisatie gaan altijd voor. **fabric-semantic-model** (`naamgeving.md`) hanteert een vergelijkbare set met een andere periodenotatie (`(ly)`, `(ytd)`); kies per model één conventie en houd je daaraan.

## Kernprincipe

Namen volgen de bedrijfstaal van de mensen in de organisatie. Ga nooit uit van terminologie: bevestig die bij de gebruiker of leid haar af uit bestaande patronen in het model. Het model hoort de gezaghebbende bron voor terminologie te zijn.

Nederlandstalig model? Dezelfde regels gelden: leesbare namen met spaties, geen afkortingen, één begrip één woord (bijv. altijd `Leverdatum`, niet afwisselend `Lev.datum` en `Delivery Date`).

## 1. Leesbare namen, geen programmeerconventies

Title Case met spaties: elk hoofdwoord met hoofdletter, korte lidwoorden, voegwoorden en voorzetsels klein tenzij ze vooraan staan (`Days of Supply`, `Net Sales by Region`), acroniemen in hoofdletters (`YTD`, `COGS`, `ID`). Geen CamelCase, snake_case, UPPER_CASE.

| Fout | Goed |
|---|---|
| `OrderStatus` | `Order Status` |
| `past_due_orders` | `Past Due Orders` |
| `TOTAL_COST` | `Total Cost` |
| `net_sales_previous_year` | `Net Sales 1YP` |
| `TurnoverMTD` | `Turnover MTD` |
| `SellMrgn%` | `Selling Margin (%)` |

Detectiepatronen in TMDL:

- `measure [a-z]+_[a-z]+`: snake_case-metingen
- `measure [A-Z][a-z]+[A-Z]`: CamelCase-metingen
- `measure [A-Z_]{4,}`: UPPER_CASE-metingen
- dezelfde patronen voor `column`-declaraties

## 2. Geen afkortingen

Woorden voluit. Uitzonderingen alleen voor algemeen bekende afkortingen (MTD, YTD, QTD) of standaard bedrijfsacroniemen die in de beschrijving worden uitgelegd.

| Fout | Goed |
|---|---|
| `Del. Mrgn %` | `Delivery Margin (%)` |
| `TFS` | `Total Freight Surcharge` |
| `COGS` | `Total Net Invoice COGS` (met beschrijving die COGS uitlegt) |
| `T&CF` | `Total Taxes & Commercial Fees` |
| `NetSls` | `Net Sales` |
| `TotDelCst` | `Total Delivery Cost` |
| `inv_lines_cnt` | `Invoice Lines` |
| `frght` | `Freight` |
| `shp_dt` | `Ship Date` |
| `CustKey` | `Customer Key` |
| `BillDocTypeCd` | `Billing Document Type Code` |
| `NI_COGS` | `Net Invoice COGS` |

Detectie:

- namen korter dan 5 tekens die geen gewoon woord zijn;
- punten gevolgd door een spatie (afkortingspunten): `\w+\.\s`;
- weggelaten klinkers: 3 of meer medeklinkers achter elkaar;
- woorden van één of twee letters die geen voorzetsel of lidwoord zijn.

## 3. Geen technische prefixen

Geen `DIM_`, `FACT_` of vergelijkbaar op tabelnamen. Gebruik tabelgroepen in Tabular Editor voor de indeling in feiten en dimensies.

| Fout | Goed |
|---|---|
| `DIM_Customer` | `Customer` |
| `FACT_Invoices` | `Invoices` |
| `DIM_Date` | `Date` |
| `stg_Orders` | `Orders` |

Uitzondering: veldparameters mogen `FP_` en calculation groups `CG_` krijgen als ze niet zichtbaar zijn voor eindgebruikers of het AI-schema. Technische tabellen zoals `__Measures` of `__Formatting` mogen een underscore-prefix hebben.

Detectie: `table (DIM|FACT|dim|fact|STG|stg|RAW|raw)_`.

## 4. Geen overbodige symbolen

Geen emoji, rijen dollartekens, Unicode-versiering of andere afwijkende tekens.

| Fout | Goed |
|---|---|
| `Turnover $$$` | `Turnover` |
| `Revenue $$` | `Revenue` |
| `SELL_MARGIN_$` | `Selling Margin (Value)` |

Detectie: namen met `$` of `#` (behalve `#` in telmetingen zoals `# Customers`), emoji, herhaalde speciale tekens.

## 5. Aggregatiesyntaxis

Eén conventie, overal. Aanbevolen: standaardafkortingen als achtervoegsel na de basisnaam.

- `MTD`, `QTD`, `YTD`; `Weekly Average`, `Daily Average` voor voortschrijdend.
- `Turnover MTD`, `Budget QTD`, `Net Sales YTD`.

| Fout | Goed |
|---|---|
| `mtd_turnover_ly` | `MTD Turnover 1YP` |
| `TurnoverMTD` | `Turnover MTD` |
| `MonthToDateSales` | `Sales MTD` |

## 6. Eenheden

Eenheid tussen haakjes: `Measure Name (Unit)`.

- valuta waar nodig: `(EUR)`, `(USD)`;
- `(%)` voor percentages;
- `(Quantity)` voor hoeveelheden;
- `(Value)` voor geldwaarde (standaard, soms weggelaten);
- `(Units)` of `(pcs)` voor stuks.

| Fout | Goed |
|---|---|
| `SellMrgn%` | `Selling Margin (%)` |
| `SELL_MARGIN_$` | `Selling Margin (Value)` |
| `TrnOvr_Qty` | `Turnover (Quantity)` |
| `SM pct 1YP` | `Selling Margin 1YP (%)` |

## 7. Perioden

Aanbevolen: `nYP` (n Year Prior): `1YP` = vorig jaar, `2YP` = twee jaar terug, `1MP` = vorige maand (indien nodig). Periode na de basisnaam, vóór de eenheid: `Turnover 1YP`, `Net Sales 2YP`, `Selling Margin 1YP (%)`.

| Fout | Goed |
|---|---|
| `Turnover_Last_Year` | `Turnover 1YP` |
| `T.O. Qty PY` | `Turnover 1YP (Quantity)` |
| `TRNVR_2YR` | `Turnover 2YP` |
| `DM val 2 yrs ago` | `Delivery Margin 2YP (Value)` |
| `net_sales_previous_year` | `Net Sales 1YP` |
| `S.M. % LY` | `Standard Margin 1YP (%)` |

## 8. Vergelijkingen

`Base Measure vs. Target (Unit)`:

- `Turnover vs 1YP (%)`: procentuele afwijking t.o.v. vorig jaar;
- `Budget MTD vs. Turnover (delta)`: absolute afwijking;
- `Forecast vs. Turnover (%)`: procentuele afwijking t.o.v. forecast.

Kies consequent: altijd `(delta)` of altijd het deltasymbool; altijd `vs.` (met punt) of altijd `vs` (zonder).

## Volgorde in een metingnaam

```
[Aggregation] [Base Name] [Period] ([Unit])
```

- `Turnover`
- `Turnover (Quantity)`
- `Turnover 1YP`
- `Turnover 1YP (Quantity)`
- `MTD Turnover 1YP`
- `Turnover vs 1YP (%)`
- `MTD Turnover vs 1YP (%)`

Voorbeeld magazijn: `Picked Lines`, `Picked Lines MTD`, `Picked Lines 1YP`, `Picked Lines vs 1YP (%)`, `On Time Delivery (%)`.

## Kolommen

1. Volledige, leesbare namen met spaties.
2. Normale hoofdletters, geen snake_case of CamelCase.
3. Geen afkortingen.
4. Verborgen sleutelkolommen mogen het patroon `[Table Name] Key` volgen.
5. In display folders per doel (Hierarchy, Attributes, Keys, Facts).

## Synoniemen (voorbereiding op AI)

Bij "Prep your data for AI" of synoniemen instellen:

- alleen echte synoniemen die mensen in de organisatie gebruiken;
- overweeg meertalige synoniemen in een internationale organisatie (bijv. `Levering` en `Delivery`);
- synoniemen helpen vooral AI-/agentvragen.

Zie verder **fabric-semantic-model** (AI-gereedheid).

## Terminologie afstemmen vóór hernoemen

Hernoem niet voordat de bedrijfstaal bekend is. Vraag, of leid af uit bestaande namen en rapporten en laat bevestigen:

1. de woorden voor kernmetrics (Revenue, Turnover, Sales, Gross Sales; of Omzet, Afzet);
2. een al bestaande, gedocumenteerde naamgevingsstandaard;
3. de conventie voor vorige periode (1YP, PY, Prior Year, Last Year);
4. de eenheidsconventie ((%), (Value), (Quantity)).

Toon daarna de voorgestelde hernoemingen gegroepeerd per probleem (programmeerconventies, afkortingen, inconsistente periode-/eenheid-/aggregatiesyntaxis, technische prefixen) en vraag bevestiging vóór je ze doorvoert.

## Hernoemingen doorvoeren

- **Tabular Editor**: `Name` wijzigen herschrijft DAX-verwijzingen als Automatic Formula Fix-up aan staat. Controleer daarna een afhankelijke meting.
- **TMDL zonder Tabular Editor**: hernoem de declaratie en pas daarna elke `[Old Name]`- en `'Table'[Old Column]`-verwijzing aan in heel `definition/` (tabellen, `relationships.tmdl`, `functions.tmdl`, rollen, perspectieven, culturen). Sluit af met `rg -n "<old name>" definition/`: die mag niets meer vinden.
- **Rapporten**: bindingen herstellen met de pbir CLI (`pbir fields replace` of `pbir fields replace-table`), die je zelf kunt installeren; bewerk rapport-JSON niet met de hand. Zie ook **fabric-powerbi-report** voor rebinden.
