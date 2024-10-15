import { Canvas } from '@canvas-js/core';
import { generateKeyPair, privateKeyFromProtobuf } from '@libp2p/crypto/keys';
import { Libp2p } from 'libp2p';
import { ConnectionConfig } from 'pg';

import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async (config: {
  PEER_ID?: string;
}): Promise<{ app: Canvas; libp2p: Libp2p }> => {
  const path =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    (process.env.APP_ENV === 'local'
      ? undefined
      : 'postgresql://commonwealth:edgeware@localhost/federation');
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  const privateKey = config.PEER_ID
    ? privateKeyFromProtobuf(Buffer.from(config.PEER_ID, 'base64'))
    : await generateKeyPair('Ed25519');

  let pgConnectionConfig: ConnectionConfig | undefined = undefined;

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

  if (process.env.NODE_ENV === 'production' && pgConnectionConfig) {
    pgConnectionConfig.ssl = {
      rejectUnauthorized: false,
    };
  }

  const app = await Canvas.initialize({
    topic: contractTopic,
    path: pgConnectionConfig!,
    contract,
  });

  const libp2p = await app.startLibp2p({
    announce: [announce],
    listen: [listen],
    bootstrapList: [],
    privateKey,
    start: true,
  });

  return { app, libp2p };
};
