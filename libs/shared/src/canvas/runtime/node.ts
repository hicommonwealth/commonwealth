import { Canvas } from '@canvas-js/core';

import { getSessionSigners } from '../signers';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async () => {
  console.log('===starting canvas node');
  let path =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    (process.env.APP_ENV === 'local'
      ? undefined
      : 'postgresql://commonwealth:edgeware@localhost/federation');
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  if (process.env.NODE_ENV === 'production') {
    path += '?sslmode=require';
    console.log('===adding ssl mode to path');
  }

  const app = await Canvas.initialize({
    topic: contractTopic,
    path,
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
