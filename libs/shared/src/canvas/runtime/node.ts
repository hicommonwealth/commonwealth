import { Canvas } from '@canvas-js/core';
import { getSessionSigners } from '../signers';
import { CanvasSignedData } from '../types';
import { contract, topic } from './contract';

export const CANVAS_TOPIC = topic;

export const startCanvasNode = async () => {
  console.log('canvas: starting');
  const app = await Canvas.initialize({
    topic,
    // TODO: production DATABASE_URL
    path:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/commonwealth',
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
  try {
    const { id: idSession } = await app.insert(
      data.sessionMessageSignature,
      data.actionMessage,
    );
    const { id: idAction } = await app.insert(
      data.actionMessageSignature,
      data.actionMessage,
    );
    console.log('applied canvas action/session:', idSession, idAction);
  } catch (err) {
    console.log('could not apply canvas action/session:', err);
  }
};
