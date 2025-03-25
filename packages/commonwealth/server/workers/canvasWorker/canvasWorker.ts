import { logger } from '@hicommonwealth/core';
import { CanvasSignedData, startCanvasNode } from '@hicommonwealth/shared';
import { decode } from '@ipld/dag-json';
import cors from 'cors';
import express from 'express';
import { config } from '../../config';

const log = logger(import.meta);

const PORT = process.env.CANVAS_HTTP_PORT || 3333;

log.info('starting canvas node...');
export const { app, libp2p } = await startCanvasNode(config, log);

if (libp2p) {
  log.info(
    'started canvas node with libp2p multiaddrs: ' +
      libp2p
        .getMultiaddrs()
        .map((m) => m.toString())
        .join(', '),
  );
} else {
  log.info('started canvas node without libp2p');
}

log.info('starting express server...');
const server = express();

server.use(cors());
server.use(
  express.raw({
    type: 'application/dag-json',
    limit: '10mb',
  }),
);

server.get('/clock', async (req, res) => {
  const [clock, heads] = await app.messageLog.getClock();
  res.json({ clock, heads });
});

server.post('/action', async (req, res) => {
  if (req.body === undefined) {
    throw new Error('no action data');
  }
  try {
    const data = decode(req.body) as CanvasSignedData;
    if (
      data.actionMessage === undefined ||
      data.actionMessageSignature === undefined ||
      data.sessionMessage === undefined ||
      data.sessionMessageSignature === undefined
    ) {
      throw new Error('invalid action data');
    }

    let appliedSessionId: string | null = null;
    let appliedActionId: string | null = null;

    log.trace('applying canvas signed data', {
      publicKey: data.sessionMessage.payload.publicKey,
    });

    // apply session
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
        appliedSessionId = idSession;
      }
    } catch (err) {
      log.warn(`could not apply canvas session: ${err.stack}`);
    }

    // apply action
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
        appliedActionId = idAction;
      }
    } catch (err) {
      log.warn(`could not apply canvas action: ${err.stack}`);
    }

    const [clock, heads] = await app.messageLog.getClock();

    res.json({
      success: true,
      result: {
        session: appliedSessionId,
        action: appliedActionId,
        clock,
        heads,
      },
    });
  } catch (err) {
    log.error('Error processing canvas request', err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

server.listen(PORT, async () => {
  const [clock, heads] = await app.messageLog.getClock();
  log.info(
    `started express server on port ${PORT}, clock: ${clock} (${heads.length})`,
  );
});
