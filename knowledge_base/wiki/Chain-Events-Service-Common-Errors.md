## Could not fetch chain-event service data
```
2023-01-23 06:39:42,925 ERROR [chainSubscriber.ts] Could not fetch chain-event service data
FetchError: request to http://localhost:8080/api/getChainEventServiceData failed, reason: connect ECONNREFUSED 127.0.0.1:8080
@
ClientRequest.<anonymous>()@/home/timolegros/Projects/commonwealth/packages/chain-events/node_modules/node-fetch/lib/index.js:1491:11
  ClientRequest.emit()@events.js:400:28
  Socket.socketErrorListener()@_http_client.js:475:9
  Socket.emit()@events.js:400:28
  emitErrorNT()@internal/streams/destroy.js:106:8
  emitErrorCloseNT()@internal/streams/destroy.js:74:3
  processTicksAndRejections()@internal/process/task_queues.js:82:21
2023-01-23 06:39:42,927 INFO [chainSubscriber.ts] No cached chains. Retrying in 1 minute(s)
```
This error indicates the Commonwealth App API/Server cannot be reached. If you are running chain-events locally and just need to quickly test chain-events with a specific chain consider using the `CHAIN` env var like this: `CHAIN=edgeware yarn start-all`. This will bypass the HTTP request and thus avoid any issues with the CW API. If this solution is not for you then do the following:
1. Check that you have the correct [`CW_SERVER_URL`][1] set.
2. Check that the CW API at the logged URL is active + working.
3. Check CW API logs for any errors.

## Could not detect network
```
2023-01-27 09:14:15,661 ERROR [subscribeFunc.ts::aave] Aave 0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2 at wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_ failure: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.4.3)
```
This error usually occurs if you are using the production Alchemy API URLs from your local environment. To fix this you can either set `ETH_ALCHEMY_API_KEY` in `packages/commonwealth/.env` and run `yarn load-db` (the script will automatically update the Alchemy URLs) or you can run the query directly (replace `ETH_ALCHEMY_API_KEY` with the appropriate API key for local dev):
```SQL
UPDATE "ChainNodes" SET url = 'wss://eth-mainnet.g.alchemy.com/v2/[ETH_ALCHEMY_API_KEY]', alt_wallet_url = 'https://eth-mainnet.g.alchemy.com/v2/[ETH_ALCHEMY_API_KEY]' WHERE eth_chain_id = 1;
```

## localhost:8081 ERR_CONNECTION_REFUSED
```
GET http://localhost:8081/api/events?limit=50&ordered=true net::ERR_CONNECTION_REFUSED
```
This error indicates that the chain-events service cannot be reached. You have 2 options:
1. Run the chain-events app locally by running `yarn start-app` or `yarn start-all` from `packages/chain-events`
2. Set the `ENTITIES_URL` env var which will tell the client to use a remote chain-event service e.g. `ENTITIES_URL=https://chain-events.herokuapp.com/api`. Note that to use this method you want to ensure you local CW database is in sync with the remote chain-events db you will be using. Instructions for syncing can be found [here][2].

## Sequelize Validation Error for Entity_Meta
```
SequelizeUniqueConstraintError: Validation error
@
Query.run()@/home/timolegros/Projects/commonwealth/node_modules/sequelize/src/dialects/postgres/query.js:76:25
  {anonymous}()@/home/timolegros/Projects/commonwealth/node_modules/sequelize/src/sequelize.js:643:28
  processTicksAndRejections()@node:internal/process/task_queues:95:5
  PostgresQueryInterface.insert()@/home/timolegros/Projects/commonwealth/node_modules/sequelize/src/dialects/abstract/query-interface.js:773:21
  model.save()@/home/timolegros/Projects/commonwealth/node_modules/sequelize/src/model.js:4046:35
  Function.create()@/home/timolegros/Projects/commonwealth/node_modules/sequelize/src/model.js:2253:12
  Object.processChainEntityCUD()@/home/timolegros/Projects/commonwealth/packages/commonwealth/server/CommonwealthConsumer/messageProcessors/chainEntityCUDQueue.ts:13:5
...
  errors: [
    ValidationErrorItem {
      message: 'ce_id must be unique',
      type: 'unique violation',
      path: 'ce_id',
      value: '2501',
      origin: 'DB',
      instance: [ChainEntityMeta],
      validatorKey: 'not_unique',
      validatorName: null,
      validatorArgs: []
    }
  ],
```
This occurs because your chain-events database is behind (in terms of entities fetched from the chain) i.e. your commonwealth database contains entities (or really ChainEntityMeta) that don't yet exist in chain-events. To fix this you need your chain-events database to be in-sync or ahead of the commonwealth database. You have 2 choices to fix this issue:
1. Get a new chain-events dump with the most recent entities and load it into your local chain-events database (`yarn dump-db` & `yarn load-db`).
2. Run the event migration for all current chains with `yarn migrate-events` (the CW API must be running i.e. `yarn start` in `packages/commonwealth`).

[1]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events%20Environment%20Variables#heroku
[2]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Overview#enforcing-chain-event-data-consistency