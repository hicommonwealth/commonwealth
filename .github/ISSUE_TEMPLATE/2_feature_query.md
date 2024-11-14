---
name: Query Feature Request
about: Use this template for requesting a query within a user story.
labels: query, enhancement, needs estimate
title: 🟩 <Query Name>
---

## Description
<!-- A clear and concise description of the feature. -->

## Stakeholders
<!-- The main points of contact for questions relating to the scope of the feature. -->
| Product   | Engineering |
| --------- | ----------- |
| Jane     | John       |

## Model
<!-- A screenshot or reference to the slice of the model in context. -->

## Engineering Requirements
<!-- List of engineering items required as part of the feature. -->

1. **Authorization**
   - Who's authorized to execute this query? Roles, Groups?
2. **Schemas** - Use [zod](http://zod.dev)
   - Input/Output schemas
3. **Routing**
   - Define REST query paths (GET) - params, query string
   - Include pagination requirements
4. **Query**
   - Define repository interface used to query this projection
   - New interface might be required
5. **Response**
   - Define success
   - Define errors (HTTP codes)

## Unit Testing
<!-- List unit testing scenarios in given-when-then format to cover this feature. -->

## Additional Context
<!-- (Optional) Any other context here, including unanswered hotspots. -->
