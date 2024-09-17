# network-explorer

## Development

* Create a Postgres database called network-explorer: `createdb network-explorer`
* Start the server: `pnpm run dev:server`
* Start the client: `pnpm run dev:client`

## Configuring a Peer ID

* Run `node ./create-peer-id.js`
* For local development, copy the PEER_ID into .env
* For production deployment, set the PEER_ID as a config variable (e.g. `heroku config:set PEER_ID=...`)
* Do not reuse the peer ID between different services

## Deploying on Heroku

TBD

## Deploying on Railway

You can deploy the server on Railway. To do this, create a Railway space, and add the
`hicommonwealth/commonwealth` Github repo as a service. Also create a Postgres database.

- Configure the build command to `pnpm -r build`.
- Configure the start command to `pnpm start:server -F=network-explorer`.
- Add the DATABASE_URL as a environment variable, pointed to the Postgres database.
- To check the app is working, add Public Networking using a Railway provided domain to port 8080.
- To use the network explorer, add two custom domains:
  - One should be connected to port 8888, for the network explorer API.
  - One should be connected to port 8889, for the libp2p service.
- If you want the network explorer to connect to another server, set a BOOTSTRAP_LIST as the environment variable.
- If you want other services to connect to the network explorer, look up the Peer ID by running `railway logs`,
  and then provide the other services with a multiaddr of the form:

```
/dns4/network-explorer-libp2p.mydomain.org/tcp/443/wss/p2p/12D3...
```

## Deploying on Vercel

Create a Vercel app from this directory.

Configure the build command to `cp tsconfig.vercel.json tsconfig.json && vite build`.

Copy .env.example to .env and set the API base URL to the backend that you've set up above.

Then deploy the frontend:

```
vercel --prod
```

## Connecting to the service via CLI

Use the lib2p address of the network explorer:

```
npm install -g @canvas-js/cli
canvas run example.contract.js --bootstrap="/dns4/network-explorer-libp2p.mydomain.org/tcp/443/wss/p2p/12D3..."
```

## Configuration Options

- BOOTSTRAP_LIST: list of libp2p peers to dial (defaults to a canvas-chat.fly.dev node)
- DATABASE_URL: a postgres database to connect to (default postgres://test@localhost/network-explorer)
- PORT: port to serve the network API on (default 3333)
- LIBP2P_PORT: port to bind libp2p on (default 3334)
- NODE_ENV: development or production
- TOPICS: unused
