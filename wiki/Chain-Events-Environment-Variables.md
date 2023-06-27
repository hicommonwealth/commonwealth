# Local
The environment variables listed here (including the VULTR Env var) should be set in `packages/chain-events/.env`

- **PGPASSWORD**
  - Optional
  - The password of the chain-events database. Should be set to 'edgeware'. Having this set avoids having to manually input the database password when executing database commands such as `yarn reset-db` or `yarn load-db`.
### Vultr Env
For more information on how to use or get these environment variables see [here][2].
These environment variables are all optional if you are not using a Vultr instance of Redis or RabbitMQ.
Those marked as required assume you are using a remote instance.
- **VULTR_IP**
  - Required
  - The IP of the Vultr server containing the Redis and RabbitMQ Docker scripts.
- **VULTR_ROOT_PASSWORD**
  - Optional (admin only)
  - The root (ubuntu) password of the Vultr server containing the Redis and RabbitMQ Docker scripts.
- **VULTR_DOCKER_ADMIN_PASSWORD**
  - Optional (admin only)
  - The password of the `VULTR_USER` defined above.
- **VULTR_RABBITMQ_CONTAINER_PORT**
  - Required
  - The network port of the remote RabbitMQ instance.
- **VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT**
  - Required
  - The network port of the remote RabbitMQ Management Dashboard instance.
- **VULTR_REDIS_CONTAINER_PORT**
  - Required
  - The network port of the remote Redis instance.
- **UNIQUE_DOCKER_CONTAINER_ID**
  - Required
  - A unique ID that is generated to distinguish your remote docker containers from other users.


# Heroku
These environment variables may be set locally but they will have unknown side-effects. Thus it is recommended not to have these set locally unless you know exactly what you are doing.
- **CLOUDAMQP_URL**
  - Required in production
  - The URI of the RabbitMQ instance. This value is usually set automatically by Heroku when a CLOUDAMQP instance is attached to an app.
- **CLOUDAMQP_APIKEY**
  - Required in production
  - The API key for the CLOUDAMQP RabbitMQ instance. This value is usually set automatically by Heroku when a CLOUDAMQP instance is attached to an app.
- **DATABASE_URL**
  - Required in production
  - The URI of the database to connect to. This value is usually set automatically by Heroku when a Heroku Postgres instance is attached to an app.
- **ROLLBAR_SERVER_TOKEN**
  - Required in production
  - The Rollbar token for the appropriate environment/app.
- **CHAIN_SUBSCRIBER_INDEX** <a name="CHAIN_SUBSCRIBER_INDEX"></a>
  - Required in production
  - This value indicates the index of the ChainSubscriber dyno. The index of a ChainSubscriber determines which chains it will listen to. See the [`getChainEventServiceData.ts` query][1] for more info.
- **NUM_CHAIN_SUBSCRIBERS**
  - Required in production
  - Should ALWAYS be set to the number of active ChainSubscriber dynos. This is because this value is used to determine what chains each dyno will listen to. See the [`getChainEventServiceData.ts` query][1] for more info.
- **JWT_SECRET**
  - Required in production
  - The JWT secret that is used to generate all user JWTs. Should be set to the exact same JWT secret as the CW App.
- **SERVER_URL**
  - Required in production
  - The URL of the CW server associated with the current CE instance. For example for a chain-events staging environment this could be https://commonwealth-staging.herokuapp.com.
- **CHAIN_EVENT_SERVICE_SECRET**
  - Required in production
  - A secret string which is used by the CE service to access private CW API routes.
- **CE_BUILD**
  - Optional in production
  - A boolean indicating if ONLY the chain-events package should be built (should be set to True). It is not required to set this in production but doing so will greatly speed up build/start-up time.
- **PROCFILE**
  - Required in production
  - Specifies the path from the root of the repo to the Procfile to use for the deployed app. Should be set to `packages/chain-events/Procfile`.

# Both
- **REPEAT_TIME**
  - Defaults to 1 minute if not set.
  - Not required in production.
  - The number of minutes the ChainSubscriber should wait between requests to the CW app to retrieve the chains it should be listening to. It is currently set to 10 minutes which means every 10 minutes the ChainSubscriber will query the CW App and retrieve all chains that have `has_chain_events_listener` set to True in the `Chains` model.

[1]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/server/routes/getChainEventServiceData.ts#L71
[2]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Overview#vultr-scripts