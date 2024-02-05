# Feature Flags

This entry documents our feature flag system built with Unleash, a flag management solution. Environment variables are documented in a [separate entry](./Environment-Variables.md).

Unleash gives us access to several desirable features: flags may be turned on or off without a full app rebuild, and flagged features may be displayed to a certain percentage of users (as in A/B testing).

## Using the Unleash Dashboard

Our Unleash server may be found at `flag.commonwealth.im`. For account and sign-in information, reach out to Kurtis Assad.

As of 240205, Common has configured one project ("Default”" and two environments within that project ("production," "development”". Existing feature flags (or "toggles") are visible from the dashboard overview.

To create a new flag, select "Create feature toggle" and fill out resulting form. Flags should be named in camelCase, following the syntax `flag.descriptiveName`. `Rollout percentage` refers to the ratio of users for whom the flag will evaluate `true` to `false`.

When using Unleash flags for local development, developers will need an API key, which may be obtained from the dashboard.

## Codebase Invocation

Unleash provides a `proxy-client-react` library with a number of feature toggle methods. To reference a flag added through the Unleash dashboard, import the `useFlag` method and invoke it from within a React component; it should evaluate to true or false, allowing for conditional rendering of UI.

## Change Log

- 240205: Authored by Graham Johnson in consultation with Kurtis Assad (#)
