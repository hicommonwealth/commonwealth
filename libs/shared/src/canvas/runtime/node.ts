import { Canvas } from '@canvas-js/core';
import pg from 'pg';

import { getSessionSigners } from '../signers';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async () => {
  const path: string =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    (process.env.APP_ENV === 'local'
      ? undefined
      : 'postgresql://commonwealth:edgeware@localhost/federation');
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  const config: pg.ConnectionConfig = {};

  const [schemeAndCredentials, rest] = path
    .replace('postgres://', '')
    .split('@');
  const [user, password] = schemeAndCredentials.split(':');
  const [hostAndPort, databaseWithParams] = rest.split('/');
  const [host, port] = hostAndPort.split(':');
  const [database] = databaseWithParams.split('?');

  config.user = user;
  config.password = password;
  config.host = host;
  config.port = port ? parseInt(port, 10) : 5432;
  config.database = database;

  if (process.env.NODE_ENV === 'production') {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }

  const app = await Canvas.initialize({
    topic: contractTopic,
    config,
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
