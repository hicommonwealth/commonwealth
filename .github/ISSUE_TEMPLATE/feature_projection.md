---
name: Projection Feature Request
about: Use this template for requesting a projection feature within a user story.
labels: projection, enhancement, needs estimate
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
   - Who's authorized to query this projection? Roles, Groups?
2. **Projection Schema** - Use [zod](http://zod.dev)
   - Projection schema (Mainly for the UI, but required for CQRS)
3. **Routing**
   - Define REST query paths (GET) - params, query string
   - Include validation schemas (params, query)
   - Include pagination requirements
4. **Query**
   - Define repository interface used to query this projection
   - New interface might be required
5. **Business Rules**
   - Define projection rules for the events we are projecting (reference to event schemas can be found in command features)
6. **Persistence**
   - Define repository interfaces used to persist projections, including data schemas
7. **Response**
   - Define success, including response schema (zod)
   - Define errors (HTTP codes)

## Unit Testing
<!-- List unit testing scenarios in given-when-then format to cover this feature. -->

## Additional Context
<!-- (Optional) Any other context here, including unanswered hotspots. -->
