## Starting Chain-Events locally from scratch
Unless otherwise specified, commands should be run from `packages/chain-events`. If you encounter an error at any point check [here][3] for information on debugging.
1. `yarn create-db`
2. If you have a database dump run `yarn load-db` otherwise skip this step.
3. `yarn migrate-db`
4. If you didn't use a database dump and you want to generate some data use the [migration script][2].
5. If you used a database dump instead of migrating run `yarn sync-entities-local` as described [here][1].
6. To run all of the chain-event servers use `yarn start-all`. This will run the consumer and subscribers which may be more than what you need. If all you need is the api simply run `yarn start-app`.

## Using a remote Chain-Events API
With this method, front-end events and proposals will load correctly but you will not receive real-time chain-event updates. This is the same as running ONLY `yarn start-app` to start the chain-events API locally. This is very useful for devs who don't need realtime events or events from a specific chain since it avoids having to run a local chain-events database or API.

1. Set the `ENTITIES_URL` to the chain-events app you want to use e.g. `https://chain-events-staging.herokuapp.com/api`
2. Now you need to sync the chain-events app database with your local database. See [here][4] for instructions on how to do that.


[1]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Overview#enforcing-chain-event-data-consistency
[2]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Overview#migrating-eventsentities
[3]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Service-Common-Errors
[4]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Overview#enforcing-chain-event-data-consistency