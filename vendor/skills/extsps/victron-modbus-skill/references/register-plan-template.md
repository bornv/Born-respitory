# Register Plan Template

Use this template before writing code or configuration.

## Register Table

| Signal | Unit ID | Register | Count | Type | Scale | Signed | Unit | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Battery SOC | `TBD` | `TBD` | `1` | `uint16` | `TBD` | `no` | `%` | `high` | `confirm` |
| Battery Power | `TBD` | `TBD` | `1` or `2` | `int16` or `int32` | `TBD` | `yes` | `W` | `high` | `confirm` |
| Battery Voltage | `TBD` | `TBD` | `1` | `uint16` | `TBD` | `no` | `V` | `high` | `confirm` |
| Battery Current | `TBD` | `TBD` | `1` | `int16` | `TBD` | `yes` | `A` | `high` | `confirm` |
| Inverter State | `TBD` | `TBD` | `1` | `uint16` | `1` | `no` | `enum` | `medium` | `confirm` |
| PV Power | `TBD` | `TBD` | `1` or `2` | `uint16` or `uint32` | `TBD` | `no` | `W` | `medium` | `confirm` |
| Grid Power | `TBD` | `TBD` | `1` or `2` | `int16` or `int32` | `TBD` | `yes` | `W` | `medium` | `confirm` |
| AC Load Power | `TBD` | `TBD` | `1` or `2` | `uint16` or `uint32` | `TBD` | `no` | `W` | `medium` | `confirm` |

## Implementation Checklist

- Confirm the GX device is reachable on TCP port `502`.
- Confirm Modbus TCP is enabled on the GX device.
- Confirm each chosen unit ID exists on the target installation.
- Confirm address base expectations from the register documentation.
- Confirm type width and signedness before combining words.
- Confirm scale factors from the documentation or live UI comparison.
- Keep raw words in logs until decoded values match expectations.

## Code Shape

Prefer three layers:

1. register definitions as data
2. Modbus transport client
3. engineering-unit conversion and naming

This keeps future register corrections local to the definitions layer.
