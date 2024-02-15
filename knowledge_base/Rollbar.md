# Rollbar

We use the Rollbar library for error tracking. If an error is raised on the server, and not caught in a `try/catch`, it’s reported to Rollbar.

Additionally, errors caught in `try/catch` structures may still be manually reported to Rollbar, using the [Rollbar util](../packages/commonwealth/server/util/rollbar.ts). To manually report errors, import `rollbar` and call the `rollbar.error` method (or `rollbar.critical` for critical errors).

## Configuration

We use two environment variables for our Rollbar config: `ROLLBAR_SERVER_TOKEN` and `ROLLBAR_ENV`.

`ROLLBAR_SERVER_TOKEN` refers to a specific project on Rollbar. Local and staging (i.e. non-prod) environments should always use the `CommonwealthDev` token, which may be obtained from Timothee Legros or an engineering lead. Only prod uses the `CommonwealthProject` token.

`ROLLBAR_ENV` is simply a tag (custom string) that allows developers to filter Rollbar reports. By convention, local development uses developers' first names or GitHub handles, e.g. Tim Legros might use “tim” and Mark Hagel might use “mhagel.” Staging environments are similarly tagged by name, e.g. Frick uses “frick.”

## Custom Fingerprinting

When we report an error to rollbar, we can use fingerprint rules to group related errors together. Heroku has a generic algorithm for grouping error types together, but this algorithm isn’t always correct, or doesn’t always fit our needs.

We use fingerprinting rules to override this default grouping algorithm. As of 240101, our only custom fingerprinting rule is to handle Sequelize “Invalid input syntax” errors (which often are triggered by PEN testing). We group them together in order to filter them out of our Rollbar Slack alerts.

## Subscribing To Rollbar Errors

We use the #eng-feed-rollbar Slack channel for reporting product (i.e. `CommonwealthProject`) Rollbar errors. Platform engineers should keep an eye on this channel.

Rollbar emails can get spammy; developers subscribed to them will likely want to set up an email label to filter it out of their main inbox.

## Change Log

- 230102: Authored by Graham Johnson in consultation with Timothee Legros (#6184).
