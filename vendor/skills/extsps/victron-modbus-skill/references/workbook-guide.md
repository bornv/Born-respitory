# Workbook Guide

## Scope

This skill is grounded in the Victron workbook `CCGX-Modbus-TCP-register-list-3.70.xlsx`.

The workbook contains three sheets:

1. `Field list`
2. `Unit ID mapping`
3. `Document versions`

The `Field list` sheet is the operational source. Its columns are:

| Column | Meaning |
| --- | --- |
| `dbus-service-name` | Logical Victron service family |
| `description` | Human-facing signal name |
| `Address` | Modbus register address |
| `Type` | Register encoding such as `uint16`, `int16`, `uint32`, `int32`, or string |
| `Scalefactor` | Decimal scaling to apply after decoding |
| `Range` | Expected value range |
| `dbus-obj-path` | D-Bus path that the register mirrors |
| `writable` | `yes` or `no` when normalized |
| `dbus-unit` | Engineering unit or enum note |
| `Remarks` | Compatibility notes, caveats, or extra meaning |

## Unit ID Rules

The `Unit ID mapping` sheet matters as much as the register list.

Important facts present in the workbook:

- since Venus OS `2.60`, unit IDs are assigned dynamically
- when in doubt, the correct source is the GX UI under `Settings -> Integrations -> Modbus TCP server -> Available services`
- in general, the unit ID equals the device instance, except when the device instance exceeds `247`
- when device instance is `0`, both `0` and `100` can be used
- many Modbus TCP clients do not support unit ID `0`
- unit ID `100` is explicitly preferred for `com.victronenergy.system`

Do not publish examples that hard-code unit IDs as if they were universal.

## What The Workbook Covers

The workbook currently exposes 945 field rows across many service families. The largest groups in the provided version are:

- `com.victronenergy.vebus`
- `com.victronenergy.multi`
- `com.victronenergy.battery`
- `com.victronenergy.system`
- `com.victronenergy.solarcharger`
- `com.victronenergy.inverter`
- `com.victronenergy.genset`
- `com.victronenergy.acsystem`

This is enough to support generic skills for battery, inverter, ESS, PV, meter, and GX-system tasks.

## Worksheet Notes

The workbook is not perfectly clean. Read it with care and tolerate:

- blank type cells on reserved rows
- blank writable cells on reserved rows
- address ranges such as `5803-5809`
- older compatibility registers noted in remarks
- typos such as `in16` and `unit32`

Do not silently "fix" these values when building a register plan. Preserve the workbook values and note any interpretation you apply.

## Practical Interpretation Rules

- Prefer `dbus-obj-path` for semantic grouping.
- Prefer `Remarks` when a row is marked as old or compatibility-only.
- Treat `writable=yes` as high-risk and confirm the user wants control actions.
- Use the workbook to identify candidates, then confirm live unit IDs on the target GX system.
