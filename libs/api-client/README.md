# Common API

## Manual Setup

### Generate a new API client

- Start app with `pnpm start` so fern can refresh the lastest `openapi.spec` from `http://localhost:8080/api/v1/openapi.json`
- Run `pnpm generate-client` to generate:
  - A new `fern/openapi/openapi.yml` file
  - A client API in `/src`, formatted with our root `.prettierrc.json` config

### Deploy a new API client

- Update the version in `package.json`
- Run `pnpm publish` to publish the client
