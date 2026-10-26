# Victron Modbus Skill

Codex skill for building and troubleshooting integrations with Victron Energy systems over Modbus TCP.

This repository is generic and public-distribution friendly. It is based on the Victron GX or CCGX Modbus register workbook and focuses on:

- finding the right registers for a requested signal
- understanding service families such as `com.victronenergy.system`, `battery`, `vebus`, `multi`, `grid`, and `solarcharger`
- handling dynamic unit IDs on Venus OS and GX devices
- building safe register plans before writing code
- avoiding common mistakes with scale factors, signedness, and older compatibility registers

## Repository Layout

- [SKILL.md](./SKILL.md): the skill definition used by Codex
- [agents/openai.yaml](./agents/openai.yaml): UI metadata for skill discovery
- [references/workbook-guide.md](./references/workbook-guide.md): workbook structure and unit-ID rules
- [references/service-overview.md](./references/service-overview.md): main service families in the Victron register list
- [references/modbus-workflow.md](./references/modbus-workflow.md): practical workflow for planning an integration
- [references/register-plan-template.md](./references/register-plan-template.md): reusable register planning template

## What The Skill Does

The skill helps an agent move from a user request such as:

- "Read battery state of charge from a Cerbo GX"
- "Find the right Modbus registers for grid power"
- "Generate a polling plan for Victron ESS metrics"
- "Why is this Modbus value off by 10x?"

to a concrete register plan with:

- service name
- runtime unit ID
- register address
- data type
- scale factor
- writable status
- D-Bus path
- engineering unit or enum notes

## Important Victron Notes

- The register workbook is the source of truth for register definitions.
- Unit IDs are not universally fixed. On modern Venus OS systems, confirm them on the GX device under `Settings -> Integrations -> Modbus TCP server -> Available services`.
- `com.victronenergy.system` commonly uses unit ID `100`.
- Prefer read-only integrations first. Treat writable registers as explicit control actions.

## Using The Skill

Install this repository as a Codex skill and invoke it as `$victron-modbus`.

Example prompt:

```text
Use $victron-modbus to find the registers I need for battery SOC, battery power, and grid power on a Cerbo GX.
```

## License

See [LICENSE](./LICENSE).
