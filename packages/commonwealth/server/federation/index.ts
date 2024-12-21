import { trpc } from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import { CanvasSignedData, startCanvasNode } from '@hicommonwealth/shared';
import { parse } from '@ipld/dag-json';
import { ZodSchema } from 'zod';
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

export function signCanvas<
  Input extends ZodSchema<{ canvas_signed_data?: string }>,
  Output extends ZodSchema,
>() {
  return trpc.fireAndForget<Input, Output>(async (input) => {
    if (input.canvas_signed_data)
      await applyCanvasSignedData(parse(input.canvas_signed_data)).catch(
        log.error,
      );
  });
}

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
