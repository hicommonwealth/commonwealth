# Feature Flags

## Available Flags

### Language Selector
- Environment Variable: `FLAG_LANGUAGE_SELECTOR`
- Default: `off`
- Description: Enables the language selection UI in the application header. When enabled, users can select their preferred language for the interface. Note that actual language translation functionality requires additional configuration.

## Usage
Feature flags can be configured in two ways:
1. Environment Variables (Local Development)
   - Set the flag in your `.env` file
   - Example: `FLAG_LANGUAGE_SELECTOR=on`

2. Unleash (Remote Environments)
   - Configure flags through the Unleash dashboard
   - Changes are reflected after the configured refresh interval

## Implementation
Feature flags are implemented using the OpenFeature SDK with either:
- UnleashProvider (remote environments)
- InMemoryProvider (local development)

See `packages/commonwealth/client/scripts/helpers/feature-flags.ts` for implementation details.
