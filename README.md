# Environment Variables
- `DB_PASSWORD` [OPTIONAL]
  - avoids the password prompt for all local database commands
- `ETH_ALCHEMY_API_KEY` [OPTIONAL]
  - if set, the load-db commands will replace production Alchemy urls with their locally supported variants


# Scripts
- `yarn start-all`
  - Starts ALL the microservices in different processes. Requires a RabbitMQ instance/connection to function properly.
- `yarn start-apps`
  - Starts just the web-servers from all the microservices (current just Commonwealth and Chain-Events)
  - This should be enough for most local front-end development
- `yarn start-rmq`
  - Starts a local RabbitMQ instance using Docker.
  - Run this in a separate terminal and pair it with the `yarn start-all` command to get a fully functional app.
- `yarn load-db [optional-dump-name]`
  - Loads the default `latest.dump` or the `optional-dump-name` into the database
  - Only available in the `commonwealth` and `chain-events` packages
