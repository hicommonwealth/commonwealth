# Commonwealth Monorepo Architecture

## 1. Overview

The Commonwealth monorepo is a modular, event-driven platform for decentralized governance, social, and blockchain-based applications. It leverages a CQRS (Command Query Responsibility Segregation) pattern, a rich domain model, and a robust infrastructure stack to support scalable, extensible, and secure community features.

---

## 2. System Components

### 2.1 Packages

- **commonwealth**: Main application (API server, client, scripts, deployment logic)
- **farcaster-app**: Farcaster protocol integration
- **snapshot-listener**: Listens to and processes Snapshot events
- **load-testing**: Load and performance testing utilities
- **external-api-testing**: Utilities for testing external APIs

### 2.2 Libraries

- **model**: Domain logic, aggregates, policies, services, and DB models
- **core**: Framework utilities, CQRS, types, error handling
- **adapters**: Protocol adapters (trpc, express, rabbitmq, etc)
- **schemas**: Zod schemas for API and DB validation
- **shared**: Shared utilities, constants, and types
- **evm-protocols**: EVM-compatible blockchain integrations
- **chains**: Chain adapters for various protocols
- **railway, sitemaps, eslint-plugin**: Miscellaneous utilities and plugins

### 2.3 Workers/Jobs

- **graphileWorker**: Background job processing
- **knock**: Notification and messaging jobs
- **twitterWorker**: Twitter event processing
- **evmChainEvents**: EVM chain event listeners
- **commonwealthConsumer**: Consumes and processes RabbitMQ messages
- **messageRelayer**: Relays messages between services
- **discordBot**: Discord bot integration

---

## 3. Application Flow

### 3.1 Client-Server Interaction

- React web client communicates with the API server via HTTP and WebSocket.

### 3.2 API Layer

- Node.js/Express server exposes REST, TRPC, and WebSocket endpoints.

### 3.3 Domain Logic

- Implemented in the `model` lib using CQRS, aggregates, policies, and services.

### 3.4 Adapters

- Protocol adapters connect core logic to external systems (RabbitMQ, Express, TRPC, etc).

---

## 4. Infrastructure

### 4.1 Databases

- PostgreSQL for persistent storage. See [Database-ERD.md](common_knowledge/Database-ERD.md) for schema.

### 4.2 Caching

- Redis for caching, rate limiting, and ephemeral data.

### 4.3 Messaging

- RabbitMQ for event-driven communication and decoupling.

### 4.4 Containers & Orchestration

- Docker Compose orchestrates all containers and services for local and production environments.

---

## 5. Initialization & Configuration

### 5.1 Environment Variables

- Managed via `.env` files and documented in [Environment-Variables.md](common_knowledge/Environment-Variables.md).

### 5.2 App Initialization Flow

- See [App-Initialization-Flow.md](common_knowledge/App-Initialization-Flow.md) for details on bootstrapping and dependency wiring.

---

## 6. Event-Driven Architecture

### 6.1 RabbitMQ Usage

- Used for asynchronous, event-driven communication between services and workers.

### 6.2 Outbox Pattern

- Ensures reliable event delivery and recovery from failures.

### 6.3 Idempotency & Retry Strategies

- Policies for handling duplicate or failed events. See [RabbitMQ.md](common_knowledge/RabbitMQ.md).

---

## 7. Security & Permissions

### 7.1 Authentication

- OAuth, wallet, and session management.

### 7.2 Authorization

- Tiered access, roles, and middleware.

### 7.3 Secrets Management

- Secure handling of sensitive configuration.

---

## 8. Deployment & Operations

### 8.1 CI/CD

- Build, test, and deployment pipelines.

### 8.2 Monitoring & Logging

- Datadog, Rollbar, and health checks.

### 8.3 Scaling & Fault Tolerance

- Strategies for handling load and failures.

---

## 9. Extensibility & Customization

### 9.1 Adding and Running Jobs/Workers

- **Jobs** such as `graphileWorker`, `knock`, `twitterWorker`, `evmChainEvents`, `commonwealthConsumer`, `messageRelayer`, and `discordBot` are located in `packages/commonwealth/server/workers/`.
- In production, these are typically run as separate processes or containers.
- **DEV_MODULITH**: In development mode, you can set the `DEV_MODULITH` environment variable to `true` to run all jobs/workers in the same server process as the API. This simplifies local development and debugging. Example:

  ```sh
  DEV_MODULITH=true pnpm run start
  ```

- This will start the API server and all background jobs in a single process, reducing the need for multiple terminals or containers.

### 9.2 Adding New Domain Logic

- **Aggregates**: Create a new folder under `libs/model/src/aggregates/` for your domain entity. Implement commands, queries, and event handlers as needed.
- **Commands**: Add a `*.command.ts` file exporting a factory function that returns a `Command<Schema>`. Use Zod schemas for input/output validation.
- **Queries**: Add a `*.query.ts` file for read operations, following the same pattern as commands.
- **Policies**: If your logic is event-driven or cross-cutting, add a new policy in `libs/model/src/policies/` or extend an existing one. Policies listen to events and can trigger commands or side effects.
- **Export** your new logic in the relevant `index.ts` files for automatic discovery and registration.
- **Testing**: Add tests in `libs/model/test/` to cover your new logic.
- **Documentation**: Update or add documentation in `common_knowledge/` as needed.

---

## 10. Diagrams

### 10.1 Logical Architecture Diagram

```mermaid
graph TD
  webClient[WebClient]
  apiServer[APIServer]
  commonwealthApp[CommonwealthApp]
  modelDomain[ModelDomain]
  coreFramework[CoreFramework]
  adapters[Adapters]
  schemas[Schemas]
  sharedUtils[SharedUtils]
  evmProtocols[EvmProtocols]
  chainAdapters[ChainAdapters]
  postgresDb[PostgresDB]
  rabbitMq[RabbitMQ]
  redisCache[Redis]

  subgraph workers[Workers]
    graphileWorker[GraphileWorker]
    knockWorker[KnockWorker]
    twitterWorker[TwitterWorker]
    evmChainEventsWorker[EvmChainEventsWorker]
    commonwealthConsumerWorker[CommonwealthConsumerWorker]
    messageRelayerWorker[MessageRelayerWorker]
    discordBotWorker[DiscordBotWorker]
  end

  webClient --> apiServer
  apiServer --> commonwealthApp
  commonwealthApp --> modelDomain
  modelDomain --> coreFramework
  modelDomain --> adapters
  modelDomain --> schemas
  modelDomain --> sharedUtils
  modelDomain --> evmProtocols
  modelDomain --> chainAdapters
  apiServer --> postgresDb
  apiServer --> redisCache
  apiServer --> rabbitMq
  graphileWorker --> postgresDb
  knockWorker --> rabbitMq
  twitterWorker --> rabbitMq
  evmChainEventsWorker --> rabbitMq
  commonwealthConsumerWorker --> rabbitMq
  messageRelayerWorker --> rabbitMq
  discordBotWorker --> rabbitMq
  graphileWorker --> apiServer
  knockWorker --> apiServer
  twitterWorker --> apiServer
  evmChainEventsWorker --> apiServer
  commonwealthConsumerWorker --> apiServer
  messageRelayerWorker --> apiServer
  discordBotWorker --> apiServer
```

### 10.2 Physical/Deployment (Components) Diagram

```mermaid
flowchart LR
  webClient[WebClient]
  apiServer[APIServer]
  workers[Workers]
  postgresDb[PostgresDB]
  rabbitMq[RabbitMQ]
  redisCache[Redis]
  webClient --> apiServer
  apiServer --> postgresDb
  apiServer --> redisCache
  apiServer --> rabbitMq
  workers --> rabbitMq
  workers --> postgresDb
  workers --> apiServer
```

### 10.3 C4 Context Diagram

```mermaid
graph TD
  user[User]
  admin[Admin]
  externalApi[ExternalAPI]
  webClient[WebClient]
  apiServer[APIServer]
  workers[Workers]
  postgresDb[PostgresDB]
  rabbitMq[RabbitMQ]
  redisCache[Redis]
  user --> webClient
  admin --> webClient
  webClient --> apiServer
  apiServer --> externalApi
  apiServer --> postgresDb
  apiServer --> redisCache
  apiServer --> rabbitMq
  workers --> rabbitMq
  workers --> postgresDb
  workers --> apiServer
```

### 10.4 C4 Container Diagram

```mermaid
graph TD
  webClient[WebClient]
  apiServer[APIServer]
  postgresDb[PostgresDB]
  rabbitMq[RabbitMQ]
  redisCache[Redis]
  subgraph workers[Workers]
    graphileWorker[GraphileWorker]
    knockWorker[KnockWorker]
    twitterWorker[TwitterWorker]
    evmChainEventsWorker[EvmChainEventsWorker]
    commonwealthConsumerWorker[CommonwealthConsumerWorker]
    messageRelayerWorker[MessageRelayerWorker]
    discordBotWorker[DiscordBotWorker]
  end
  webClient --> apiServer
  apiServer --> postgresDb
  apiServer --> redisCache
  apiServer --> rabbitMq
  graphileWorker --> postgresDb
  knockWorker --> rabbitMq
  twitterWorker --> rabbitMq
  evmChainEventsWorker --> rabbitMq
  commonwealthConsumerWorker --> rabbitMq
  messageRelayerWorker --> rabbitMq
  discordBotWorker --> rabbitMq
  graphileWorker --> apiServer
  knockWorker --> apiServer
  twitterWorker --> apiServer
  evmChainEventsWorker --> apiServer
  commonwealthConsumerWorker --> apiServer
  messageRelayerWorker --> apiServer
  discordBotWorker --> apiServer
```

### 10.5 C4 Component Diagram (API Server)

```mermaid
graph TD
  apiServer[APIServer]
  trpcAdapter[TRPCAdapter]
  expressAdapter[ExpressAdapter]
  commandBus[CommandBus]
  queryBus[QueryBus]
  eventBus[EventBus]
  domainLogic[DomainLogic]
  authMiddleware[AuthMiddleware]
  rateLimiter[RateLimiter]
  apiServer --> trpcAdapter
  apiServer --> expressAdapter
  trpcAdapter --> commandBus
  expressAdapter --> queryBus
  commandBus --> domainLogic
  queryBus --> domainLogic
  domainLogic --> eventBus
  eventBus --> apiServer
  apiServer --> authMiddleware
  apiServer --> rateLimiter
```

### 10.6 C4 Component Diagram (WebClient)

```mermaid
graph TD
  webClient[WebClient]
  reactApp[ReactApp]
  stateManager[StateManager]
  apiClient[ApiClient]
  router[Router]
  uiComponents[UIComponents]
  hooks[Hooks]
  webClient --> reactApp
  reactApp --> stateManager
  reactApp --> apiClient
  reactApp --> router
  reactApp --> uiComponents
  reactApp --> hooks
```

### 10.7 C4 Component Diagram (Worker)

```mermaid
graph TD
  worker[Worker]
  messageConsumer[MessageConsumer]
  eventHandler[EventHandler]
  jobProcessor[JobProcessor]
  dbClient[DbClient]
  apiClient[ApiClient]
  logger[Logger]
  worker --> messageConsumer
  messageConsumer --> eventHandler
  eventHandler --> jobProcessor
  jobProcessor --> dbClient
  jobProcessor --> apiClient
  jobProcessor --> logger
```

### 10.8 C4 Component Diagram (GraphileWorker)

```mermaid
graph TD
  graphileWorker[GraphileWorker]
  pgListener[PgListener]
  jobScheduler[JobScheduler]
  jobProcessor[JobProcessor]
  dbClient[DbClient]
  logger[Logger]
  graphileWorker --> pgListener
  pgListener --> jobScheduler
  jobScheduler --> jobProcessor
  jobProcessor --> dbClient
  jobProcessor --> logger
```

### 10.9 C4 Component Diagram (KnockWorker)

```mermaid
graph TD
  knockWorker[KnockWorker]
  messageConsumer[MessageConsumer]
  notificationHandler[NotificationHandler]
  apiClient[ApiClient]
  dbClient[DbClient]
  logger[Logger]
  knockWorker --> messageConsumer
  messageConsumer --> notificationHandler
  notificationHandler --> apiClient
  notificationHandler --> dbClient
  notificationHandler --> logger
```

### 10.10 C4 Component Diagram (TwitterWorker)

```mermaid
graph TD
  twitterWorker[TwitterWorker]
  messageConsumer[MessageConsumer]
  twitterApiClient[TwitterApiClient]
  eventHandler[EventHandler]
  dbClient[DbClient]
  logger[Logger]
  twitterWorker --> messageConsumer
  messageConsumer --> eventHandler
  eventHandler --> twitterApiClient
  eventHandler --> dbClient
  eventHandler --> logger
```

### 10.11 C4 Component Diagram (EvmChainEventsWorker)

```mermaid
graph TD
  evmChainEventsWorker[EvmChainEventsWorker]
  messageConsumer[MessageConsumer]
  chainEventHandler[ChainEventHandler]
  evmApiClient[EvmApiClient]
  dbClient[DbClient]
  logger[Logger]
  evmChainEventsWorker --> messageConsumer
  messageConsumer --> chainEventHandler
  chainEventHandler --> evmApiClient
  chainEventHandler --> dbClient
  chainEventHandler --> logger
```

### 10.12 C4 Component Diagram (CommonwealthConsumerWorker)

```mermaid
graph TD
  commonwealthConsumerWorker[CommonwealthConsumerWorker]
  messageConsumer[MessageConsumer]
  eventHandler[EventHandler]
  dbClient[DbClient]
  apiClient[ApiClient]
  logger[Logger]
  commonwealthConsumerWorker --> messageConsumer
  messageConsumer --> eventHandler
  eventHandler --> dbClient
  eventHandler --> apiClient
  eventHandler --> logger
```

### 10.13 C4 Component Diagram (MessageRelayerWorker)

```mermaid
graph TD
  messageRelayerWorker[MessageRelayerWorker]
  messageConsumer[MessageConsumer]
  relayer[Relayer]
  apiClient[ApiClient]
  logger[Logger]
  messageRelayerWorker --> messageConsumer
  messageConsumer --> relayer
  relayer --> apiClient
  relayer --> logger
```

### 10.14 C4 Component Diagram (DiscordBotWorker)

```mermaid
graph TD
  discordBotWorker[DiscordBotWorker]
  messageConsumer[MessageConsumer]
  discordApiClient[DiscordApiClient]
  eventHandler[EventHandler]
  dbClient[DbClient]
  logger[Logger]
  discordBotWorker --> messageConsumer
  messageConsumer --> eventHandler
  eventHandler --> discordApiClient
  eventHandler --> dbClient
  eventHandler --> logger
```

### 10.5 Database ERD

- See [Database-ERD.md](common_knowledge/Database-ERD.md)

---

## 11. Glossary

- (Define key terms, acronyms, and concepts)

## 12. References

- [App-Initialization-Flow.md](common_knowledge/App-Initialization-Flow.md)
- [RabbitMQ.md](common_knowledge/RabbitMQ.md)
- [Environment-Variables.md](common_knowledge/Environment-Variables.md)
- [Database-ERD.md](common_knowledge/Database-ERD.md)
- [Deployment.md](common_knowledge/Deployment.md)
- [State-Management.md](common_knowledge/State-Management.md)
