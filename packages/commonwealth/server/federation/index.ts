import { logger } from '@hicommonwealth/core';
import { CanvasSignedData, startCanvasNode } from '@hicommonwealth/shared';
import { parse } from '@ipld/dag-json';
import { config } from '../config';

const log = logger(import.meta);
export const { app: canvas, libp2p } = await startCanvasNode(config);

if (libp2p) {
  log.info(
    'canvas: started libp2p with multiaddrs: ' +
      libp2p
        .getMultiaddrs()
        .map((m) => m.toString())
        .join(', '),
  );
}

export const applyCanvasSignedData = async (
  path: string,
  canvas_signed_data?: string,
) => {
  if (!canvas_signed_data) return;
  const data = parse(canvas_signed_data) as CanvasSignedData;

  let appliedSessionId: string | null = null;
  let appliedActionId: string | null = null;

  log.trace('applying canvas signed data', {
    path,
    publicKey: data.sessionMessage.payload.publicKey,
  });
  try {
    const encodedSessionMessage = canvas.messageLog.encode(
      data.sessionMessageSignature,
      data.sessionMessage,
    );
    if (!(await canvas.messageLog.has(encodedSessionMessage.id))) {
      const { id: idSession } = await canvas.insert(
        data.sessionMessageSignature,
        data.sessionMessage,
      );
      appliedSessionId = idSession;
    }
  } catch (err) {
    log.warn(`could not apply canvas session: ${err.stack}`);
  }

  try {
    const encodedActionMessage = canvas.messageLog.encode(
      data.actionMessageSignature,
      data.actionMessage,
    );
    if (!(await canvas.messageLog.has(encodedActionMessage.id))) {
      const { id: idAction } = await canvas.insert(
        data.actionMessageSignature,
        data.actionMessage,
      );
      appliedActionId = idAction;
    }
  } catch (err) {
    log.warn(`could not apply canvas action: ${err.stack}`);
  }

  return { session: appliedSessionId, action: appliedActionId };
};
