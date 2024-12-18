[![Coverage Status](https://coveralls.io/repos/github/hicommonwealth/commonwealth/badge.svg?branch=master)](https://coveralls.io/github/hicommonwealth/commonwealth?branch=master)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/hicommonwealth/commonwealth/CI.yml?branch=master&label=CI)
![GitHub repo size](https://img.shields.io/github/repo-size/hicommonwealth/commonwealth)

# Setup

### Prerequisites

- Node.js (version 22.x)
- PNPM
- Docker

### Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/hicommonwealth/commonwealth.git
    ```

2. Navigate to the project directory:

    ```bash
    cd commonwealth
    ```

3. Install dependencies:

    ```bash
    pnpm install
    ```

4. Set up environment variables:

    ```bash
    cp .env.example .env
    ```

5. Run external services (postgresql, redis, rabbitmq):

    ```bash
    docker-compose up -d
    ```

6. Run the database migrations:

    ```bash
    pnpm migrate-db
    ```

7. Start the server:

    ```bash
    pnpm run start
    ```

The API server runs on <http://localhost:3000/> and you can test it by making a request to
<http://localhost:3000/api/health>. It should respond with

```json
{
  "status": "ok"
}
```

The client is served from <http://localhost:8080/>.

### Side Notes

Some features of the application require additional API keys.
While the app will still function without them, certain functionalities may be limited.

Required for openAI image generation:

- OPENAI_ORGANIZATION
- OPENAI_API_KEY

Required for chain features on EVM chains (groups, stake, contests):

- ETH_ALCHEMY_API_KEY

Ensure these keys are set up in your environment variables to fully utilize all features of the application.

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
