# Model organiseren: de passes in detail

Een model klaarmaken voor rapportbouwers, Excel-gebruikers en Copilot. Organiseren is een reeks passes over dezelfde objecten. Doe ze allemaal tenzij de scope bewust beperkt is, en meld welke je overslaat en waarom. Niet voor DAX-performance (**fabric-semantic-model**) of voor sterschema- en ontwerpwijzigingen (**fabric-semantic-model**, `modelleren.md`).

## Inhoud

- [Gereedschap](#gereedschap)
- [Pass 0: inventaris en lineage](#pass-0-inventaris-en-lineage)
- [Pass 1: tabelgroepen en display folders](#pass-1-tabelgroepen-en-display-folders)
- [Pass 2: namen](#pass-2-namen)
- [Pass 3: hiërarchieën](#pass-3-hiërarchieën)
- [Pass 4: sortering](#pass-4-sortering)
- [Pass 5: verbergen](#pass-5-verbergen)
- [Pass 6: Analyze in Excel](#pass-6-analyze-in-excel)
- [Pass 7: beschrijvingen](#pass-7-beschrijvingen)
- [Pass 8: format strings](#pass-8-format-strings)
- [Pass 9: data categories](#pass-9-data-categories)
- [Pass 10: context-annotatie](#pass-10-context-annotatie)
- [Pass 11: berekende tabellen en kolommen](#pass-11-berekende-tabellen-en-kolommen)
- [Pass 12 en 13: DAX-code en UDF's](#pass-12-en-13-dax-code-en-udfs)
- [Pass 14: duplicaten](#pass-14-duplicaten)
- [Pass 15: perspectieven, vertalingen en rollen](#pass-15-perspectieven-vertalingen-en-rollen)
- [Afronden](#afronden)

## Gereedschap

| Situatie | Gereedschap |
|---|---|
| Model open in Power BI Desktop, Tabular Editor 3 beschikbaar | TE3 als externe tool; C#-scripts |
| PBIP/TMDL op schijf, geen TE3 | Tabular Editor CLI `te` of TMDL bewerken (zie **fabric-semantic-model**, `tmdl.md`) |
| Alleen Power BI Desktop | Handmatig in het modelvenster; Claude levert per object de waarden |

- **Eén script per pass.** In TE3 is één script één undo-stap (Ctrl+Z), dus per pass blijft elke wijziging te controleren en apart terug te draaien.
- **Controleer na elk script** of elke bedoelde eigenschap is gezet en niets anders is geraakt. Annotaties (`TableGroup`, `context`) lees je apart terug.
- **Sluit DAX-editortabbladen** van objecten die een script wijzigt. Een script dat een object bewerkt terwijl de editor het parset, heeft TE3 laten crashen (`IndexOutOfRangeException` in `ScrollbarIndicatorsController`).
- **Opslaan doe je zelf.** Op een live verbinding schrijft opslaan direct naar de server.
- Een berekende tabel die nooit herberekend is, geeft geen data tot hij ververst is.

## Pass 0: inventaris en lineage

Vóór je iets wijzigt:

1. Leg de startsituatie vast: tabellen, kolommen, metingen, functies, bestaande display folders, tabelgroepen, hiërarchieën, culturen, perspectieven, rollen en annotaties.
2. Zoek afnemers (zie SKILL.md, [Lineage en impactanalyse](../SKILL.md#lineage-en-impactanalyse)): rapporten op het model in elke workspace en composite models erbovenop. Hernoemen, verwijderen en pass 6 hangen hiervan af.
3. Noteer de culturen. Sommige TE-bewerkingen schrijven automatisch vertaalde captions (een hiërarchie toevoegen doet dat), en hernoemen laat bestaande vertalingen naar het nieuwe object wijzen.

## Pass 1: tabelgroepen en display folders

- **Tabelgroepen**: `table.TableGroup` (opgeslagen als annotatie `TabularEditor_TableGroup`). Gebruik rolgebaseerde groepen: `Facts`, `Dimensions`, `Measures`, `Calculation Groups`, `Parameters`. Groepen zijn alleen zichtbaar in Tabular Editor en komen niet in Power BI; daarom horen tabelnamen géén `DIM_`/`FACT_`-prefix te krijgen.
- **Display folders**: elke zichtbare kolom en meting in een folder. Mik op **3 tot 5 topfolders per tabel**. Meer dan 5 betekent dat de tabel onderwerpen mengt of de folders te fijn zijn. Een grotere bestaande structuur die al vóór deze sessie bestond, laat je staan.
- Nesten alleen met `/` (`Keys/Technical`); een backslash nest niet. Eén niveau is meestal genoeg.
- Genummerde prefixen sturen de volgorde als alfabetisch niet klopt.
- Folders op verborgen objecten zijn onzichtbaar. Zet ze wel, zodat een latere unhide op een logische plek landt, maar besteed er geen topfolder aan.

Voorbeeldindeling feitentabel `Orderregels`:

```
1. Measures
2. Facts
3. Degenerate Dimensions
4. Keys
```

Voorbeeldindeling dimensie `Artikel`:

```
1. Artikelhiërarchie
2. Attributes
3. Keys
```

## Pass 2: namen

Title Case-bedrijfsnamen voor tabellen, kolommen, metingen en hiërarchieën (`Order Date`, `Net Sales`, `Days of Supply`), acroniemen in hoofdletters, geen programmeerconventies, geen technische prefixen, geen onverklaarde afkortingen, en één consistente syntaxis voor aggregaties, eenheden, perioden en vergelijkingen. Volledige regels: [naamgeving.md](naamgeving.md).

- **Eén begrip, één woord, overal.** `Customer Key`, `Customer`, `Cust` voor hetzelfde in verschillende tabellen worden één vorm; kwalificaties met betekenis (`Billing Date`, `Order Date`) blijven. Kies één keer enkelvoud of meervoud voor tabelnamen.
- Kolommen van een berekende tabel binden via `SourceColumn` aan de uitvoer van de expressie. Alleen het kolomobject hernoemen volstaat zolang `SourceColumn` nog klopt; verandert de expressie, houd `SourceColumn` gelijk, anders valt de kolom weg bij herberekenen.
- Hernoemen in Tabular Editor neemt relaties, sort-by-kolommen, hiërarchieniveaus, vertalingen en perspectieflidmaatschap mee, en hernoemt de partitie van een berekende tabel mee.
- **Vóór hernoemen**: toon de oud→nieuw-lijst en waarschuw dat visuals, filters, bladwijzers en veldparameters die aan de oude naam hangen, breken. Zonder akkoord geen renames op een model met gekoppelde rapporten.

## Pass 3: hiërarchieën

Voeg de natuurlijke drill-paden toe: kalender (Year > Quarter > Month > Date), fiscale kalender als die bestaat, geografie (Country > Region > City), product (Category > Subcategory > Product), organisatie. Voorbeeld magazijn: Vestiging > Magazijn > Locatie. Sla een hiërarchie over als de niveaus niet echt genest zijn.

## Pass 4: sortering

Elke tekstkolom met een niet-alfabetische natuurlijke volgorde krijgt een `SortByColumn`:

- maandnamen op maandnummer;
- maandlabels (`Mar 2025`) op een jaar-maandsleutel;
- weekdagnamen op weekdagnummer;
- statussen en buckets (bijv. orderstatus, leverbetrouwbaarheidsklasse) op een expliciete volgordekolom.

De sorteersleutel moet **precies één waarde per sorteerwaarde** hebben, anders faalt de refresh.

## Pass 5: verbergen

Verberg wat rapportbouwers niet in een visual horen te slepen:

- surrogaat- en vreemde sleutels;
- sorteersleutels en technische kolommen;
- numerieke feitkolommen die alleen via een meting geaggregeerd horen te worden (verberg ze en zorg dat de meting bestaat).

Verberg tabellen die alleen relaties of metingen ondersteunen. Verberg géén kolom die een hiërarchie of zichtbare slicer nodig heeft.

## Pass 6: Analyze in Excel

`IsAvailableInMDX = false` verwijdert de attribuuthiërarchie van een kolom: minder verwerking en geheugen, en de kolom verdwijnt uit Excel-draaitabellen en andere MDX-clients.

- Kandidaten volgen de TE3 BPA-regel `TE3_BUILT_IN_SET_ISAVAILABLEINMDX_FALSE`: verborgen kolommen die niet gebruikt worden voor sortering, in hiërarchieën, variaties of kalenders, zonder eigen sort-by-kolom en niet in een Direct Lake-tabel.
- Excel-gebruik verschijnt niet als gekoppeld rapport. Controleer gekoppelde Excel-werkmappen in de lineage en, met beheerrechten, `AnalyzedByExternalApplication`-events in het activiteitenlogboek. Is er Excel- of ander MDX-gebruik: meld welke kolommen het raakt in plaats van ze stil uit te zetten.

## Pass 7: beschrijvingen

Elke zichtbare tabel, kolom, meting, hiërarchie en functie krijgt een beschrijving, tenzij naam en metadata al alles zeggen. Zo kort als kan, zo lang als nodig: alleen wat de naam niet zegt (formaat, voorbeeldwaarde, grain, uitsluitingen, eenheid of valuta, een uitgeschreven acroniem, wat een meting aggregeert).

Herhaal **nooit** wat de metadata al toont: naam, objecttype, tabel, bronkolom, datatype, format string, sort-by-kolom, hiërarchieniveaus, relaties of berekend-status. Een beschrijving die daar niets aan toevoegt, blijft leeg.

Schrijfstijl (ongeveer 80% richting ASD-STE100 Simplified Technical English): korte zinnen, één feit per zin, eenvoudige woorden, actief en tegenwoordige tijd, geen Latijnse afkortingen (`Example:`, niet `e.g.`; in het Nederlands `Voorbeeld:`, niet `bijv.`). Veldnamen, productnamen, codes en formaatpatronen laat je zoals ze zijn. Twee of meer feiten: elk op een eigen regel als `- `-bullet; één feit blijft één regel.

| Object | Beschrijving |
|---|---|
| `Month Label` | `Example: Mar 2025` |
| `Month Sort` | `- Format: YYYYMM\n- Example: 202503` |
| `Net Sales` | `Invoice value after discounts and returns.\n- Local currency\n- Does not include freight or taxes` |
| `Backorder Quantity` (voorbeeld) | `Ordered quantity not yet shipped.\n- Pieces\n- Excludes cancelled order lines` |

In TMDL schrijf je een beschrijving als `///`-regel boven het object:

```tmdl
/// Net orders exclude cancellation document types
measure 'Net Orders' =
```

Copilot kapt beschrijvingen af na 200 tekens (zie **fabric-semantic-model**, AI-gereedheid).

## Pass 8: format strings

Formatteer elke zichtbare meting en numerieke kolom: scheidingstekens, valuta, percentage, decimalen die bij de data passen. Gebruik een format string-expressie (`FormatStringDefinition`) als het formaat van de context afhangt, bijvoorbeeld de gekozen valuta. Datumformaten zijn hoofdlettergevoelig: `MM` is maand, `mm` is minuten, dus `yyyy-MM-dd`, nooit `yyyy-mm-dd`.

## Pass 9: data categories

Zet `DataCategory` waar het clientgedrag verandert:

- geografie: `Country`, `StateOrProvince`, `City`, `PostalCode`, `County`, `Continent`, `Latitude`, `Longitude`, `Place`;
- `WebUrl`, `ImageUrl`, `Barcode` (handig voor artikelnummers of locatiecodes die als barcode gescand worden).

De datumtabel krijgt op tabelniveau `DataCategory = "Time"` en de datumkolom `IsKey = true`.

## Pass 10: context-annotatie

Voeg een annotatie `context` toe (`obj.SetAnnotation("context", "...")`) aan objecten waarvan het doel niet uit de naam of metadata blijkt: role-playing sleutels, hulptabellen, kolommen voor RLS of een calculation group, losgekoppelde parametertabellen, alles wat bewaard blijft voor een afnemer verderop. Een sorteersleutel heeft er geen nodig; `SortByColumn` zegt al wat hij sorteert. Schrijf in de stijl van pass 7 waarom het object bestaat, bijvoorbeeld: "Kept for the Finance export; not used in reports."

## Pass 11: berekende tabellen en kolommen

Elke DAX-berekende tabel en -kolom moet zich in één korte zin in zijn `context`-annotatie rechtvaardigen: waarom in het model berekend, waarom nodig, en waarom niet uit de bron (bijvoorbeeld: afgeleid uit meerdere feitentabellen bij refresh, afhankelijk van modelrelaties, of de bron is een alleen-lezen view). Is er geen geldige reden: adviseer verplaatsen naar de bron (Power Query, view of dataflow) in plaats van een reden te verzinnen.

## Pass 12 en 13: DAX-code en UDF's

Zie [dax-code-en-udfs.md](dax-code-en-udfs.md): opmaak, `_`- en `@`-prefixen, code actions, commentaar, en herhaalde logica als UDF voorstellen met samengestelde naam, type-hints en documentatie.

## Pass 14: duplicaten

Een veld dat een ander dupliceert (zelfde waarden onder een andere naam, tweede kopie van een sleutel, ongebruikte meting die dezelfde logica herhaalt) mag alleen weg als niets het gebruikt:

- geen modelafhankelijkheid (`ReferencedBy` leeg);
- geen RLS- of perspectiefgebruik;
- geen rapport, Excel-werkmap of composite model in de lineage van pass 0.

Toon de lijst met verwijderingen vóór je ze doorvoert.

## Pass 15: perspectieven, vertalingen en rollen

- **Perspectieven**: lidmaatschap is bewust en actueel. Nieuwe objecten vallen standaard buiten bestaande perspectieven; voeg toe wat erbij hoort, inclusief de kolommen die een zichtbare meting nodig heeft.
- **Vertalingen**: elke cultuur dekt elke zichtbare tabel, kolom, meting, hiërarchie en display folder, met captions en beschrijvingen. Een halve cultuur toont gebruikers een taalmix. Meld de gaten en vul ze waar jij de tekst levert of goedkeurt.
- **Rollen**: bestaan er beveiligingsrollen, dan heeft elke rol tabelrechten en filterexpressies, leden waar het model ze definieert, en object-level security die past bij wat in pass 5 verborgen is. Maak of verruim geen beveiliging zonder jou.

## Afronden

1. Draai de Best Practice Analyzer in Tabular Editor (zie de skill **tabular-editor-bpa** als die beschikbaar is) en herstel wat de passes hebben veroorzaakt.
2. Draai per gewijzigde tabel een kleine DAX-query om sortering, formats en hiërarchieën te controleren.
3. Rapporteer per pass: wat veranderd is, wat al goed was, wat is overgeslagen en waarom, en elke hernoeming en verwijdering met de downstream-impact.
4. Het model is niet opgeslagen; dat doe je zelf. In TE3 is ongedaan maken één Ctrl+Z per script.
