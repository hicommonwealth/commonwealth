import { Canvas } from '@canvas-js/core';

import { getSessionSigners } from '../signers';
import { CanvasSignedData } from '../types';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async () => {
  const path =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    'postgresql://commonwealth:edgeware@localhost/federation';
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  console.log('canvas: starting federation node on', path);

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
    console.log(
      'canvas: started libp2p with multiaddrs',
      app.libp2p.getMultiaddrs().map((m) => m.toString()),
    );
  }

  return app;
};

export const applyCanvasSignedData = async (
  app: Canvas,
  data: CanvasSignedData,
) => {
  try {
    const encodedSessionMessage = app.messageLog.encode(
      data.sessionMessageSignature,
      data.sessionMessage,
    );
    if (!(await app.messageLog.has(encodedSessionMessage.id))) {
      const { id: idSession } = await app.insert(
        data.sessionMessageSignature,
        data.sessionMessage,
      );
      console.log('applied canvas session:', idSession);
    }
  } catch (err) {
    console.log('could not apply canvas session:', err);
  }

  try {
    const encodedActionMessage = app.messageLog.encode(
      data.actionMessageSignature,
      data.actionMessage,
    );
    if (!(await app.messageLog.has(encodedActionMessage.id))) {
      const { id: idAction } = await app.insert(
        data.actionMessageSignature,
        data.actionMessage,
      );
      console.log('applied canvas action:', idAction);
    }
  } catch (err) {
    console.log('could not apply canvas action:', err);
  }
};
