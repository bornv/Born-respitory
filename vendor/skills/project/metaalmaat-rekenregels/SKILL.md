---
name: metaalmaat-rekenregels
description: Bouw of controleer Metaalmaat-omrekeningen voor leveranciersprijzen, Excel, dichtheid, staf, plaat en buis tussen kg, ton, meter, m² en stuk. Gebruik bij prijsbasis, eenheden en theoretische of opgegeven gewichten.
metadata:
  origin: repository-project-skill
---

# Metaalmaat-rekenregels

## Gegevenscontract

De leverancier vult prijzen en per artikel Dichtheid (kg/m3) in Excel in.
Gebruik kg/m³, dus bijvoorbeeld 7850 en niet 7,85 voor staal. De dichtheid hoort
bij de specifieke kwaliteit/legering; voorbeelden zijn geen universele norm.
Prijzen komen uit dit Excelbestand. Alleen valutakoersen worden op verzoek
online opgehaald. Een online marktprijs is geen vervanging voor de offerte.

Een expliciete dichtheid uit Excel gaat vóór een standaardmateriaalwaarde.
Een bekend leveranciersgewicht in kg/m, kg/m² of kg/stuk gaat vóór het bijbehorende
theoretische gewicht. Het verzoek om dichtheid in te vullen betekent niet dat
alle bestaande bestanden zonder die kolom ineens geweigerd moeten worden.
Verander verplichte velden of fallbackgedrag alleen wanneer de opdracht dat vraagt.

## Werkwijze

1. Lees de actuele rekenkern, Excelmapping, voorbeelden en tests. Controleer
   welke bronkolom is gebruikt: prijs, eenheid, prijsbasis en valuta zijn aparte
   begrippen en kunnen per regel/leverancier verschillen.
2. Normaliseer naar kg. Lees [formules en referentiegevallen](references/rekenen.md)
   voor geometrie, prijsomrekening, onafhankelijke testwaarden en grensgevallen.
3. Gebruik alle maten in mm en dichtheid in kg/m³. m² is vlakke plaat- of
   stripoppervlakte, niet het verfoppervlak van staf of buis.
4. Behandel lege waarden, nul, negatieve getallen en ongeldige getallen apart.
   Een nulprijs mag geldig zijn; dichtheid en relevante maten moeten positief
   zijn. Ontbrekende informatie levert controlepunten op, geen verzonnen waarde.
5. Controleer prijsbasis één keer. Per 100 kg is prijs / 100, geen prijs per kg
   en geen automatische dubbeltelling met een eenheid die al een basis bevat.
6. Controleer oorspronkelijke waarden en auditvelden in de export. Behoud het
   originele Excelbestand. Formules worden niet stilzwijgend als nieuwe formules
   uitgevoerd; controleer de bestaande exportbescherming tegen formule-injectie.

## Aantonen

Gebruik onafhankelijke referentieberekeningen en tolerantie voor floating point.
Test bekende leveranciersgewichten, onbekende materialen met expliciete dichtheid,
ontbrekende maten, prijsbasis 1/100/1000, valuta en terugrekenen tussen eenheden.
Een theoretisch profielgewicht zonder hoekradii is geen gecertificeerd
leveranciersgewicht; vermeld deze beperking.
