import { Canvas } from '@canvas-js/core';
import { ConnectionConfig } from 'pg';

import { getSessionSigners } from '../signers';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async () => {
  const path =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    (process.env.APP_ENV === 'local'
      ? undefined
      : 'postgresql://commonwealth:edgeware@localhost/federation');
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  let pgConnectionConfig: ConnectionConfig = {};

  if (path) {
    const url = new URL(path);

    pgConnectionConfig = {
      user: url.username,
      host: url.hostname,
      database: url.pathname.slice(1), // remove the leading '/'
      password: url.password,
      port: url.port ? parseInt(url.port) : 5432,
      ssl: false,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    pgConnectionConfig.ssl = {
      rejectUnauthorized: false,
    };
    console.log('===SSL configured with rejectUnauthorized: false');
  }

  const app = await Canvas.initialize({
    topic: contractTopic,
    path: pgConnectionConfig,
    contract,
    signers: getSessionSigners(),
    bootstrapList: [],
    announce: [announce],
    listen: [listen],
  });

  if (process.env.START_LIBP2P) {
    await app.libp2p.start();
  }

  return app;
};
