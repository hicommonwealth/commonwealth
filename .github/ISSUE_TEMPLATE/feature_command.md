---
name: Command Handler Feature Request
about: Use this template for requesting a command handler feature within a user story.
labels: command, enhancement, needs estimate
---

# Description
<!-- A clear and concise description of the feature. -->

## Stakeholders
<!-- The main points of contact for questions relating to the scope of the feature. -->
| Product   | Engineering |
| --------- | ----------- |
| @Jane     | @John       |

## Model
<!-- A screenshot or reference to the slice of the model in context. -->

## Engineering Requirements
<!-- List of engineering items required as part of the feature. -->

1. **Authorization**
   - Who's authorized to execute this command? Roles, Groups?
2. **Message Schemas** - Use [zod](http://zod.dev)
   - Command schema
3. **Routing**
   - Define REST path, verb - params, query string
   - Include validation schemas (params, query)
4. **Loading Aggregate**
   - Define repository interface used to load (hydrate) model
   - New interface might be required (get by id variants)
5. **Business Rules**
   - Define model invariants to check before accepting this command,based on current state and incoming payload
6. **Mutations**
   - Define model mutations produced by this command
   - This might require new or modified schemas
7. **Persistence**
   - Define repository interfaces used to persist mutations, including data schemas
8. **Events**
   - Define mechanisms used to inform the system about this change - publishing events or synchronously calling a policy
   - Consider integration tradeoffs - inline, retries, circuit breakers, fire-and-forget, pubsub topics, etc
   - Define Event Schemas - Use [zod](http://zod.dev)
9. **Response**
   - Define success, including response schema (zod)
   - Define errors (HTTP codes)

## Unit Testing
<!-- List unit testing scenarios in given-when-then format to cover this feature. -->

## Additional Context
<!-- (Optional) Any other context here, including unanswered hotspots. -->
