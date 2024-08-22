import { Canvas } from '@canvas-js/core';

import { getSessionSigners } from '../signers';
import { CanvasSignedData } from '../types';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async () => {
  console.log('canvas: starting', process.env.POSTGRES_FEDERATION_DB_URL);

  const path =
    process.env.POSTGRES_FEDERATION_DB_URL ??
    'postgresql://commonwealth:edgeware@localhost/federation';
  const app = await Canvas.initialize({
    topic: contractTopic,
    path,
    contract,
    signers: getSessionSigners(),
    bootstrapList: [], // TODO: app.libp2p.start()
  });
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
