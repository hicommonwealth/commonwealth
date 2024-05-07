# Scripts
- `pnpm start-all`
  - Starts ALL the microservices in different processes. Requires a RabbitMQ instance/connection to function properly.
- `pnpm start-apps`
  - Starts just the web-servers from all the microservices (currently just Commonwealth and Chain-Events)
  - This should be enough for most local front-end development
- `pnpm start-rmq`
  - Starts a local RabbitMQ instance using Docker.
  - Run this in a separate terminal and pair it with the `pnpm start-all` command to get a fully functional app.
- `pnpm start-redis`
  - make sure to have `REDIS_URL=redis://localhost:6379` in your .env file     
  - Starts a local redis instance using Docker, it will start redis on its default port 6379
- `pnpm load-db [optional-dump-name]`
  - Loads the default `latest.dump` or the `optional-dump-name` into the database
  - Only available in the `commonwealth` and `chain-events` packages

