# Formules en onafhankelijke referentiegevallen

Met alle maten d, b, h, t in mm: doorsnede A in mm²; kg/m = A × rho / 1.000.000.

| Vorm | Doorsnede A |
|---|---|
| Rondstaf | π × d² / 4 |
| Vierkantstaf | b² |
| Zeskantstaf, sleutelmaat b | √3 × b² / 2 |
| Platstaf | b × t |
| Ronde buis | π × (d² − (d − 2t)²) / 4 |
| Rechthoekige koker | b × h − (b − 2t) × (h − 2t) |

Een buis/koker heeft positieve binnenmaten nodig. De kokerformule negeert
hoekradii. Open profielen gebruiken bekende leveranciersgewichten.

Voor plaat: kg/m² = t × rho / 1000. kg/m = kg/m² × breedte/1000.
Stukgewicht = kg/m × lengte/1000; voor een hele plaat equivalent
kg/m² × breedte/1000 × lengte/1000. Ton = 1000 kg.

Prijs doeleenheid = bronprijs / prijsbasis / kg per broneenheid ×
kg per doeleenheid × valutakoers. Met 1 EUR = R valuta is de kruiskoers
van bron naar doel: R_doel / R_bron. Controleer koersdatum en herkomst.

## Onafhankelijke gevallen

- Rondstaf Ø20, rho 7850: π × 0,01² × 7850 = 2,46615023306799 kg/m.
  Bij 1,20 EUR/kg wordt dit 2,95938027968159 EUR/m.
- Dezelfde vorm, onbekend materiaal maar rho 1000: 0,314159265358979 kg/m.
  De expliciete leveranciersdichtheid mag niet terugvallen naar staal.
- Aluminiumplaat 2 × 1250 × 2500, rho 2700: 5,4 kg/m² en 16,875 kg/stuk.
  Bij 100 EUR/stuk is dit 32 EUR/m² en 5,92592592592593 EUR/kg.
- Platstaf 40 × 8, rho 7850: 2,512 kg/m. Bij 120 EUR per 100 kg:
  1,20 EUR/kg en 3,0144 EUR/m. De prijsbasis wordt maar eenmaal toegepast.
- Een leverancier geeft 3 kg/m op voor Ø20 staal: gebruik 3 kg/m, niet 2,46615.
- Kruiskoers: 1 EUR = 1,10 USD en 0,88 GBP; 1 USD = 0,80 GBP.
- Tekst 7,85 is geen 7850 kg/m³. Neem geen automatische ×1000-correctie aan.
  Toon een controlepunt indien een aparte plausibiliteitscontrole is gevraagd.

Vergelijk met een numerieke tolerantie, bijvoorbeeld 1e-9 absoluut voor deze
gewichten. Bepaal geldigheid per gevraagde omrekening: een prijs per kg naar
kg heeft geen geometrie nodig; naar meter wel een geldig kg/m.
