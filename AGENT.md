# AGENT.md — AI-Assisted Development Guardrails

## Policy vs Projection Architecture

### Policies (`libs/model/src/policies/*.policy.ts`)
- **Purpose:** Orchestrate flows by reacting to events and calling `command()`
- **Type:** `Policy` from `@hicommonwealth/core`
- **Can:** Read models for context, call `command()`, perform side effects (Redis, notifications)
- **Cannot:** Mutate database directly via Sequelize

### Projections (`libs/model/src/aggregates/<aggregate>/*.projection.ts`)
- **Purpose:** Build/update read models by reacting to events and mutating DB
- **Type:** `Projection` from `@hicommonwealth/core`
- **Can:** Create/update/destroy records via Sequelize
- **Cannot:** Call `command()`

### Validation Checks
Before submitting code that handles events, verify:
1. `.policy.ts` files do NOT call `models.*.create/update/destroy/save/upsert/bulkCreate/increment/findOrCreate`
2. `.projection.ts` files do NOT call `command()`
3. No "Project..." prefixed commands exist (projection logic must not be wrapped in commands)
4. Projections live in `aggregates/<aggregate>/`, not in `policies/`
5. If a handler needs both a command call AND a DB mutation, it must be split into separate policy and projection files
