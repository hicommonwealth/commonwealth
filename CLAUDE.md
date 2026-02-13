# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Commonwealth is a full-stack TypeScript monorepo for a multi-tenant blockchain community platform. The application supports multiple blockchains (EVM, Cosmos, Solana) with on-chain governance, real-time notifications, and community engagement features.

## Prerequisites

- Node.js 22.x
- pnpm 9.14.2
- Docker (for PostgreSQL, RabbitMQ, Redis)
- PostgreSQL client (psql)

## Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start external services (PostgreSQL, Redis, RabbitMQ)
docker-compose up -d

# Run database migrations
pnpm migrate-db

# Start the application (API + frontend)
pnpm start
```

The API server runs on http://localhost:3000 (health check at /api/health) and the client on http://localhost:8080.

## Common Commands

### Development

```bash
# Start API server and frontend (most common for local dev)
pnpm start

# Start only the API server
pnpm -F commonwealth start-api

# Start only the frontend
pnpm -F commonwealth start-frontend

# Start all microservices (requires RabbitMQ)
pnpm start-all

# Start just web servers from microservices
pnpm start-apps
```

### Building

```bash
# Build all packages
pnpm build

# Build commonwealth package only
pnpm -F commonwealth build

# Build frontend bundle
pnpm -F commonwealth bundle
```

### Testing

```bash
# Run unit tests (most common)
pnpm -F commonwealth test-unit

# Run integration tests
pnpm -F commonwealth test-integration

# Run API tests
pnpm test-api

# Run E2E tests
pnpm -F commonwealth test-e2e

# Run specific test file or pattern
pnpm -F commonwealth test-select <path>

# Run tests in watch mode
pnpm -F commonwealth test-select:watch
```

### Code Quality

```bash
# Type check all packages (run from root)
pnpm -r check-types

# Lint changed files on current branch (best for local development)
pnpm lint-branch-warnings

# Lint with diff configuration (used in CI)
pnpm -r run lint-diff

# Format code
pnpm format

# Check formatting without changes
pnpm format-check
```

### Database

```bash
# Run migrations
pnpm migrate-db

# Reset database (drop and recreate)
pnpm -F model reset-db

# Load database dump
pnpm load-db [optional-dump-name]

# Dump database
pnpm -F model dump-db

# Open psql client
pnpm psql
```

### Worker Services

```bash
# Start consumer worker
pnpm -F commonwealth start-consumer

# Start EVM chain events worker
pnpm -F commonwealth start-evm-ce

# Start Solana chain events worker
pnpm -F commonwealth start-solana-ce

# Start Graphile worker
pnpm -F commonwealth start-graphile

# Start Knock notification worker
pnpm -F commonwealth start-knock

# Start Discord bot worker
pnpm -F commonwealth start-discord-listener

# Start Twitter worker
pnpm -F commonwealth start-twitter

# Start message relayer
pnpm -F commonwealth start-message-relayer
```

## Architecture

### Monorepo Structure

This is a pnpm workspace monorepo with the following key packages:

**Core Packages:**
- `packages/commonwealth` - Main application (backend + frontend)
- `packages/snapshot-listener` - Event listener service
- `packages/farcaster-app` - Farcaster frame integration
- `packages/load-testing` - Performance testing suite

**Shared Libraries (libs/):**
- `@hicommonwealth/model` - Sequelize ORM models, database layer, business logic (71+ models)
- `@hicommonwealth/core` - Core abstractions, adapter registry, logging, configuration
- `@hicommonwealth/adapters` - External service integrations (S3, Redis, analytics, messaging)
- `@hicommonwealth/schemas` - Zod validation schemas for data contracts
- `@hicommonwealth/shared` - Isomorphic utilities (Canvas.js chains, cryptography)
- `@hicommonwealth/chains` - Chain type definitions and Cosmos SDK utilities
- `@hicommonwealth/evm-protocols` - Ethereum/EVM contract ABIs and utilities

### Tech Stack

**Frontend:**
- React 18.3 with TypeScript
- Vite for bundling
- State: Zustand (UI state), React Query (server state)
- Routing: React Router v6
- Forms: React Hook Form
- Rich text: Lexical, Quill
- Styling: SASS with component-scoped styles
- Web3: Ethers.js, Viem, Solana SDK, CosmJS

**Backend:**
- Node.js with Express.js
- API: REST + tRPC
- Database: PostgreSQL with Sequelize ORM
- Message Queue: RabbitMQ (via Rascal)
- Job Queue: Graphile Worker
- Caching: Redis
- Logging: Pino
- Authentication: Passport.js with JWT

### Commonwealth Package Structure

**Server (`packages/commonwealth/server/`):**
- `api/` - tRPC routers (external, internal, integration, mcp-server)
- `workers/` - Background job processors and microservices
  - `commonwealthConsumer/` - Main event consumer
  - `evmChainEvents/` - EVM chain event polling
  - `solanaChainEvents/` - Solana event processing
  - `graphileWorker/` - Job scheduler
  - `messageRelayer/` - Message delivery
  - `discordBot/`, `twitterWorker/`, `knock/` - Integration workers
- `routes/` - Express route handlers
- `middleware/` - Express middleware (auth, rate limiting)
- `passport/` - Authentication strategies
- `scripts/` - Admin and maintenance scripts
- `config.ts` - Centralized configuration
- `bindings/bootstrap.ts` - Service initialization

**Client (`packages/commonwealth/client/`):**
- `scripts/views/` - Page components
- `scripts/controllers/` - Component logic orchestration
- `scripts/hooks/` - Custom React hooks
- `scripts/state/` - Zustand stores (UI state)
- `scripts/stores/` - Additional state management
- `scripts/helpers/` - Business logic helpers
- `scripts/navigation/` - Routing logic
- `components/` - Reusable UI components
- `component_kit/` - Core design system components (prefixed with `CW`)

**Shared (`packages/commonwealth/`):**
- `shared/` - Isomorphic utilities
- `src/services/` - Business logic services (token cache, chain events, integrations)
- `test/` - Unit, integration, E2E, and devnet tests

### Request Flow

1. **Client → API**: React frontend makes tRPC/REST calls to Express backend
2. **API → Model**: Routes/procedures use `@hicommonwealth/model` Sequelize models
3. **Model → Database**: ORM manages PostgreSQL interactions
4. **Event Publishing**: Services publish events to RabbitMQ
5. **Worker Processing**: Background workers consume messages and process async jobs
6. **Notifications**: Events trigger notifications via Knock/Discord/Twitter

### Service Isolation

Workers can run as independent services using the `SERVICE` environment variable:
- `SERVICE=web` - Main API + frontend serving
- `SERVICE=consumer` - Commonwealth consumer worker
- `SERVICE=evm-ce` - EVM chain events worker
- `SERVICE=graphile` - Graphile job worker
- `SERVICE=knock` - Knock notification worker
- `SERVICE=discord-listener` - Discord bot
- `SERVICE=twitter` - Twitter worker
- `SERVICE=message-relayer` - Message relay worker

Use `DEV_MODULITH=true` to run workers in the main process for local development.

## Development Guidelines

### Environment Variables

**Backend:**
- Access through the `config` object from `@hicommonwealth/model`
- Type-safe with Zod schema validation
- Centralized in `config.ts`

```typescript
import { config } from '@hicommonwealth/model';
const jwtSecret = config.AUTH.JWT_SECRET;
```

**Frontend:**
- Defined in `vite.config.ts`
- Access with `process.env.VARIABLE_NAME`
- Must be explicitly exposed in Vite config

### Feature Flags

- All feature flag environment variables prefixed with `FLAG_`
- Define in `feature-flags.ts` using `buildFlag` helper
- Frontend: Use `useFlag` hook from Unleash
- Backend: Check environment variables directly

### State Management

**Use React Query for:**
- Server state (data fetching, caching, synchronization)
- API data and mutations

**Use Zustand for:**
- UI state (modals, sidebars, form inputs, UI preferences)
- Client-only state

**Zustand conventions:**
- Create focused stores in `state/ui/`
- Export vanilla store (named) and React hook (default)
- Use `createBoundedUseStore` wrapper

### React Components

**Directory structure:**
- `components/` - Reusable UI components
- `component_kit/` - Core design system components (prefix with `CW`)
- Each component in its own PascalCase folder with `index.ts`

**Naming:**
- Components: PascalCase (e.g., `CWButton`, `UserProfile`)
- Props interface: `ComponentNameProps`
- Component kit exports: named exports; others: default exports
- Root CSS class matches component name

**Implementation:**
- Functional components only
- Destructured props with TypeScript
- Event handlers defined in component body (not inline)
- Skeleton components for loading states

### Linting and Type Checking

**Workflow for fixing issues:**

1. **Check types**: `pnpm -r check-types` (from root)
2. **Lint locally**: `pnpm lint-branch-warnings` (from root) - includes warnings, best for iteration
3. **Fix issues systematically**:
   - Remove unused variables/imports
   - Correct type errors (avoid `any`, prefer `unknown`)
   - Ensure React hooks have correct dependencies (never disable `exhaustive-deps`)
   - Use `const` instead of `let` where possible
4. **Verify**: Re-run checks until clean

**CI checks:**
- `pnpm -r run lint-diff` - Diff-based linting (errors and warnings)
- `pnpm -r check-types` - TypeScript compilation

### Database Patterns

- 71+ Sequelize models in `@hicommonwealth/model`
- Extensive migration history (managed by Sequelize CLI)
- Foreign keys maintain referential integrity
- Partitioned tables for large datasets

### Testing Strategy

- **Unit tests**: Service/model libraries in `test/unit/`
- **Integration tests**: With test databases in `test/integration/`
- **API tests**: `test/integration/api/`
- **E2E tests**: Playwright for user workflows in `test/e2e/`
- **Devnet tests**: Blockchain integration in `test/devnet/`

Bootstrap test database: `pnpm -F commonwealth bootstrap-test-db`

### Design System

- Figma is the single source of truth for UI design
- Build reusable components in `component_kit`
- Use `getClasses` utility for component variants
- Match component styles to Figma specifications

### Error Handling

- Centralized error handler middleware in Express
- Custom `AppError` class for domain errors
- Try-catch with async error wrappers

### Authentication

- Passport.js strategies: JWT, Magic, Discord, Privy
- JWT stored in cookies with httpOnly flag
- Session management with express-session + Sequelize store

## Important Patterns

### Adapter Pattern

Services abstracted through adapters (cache, blob storage, notifications) registered at runtime via `@hicommonwealth/core`. Allows swapping implementations (S3 ↔ R2, Redis ↔ in-memory).

### Middleware Composition

Express middleware orchestrates concerns (auth, rate limiting, logging, error handling). tRPC procedures stack validators, auth checks, and business logic.

### Event-Driven Processing

Services publish events to RabbitMQ. Workers consume messages and process async jobs. Enables service isolation and horizontal scaling.

### Policies vs Projections

Both policies and projections are event handlers, but serve fundamentally different purposes:

**Policies** (`libs/model/src/policies/*.policy.ts`):
- Orchestrators that connect flows: event → `command()`
- React to events and invoke commands defined by aggregates
- May read from models (ideally via queries) for context needed to decide which command to invoke
- **Cannot** mutate the database directly via Sequelize
- Use the `Policy` type from `@hicommonwealth/core`
- Side-effect-only handlers (Redis, notifications, external services) are also policies

**Projections** (`libs/model/src/aggregates/<aggregate>/*.projection.ts`):
- Read model builders that materialize state: event → Sequelize mutation
- React to events and mutate database models directly
- **Cannot** call `command()`
- Use the `Projection` type from `@hicommonwealth/core`
- Live inside their respective aggregate directory, not in `policies/`

**Rules:**
- `.policy.ts` files must NOT contain direct DB mutations (`models.*.create/update/destroy/save/upsert/bulkCreate/increment/findOrCreate`)
- `.projection.ts` files must NOT call `command()`
- "Project..." prefixed commands are a code smell — projection logic should not be wrapped in command indirection
- When an event needs both a command call AND a DB mutation, split into separate policy and projection files

### Configuration Management

Centralized config via `@hicommonwealth/core/configure()` with environment-specific overrides and Zod validation.

### Monorepo Dependencies

Use workspace protocol for internal dependencies. Clear package boundaries with specific entry points. Shared types/schemas prevent circular dependencies.
