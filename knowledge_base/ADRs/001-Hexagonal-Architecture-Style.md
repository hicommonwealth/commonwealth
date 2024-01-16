# ADR 001: Hexagonal Architecture Style

Date: 2024-01-12

## Status

Proposed: @Rotorsoft 20240112
Accepted:

## Context

We are designing a system that requires clear separation of concerns, flexibility, and the ability to swap out components with minimal impact on other parts, specially the core domain. We also anticipate the need to support multiple types of clients and external systems.

Given some of the existing cross-cutting concerns:

1. **Logging**: We need to track the activities in our system for debugging and auditing purposes.
2. **Caching**: To improve performance, we need to cache frequently accessed data.
3. **Queuing**: We need to handle asynchronous tasks and ensure they are processed in a reliable manner.
4. **Monitoring**: We need to keep track of the health and performance of our system.
5. **API Protocols**: Our system needs to interact with various external systems, each of which may use a different API protocol (like REST, GraphQL, gRPC).
6. **Database System**: Our system needs to store and retrieve data. We need to choose the right database system (like SQL, NoSQL) based on our data model and access patterns.

We need an architecture style that can handle these cross-cutting concerns in a clean and efficient manner.

## Decision

We have decided to use the Hexagonal Architecture style (also known as Ports and Adapters) for our system design.

## Rationale

1. **Separation of Concerns**: Hexagonal Architecture allows us to separate the core business logic from the code that interacts with the outside world (like databases, UI, external services). This makes the core logic easier to understand, test, and maintain.
2. **Flexibility**: With Hexagonal Architecture, we can easily swap out components without affecting the core logic. For example, we can change the database or the UI framework without touching the business logic.
3. **Testability**: Hexagonal Architecture makes it easy to write automated tests. We can use mock adapters in our tests to isolate the business logic.
4. **Multiple Clients**: Hexagonal Architecture allows us to support multiple types of clients (like web, mobile, API) using the same core logic.

## Consequences

While Hexagonal Architecture provides many benefits, it also introduces some complexity. We will need to manage this complexity through good design and coding practices.

## References

- [Alistair Cockburn, "Hexagonal Architecture"](https://alistair.cockburn.us/hexagonal-architecture)
- [Roman Glushach, "Hexagonal Architecture: The Secret to Scalable and Maintainable Code for Modern Software"](https://medium.com/@romanglushach/hexagonal-architecture-the-secret-to-scalable-and-maintainable-code-for-modern-software-d345fdb47347)
- [Spike PR - Logging port and adapter](https://github.com/hicommonwealth/commonwealth/pull/6345)
