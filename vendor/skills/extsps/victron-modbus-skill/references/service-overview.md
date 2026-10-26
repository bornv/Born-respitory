# Service Overview

## Main Families In The Provided Workbook

The workbook version used for this skill contains these major service groups:

| Service | Rows | Typical Scope |
| --- | ---: | --- |
| `com.victronenergy.vebus` | 125 | VE.Bus inverter/charger and ESS control |
| `com.victronenergy.multi` | 118 | Multi RS and related inverter-charger signals |
| `com.victronenergy.battery` | 108 | battery voltage, current, power, SOC, alarms |
| `com.victronenergy.system` | 73 | GX-wide aggregates, relays, system-level totals |
| `com.victronenergy.solarcharger` | 60 | MPPT and solar charger metrics |
| `com.victronenergy.inverter` | 55 | inverter output and status |
| `com.victronenergy.genset` | 45 | generator electrical and runtime values |
| `com.victronenergy.acsystem` | 42 | RS device collections and AC system summaries |
| `com.victronenergy.settings` | 34 | ESS and control-loop settings |
| `com.victronenergy.grid` | 32 | grid meter values |
| `com.victronenergy.dcgenset` | 26 | DC generator metrics |
| `com.victronenergy.pvinverter` | 24 | AC-coupled PV inverter metrics |

## Useful Starting Points

For common requests, these are the first service families to inspect:

- battery dashboard: `com.victronenergy.battery`
- inverter or ESS control: `com.victronenergy.vebus`, `com.victronenergy.multi`, `com.victronenergy.settings`
- solar monitoring: `com.victronenergy.solarcharger`, `com.victronenergy.pvinverter`
- whole-system totals: `com.victronenergy.system`
- site import or export: `com.victronenergy.grid`

## Examples

Representative rows from the workbook:

- `com.victronenergy.battery`, `Battery power`, address `256`, type `int32`, path `/Dc/0/Power`
- `com.victronenergy.system`, `CCGX Relay 1 state`, address `806`, writable `yes`, path `/Relay/0/State`
- `com.victronenergy.settings`, `ESS control loop setpoint`, address `2700`, writable `yes`, path `/Settings/Cgwacs/AcPowerSetPoint`
- `com.victronenergy.solarcharger`, `Battery voltage`, address `771`, type `uint16`, scale `100`

## Design Implications

- Generic read-only integrations usually start with `battery`, `system`, `solarcharger`, and `grid`.
- Generic control integrations usually touch `vebus`, `multi`, or `settings`.
- `system` rows are attractive because they expose GX-level aggregates, but they still require the correct system unit ID handling.
