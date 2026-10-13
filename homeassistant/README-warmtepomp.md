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
| Thermostaat `climate.thermostat_1` | Waarschijnlijk Intergas gateway (InComfort): die noemt kamers *Thermostat 1* | Ingevuld |
| Zonneplan-kwartierprijzen met `forecast`-attribuut | HACS: [Zonneplan ONE (fsaris)](https://github.com/fsaris/home-assistant-zonneplan-one) | Gecontroleerd in de broncode |
| Victron SoC, netvermogen, PV-vermogen, huisverbruik | Victron GX (officieel, HA 2026.5+) | Zie [Benodigde waarden](#benodigde-waarden) |

De Xtend-integraties die ik vond ([pepijnnichting/intergas-xtend](https://github.com/pepijnnichting/intergas-xtend),
[svdlinde42/ha-intergas-xtend-local-ap](https://github.com/svdlinde42/ha-intergas-xtend-local-ap))
zijn vooral uitleesintegraties. Daarom loopt de sturing via de thermostaat. Een Xtend-integratie is
handig om COP, compressor en ketelinzet te volgen, maar is niet nodig.

## Benodigde waarden

Het pakket gebruikt zeven waarden van buitenaf. De Victron-namen hieronder zijn de namen uit de
officiële **Victron GX**-integratie (Home Assistant 2026.5+, via MQTT op de Cerbo GX) en de
HACS-integratie **Victron MQTT Integration** (`victron_mqtt`) van dezelfde maker: beide gebruiken
de bibliotheek `victron-mqtt`, dus de namen zijn gelijk. Ik heb ze
gecontroleerd in de broncode van de integratie (`victron-mqtt` 2026.9.5). De entity-ID's zelf
hangen af van de apparaatnaam in jouw installatie. Zoek dus op de **weergavenaam** onder
Instellingen → Apparaten & diensten → Victron GX → Entiteiten.

| Placeholder in het pakket | Wat | Bron in Home Assistant | Eenheid / teken |
|---|---|---|---|
| `climate.thermostat_1` | Thermostaat | InComfort (*Thermostaat*) | Attributen `temperature`, `min_temp`, `max_temp` |
| `sensor.zonneplan_current_quarter_hourly_electricity_tariff` | Kwartierprijs + `forecast` | Zonneplan ONE (HACS) → *Current quarter hourly electricity tariff* | €/kWh |
| `sensor.ac_system_0_dc_battery_charge` | Batterij-SoC | Victron GX → **DC battery charge** | % |
| `sensor.wp_netvermogen` (som van `sensor.ac_system_0_grid_power_l1/l2/l3`, maakt het pakket zelf) | Netvermogen totaal | Victron GX → **Grid power L1** (+ L2 + L3) | W, **afname = positief** |
| `sensor.ac_system_0_pv_power` | PV totaal | Victron GX → **PV power** (DC) + **PV on grid power L1–L3** + **PV on output power L1–L3** | W |
| `sensor.huisverbruik_totaal` (eigen somhelper) | Huisverbruik totaal, incl. warmtepomp | Victron GX → **Consumption power L1** (+ L2 + L3) | W |
| `number.ac_system_0_ess_min_soc_limit` | ESS-minimum | Victron GX → **ESS min SoC limit** | % |
| `sensor.ac_system_0_dynamic_ess_minimum_soc` | DESS-minimum | Victron GX → **Dynamic ESS minimum SoC** | % |

### Per fase optellen

De Victron GX-integratie levert netvermogen, verbruik en AC-PV **per fase**. Er is geen
totaalsensor. Maak daarom per totaal een somhelper:

1. Instellingen → Apparaten & diensten → **Helpers** → **Helper aanmaken** →
   **Combineer de status van meerdere sensoren** (*Combine the state of several sensors*).
2. Vul in:

   | Helpernaam | Type | Invoersensoren |
   |---|---|---|
   | `Victron net totaal` | Som | Grid power L1, L2, L3 (wat je hebt) |
   | `Victron verbruik totaal` | Som | Consumption power L1, L2, L3 |
   | `Victron PV totaal` | Som | PV power (DC), PV on grid power L1–L3, PV on output power L1–L3 (alleen wat bij jou bestaat) |

3. Gebruik de entity-ID's van deze helpers in het pakket.

Heb je één fase en maar één PV-bron? Dan kun je de Victron-sensor direct gebruiken. Alleen
DC-PV (MPPT's) en geen *PV on grid/output*-sensoren? Gebruik dan **PV power** direct.

**Dubbele sensoren:** zie je elke Victron-sensor twee keer, waarvan één *Niet beschikbaar*? Dan
zijn er oude entiteiten blijven staan (bijvoorbeeld na het opnieuw toevoegen van de integratie).
Gebruik altijd de entiteit **met** waarde. Controleer ook of je somhelpers die gebruiken: één
niet-beschikbare invoer maakt de hele som `unknown`.

**Let op:** een somhelper wordt `unknown` zodra één invoer `unknown` is. Neem daarom alleen
sensoren op die bij jou echt een waarde hebben (PV on output bestaat bijvoorbeeld alleen bij een
PV-omvormer op AC-out).

### Waarom deze sensoren

- **Consumption power** (`Ac/Consumption`) is het totale AC-verbruik op de in- én uitgang van de
  Multi/Quattro. De warmtepomp telt dus mee, waar hij ook is aangesloten. Gebruik **niet**
  *AC loads* of *Critical loads*: dat is maar één van de twee.
- **DC battery charge** is de SoC die het Victron-systeem zelf gebruikt (`Dc/Battery/Soc`).
- **ESS min SoC limit** en **Dynamic ESS minimum SoC** zijn de ondergrenzen die Victron hanteert.
  Het pakket neemt de hoogste van deze twee en **WP minimale SoC**. Ontbreekt een Victron-waarde,
  dan telt die niet mee. (*Active SoC limit* wordt niet bij elke installatie geleverd.)
- **Bruikbare batterijcapaciteit (kWh)** levert Victron niet als kWh. Die vul je zelf in.

### Controleren in Home Assistant

Plak [`checks/warmtepomp_invoercheck.jinja`](checks/warmtepomp_invoercheck.jinja) in
**Ontwikkelhulpmiddelen → Template** (sinds 2026.8: **Hulpmiddelen → Template**), met dezelfde
entity-ID's als in het pakket. Je ziet per waarde ✅, ⚠️ of ❌. De check kijkt naar:
- of elke sensor bestaat;
- of de eenheid klopt (W, niet kW);
- of de Zonneplan-forecast leesbaar is en in kwartieren komt;
- of het teken van het netvermogen klopt (afname = positief).

## Installatie

1. **Maak een back-up**: Instellingen → Systeem → Back-ups → **Nu back-up maken**.
2. Open de **File editor**-app en open `configuration.yaml`. Maak eerst een kopie van het bestand.
   Voeg daarna onder `homeassistant:` het volgende toe (staat er al `packages:`, dan sla je deze stap over):
   ```yaml
   homeassistant:
     packages: !include_dir_named Packages
   ```
3. Maak de map `packages` aan in `/config` en zet `warmtepomp_slim.yaml` daarin.
4. **Entity-ID's zijn al ingevuld** voor jouw installatie (zie [Benodigde waarden](#benodigde-waarden)).
   Draai na de herstart de [invoercheck](#controleren-in-home-assistant).

5. Ga naar **Ontwikkelhulpmiddelen → YAML** (sinds 2026.8: **Hulpmiddelen → YAML**) →
   **Configuratie controleren**. Pas als die groen is: **Herstarten**.
6. Voer het script **WP slim – standaardwaarden instellen** één keer uit
   (Instellingen → Automatiseringen & scènes → Scripts).
7. Controleer en pas aan:
   - **WP basistemperatuur**: staat op 20,0 °C;
   - **WP bruikbare batterijcapaciteit**: bruikbare kWh van je Victron-batterij;
   - **WP minimale SoC**: dezelfde waarde als de minimale SoC in Victron ESS (met de Victron-minima gekoppeld neemt het pakket automatisch de hoogste);
   - **WP stapgrootte thermostaat**: 0,5 of 0,1, afhankelijk van wat je thermostaat accepteert.
8. Zet **WP slimme regeling actief** aan.

## Thermostaat en Xtend instellen

**InComfort-gateway:** een setpoint vanuit Home Assistant wordt een *override* op de thermostaat.
Schakelt het klokprogramma van de thermostaat naar een volgende stap, dan vervalt die override en
ziet het pakket dat als handmatige wijziging (pauze van 3 uur). Zet het programma daarom op een
vaste temperatuur. Gebruik de integratie-optie *legacy setpoint status* alleen als je thermostaat
de override niet goed terugmeldt.


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
  - entity: climate.thermostat_1
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
| WP bruikbare batterijcapaciteit | 16 kWh | BYD 312 Ah × 51,2 V ≈ 16 kWh |
| WP minimale SoC | 20 % | Gelijk houden aan Victron ESS |
| WP verwacht verbruik als meting ontbreekt | 800 W | Reservewaarde als er nog geen 24-uursgemiddelde is |
