# Bedrijfsregels en berekeningen

## Kisten, robots en zendingen
- **Slijpronde** = kistorderregel met artikel `.990`; **nieuwe kist** = `.000`.
- **Zending** = kistregel met zowel GOB (ontvangst, `WE`/`GOB`) als GVR (verzending, `WA`/`GVR`) in de PAJL: 1 GOB + 1 GVR = 1 zending = 1 kist. Kolommen GOBDatum (eerste), GVRDatum (laatste), Zending (1/0). Andere journaalcodes tellen niet.
- **Unieke kisten / kisten in omloop** tellen op serienummer `CHARGEN_SERIEN_NR`. Controlepagina: regels zonder GOB/GVR, serienummer ontbreekt.
- **Kisttype** = artikelnummer vóór de punt. Koppeling kisttype → robot: handmatige lijst + automatisch uit afkeur (meest gebruikte mesrobot) + "Niet gekoppeld". Geen (Blank) robots; liever "All" in slicers. `50225618` = Primal Cut, `50234143` = nieuwe kist Primal Cut.
- Velden per kisttype in de calculatie zijn grijs voor robots die niet geselecteerd zijn. Kistkosten uit de stuklijst (bak + messen).

## Kosten en marge
- **Kosten** = alle kostencategorieën op kistorders, zonder Omzet, zonder revisie-categorieën, zonder negatieve Overige kosten.
- **Kosten contract** (slijpmarge) = Kosten − Meerkosten extra messen + Kosten zonder kistregel (toegerekend). Kosten op de contractorder zelf tellen **niet** mee (alleen informatie: "Kosten contractorder").
- **Meerkosten extra messen**: slijpkosten boven `Robots[StandaardSlijpPerKist]` worden via een serviceorder gefactureerd → buiten contractprijs en saldo.
- **Afkeur-norm** = gemiddelde afkeur per ronde over alle klanten per robot; daarboven = kandidaat voor doorbelasting.
- **Toerekening naar robot/kisttype**: kosten zonder kistregel (transport, commissie, overig) naar rato van `Calculatiewaarde slijpen`, alleen als Robots/Kisttypen/KistRegels gefilterd is (`ISFILTERED` + `REMOVEFILTERS`).
- **Kosten per jaar** = per klant (kosten contract − nieuwe kisten in afgesloten maanden) / Maanden actief × 12 + afschrijving nieuwe kisten (3 jaar). Cut-off: `Periodes[Maand] < eerste dag huidige maand`.
- **Gewenste marge**: slicer, niets gekozen = 35 %. Benodigd bedrag = kosten / (1 − marge), per jaar/kwartaal/maand/kist.
- **Nieuw contract**: kisten per jaar = benchmark "kisten per jaar per 10.000 varkens per week" (alle klanten met dat robottype) × slachtingen; kosten per kist = werkelijke kosten per slijpronde (bij < 20 rondes de Excel-kostprijs); prijs = kosten / (1 − marge − commissie); jaarlijkse indexatie als invoer.

## Omzet, afspraken en contracten
- **Omzetplanning**: termijnbedrag gelijk over de maanden van de termijn; contractwaarde gelijk over de looptijd (n maanden = afgerond (dagen Start→Eind+1) / 30,4375; 9 jan t/m 8 jan = 12). Contractwaarde: bedrag uit de afsprakenlijst, anders BedragServiceTabel, anders plan-omzet (PLW). Alleen vanaf StartPeriode.
- **BedragRevisie** = (contractwaarde − WaardeSlijpservice) / n; `Geplande omzet slijpservice` = gepland − revisiedeel (t/m huidige maand).
- **Verwachte omzet** = geplande omzet slijpservice + verkochte kisten + gefactureerde omzet op orders zonder afspraak met bedrag; bij robotfilter naar rato.
- **Nog te factureren** = verwacht t/m vandaag − gefactureerd (951000 op het ordernummer vanaf de eerste termijn), nooit negatief; facturen dekken eerst de oudste termijn. Achterstallig = verstreken termijnen; lopende termijn apart.
- **Automatisch gevonden contracten**: contractorder (00xxxx0000) met PLW voor een klant met slijpkisten die nog niet in tblContracten staat → Bron "Automatisch gevonden: vul bedrag, einddatum en kistorders aan" (oranje in de tabel). Kistorders van die klant die nog nergens aan hangen worden voorlopig gekoppeld ("controleren").
- **Kistorders[Afspraak]**: Termijnafspraak / Contract (contract met waarde in de planning) / Geen afspraak (omzet = factuur).
- **Contractfacturen** staan vaak niet op de kist- of contractorder: pagina "Omzet per order" (tabel OmzetKlant: alle 951000 van slijpklanten, Ordertype Kistorder / Contractorder / Andere order).

## Revisie
- Hoort bij het contract, telt niet in de slijpmarge. Herkenning: omschrijving bevat `REVIS` (gereviseerd gereedschap, Revisie Set) of artikel(stam) in `tblNietInSlijpmarge`.
- Zichtbaar via `Revisie omzet`, `Revisie kosten`, `Geplande omzet niet-slijp (revisie e.d.)`.

## Transport
- 1 unieke klantorderregel per afleverbon = 1 kist (herhaalde PKLP-subregels 1×). FSC telt mee als kist.
- Hoofdafleverbon: `FELD_5_N8` (Main Slip id) > 0, anders getal uit `FELD_3_X35` (prefixen "Verz. met Afl.bon", "Verzonden met Afleverbon", "Verzonden met Afl.bon", "Verzonden met"). Ketens volgen; cycli, ontbrekende hoofdbon, niet-leesbare tekst apart tonen. Leeg veld = eigen bon.
- `FRACHT_BETRAG` (Shipping) blijft apart van geboekte transportkosten (437450). Bij bundeling telt elk bonbedrag één keer. Vracht per kist alleen bij complete zendingen met positief bedrag, verstreken datum, één klant en geen afwijkend adres (controle-indicator, geen bewijs).

## Controller/accountant-checks (bij elke inhoudelijke wijziging)
1. Sleutels uniek (OrderRegel, AfspraakId, contract-maand).
2. Omzet in KistKosten = Facturen (totaal en per order/periode).
3. Contractplanning over de looptijd = contractwaarde.
4. Termijnen vs. facturen per afspraak; verschillen verklaren (nog niet gefactureerd, inhaalfactuur).
5. Matching: kosten en omzet in dezelfde scope (revisie, contractorder, extra messen consequent in of uit).
6. Cut-off: lopende maand niet in jaarcijfers; geen deling door maanden zonder activiteit.
7. Onwaarschijnlijke marges (bv. > 90 %) zijn bijna altijd een scope- of filterfout, geen echte marge.
8. Transport gefactureerd terwijl het contract transport uitsluit → signaleren.
- **Contracten (sinds v51):** alleen de contracten uit de afsprakenlijst (tblContracten) tellen mee. Contractorders in Penta die er niet in staan, verschijnen alleen als signaal "Nieuwe contracten (aanvullen)" als ze boekingen vanaf 202401 hebben.
- **"Volgens afspraak" (sinds v55, eerder "verwacht"):** omzet die volgens de afspraken bij een periode hoort (contractwaarde verdeeld over de looptijd + verkochte kisten), los van de factuurdatum. Geen voorspelling; voor een afgesloten jaar het resultaat volgens afspraak. "Nog niet gefactureerd (afspraak)" = per klant afspraak − gefactureerd (≥ 0).

## Boekhoudkundige toets (v57)
- Omzet volgens afspraak = toerekening naar tijd (contractwaarde gelijk over de looptijd): past bij het matchingprincipe en bij omzet "over de tijd" voor diensten (RJ 270 / IFRS 15), mits de dienst ongeveer gelijkmatig geleverd wordt.
- Kosten = ISW-boekingen in SAP per boekingsperiode (toerekening via het grootboek).
- Marge op de verkoopprijs, overal gelijk.
- Open punten voor de controller: (1) "Nog niet gefactureerd" is eenzijdig (vooruit gefactureerd ontbreekt); (2) nieuwe kisten: direct als kosten of activeren/afschrijven, afhankelijk van of ze verkocht of in de prijs begrepen zijn; (3) verwacht verlies op een contract moet direct genomen worden (voorziening); (4) twee omzetbronnen (KPTM 951000 en facturen) periodiek aansluiten; (5) vreemde valuta handmatig omgerekend, koersverschillen niet zichtbaar.
