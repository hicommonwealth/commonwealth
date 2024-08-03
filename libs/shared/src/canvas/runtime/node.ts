import { Canvas } from '@canvas-js/core';

import { getSessionSigners } from '../signers';
import { CanvasSignedData } from '../types';
import { contract, topic } from './contract';

export const CANVAS_TOPIC = topic;

export const startCanvasNode = async () => {
  console.log('canvas: starting');
  const app = await Canvas.initialize({
    topic,
    path:
      process.env.DATABASE_URL_CANVAS ??
      'postgresql://commonwealth:edgeware@localhost/canvas',
    contract,
    signers: getSessionSigners(),
    bootstrapList: [], // TODO
  });

  // TODO
  // app.libp2p.start()

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
