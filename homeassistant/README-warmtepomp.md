# Slimme warmtepompregeling – Intergas Xtend

Pakket: [`packages/warmtepomp_slim.yaml`](packages/warmtepomp_slim.yaml)

## Hoe het werkt

Home Assistant verschuift het setpoint van je kamerthermostaat in kleine stappen rond je
basistemperatuur. De Xtend volgt de warmtevraag van de thermostaat zelf. De batterij blijft
volledig onder regie van Victron (ESS / Dynamic ESS): dit pakket leest alleen de SoC.

| Modus | Setpoint | Wanneer |
|---|---|---|
| `comfort` | basis | Standaard. Ook bij dure stroom als de batterij levert. |
| `zon` | basis + 0,5 °C | PV − huisverbruik > 1000 W én er wordt teruggeleverd, 10 min aaneen |
| `voorverwarmen` | basis + 0,5 °C | Prijs ≤ 0, **of** goedkoop kwartier + dure periode binnen 6 uur + batterij kan die dure periode niet dekken |
| `besparen` | basis − 0,0 °C (instelbaar tot −1,0) | Duur kwartier én batterij (bijna) leeg |

**Goedkoop/duur** wordt per kwartier bepaald binnen de komende 12 uur Zonneplan-prijzen:
goedkoop = laagste 25 %, duur = hoogste 25 %. Als het verschil tussen die grenzen kleiner is dan
€ 0,06/kWh, wordt er niets verschoven: dan kost voorverwarmen meer dan het oplevert.

**Batterijdekking:** `(SoC − minimale SoC) × capaciteit` wordt vergeleken met
`duur aantal uren in de komende 6 uur × gemiddeld huisverbruik (24 uur)`. Dekt de batterij het,
dan wordt er niet voorverwarmd. De schatting is voorzichtig: als Dynamic ESS de batterij
tussendoor nog goedkoop bijlaadt, telt dat niet mee. Het pakket verwarmt in dat geval soms
iets te vaak voor, maar nooit te weinig.

**Rustig stoken:**
- maximaal 0,5 °C per wijziging;
- minimaal 30 minuten tussen wijzigingen;
- de verhogingen zijn klein, zodat de Xtend het alleen af kan en de cv-ketel niet bijspringt;
- de zon-modus heeft hysterese, zodat extra stoken de modus niet direct weer uitzet.

**Zelf bedienen:** verander je het setpoint (aan de thermostaat, in de app of in HA), dan:
- pauzeert de regeling 3 uur en neemt daarna rustig weer over (standaard), of
- wordt jouw waarde de nieuwe basistemperatuur, als de schakelaar
  **WP handmatige wijziging wordt nieuwe basis** aan staat.

## Wat je nodig hebt

| Onderdeel | Integratie | Status |
|---|---|---|
| Thermostaat als `climate.*` met instelbaar setpoint | bijv. Intergas gateway (InComfort), OpenTherm Gateway of je eigen thermostaat-integratie | **Zelf invullen** |
| Zonneplan-kwartierprijzen met `forecast`-attribuut | HACS: [Zonneplan ONE (fsaris)](https://github.com/fsaris/home-assistant-zonneplan-one) | Gecontroleerd in de broncode |
| Victron SoC, netvermogen, PV-vermogen, huisverbruik | bijv. Victron GX via Modbus TCP of MQTT | **Zelf invullen** |

De Xtend-integraties die ik vond ([pepijnnichting/intergas-xtend](https://github.com/pepijnnichting/intergas-xtend),
[svdlinde42/ha-intergas-xtend-local-ap](https://github.com/svdlinde42/ha-intergas-xtend-local-ap))
zijn vooral uitleesintegraties. Daarom loopt de sturing via de thermostaat. Een Xtend-integratie is
handig om COP, compressor en ketelinzet te volgen, maar is niet nodig.

## Installatie

1. **Maak een back-up**: Instellingen → Systeem → Back-ups → **Nu back-up maken**.
2. Open de **File editor**-app en open `configuration.yaml`. Maak eerst een kopie van het bestand.
   Voeg daarna onder `homeassistant:` het volgende toe (staat er al `packages:`, dan sla je deze stap over):
   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```
3. Maak de map `packages` aan in `/config` en zet `warmtepomp_slim.yaml` daarin.
4. **Vervang de entity-ID's** (zoek en vervang in het hele bestand):

   | In het bestand | Vervang door | Waar vind je het |
   |---|---|---|
   | `climate.woonkamer` | je thermostaat | Instellingen → Apparaten & diensten → Entiteiten, zoek op "climate" |
   | `sensor.zonneplan_current_quarter_hourly_electricity_tariff` | meestal al juist | Zoek op "quarter" |
   | `sensor.victron_battery_soc` | Victron batterij-SoC (%) | |
   | `sensor.victron_grid_power` | netvermogen (W, **+ = afname**) | Is het teken bij jou andersom? Vervang dan in de zon-sensor `-net` door `net`. |
   | `sensor.victron_pv_power` | totaal PV-vermogen (W) | Meerdere PV-bronnen? Maak eerst een *Combine the state of several sensors*-helper (som). |
   | `sensor.victron_ac_consumption` | totaal huisverbruik (W), inclusief de warmtepomp | |

5. Ga naar **Ontwikkelhulpmiddelen → YAML** (sinds 2026.8: **Hulpmiddelen → YAML**) →
   **Configuratie controleren**. Pas als die groen is: **Herstarten**.
6. Voer het script **WP slim – standaardwaarden instellen** één keer uit
   (Instellingen → Automatiseringen & scènes → Scripts).
7. Controleer en pas aan:
   - **WP basistemperatuur**: staat op 20,0 °C;
   - **WP bruikbare batterijcapaciteit**: bruikbare kWh van je Victron-batterij;
   - **WP minimale SoC**: dezelfde waarde als de minimale SoC in Victron ESS;
   - **WP stapgrootte thermostaat**: 0,5 of 0,1, afhankelijk van wat je thermostaat accepteert.
8. Zet **WP slimme regeling actief** aan.

## Thermostaat en Xtend instellen

Deze punten zijn advies en niet getest op jouw installatie:

- **Zet het eigen programma van de thermostaat uit** (vaste temperatuur). Anders ziet HA elke
  programmawissel als een handmatige wijziging en pauzeert de regeling.
- **Laat de thermostaat modulerend regelen (OpenTherm)** en niet aan/uit. Dat geeft de meest
  continue warmtevraag.
- **Gebruik bij voorkeur weersafhankelijke regeling (stooklijn)** als je installatie dat
  ondersteunt. Een lage, goed afgestelde stooklijn is de grootste besparing bij een warmtepomp.
- Gebruik **geen nachtverlaging**, of hooguit 0,5 °C. Opwarmen in de ochtend kost vaak meer dan
  het oplevert, en de ketel springt dan eerder bij.
- Zie je de cv-ketel bijspringen tijdens voorverwarmen of in de zon-modus? Verlaag dan
  **WP verhoging bij voorverwarmen/zonneoverschot** naar 0,3 °C.

## Dashboardkaart

```yaml
type: entities
title: Warmtepomp slim
entities:
  - entity: input_boolean.wp_slim_actief
  - entity: sensor.wp_regelmodus
  - type: attribute
    entity: sensor.wp_regelmodus
    attribute: reden
    name: Reden
  - type: attribute
    entity: sensor.wp_regelmodus
    attribute: verschuiving
    name: Verschuiving (°C)
  - type: attribute
    entity: sensor.wp_regelmodus
    attribute: prijs_nu
    name: Prijs nu (€/kWh)
  - type: attribute
    entity: sensor.wp_regelmodus
    attribute: batterij_beschikbaar_kwh
    name: Batterij beschikbaar (kWh)
  - type: attribute
    entity: sensor.wp_regelmodus
    attribute: benodigd_dure_periode_kwh
    name: Nodig voor dure periode (kWh)
  - entity: binary_sensor.wp_zonneoverschot
  - entity: timer.wp_handmatig
  - entity: input_number.wp_basistemperatuur
  - entity: input_boolean.wp_handmatig_wordt_basis
  - entity: climate.woonkamer
```

## Alle instellingen

| Helper | Standaard | Betekenis |
|---|---|---|
| WP basistemperatuur | 20,0 °C | De temperatuur die altijd wordt aangehouden |
| WP verhoging bij voorverwarmen | 0,5 °C | Extra bij goedkope stroom vóór een dure periode |
| WP verhoging bij zonneoverschot | 0,5 °C | Extra bij zonneoverschot |
| WP verlaging bij dure stroom en lege batterij | 0,0 °C | 0 betekent: nooit onder de basis |
| WP maximale stap per wijziging | 0,5 °C | Hoeveel het setpoint per keer mag veranderen |
| WP stapgrootte thermostaat | 0,5 °C | Afronding naar wat de thermostaat accepteert |
| WP minimale tijd tussen wijzigingen | 30 min | Tegen pendelen |
| WP pauze na handmatige wijziging | 3 h | Hoe lang jouw handmatige stand blijft staan |
| WP prijsvenster vooruit | 12 h | Venster om goedkoop/duur te bepalen |
| WP vooruitkijken naar dure periode | 6 h | Hoe ver vooruit voorverwarmen zinvol is |
| WP minimaal prijsverschil | € 0,06/kWh | Onder dit verschil wordt er niet verschoven |
| WP zonneoverschot aan vanaf | 1000 W | Overschot dat nodig is om de zon-modus te starten |
| WP zonneoverschot uit bij tekort van | 300 W | Zon-modus stopt als het tekort groter wordt dan dit |
| WP bruikbare batterijcapaciteit | 10 kWh | Bruikbare capaciteit van je Victron-batterij |
| WP minimale SoC | 20 % | Gelijk houden aan Victron ESS |
| WP verwacht verbruik als meting ontbreekt | 800 W | Reservewaarde als er nog geen 24-uursgemiddelde is |
