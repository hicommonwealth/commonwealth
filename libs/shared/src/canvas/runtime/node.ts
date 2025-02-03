import { Canvas } from '@canvas-js/core';
import { generateKeyPair, privateKeyFromProtobuf } from '@libp2p/crypto/keys';
import { Libp2p } from 'libp2p';
import { ConnectionConfig } from 'pg';

import { getSessionSigners } from '../signers';
import { contract, contractTopic } from './contract';

export const CANVAS_TOPIC = contractTopic;

export const startCanvasNode = async (config: {
  LIBP2P_PRIVATE_KEY?: string;
}): Promise<{ app: Canvas; libp2p: Libp2p | null }> => {
  const path =
    process.env.FEDERATION_POSTGRES_DB_URL ??
    (process.env.APP_ENV === 'local'
      ? undefined
      : 'postgresql://commonwealth:edgeware@localhost/federation');
  const announce =
    process.env.FEDERATION_ANNOUNCE_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';
  const listen =
    process.env.FEDERATION_LISTEN_ADDRESS ?? '/ip4/127.0.0.1/tcp/8090/ws';

  const privateKey = config.LIBP2P_PRIVATE_KEY
    ? privateKeyFromProtobuf(
        new Uint8Array(Buffer.from(config.LIBP2P_PRIVATE_KEY, 'base64')),
      )
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

  const explorerNode =
    process.env.LIBP2P_NODE ??
    '/dns4/common-explorer-libp2p.canvas.xyz/tcp/443/wss/p2p/12D3KooWFgHkuVBH5UNrMQ4rAM5cQUrNH4BLtkubE3DjWQVepN79';

  const app = await Canvas.initialize({
    topic: contractTopic,
    path: pgConnectionConfig!,
    contract,
    signers: getSessionSigners(),
  });

  const libp2p =
    process.env.APP_ENV === 'production'
      ? ((await app.startLibp2p({
          announce: [announce],
          listen: [listen],
          bootstrapList: [explorerNode],
          denyDialMultiaddr: (multiaddr) =>
            multiaddr.toString() !== explorerNode,
          privateKey,
          start: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as Libp2p<any>)
      : null;

  return { app, libp2p };
};
