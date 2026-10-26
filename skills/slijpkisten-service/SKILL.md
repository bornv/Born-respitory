---
name: slijpkisten-service
description: "Kennis en werkwijze voor het Power BI-rapport Slijpkisten Service (JBT Marel, LCV): slijpkisten, messen, robots en kisttypen, slijpservicecontracten, betaalafspraken en termijnen, kosten en marge per klant/robot/kist, revisie buiten de slijpmarge, WaardeSlijpservice, serienummers en zendingen (GOB/GVR) uit de PAJL, transport en afleverbonnen (PKLK/PKLP), de afsprakenlijst (Excel op SharePoint) en het PBIP/TMDL-project. Ook: Oracle LCV_DATA via de gateway en databaselink PENTA8, trage of mislukte refresh (time-out 5 uur, ORA-01013, ORA-01861, ORA-12154, ORA-12570, maxJsonLength, 403, partition type change, dynamic data source), dataflow-staging en controller/accountant-controles op de marge. Gebruik bij Slijpkisten, slijpservice, kistorders, KPTM, PAJL, PKLK, PKLP, LCV_DATA, lcvpentabi, Penta, contractorder 00xxxx0000, slijpmarge, revisie, betaalafspraken, Slijpkisten_afspraken.xlsx. Niet voor: algemene DAX/M-regels (pbi-model-power-query-dax), TMDL/REST (fabric-semantic-model), rapportontwerp (pbi-rapport-review), finance-methodiek (finance-*)."
---

# Slijpkisten Service (Power BI, LCV/Penta)

Het rapport toont per klant, robot en kist wat de slijpservice kost en oplevert, wat er volgens de afspraken nog gefactureerd moet worden en hoe kisten en zendingen lopen. Het is een **PBIP-project (TMDL + PBIR)** met als bronnen **Oracle LCV_DATA** (server `lcvpentabi.marel.net`, via de on-premises gateway) en de **afsprakenlijst** `Slijpkisten_afspraken.xlsx` op SharePoint.

Claude levert M, DAX, TMDL, SQL en stappen. **Born** voert ze uit in Power BI Desktop, de service, SQL-tools of Excel. Claude kan niet tegen Oracle of de service testen: zeg altijd wat lokaal gecontroleerd is en wat niet.

## Werkwijze

| Vraag | Laad |
|---|---|
| Welke view, kolom, kostensoort of code betekent wat? Kan ik X ook uit Y halen (bijv. factuurtabellen i.p.v. KPTM)? | [bronnen-lcv-penta.md](references/bronnen-lcv-penta.md) |
| Hoe tellen kisten, zendingen, robots, revisie, contracten, marge? | [bedrijfsregels.md](references/bedrijfsregels.md) |
| Welke tabel/meting doet wat, waar zit een berekening, hoe pas ik een meting aan? | [model-en-metingen.md](references/model-en-metingen.md) |
| Excel op SharePoint: kolommen, nieuwe afspraak/contract toevoegen | [afsprakenlijst-sharepoint.md](references/afsprakenlijst-sharepoint.md) |
| Refresh faalt of duurt uren, Oracle-fout, gateway, rechten, dataflow | [refresh-en-performance.md](references/refresh-en-performance.md) |
| Nieuwe versie maken, versies samenvoegen, valideren, opleveren | [werkwijze-pbip.md](references/werkwijze-pbip.md) |
| Opbouw volgens de LCV-standaard (F/D-namen, Calculations, Refresh date, afwijkingen), tabelnamen oud → nieuw | [lcv-werkwijze-afstemming.md](references/lcv-werkwijze-afstemming.md) + skill **penta-powerbi-lcv** |

## Vaste afspraken (niet opnieuw ter discussie stellen)

0. **Eén query per Penta-bron; combineren in DAX of op de server.** Een Oracle-query verwijst nooit naar een andere Oracle-query.
0. **Bouw volgens de LCV-werkwijze** (skill penta-powerbi-lcv): `F `/`D `-tabelnamen, metingen in `Calculations`, `Last refresh date` + kaart op elke pagina, CommandTimeout 3 uur, sterschema. Afwijkingen alleen zoals vastgelegd in [lcv-werkwijze-afstemming.md](references/lcv-werkwijze-afstemming.md).

1. **1 GOB + 1 GVR = 1 zending = 1 kist.** Alleen journaalposten Goederenontvangst (GOB) en Goederenverzending (GVR) tellen; serienummer = `CHARGEN_SERIEN_NR` uit LCV_PAJL, rechtstreeks geladen (geen parameter, geen momentopname).
2. **Elke kist hoort bij een robot.** Geen "(Blank)"-robot; niet te koppelen kisttypen komen onder "Niet gekoppeld", in slicers liever "All". `50225618` = Primal Cut, `50234143` = nieuwe kist Primal Cut.
3. **Revisie hoort bij het contract, maar telt niet mee in de slijpservicemarge.** Regels met "REVIS" in de omschrijving (gereviseerd gereedschap, Revisie Set) of een artikel uit `tblNietInSlijpmarge` → aparte revisiecategorie; zichtbaar, maar buiten Kosten/Omzet van de slijpmarge.
4. **Per contract staat het slijpdeel in `WaardeSlijpservice`** (Excel). Leeg = hele contractwaarde is slijpservice. Het slijpdeel staat **niet** als apart bedrag in de financedata (gezocht in KPTM, omzet, PLW, PO's): de contracttekst + Excel zijn de bron.
5. **Kosten op de contractorder (00xxxx0000)** zijn onderhoud/revisie/support: alleen informatie, niet in de slijpmarge.
6. **Negatieve "Overige kosten"** (creditnota's, overboekingen naar het contract) blijven in de data, maar tellen niet mee in de meting Kosten.
7. **Kalender dynamisch** (eerste t/m laatste maand in de data of t/m vandaag), met Maandstatus voor de lopende maand; marge- en jaarcijfers gebruiken alleen **afgesloten maanden**.
8. **Alleen afspraken met Status = "Actief"** tellen in termijnen en planning.
9. **Geen vertrouwelijke data in Git**: geen .pbix, Excel met klantgegevens, contract-pdf's of bedragen per klant in de repository.

## Antwoordregels

- Nederlands, direct, tabellen voor vergelijkingen, genummerde stappen met klikpad (Desktop/service in de taal van het scherm van Born; Engelse knoppen tussen haakjes als de UI Engels is).
- Veldnamen, foutmeldingen en Penta-codes letterlijk overnemen.
- Onderscheid **gecontroleerd** (model laadt, verwijzingen kloppen, data uit momentopname) / **aanname** (Penta-datatypen, indexen, gedrag van de databaselink) / **niet getest** (Oracle-refresh, DAX-uitvoering, service).
- Bij een foutmelding eerst kijken of het een **nieuwe** refresh is (Request ID en tijd vergelijken) voordat je conclusies trekt.
