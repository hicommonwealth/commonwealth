# ADR 002: OpenFeature as our feature flagging adapter

Using OpenFeature provides use with the flexibility to swap out feature flagging providers.

## Status

Proposed: 240212 by Kurtis Assad (@kurtisassad)

## Context

We need a more robust feature flagging system than what we currently had. We were using .env variables directly.
This was a problem because webpack eagerly evaluates these, which means that if we want to change a feature flag
on production, we would need to perform a re-deploy which would take about 20 minutes. We need a system that would
allow us to toggle these features at runtime.

## Decision

We have decided to use the OpenFeature for our feature flagging system.

## Rationale

OpenFeature allows us to:

1. **Ability to toggle features at runtime**: The main purpose of this system, we want to be able to turn features on or off at runtime
2. **Allow us to roll out these features to a subset of users**: We want the ability to be able to roll out some features to specific communities or users.
3. **Allow us the ability to A/B test features**: We want the ability to A/B test features.

## Consequences

As OpenFeature is an interface across many feature flagging providers, it can impose constraints on some providers,
which would not allow us to utilize their full functionality.