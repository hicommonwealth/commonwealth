import * as schemas from '@hicommonwealth/schemas';
import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyComment,
  verifyDeleteReaction,
  verifyDeleteThread,
  verifyReaction,
  verifyThread,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import type { AuthHandler } from './authorization';

const ThreadSignature = z.object({
  title: z.string(),
  body: z.string(),
  community_id: z.string(),
  topic_id: z.union([z.number(), z.null()]),
});

export const verifyThreadSignature: AuthHandler<
  typeof schemas.CanvasThread
> = async ({ actor, payload }) => {
  if (hasCanvasSignedDataApiArgs(payload)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
    const thread = ThreadSignature.parse(payload);

    await verifyThread(canvasSignedData, {
      community: thread.community_id,
      topic: thread.topic_id,
      title: thread.title,
      body: thread.body,
      address:
        canvasSignedData.actionMessage.payload.did.split(':')[2] === 'polkadot'
          ? addressSwapper({
              currentPrefix: 42,
              address: actor.address!,
            })
          : actor.address!,
    });
  }
};

export const verifyDeleteThreadSignature: AuthHandler<
  typeof schemas.DeleteThread.input
> = async ({ payload }) => {
  if (hasCanvasSignedDataApiArgs(payload)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
    const thread_id = canvasSignedData.actionMessage.payload.args.thread_id;
    await verifyDeleteThread(canvasSignedData, { thread_id });
  }
};

export const verifyCommentSignature: AuthHandler<
  typeof schemas.CanvasComment
> = async ({ actor, payload }) => {
  if (hasCanvasSignedDataApiArgs(payload)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
    await verifyComment(canvasSignedData, {
      thread_id: payload.thread_msg_id ?? null,
      parent_comment_id: payload.parent_msg_id ?? null,
      text: payload.text,
      address:
        canvasSignedData.actionMessage.payload.did.split(':')[2] === 'polkadot'
          ? addressSwapper({
              currentPrefix: 42,
              address: actor.address!,
            })
          : actor.address!,
    });
  }
};

export const verifyReactionSignature: AuthHandler<
  typeof schemas.ThreadCanvasReaction | typeof schemas.CommentCanvasReaction
> = async ({ actor, payload }) => {
  if (hasCanvasSignedDataApiArgs(payload)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
    const address =
      canvasSignedData.actionMessage.payload.did.split(':')[2] === 'polkadot'
        ? addressSwapper({
            currentPrefix: 42,
            address: actor.address!,
          })
        : actor.address!;

    const reaction =
      'thread_msg_id' in payload
        ? {
            thread_id: payload.thread_msg_id ?? null,
            value: payload.reaction,
            address,
          }
        : 'comment_msg_id' in payload
          ? {
              comment_id: payload.comment_msg_id ?? null,
              value: payload.reaction,
              address,
            }
          : null;

    if (reaction === null) throw new Error('Invalid reaction');

    await verifyReaction(canvasSignedData, reaction);
  }
};

export const verifyDeleteReactionSignature: AuthHandler<
  typeof schemas.DeleteReaction.input
> = async ({ payload }) => {
  if (hasCanvasSignedDataApiArgs(payload)) {
    const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
    if (canvasSignedData.actionMessage.payload.name === 'unreactComment') {
      await verifyDeleteReaction(canvasSignedData, {
        comment_id: canvasSignedData.actionMessage.payload.args.comment_id,
      });
    } else if (
      canvasSignedData.actionMessage.payload.name === 'unreactThread'
    ) {
      await verifyDeleteReaction(canvasSignedData, {
        thread_id: canvasSignedData.actionMessage.payload.args.thread_id,
      });
    } else {
      throw new Error('unexpected signed message');
    }
  }
};
