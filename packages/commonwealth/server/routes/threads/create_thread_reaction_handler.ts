import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyReaction,
} from '@hicommonwealth/shared';
import { CreateThreadReactionOptions } from 'server/controllers/server_threads_methods/create_thread_reaction';
import { applyCanvasSignedData } from 'server/federation';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidThreadId: 'Invalid thread ID',
};

type CreateThreadReactionRequestParams = { id: string };
type CreateThreadReactionRequestBody = {
  reaction: string;
  thread_msg_id: string | null;
};
type CreateThreadReactionResponse = ReactionAttributes;

export const createThreadReactionHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<
    CreateThreadReactionRequestBody,
    any,
    CreateThreadReactionRequestParams
  >,
  res: TypedResponse<CreateThreadReactionResponse>,
) => {
  const { user, address } = req;
  // @ts-expect-error <StrictNullChecks>
  const { reaction, thread_msg_id: threadMsgId } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  // @ts-expect-error StrictNullChecks
  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }

  const reactionFields: CreateThreadReactionOptions = {
    // @ts-expect-error <StrictNullChecks>
    user,
    // @ts-expect-error <StrictNullChecks>
    address,
    reaction,
    threadId,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    // Only save the canvas fields if they are given and they are strings
    reactionFields.canvasSignedData = req.body.canvas_signed_data;
    reactionFields.canvasMsgId = req.body.canvas_msg_id;

    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    const canvasThreadReaction = {
      thread_id: threadMsgId ?? null,
      address:
        canvasSignedData.actionMessage.payload.did.split(':')[2] == 'polkadot'
          ? addressSwapper({
              currentPrefix: 42,
              // @ts-expect-error <StrictNullChecks>
              address: address.address,
            })
          : // @ts-expect-error <StrictNullChecks>
            address.address,
      value: reaction,
    };
    await verifyReaction(canvasSignedData, canvasThreadReaction);
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction(reactionFields);

  // publish signed data
  if (hasCanvasSignedDataApiArgs(req.body)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);
    await applyCanvasSignedData(canvasSignedData);
  }

  // update address last active
  // @ts-expect-error StrictNullChecks
  address.last_active = new Date();
  // @ts-expect-error StrictNullChecks
  address.save().catch(console.error);

  // emit notification
  controllers.notifications.emit(notificationOptions).catch(console.error);

  // track analytics event
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, newReaction);
};
