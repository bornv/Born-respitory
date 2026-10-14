---
name: finance-variantieanalyse
description: "Variantieanalyse en verschillenanalyse van financiële cijfers: budget tegenover werkelijk, periode tegenover vorige periode of vorig jaar, uitsplitsen naar prijs-effect, volume-effect, mix, bezetting, timing en valuta, materialiteit bepalen, een watervalgrafiek (waterfall) of brugtabel opbouwen en een toelichting schrijven voor het management. Gebruik bij 'waarom is de marge gedaald', 'verklaar het verschil met budget voor 2025M09', 'prijs- en volume-effect splitsen', 'waterfall van omzet budget naar werkelijk', 'commentaar schrijven bij de maandcijfers'. Voor de opbouw van P&L, balans en kasstroomoverzicht: finance-overzichten. Voor de uitwerking in DAX en Power BI: pbi-model-power-query-dax."
---

# Variantieanalyse

Gebaseerd op [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, © Anthropic): de skill `variance-analysis` uit de finance-plugin, commit `02ffa99`. Vertaald en aangepast aan de Nederlandse praktijk.

Deze skill helpt bij de analyse maar geeft geen fiscaal, accounting- of auditadvies; laat uitkomsten door een bevoegde collega of accountant controleren.

Je splitst hiermee een verschil tussen twee cijfers uit naar de onderliggende oorzaken (flux/variance analysis), bepaalt wat materieel is en schrijft er een toelichting bij die het management kan gebruiken. Bij JBT Marel komen de resultatendata uit SAP via de Oracle-view `LCV_KPTM` in schema `LCV_DATA`; de uitwerking gebeurt in Power BI en Excel, de eindversie zet je op SharePoint.

## Uitgangspunten

- **Vergelijk altijd gelijke grootheden**: dezelfde periode-afbakening, dezelfde entiteit, dezelfde valuta en koers, dezelfde rekeningstructuur.
- **Bedragen in euro's** (€ 1.250,00), percentages met komma (12,5%), margeverschillen in procentpunten (pp), datums dd-mm-jjjj, perioden `jjjjMM`.
- **Veldnamen, grootboekrekeningen en SAP-termen blijven ongewijzigd.**
- **Een verschil dat je niet kunt verklaren, benoem je als onverklaard** — vul het niet op met "diversen".
- De som van de verklaarde effecten moet exact gelijk zijn aan het totale verschil.

## Werkwijze

1. **Afbakenen**: welke regel, welke periode, welke vergelijkingsbasis (budget, forecast, vorige periode, vorig jaar).
2. **Totaalverschil berekenen** in euro's en in procenten, en benoemen of het gunstig of ongunstig is.
3. **Toetsen aan de materialiteitsdrempel**; alleen materiële verschillen krijgen een volledige analyse.
4. **Uitsplitsen** naar effecten met een van de methoden hieronder.
5. **Aansluiten**: som van de effecten = totaalverschil. Klopt dit niet, dan is de analyse niet af.
6. **Toelichting schrijven** per materieel verschil, met oorzaak, bedrag, verwachting en actie.
7. **Visualiseren** met een watervalgrafiek plus een brugtabel.

## Uitsplitsing naar prijs en volume

De basisuitsplitsing voor elke grootheid die je als prijs maal hoeveelheid kunt schrijven: omzet, inkoopwaarde, uren.

```
Totaalverschil  = werkelijk − budget

Volume-effect   = (werkelijke hoeveelheid − budgethoeveelheid) × budgetprijs
Prijs-effect    = (werkelijke prijs − budgetprijs) × werkelijke hoeveelheid

Controle: volume-effect + prijs-effect = totaalverschil
```

Voorbeeld omzetverschil:

| Element | Hoeveelheid | Prijs | Bedrag |
|---|---:|---:|---:|
| Budget | 10.000 | € 50,00 | € 500.000,00 |
| Werkelijk | 11.000 | € 48,00 | € 528.000,00 |
| Volume-effect | +1.000 × € 50,00 | | € 50.000,00 gunstig |
| Prijs-effect | 11.000 × −€ 2,00 | | −€ 22.000,00 ongunstig |
| **Totaalverschil** | | | **€ 28.000,00 gunstig** |

Wil je het mix-effect apart zien, splits dan in drie termen: volume-effect tegen budgetprijs en budgetmix, prijs-effect tegen werkelijke mix, en mix-effect als het resterende deel. Leg vast welke conventie je kiest; de verdeling van de kruisterm bepaalt de uitkomst per effect, niet het totaal.

## Uitsplitsing naar tarief en mix

Voor een samengesteld percentage, bijvoorbeeld de brutomarge over producten met verschillende marges.

```
Tarief-effect = som over i van: werkelijke hoeveelheid_i × (werkelijk tarief_i − budgettarief_i)
Mix-effect    = som over i van: budgettarief_i × (werkelijke hoeveelheid_i − hoeveelheid_i bij budgetmix)
```

Voorbeeld: machines hebben 40,0% marge, service 60,0% marge. Bij een budgetmix van 50/50 is de gemengde marge 50,0%; verschuift de werkelijke mix naar 60/40 ten gunste van machines, dan daalt de gemengde marge naar 48,0%. Het mix-effect verklaart dan 2,0 pp margedaling, zonder dat één product goedkoper is geworden.

## Uitsplitsing van personeelskosten

| Effect | Berekening |
|---|---|
| Bezettingseffect | (werkelijke bezetting in fte − budget-fte) × gemiddelde budgetloonkosten |
| Tarief-effect | (werkelijke gemiddelde loonkosten − budget) × budget-fte |
| Mix-effect | Verschuiving tussen functieniveaus of afdelingen |
| Timing-effect | Eerder of later aangenomen dan gepland (deelperiode) |
| Verloop | Besparing door onverwacht vertrek, deels tenietgedaan door vervanging en inhuur |

## Uitsplitsing van overige bedrijfskosten

Als prijs maal hoeveelheid niet werkt, splits je naar kostensoort: personeelsgebonden kosten, volumegebonden kosten (transport, commissie, verbruik), discretionaire kosten (reizen, beurzen, advies), contractuele en vaste kosten (huur, verzekering, licenties), eenmalige posten (afvloeiing, claims, afwaardering) en timing of fasering ten opzichte van het plan.

## Materialiteit (materiality)

| Vergelijking | Drempel in procenten | Criterium |
|---|---:|---|
| Werkelijk tegen budget | 10,0% | Euro's **of** procenten overschreden |
| Werkelijk tegen vorige periode | 15,0% | Euro's **of** procenten overschreden |
| Werkelijk tegen forecast | 5,0% | Euro's **of** procenten overschreden |
| Maand tegen vorige maand | 20,0% | Euro's **of** procenten overschreden |

De drempel in euro's stel je per organisatie vast; gebruikelijk is 0,5% tot 1,0% van de jaaromzet voor resultatenposten. Prioriteer het onderzoek op: grootste absolute bedrag, grootste percentage, onverwachte richting, een post die eerder op koers lag, en een verschil dat elke periode groeit.

## Valkuilen bij een analyse per dimensie

Zodra je een verschil per dimensie bekijkt — per machinetype, per product, per klant, per vestiging — gaat het snel mis. Deze vier controles kwamen uit een margeanalyse die eerst verkeerde uitkomsten gaf.

1. **Meet omzet en kosten over dezelfde basis.** Filter je op één dimensie, bijvoorbeeld machinetype, terwijl de omzet per klant in het contract zit, dan vergelijk je gefilterde kosten met ongefilterde omzet. Verdeel de omzet in dat geval naar rato over de dimensie, met een expliciet verdeelsleutel (aantal machines, contractwaarde, uren).
2. **Reken kosten zonder die dimensie ook toe.** Posten als transport en commissie dragen het kenmerk machinetype niet. Bij filteren vallen ze stilzwijgend weg en lijkt de marge te hoog. Verdeel ze naar rato met dezelfde sleutel, of laat ze expliciet buiten de analyse en meld dat.
3. **Reken omzet toe aan de looptijd van het contract, niet aan de factuurdatum.** Een jaarcontract dat in één keer gefactureerd wordt, hoort gespreid over de maanden waarin de prestatie is geleverd; anders ontstaat een piek in één periode en een gat daarna.
4. **Laat de lopende, onvolledige maand buiten een omrekening naar jaarcijfers** en bepaal het aantal maanden per klant of per contract, niet met één getal voor iedereen. Een klant die in `2025M04` is gestart, heeft een andere noemer dan een klant die het hele jaar meeloopt.

Doe deze vier controles vóór je conclusies trekt, en noteer per analyse welke verdeelsleutel en welke noemer je hebt gebruikt. De uitwerking hiervan in DAX en Power BI (measures, filtercontext, verdeling naar rato) staat in de skill `pbi-model-power-query-dax`.

## Watervalgrafiek (waterfall)

Een watervalgrafiek, ook brug genoemd, laat zien hoe je van het ene cijfer naar het andere komt via positieve en negatieve bijdragen.

```
WATERVAL: omzet — werkelijk tegen budget, 2025Q4

Budget omzet                                     € 10.000.000,00
  |
  |--[+] Volumegroei nieuwe klanten                  € 800.000,00
  |--[+] Uitbreiding bestaande klanten               € 400.000,00
  |--[-] Prijsconcessies en korting                 -€ 200.000,00
  |--[-] Verloop en contractverkleining              -€ 350.000,00
  |--[+] Valuta-effect                                € 50.000,00
  |--[-] Timing (orders doorgeschoven naar 2026Q1)  -€ 150.000,00
  |
Werkelijke omzet                                 € 10.550.000,00

Totaalverschil: € 550.000,00 gunstig (5,5%)
```

Brugtabel ernaast:

| Oorzaak | Bedrag | Aandeel in het verschil | Cumulatief |
|---|---:|---:|---:|
| Volumegroei nieuwe klanten | € 800.000,00 | 145,5% | € 10.800.000,00 |
| Uitbreiding bestaande klanten | € 400.000,00 | 72,7% | € 11.200.000,00 |
| Prijsconcessies | −€ 200.000,00 | −36,4% | € 11.000.000,00 |
| Verloop en contractverkleining | −€ 350.000,00 | −63,6% | € 10.650.000,00 |
| Valuta-effect | € 50.000,00 | 9,1% | € 10.700.000,00 |
| Timing | −€ 150.000,00 | −27,3% | € 10.550.000,00 |
| **Totaal** | **€ 550.000,00** | **100,0%** | |

Regels: zet maximaal vijf tot acht staven neer en voeg de rest samen tot "overig"; orden van grootste positief naar grootste negatief, of in een logische bedrijfsvolgorde; controleer dat beginwaarde plus alle bijdragen exact de eindwaarde geeft; gebruik kleur alleen als extra signaal, nooit als enige onderscheid; label elke staaf met bedrag en korte omschrijving. Een aandeel boven 100,0% is normaal zodra effecten elkaar tegenwerken.

## Toelichting schrijven voor het management

Opbouw per verschil:

```
[Regel]: [gunstig/ongunstig] verschil van € [bedrag] ([percentage]%)
tegenover [vergelijkingsbasis], periode [jjjjMM]

Oorzaak: [hoofdoorzaak, met bedrag per effect]
[Twee à drie zinnen die uitleggen waarom het gebeurde.]

Verwachting: [eenmalig / houdt aan / verbetert / verslechtert]
Actie: [geen / volgen / verder onderzoeken / forecast bijstellen]
```

Een goede toelichting is concreet (noemt de echte oorzaak), becijferd (bedrag en percentage per effect), verklarend (waarom, niet alleen wat), vooruitkijkend (houdt het aan?), actiegericht en kort (twee tot vier zinnen).

Vermijd: "de omzet was hoger door hogere omzet" (cirkelredenering), "de kosten waren verhoogd" (welke, waarom?), "timing" zonder te zeggen wat verschoof en wanneer het terugkomt, "eenmalig" zonder de post te noemen, "diverse kleine posten" bij een materieel verschil, en alleen de grootste oorzaak noemen terwijl er compenserende effecten zijn.

## Budget, forecast en werkelijk naast elkaar

| Regel | Budget | Forecast | Werkelijk | Verschil budget (€) | Verschil budget (%) | Verschil forecast (€) |
|---|---:|---:|---:|---:|---:|---:|
| Netto-omzet | € 0,00 | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 |
| Kostprijs omzet | € 0,00 | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 |
| Brutomarge | € 0,00 | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 |

Wanneer welke vergelijking: tegen **budget** voor beoordeling en verantwoording (het budget ligt vast); tegen **forecast** voor operationele bijsturing (noem versie en datum); **forecast tegen budget** om te zien hoe de verwachting is verschoven; tegen **vorige periode** als een budget niet zinvol is (nieuwe activiteit, net overgenomen onderdeel); tegen **vorig jaar** voor groei en seizoenvergelijking.

Patronen in verschillen over het jaar: structureel gunstig wijst op een te voorzichtig budget, structureel ongunstig op een te ambitieus budget of uitvoeringsproblemen, een groeiend ongunstig verschil op verslechtering, een krimpend verschil op een forecast die gedurende het jaar beter wordt, en sterk wisselende verschillen op een grillige markt of een zwakke prognosemethode.

## Controle voor oplevering

- [ ] Vergelijkingsbasis, periode (`jjjjMM`), entiteit en valuta staan expliciet vermeld.
- [ ] Som van de effecten is exact gelijk aan het totaalverschil; de waterval sluit aan.
- [ ] De vier controles uit "Valkuilen bij een analyse per dimensie" zijn gedaan en de gebruikte verdeelsleutel en noemer zijn genoteerd.
- [ ] Materialiteitsdrempel vooraf vastgelegd en consequent toegepast.
- [ ] Elk materieel verschil heeft oorzaak, bedrag, verwachting en actie.
- [ ] Onverklaarde delen zijn als onverklaard benoemd, niet weggeschreven onder "diversen".
- [ ] Bedragen in € met punt en komma, percentages met komma, margeverschillen in pp.
- [ ] Bron per cijfer vermeld (`LCV_DATA.LCV_KPTM`, Power BI-model, Excel-bestand).
- [ ] De analyse is door een bevoegde collega gecontroleerd vóór gebruik in managementrapportage.
