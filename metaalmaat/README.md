# Metaalmaat

Browsertool voor materiaalprijzen en hoeveelheden tussen kg, ton, meter, m² en stuk, met Excel-import, invulformat, export en valutaomrekening.

## Gebruik

1. Download het Excel-format of importeer een bestaande .xlsx, .csv of .tsv.
2. Kies tabblad, kopregel, prijskolom, bron-eenheid, prijsbasis en valuta. Kolommen met eenheden en valuta mogen per regel verschillen. Uitzonderingen per leverancier en regel zijn mogelijk.
3. Kies de gewenste eenheid en doelvaluta. Laad bij verschillende valuta een ECB-koers via Frankfurter, of vul een eigen koers en datum in.
4. Controleer herkende maten en gemarkeerde regels. Download alle bronwaarden en uitkomsten als Excel; CSV bevat het geselecteerde tabblad.

Na het aanmaken van een bestand verschijnt een opslagvenster in de tool. Met een nieuwe klik op ‘Opslaan als…’ opent een ondersteunde desktopbrowser de bestandskiezer. Op iPhone/iPad opent ‘Bewaar / deel bestand’ het native deelmenu wanneer bestanden delen beschikbaar is. Kies daar ‘Bewaar in Bestanden’. De gewone downloadlink en ‘Open bestand’ blijven beschikbaar als een ingebouwde browser native vensters blokkeert. Annuleren wordt onderscheiden van succesvol opslaan. Een bestand blijft klaarstaan zolang de pagina open blijft. Native picker/share worden direct vanuit de tweede klik aangeroepen, na de asynchrone Excelgeneratie.

De losse calculator ondersteunt rondstaf, vierkantstaf, zeskantstaf, platstaf, plaat, ronde buis, koker en bekende profielgewichten. Maten zijn in mm. Zeskant gebruikt de sleutelmaat. m² betekent vlakke plaat-/stripoppervlakte. Kokergewichten zijn theoretisch zonder hoekradii. Een opgegeven leveranciersgewicht gaat voor geometrie.

Bestanden worden uitsluitend in de browser verwerkt en blijven niet bewaard na verversen. Bronformules worden als hun opgeslagen waarden geëxporteerd. Er wordt alleen een extern verzoek gedaan wanneer koersen worden opgehaald. Geen gebruikersdata worden in de sitebron opgenomen.

## Rekenkern

Prijs doel = bronprijs / prijsbasis / kg per broneenheid × kg per doeleenheid × valutakoers.

Koersen zijn genoteerd als 1 EUR = X vreemde valuta. Kruiskoers bron naar doel = koers doel / koers bron. De export vermeldt gebruikte valuta, koers, datum en bron. Ontbrekende koersen en maten produceren geen verzonnen resultaten.

## Ontwikkeling

Buildless HTML/CSS/ESM in `dist`. JSZip is lokaal gebundeld met licentie in `dist/vendor`; runtime imports hebben geen CDN nodig. De testen gebruiken de geïnstalleerde JSZip uit `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

```sh
npm test
```

De hostingconfiguratie staat in `.openai/hosting.json`.

## Windows Desktop 2.0

De Windows-app leest prijzen uit het Excelbestand dat de leverancier invult.
De leverancier vult per artikel ook Dichtheid (kg/m3) in, passend bij de
kwaliteit/legering. Het format bevat uitleg en ingevulde voorbeelden.
De ingevulde dichtheid gaat voor de standaardmateriaalwaarde; bekende
leveranciersgewichten gaan voor het theoretische gewicht.

De app heeft native Opslaan als en een Windows-menu. Alleen valutakoersen
worden op verzoek opgehaald. De gehoste Site is niet gewijzigd of gepubliceerd.
Zie `LEESMIJ-WINDOWS.txt` voor gebruikersinstructies.

```sh
npm ci
npm test
npm run desktop
npm run build:windows
```

De portable x64-exe staat in `release/`. Deze is niet digitaal ondertekend.
Starten op Windows zelf is nog niet getest. JSZip wordt als ontwikkelafhankelijkheid
geïnstalleerd voor de exporttests.
