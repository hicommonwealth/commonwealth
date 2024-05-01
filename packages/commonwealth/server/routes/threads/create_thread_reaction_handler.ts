import { AppError } from '@hicommonwealth/core';
import { ReactionAttributes } from '@hicommonwealth/model';
import { CreateThreadReactionOptions } from 'server/controllers/server_threads_methods/create_thread_reaction';
import {
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
} from 'shared/canvas/types';
import { addressSwapper } from 'shared/utils';
import { verifyReaction } from '../../../shared/canvas/serverVerify';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  InvalidReaction: 'Invalid reaction',
  InvalidThreadId: 'Invalid thread ID',
};

type CreateThreadReactionRequestParams = { id: string };
type CreateThreadReactionRequestBody = {
  reaction: string;
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
  const { reaction } = req.body;

  if (!reaction) {
    throw new AppError(Errors.InvalidReaction);
  }

  const threadId = parseInt(req.params.id, 10);
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }

  const reactionFields: CreateThreadReactionOptions = {
    user,
    address,
    reaction,
    threadId,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    // Only save the canvas fields if they are given and they are strings
    reactionFields.canvasSignedData = req.body.canvas_signed_data;
    reactionFields.canvasHash = req.body.canvas_hash;

    if (process.env.ENFORCE_SESSION_KEYS === 'true') {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);

      await verifyReaction(canvasSignedData, {
        thread_id: threadId,
        address:
          canvasSignedData.actionMessage.payload.address.split(':')[0] ==
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                address: address.address,
              })
            : address.address,
        value: reaction,
      });
    }
  }

  // create thread reaction
  const [newReaction, notificationOptions, analyticsOptions] =
    await controllers.threads.createThreadReaction(reactionFields);

  // update address last active
  address.last_active = new Date();
  address.save().catch(console.error);

  // emit notification
  controllers.notifications.emit(notificationOptions).catch(console.error);

  // track analytics event
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, newReaction);
};
