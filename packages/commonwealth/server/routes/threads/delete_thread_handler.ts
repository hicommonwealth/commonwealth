import { AppError } from '@hicommonwealth/core';
import {
  applyCanvasSignedData,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyDeleteThread,
} from '@hicommonwealth/shared';
import { DeleteThreadOptions } from 'server/controllers/server_threads_methods/delete_thread';
import { canvas } from 'server/federation';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidThreadID: 'Invalid thread ID',
};

type DeleteThreadRequestBody = {
  canvas_signed_data?: string;
  canvas_msg_id?: string;
};
type DeleteThreadRequestParams = { id: string };
type DeleteThreadResponse = void;

export const deleteThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<DeleteThreadRequestBody, {}, DeleteThreadRequestParams>,
  res: TypedResponse<DeleteThreadResponse>,
) => {
  const { user, address } = req;
  const { id } = req.params!;

  const threadId = parseInt(id, 10) || 0;
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadID);
  }

  const threadFields: DeleteThreadOptions = {
    // @ts-expect-error StrictNullChecks
    user,
    // @ts-expect-error StrictNullChecks
    address,
    threadId,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    threadFields.canvasSignedData = req.body.canvas_signed_data;
    threadFields.canvasMsgId = req.body.canvas_msg_id;

    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    const thread_id = canvasSignedData.actionMessage.payload.args.thread_id;
    await verifyDeleteThread(canvasSignedData, { thread_id });
  }

  await controllers.threads.deleteThread(threadFields);

  // publish signed data
  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    if (canvasSignedData.actionMessage.payload.args.thread_id !== null) {
      await applyCanvasSignedData(canvas, canvasSignedData);
    }
  }

  return success(res, undefined);
};
