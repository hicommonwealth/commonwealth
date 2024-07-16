import { Canvas } from '@canvas-js/core';
import { ed25519 } from '@canvas-js/signatures';

import { getSessionSigners } from '../signers';
import { CanvasSignedData } from '../types';
import { contract, topic } from './contract';

export const CANVAS_TOPIC = topic;

export const startCanvasNode = async () => {
  console.log('canvas: starting');
  const app = await Canvas.initialize({
    topic,
    path:
      process.env.DATABASE_URL_P2P ??
      'postgresql://commonwealth:edgeware@localhost/canvas',
    contract,
    signers: getSessionSigners(),
    bootstrapList: [], // TODO
  });
  console.log('canvas:', app);

  // TODO
  // app.libp2p.start()

  return app;
};

export const applyCanvasSignedData = async (
  app: Canvas,
  data: CanvasSignedData,
) => {
  console.log(data);

  ed25519.verify(data.sessionMessageSignature, data.sessionMessage);
  ed25519.verify(data.actionMessageSignature, data.actionMessage);
  console.log('verified using scheme directly');

  app.messageLog.verifySignature(
    data.sessionMessageSignature,
    data.sessionMessage,
  );
  app.messageLog.verifySignature(
    data.actionMessageSignature,
    data.actionMessage,
  );
  console.log('verified using log');

  try {
    const { id: idSession } = await app.insert(
      data.sessionMessageSignature,
      data.actionMessage,
    );
    console.log('applied canvas session:', idSession);
  } catch (err) {
    console.log('could not apply canvas session:', err);
  }
  try {
    const { id: idAction } = await app.insert(
      data.actionMessageSignature,
      data.actionMessage,
    );
    console.log('applied canvas action:', idAction);
  } catch (err) {
    console.log('could not apply canvas action:', err);
  }
};
