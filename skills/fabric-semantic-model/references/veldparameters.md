# Veldparameters

Een **veldparameter** is een dynamische veldkiezer: met één slicer kiest de rapportgebruiker welke kolom of meting een visual gebruikt. Zo levert één visual meerdere weergaven ("bekijk per Artikel / Leverancier / Magazijn", een metric-kiezer, een "dynamische weergave"-grafiek).

Deze referentie gaat over het **modelobject**: de berekende tabel van de veldparameter. Die kun je volledig in het model maken, wijzigen, hernoemen of verwijderen, los van een rapport.

> **Afbakening.** De berekende tabel is het hele werk hier. De bijbehorende slicer en doelvisual in het rapport (PBIR) zijn rapportwerk: zie **fabric-powerbi-report**.

## Herkennen

Een tabel **is** een veldparameter als en alleen als één kolom `extendedProperty ParameterMetadata` heeft waarvan de JSON `"kind": 2` bevat. Lees de TMDL (of bevraag het model, zie [metadata-ontdekken.md](metadata-ontdekken.md)) om een bestaande parameter te vinden vóór je er een tweede maakt.

## TMDL-vorm

Een veldparameter is een berekende tabel met één tuple `(label, NAMEOF(verwijzing), volgorde)` per kiesbaar veld. Hij heeft precies drie kolommen, gekoppeld aan `[Value1]` (label), `[Value2]` (veld) en `[Value3]` (volgorde). Kolommen en metingen mag je in één parameter mengen.

```tmdl
table 'Slice by'

	column 'Slice by Order'
		dataType: int64
		isHidden
		formatString: 0
		summarizeBy: sum
		sourceColumn: [Value3]

	column 'Slice by Fields'
		dataType: string
		isHidden
		summarizeBy: none
		sourceColumn: [Value2]
		sortByColumn: 'Slice by Order'

		extendedProperty ParameterMetadata = {"version":3,"kind":2}

	column 'Slice by'
		dataType: string
		summarizeBy: none
		sourceColumn: [Value1]
		sortByColumn: 'Slice by Order'

		relatedColumnDetails
			groupByColumn: 'Slice by Fields'

	partition 'Slice by' = calculated
		mode: import
		source =
				{
				    ("Product Name", NAMEOF('Product'[Product Name]), 0),
				    ("Revenue", NAMEOF('Internet Sales'[Total Sales Amount]), 1)
				}
```

Voor een parameter met de naam `<P>` houd je deze vorm aan:

| Kolom | Bron | Zichtbaarheid | Doel |
|---|---|---|---|
| `<P>` | `[Value1]` | zichtbaar | Label in de slicer; gesorteerd op de volgordekolom en gegroepeerd op de veldenkolom |
| `<P> Fields` | `[Value2]` | verborgen | Draagt `ParameterMetadata` met `"kind": 2`; gesorteerd op de volgordekolom |
| `<P> Order` | `[Value3]` | verborgen | Dichte, nul-gebaseerde volgorde; `dataType: int64`, `summarizeBy: sum`, `formatString: 0` |

Per tuple:

- `<volgorde>` nul-gebaseerd en zonder gaten, in de volgorde van de velden.
- `NAMEOF` gebruiken voor zowel kolommen als metingen.
- In labels (stringliterals) `"` escapen als `""`.
- In tabelverwijzingen tussen enkele aanhalingstekens `'` escapen als `''`.
- In objectverwijzingen tussen blokhaken `]` escapen als `]]`.

Desktop herkent de tabel alleen als veldparameter als de veldenkolom `ParameterMetadata` met `"kind": 2` heeft.

## Werkwijze: veldparameter maken

**Wanneer:** je vraagt om een metric-kiezer, "bekijk per"-tabel of dynamische weergave, of expliciet om een veldparameter, en er bestaat nog geen passende.

1. **Afbakenen.** Bevestig dat het om een veldparametertabel gaat. De tabel bouw je hier; slicer en visual zijn rapportwerk.
2. **Zoeken.** Controleer volgens [Herkennen](#herkennen) of er al een passende parameter is. Zo ja: ga naar [Wijzigen](#werkwijze-veldparameter-wijzigen) in plaats van een duplicaat te maken.
3. **Velden verzamelen.** De geordende lijst kolommen/metingen en hun slicerlabels. Zijn de velden onduidelijk: stop en vraag het.
4. **Bouwen.** Schrijf de TMDL volgens de [TMDL-vorm](#tmdl-vorm); zie ook [tmdl.md](tmdl.md). Bij PBIP: nieuw bestand in `definition/tables/` (zie [pbip.md](pbip.md)). Bij een workspace: `getDefinition` → bewerken → `updateDefinition` met alle parts (zie [rest-api.md](rest-api.md#tmdl-definitie-via-de-fabric-items-api)). In Desktop kun je een veldparameter ook via de UI maken; Claude levert dan de velden, labels en volgorde.
5. **Opslaan en controleren.** Controleer dat de zichtbare labelkolom, de verborgen kolommen `Fields`/`Order` en `ParameterMetadata` er alle drie zijn. Een slicer koppel je aan de zichtbare labelkolom.

## Werkwijze: veldparameter wijzigen

**Wanneer:** je wilt velden toevoegen, verwijderen, herordenen of een label wijzigen.

De set velden staat volledig in de tuple-expressie van de berekende partitie. Een wijziging is dus een **herschrijving van de partitie**. De drie kolommen, zichtbaarheid, sort-by, group-by en `ParameterMetadata` staan los van de veldenset en blijven ongewijzigd.

1. **Parameter vinden** volgens [Herkennen](#herkennen). Is de genoemde tabel geen veldparameter: stop en meld het.
2. **De volledige nieuwe set bepalen.** Een wijziging is een **volledige vervanging**, geen samenvoeging: stel de complete nieuwe, geordende lijst op (een veld weglaten = verwijderen). Nummer `order` opnieuw, nul-gebaseerd en zonder gaten.
3. **Partitie herschrijven.** Vervang de `source` van de partitie door de complete nieuwe `{ ... }`-set; laat de drie kolommen en `ParameterMetadata` ongemoeid.
4. **Opslaan en controleren.** Kolommen en `ParameterMetadata` ongewijzigd; de nieuwe tuples verschijnen na vernieuwen.

## Werkwijze: hernoemen of verwijderen

Deze wijzigingen raken de veldenset niet.

1. **Parameter vinden** volgens [Herkennen](#herkennen).
2. **Wijziging uitvoeren:**

   | Wijziging | In TMDL |
   |---|---|
   | Tabel hernoemen | De naam van de `table` aanpassen |
   | Slicerlabel hernoemen | De zichtbare labelkolom (`column`) hernoemen |
   | Verwijderen | Het TMDL-bestand van de tabel verwijderen |

3. **Opslaan en controleren.** Let op: hernoemen verandert het koppeldoel. Een slicer die al aan de oude naam hangt, moet in het rapport opnieuw gekoppeld worden.

## Veelvoorkomende scenario's

| Scenario | Aanpak |
|---|---|
| "Bekijk per Artikel / Leverancier / Magazijn"-kiezer | [Maken](#werkwijze-veldparameter-maken): één parameter over de dimensiekolommen |
| Metric-kiezer (bijv. OTIF % / Leverbetrouwbaarheid / Voorraadwaarde) | [Maken](#werkwijze-veldparameter-maken): één parameter over de metingen |
| Veld toevoegen aan een bestaande parameter | [Wijzigen](#werkwijze-veldparameter-wijzigen): partitie herschrijven met de **volledige** nieuwe set |
| Volgorde in de slicer aanpassen | [Wijzigen](#werkwijze-veldparameter-wijzigen): `order` opnieuw nul-gebaseerd nummeren |
| Verouderde parameter verwijderen | [Verwijderen](#werkwijze-hernoemen-of-verwijderen): TMDL-bestand verwijderen |

## Moet / liever / vermijd

**Moet**
- De drie kolommen op `[Value1]`/`[Value2]`/`[Value3]` en `ParameterMetadata` `"kind": 2` behouden, anders herkent Desktop de tabel niet als veldparameter.
- Dichte, nul-gebaseerde `order`-waarden in de volgorde van de velden.
- Labels, tabelnamen en objectnamen escapen in de tuple-DAX.
- Wijzigingen behandelen als **volledige vervanging** van de veldenset.

**Liever**
- Bij wijzigen de hele partitie-`source` vervangen (complete `{ ... }`-set) in plaats van losse tuples te diffen; kolommen en `ParameterMetadata` behouden.

**Vermijd**
- Alleen de partitie-DAX aanpassen terwijl `ParameterMetadata`, sort-by of group-by niet meer kloppen.
- Stilletjes een statische tabel met `SWITCH` bouwen als om een veldparameter gevraagd is.

## Probleemoplossing

| Symptoom | Oorzaak / oplossing |
|---|---|
| Desktop toont de tabel, maar niet als veldparameter | `ParameterMetadata` `"kind": 2` ontbreekt of is ongeldig op de kolom `Fields`. Herstel de extended property. |
| Slicer-opties in de verkeerde volgorde | `order` niet dicht/nul-gebaseerd, of `sortByColumn` op de label-/veldenkolom wijst niet naar de kolom `Order`. |
| Tuple wordt niet geparsed / DAX-fout | Een label, tabel- of objectnaam is niet geëscaped. Pas de escaperegels hierboven toe. |
| Na wijzigen zijn velden verdwenen | Wijzigen is volledige vervanging: de nieuwe expressie moet **alle** te behouden velden bevatten. |
| Slicer werkt niet meer na hernoemen | Het koppeldoel is veranderd; koppel de slicer in het rapport opnieuw. |

## Voorbeeld: metric-kiezer voor een warehousemodel

*Voorbeeld*, uitgaande van bestaande metingen `[OTIF %]`, `[# Orderregels]` en `[Voorraadwaarde]` in de tabellen `Orderregels` en `Voorraad`; pas de namen aan op je eigen model.

```tmdl
table Metriek

	column 'Metriek Order'
		dataType: int64
		isHidden
		formatString: 0
		summarizeBy: sum
		sourceColumn: [Value3]

	column 'Metriek Fields'
		dataType: string
		isHidden
		summarizeBy: none
		sourceColumn: [Value2]
		sortByColumn: 'Metriek Order'

		extendedProperty ParameterMetadata = {"version":3,"kind":2}

	column Metriek
		dataType: string
		summarizeBy: none
		sourceColumn: [Value1]
		sortByColumn: 'Metriek Order'

		relatedColumnDetails
			groupByColumn: 'Metriek Fields'

	partition Metriek = calculated
		mode: import
		source =
				{
				    ("OTIF %", NAMEOF('Orderregels'[OTIF %]), 0),
				    ("Aantal orderregels", NAMEOF('Orderregels'[# Orderregels]), 1),
				    ("Voorraadwaarde", NAMEOF('Voorraad'[Voorraadwaarde]), 2)
				}
```

Wil je later "Aantal orderregels" vooraan, dan herschrijf je de hele `source` met de nieuwe volgorde 0, 1, 2; de kolommen blijven gelijk.
