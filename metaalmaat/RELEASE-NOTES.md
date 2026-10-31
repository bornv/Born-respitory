# JBT Marel Materiaalprijs Converter 2.1.1 — Windows Setup

Download **Materiaalprijs-Converter-Setup-2.1.1-x64.exe**, of download de ZIP met setup, Excel-invulformat en handleiding.

Nieuw in 2.1.1:

- Te grote bestanden worden direct gemeld, met het aantal gevonden rijen, in plaats van na het volledig inlezen. Grenzen: 25 MB, 100 MB uitgepakt, 49.999 regels plus kopregel per tabblad en 100.000 rijen per werkmap. CSV-bestanden hebben nu dezelfde regelgrens.
- Ontbreekt een gewicht, dan noemt de tabel de oorzaak: dichtheid controleren, dichtheid ontbreekt, maat ongeldig of maat ontbreekt.
- Excelbestanden zonder rij- of celnummers (toegestaan in de Excel-standaard, door sommige programma's zo opgeslagen) worden nu correct ingelezen in plaats van geweigerd.
- De Windows-build leest het versienummer uit package.json en stopt direct als die versie al gepubliceerd is.

Uit 2.1.0:

- Installatiewizard in Nederlands en Engels, met keuze van installatiemap.
- Standaard voor de huidige gebruiker; optioneel voor alle gebruikers met administratorrechten.
- JBT Marel-programmagroep in Start, bureaubladsnelkoppeling en verwijderfunctie in Windows.
- Handleiding en leveranciersformat worden ook meegeïnstalleerd.
- Losse berekening: met een ingevuld leveranciersgewicht meldt het resultaatvlak dat materiaal en maten niet meetellen; wijkt dat gewicht meer dan 10% af van het theoretische gewicht, dan volgt een waarschuwing.
- Koersdatum staat standaard op vandaag. Is de ECB-koers van die dag nog niet gepubliceerd (op werkdagen rond 16:00), dan meldt de app welke koersdatum wel is gebruikt.
- Automatische Windows-controle van installatie, snelkoppelingen, import/export, opnieuw installeren en verwijderen.
- Gebruikersdata worden standaard behouden bij verwijderen. Bewaar werkbestanden buiten de installatiemap.

De rekenregels en de correcties uit 2.0.1 blijven behouden. Geen automatische updates.
De setup is niet digitaal ondertekend; Windows kan een melding over een onbekende uitgever tonen.
De test bedient de setup stil; er is geen handmatige beoordeling van de wizard. Native bestandskeuze tijdens de app-test wordt nagebootst.
