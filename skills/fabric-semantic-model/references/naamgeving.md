# Naamgeving in semantische modellen

Pas deze conventies toe bij nieuwe modellen. Bij bestaande modellen: blijf consistent met de bestaande naamgeving, tenzij je expliciet vraagt om te standaardiseren of de naamgeving te auditen.

## Kernprincipe

Namen volgen de bedrijfstaal van de mensen die het model gebruiken. Twijfel je, vraag dan welke termen de organisatie gebruikt (bijv. "orderregel" of "orderlijn", "leverancier" of "crediteur"). Het model is de gezaghebbende bron voor bedrijfstermen.

> **Taal.** De bron adviseert voor Copilot de taal waarin vragen gesteld worden (meestal Engels). Werkt je team in het Nederlands, kies dan bewust Nederlands of Engels en houd het in het hele model gelijk. Zie [ai-gereedheid.md](ai-gereedheid.md#2-naamgeving).

## Algemene regels

- Leesbare namen met spaties: geen `CamelCase`, `snake_case` of `UPPER_CASE`.
- Zakelijke namen: `Sales`, `Product`, `Customer` (of `Orders`, `Artikel`, `Klant`). Geen technische termen als `Fact`, `Dim`, `DIM_`, `FACT_`, `STG_`.
- Woorden voluit; geen afkortingen behalve algemeen bekende in het domein (YTD, MTD, QTD; in supply chain bijvoorbeeld OTIF).
- Gebruik je een afkorting, leg die dan uit in de `description` van het object.
- Geen emoji's, tabs, regeleinden of andere afwijkende tekens.
- Geen spatie aan begin of eind.

## Tabelnamen

- Zakelijk en zonder technische prefixen.
- Meervoud voor feittabellen: `Sales`, `Orders`, `Invoices` (bijv. `Orderregels`, `Leveringen`, `Voorraadmutaties`).
- Enkelvoud voor dimensietabellen: `Product`, `Customer`, `Date` (bijv. `Artikel`, `Leverancier`, `Magazijn`, `Datum`).

## Kolomnamen

- Leesbaar met spaties: `Order Date`, `Unit Price`, `Product Category`.
- De belangrijkste omschrijvende kolom van een dimensie heet bij voorkeur als de tabel: `Product` in plaats van `Product Name` in de tabel `Product`.
- Gebruikt Copilot of een Data Agent het model, vermijd dan dezelfde kolomnaam in meerdere tabellen; gebruik dan tabelgekwalificeerde namen als `Product Name`, `Customer Name`.

## Metingnamen

- Duidelijk en beschrijvend: `Total Sales`, `Total Quantity`, `# Customers`.
- `#`-prefix voor tellingen: `# Orders`, `# Products` (bijv. `# Orderregels`, `# Leveringen`).
- Geen programmeernamen: `NetSls`, `TotDelCst`, `inv_lines_cnt`.

### Varianten van een meting

Opbouw: **[Basisnaam] [Periode] ([Eenheid])**

- `Total Sales` — basis
- `Total Sales (ly)` — vorig jaar
- `Total Sales (ytd)` — year-to-date
- `Total Sales (qty)` — hoeveelheidsvariant
- `Gross Margin (%)` — percentage

### Periodeconventies

Kies één conventie en pas die overal in het model toe.

| Conventie | Betekenis |
|---|---|
| `(ly)` | Vorig jaar |
| `(ytd)` | Year-to-date |
| `(qtd)` | Quarter-to-date |
| `(mtd)` | Month-to-date |

### Eenheidsconventies

| Achtervoegsel | Betekenis |
|---|---|
| `(%)` | Percentage |
| `(qty)` | Hoeveelheid |
| `(value)` | Geldwaarde (vaak weggelaten als standaard) |

## Antipatronen

| Antipatroon | Probleem | Correct |
|---|---|---|
| `OrderStatus` | CamelCase | `Order Status` |
| `past_due_orders` | snake_case | `Past Due Orders` |
| `TOTAL_COST` | UPPER_CASE | `Total Cost` |
| `Del. Mrgn %` | Afkorting | `Delivery Margin (%)` |
| `NetSls` | Afkorting + CamelCase | `Net Sales` |
| `FACT_Orders` | Technisch prefix | `Orders` |
| `DIM_Customer` | Technisch prefix | `Customer` |
| `Turnover $$$` | Overbodige tekens | `Turnover` |
| `SM pct 1YP` | Meerdere problemen | `Standard Margin (ly) (%)` |

Typische exportkolommen uit ERP of SharePoint (`ORD_QTY`, `LeverDatumGepland`, `field_3`) hernoem je dus naar bijvoorbeeld `Bestelde hoeveelheid` en `Geplande leverdatum`.

## Displayfolders

Organiseer metingen met `displayFolder` en gebruik dezelfde mappenstructuur voor alle tabellen van hetzelfde soort.

Feittabellen:

```
Measures\
    Value\
    Quantity\
    Counts\
Facts
Keys
```

Dimensietabellen:

```
Attributes
Keys
```

## Beschrijvingen

Elke zichtbare meting en kolom heeft een `description`. Een goede beschrijving:

- legt uit wat het object in bedrijfstermen is;
- verklaart gebruikte afkortingen;
- zegt wanneer je dit object gebruikt in plaats van een vergelijkbaar object;
- is extra belangrijk als Copilot of een Data Agent het model gebruikt.

Slecht: de naam herhalen (`Total Sales` → "The total sales").
