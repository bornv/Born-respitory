# Victron Modbus Workflow

## Purpose

Use this guide to turn a vague Victron request into a concrete Modbus TCP implementation plan.

## Inputs To Capture

- GX device hostname or IP
- TCP port, usually `502`
- list of connected Victron services or devices
- required measurements
- poll interval and latency tolerance
- read-only or read/write scope
- target runtime or language

## Planning Sequence

### 1. Define The Output Contract

List the exact signals the consumer needs.

Good examples:

- battery state of charge as percent
- battery voltage and current
- inverter or charger operating state
- PV charger power
- grid import or export power
- AC consumption by phase

Avoid starting from the full Victron register map. Start from the consumer contract and work backward to the minimum register set.

### 2. Map Signals To Victron Services

Decide which logical service likely owns each signal.

Typical split:

- battery metrics: battery monitor or BMS
- inverter and charger metrics: MultiPlus or Quattro
- solar production: MPPT solar charger or PV inverter
- grid metrics: energy meter service
- tank and temperature values: dedicated sensor services

If the exact service is unknown, present the likely owners and keep the implementation modular so unit IDs can be changed without rewriting decoding.

### 3. Build The Register Table

For each requested signal, capture:

| Signal | Unit ID | Register | Count | Type | Scale | Signed | Unit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Battery SOC | `?` | `?` | `1` | `uint16` | `0.1` or `1` | no | `%` | confirm from Victron docs for the exact service |

Do not hide uncertainty. Leave unknown values as explicit placeholders and call them out.

### 4. Choose Polling Strategy

Use this default approach unless the user has stricter requirements:

- poll critical power and SOC values every 1 to 5 seconds
- poll slower-changing state values every 5 to 30 seconds
- group adjacent registers by unit ID
- keep each request small enough that debugging remains simple

Prefer predictable polling over aggressive batching on the first implementation.

### 5. Design Decoding

Define decoding per register group:

- `uint16`
- `int16`
- `uint32`
- `int32`

Record endianness and word order assumptions explicitly in code. If the docs are ambiguous, log raw words and compare them with a known good value before hardening the decoder.

### 6. Add Validation Hooks

For the first pass, include:

- debug logging of raw register words
- a small command or function to read one signal by name
- a sample output table showing decoded engineering units

These diagnostics matter more than elegant abstractions during early bring-up.

## Failure Patterns

### Correct Transport, Wrong Value

Likely causes:

- address offset mismatch
- wrong unit ID
- wrong signedness
- wrong scale factor
- wrong 32-bit word interpretation

### Timeouts Or Empty Responses

Likely causes:

- wrong host or port
- Modbus TCP disabled on the GX device
- unit ID not present on that system
- request spans unsupported registers

### Intermittent Failures

Likely causes:

- polling too fast
- too many wide grouped reads
- network instability
- multiple clients competing for the same gateway

## Output Format

When responding to a user request, prefer this structure:

1. assumptions
2. register plan
3. implementation sketch
4. validation steps
5. known unknowns
