import { logger } from '@hicommonwealth/core';
import { CanvasSignedData, startCanvasNode } from '@hicommonwealth/shared';
import { parse } from '@ipld/dag-json';
import { config } from '../config';

const log = logger(import.meta);
export const { app: canvas, libp2p } = await startCanvasNode(config);

log.info(
  'canvas: started libp2p with multiaddrs: ' +
    libp2p
      .getMultiaddrs()
      .map((m) => m.toString())
      .join(', '),
);

export const applyCanvasSignedDataMiddleware: (
  input,
  output,
) => Promise<undefined> = async (input, output) => {
  if (output.canvas_signed_data)
    await applyCanvasSignedData(parse(output.canvas_signed_data));
};

export const applyCanvasSignedData = async (data: CanvasSignedData) => {
  let appliedSessionId: string | null = null;
  let appliedActionId: string | null = null;

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
