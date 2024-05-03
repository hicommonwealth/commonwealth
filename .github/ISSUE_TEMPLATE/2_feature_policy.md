---
name: Policy Feature Request
about: Use this template for requesting a policy feature within a user story.
labels: policy, enhancement, needs estimate
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

1. **Integration**
   - Define integration strategy (webhook, direct model sync API call, pubsub, etc)
2. **Routing**
   - Define REST path, verb - Usually POST with event in body (if exposed as HTTP endpoint)
   - Reference to event schemas (found in command features) - body contract
3. **References**
   - Define projections used to complement business rules, and how to query them
4. **Business Rules**
   - Define policy rules and commands to be invoked
   - Reference to command schemas (found in command features)
5. **Response**
   - Define success, including
   - Define errors (HTTP codes, dead-letter-queues)

## Unit Testing
<!-- List unit testing scenarios in given-when-then format to cover this feature. -->

## Additional Context
<!-- (Optional) Any other context here, including unanswered hotspots. -->
