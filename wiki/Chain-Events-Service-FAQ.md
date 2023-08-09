## I started chain-events with `yarn start-all` but I don't see any new events?
- Check that chains are actually being listened to by check the `active listeners` log.
- If the above is correct it may be that the chains you are listening to are not currently producing events. Protocols such as Aave or tokens such as USDC (usd-coin) emit lots of events while Substrate chains may emit less.

## I don't see any proposals on the client. How do I debug?
1. Check the `/entities` route with browser dev tools. Did it return the entities you expect? If not:
   - check your `ENTITIES_URL` env var (link coming soon). If the `ENTITIES_URL` env var is correct then you may need migrate the existing entities into the chain-events database. See the [`migrateEvents` docs][1] for instructions on migrating the missing events. Make sure that the database you are migrating matches the app that the `ENTITIES_URL` points to.
   - If you are not using the `ENTITIES_URL` and you are running the chain-events app locally ensure you have started the app. See [here][3].
2. Check the `/getEntityMeta` route with browser dev tools. Did it return the entities you expected? If not, you may not have migrated the most updated EntityMeta into your database. See [here][1] for instructions on how to migrate the missing EntityMeta into your local database. Note this will have no effect if (1) is not completed first.

## Some proposals are missing from the client. How do I fix this?
1. Run the [event migration][1] on the database instance pointed to by your `ENTITIES_URL`. For example, if your `ENTITIES_URL` is set to `https://chain-events-staging.herokuapp.com/api` that means you should the migration on a one-off dyno inside the `chain-events-staging` app e.g. `heroku run bash -a chain-events-staging`
2. If (1) did not resolve your issue message Timothee or Jake as this may indicate a chain-events bug.


[1]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events%20Overview#migrating-eventsentities
[2]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events%20Overview#enforcing-chain-event-data-consistency
[3]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Service-Common-Scenarios#starting-chain-events-locally-from-scratch