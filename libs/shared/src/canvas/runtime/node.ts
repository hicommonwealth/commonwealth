import { Canvas } from '@canvas-js/core';
import {
  createEd25519PeerId,
  createFromProtobuf,
} from '@libp2p/peer-id-factory';

import { getSessionSigners } from '../signers';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async (config: { PEER_ID?: string }) => {
  const path =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    (process.env.APP_ENV === 'local'
      ? undefined
      : 'postgresql://commonwealth:edgeware@localhost/federation');
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  const peerId = config.PEER_ID
    ? await createFromProtobuf(Buffer.from(config.PEER_ID, 'base64'))
    : await createEd25519PeerId();

  const app = await Canvas.initialize({
    peerId,
    topic: contractTopic,
    path,
    contract,
    signers: getSessionSigners(),
    bootstrapList: [],
    announce: [announce],
    listen: [listen],
  });

  if (config.PEER_ID) {
    await app.libp2p.start();
  }

  return app;
};
