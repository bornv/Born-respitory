---
name: victron-modbus
description: Build, extend, or troubleshoot integrations that use Victron Energy Modbus TCP register lists, especially the CCGX or GX workbook, to read or control Victron systems. Use when Codex needs to interpret the Victron register spreadsheet, map dbus services to unit IDs and registers, generate polling code, search for candidate registers, validate scale factors and signedness, or diagnose wrong values in Cerbo GX or Venus OS based systems.
---

# Victron Modbus

## Overview

Use this skill to work from the Victron Modbus workbook toward an implementation. Start from the register list and unit-ID rules, then produce a concrete register plan before writing code.

The bundled references are based on the provided `CCGX-Modbus-TCP-register-list-3.70.xlsx` workbook:

- `Field list` contains the register catalog.
- `Unit ID mapping` explains preferred and dynamic unit IDs.
- `Document versions` explains how the workbook evolved.

The workbook includes 945 register rows and covers addresses from `3` through `5812`, with some range-style reserved rows near the end.

## Start Here

1. Identify the signals the user actually needs.
2. Search the workbook by service name, dbus path, and description.
3. Resolve unit IDs from the live GX device, not from old static assumptions.
4. Build a register table with type, scale, writable flag, and unit.
5. Generate code or configuration only after the register table is explicit.

## Use The Workbook Correctly

Treat the spreadsheet as the source of truth for:

- register address
- Modbus value type
- scale factor
- dbus object path
- writable or read-only status
- engineering unit or enum notes

Do not assume the workbook alone gives you the runtime unit ID. Since Venus OS `2.60`, unit IDs are assigned dynamically. The `Unit ID mapping` sheet explicitly says to confirm them on the GX device via:

`Settings -> Integrations -> Modbus TCP server -> Available services`

Important rule from the workbook:

- use unit ID `100` for `com.victronenergy.system`
- when device instance is `0`, both `0` and `100` can work, but many clients do not support unit ID `0`

## Search Before You Design

Search the workbook by:

- `dbus-service-name` when the device family is known
- `description` when the user names a measurement in plain language
- `dbus-obj-path` when matching existing D-Bus semantics
- `Remarks` when deciding between old and current register variants

If the workbook is available as a spreadsheet, filter or search within the `Field list` sheet first. If only extracted text is available, search for the service name and D-Bus path together to reduce ambiguity.

## Build The Register Plan

For every signal you plan to use, capture:

- service name
- runtime unit ID
- register address
- type
- scale factor
- writable flag
- dbus path
- unit or enum meaning

Use [references/register-plan-template.md](references/register-plan-template.md) as the working table.

If multiple candidate registers exist, prefer the newer or wider register when the remarks say an older variant exists. Example from the workbook: battery power appears as both `int32` at address `256` and an older `int16` variant at `258`.

## Generate Code Conservatively

When generating a client:

- keep register definitions as data
- keep Modbus transport separate from decoding
- decode `int16`, `uint16`, `int32`, `uint32`, and string registers explicitly
- log raw words during first-pass bring-up
- keep writable registers behind an explicit opt-in path

Assume the first implementation is read-only unless the user clearly asks for writes.

## Watch For Workbook Quirks

The workbook is useful but not perfectly normalized. Handle these cases explicitly:

- reserved rows exist and should not become live signals
- a few type cells contain typos such as `in16` and `unit32`
- some rows have blank type or writable cells
- some address entries are ranges such as `5803-5809`
- remarks sometimes identify preferred replacements or older variants

The parser script preserves these values instead of silently guessing.

## Troubleshooting

If values are wrong but reads succeed, check in this order:

1. wrong unit ID
2. wrong register address
3. wrong signedness
4. wrong width or word order
5. wrong scale factor
6. using an older compatibility register instead of the newer one

If reads fail entirely:

1. confirm the GX Modbus TCP server is enabled
2. confirm the live unit ID on the GX device
3. test one known register from `com.victronenergy.system`
4. expand outward only after a single known read works

## References

- Read [references/workbook-guide.md](references/workbook-guide.md) for the workbook structure, unit-ID rules, and worksheet quirks.
- Read [references/service-overview.md](references/service-overview.md) for the main service families exposed by the workbook.
- Read [references/register-plan-template.md](references/register-plan-template.md) when turning a request into a concrete polling table.
