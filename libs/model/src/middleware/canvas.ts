import * as schemas from '@hicommonwealth/schemas';
import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyComment,
  verifyReaction,
  verifyThread,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { config } from '../config';
import type { AuthHandler } from './authorization';

const ThreadSignature = z.object({
  title: z.string(),
  body: z.string(),
  address: z.string(),
  community_id: z.string(),
  topic_id: z.union([z.number(), z.null()]),
});

export const verifyThreadSignature: AuthHandler<
  typeof schemas.CanvasThread
> = async ({ actor, payload }) => {
  if (config.ENFORCE_SESSION_KEYS) {
    if (hasCanvasSignedDataApiArgs(payload)) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);

      if (
        !(
          'community_id' in payload &&
          'topic_id' in payload &&
          'title' in payload &&
          'body' in payload
        )
      )
        throw new InvalidInput('Missing thread arguments');

      const thread = ThreadSignature.parse(payload);

      await verifyThread(canvasSignedData, {
        community: thread.community_id,
        topic: thread.topic_id,
        title: thread.title,
        body: thread.body,
        address:
          canvasSignedData.actionMessage.payload.did.split(':')[2] ===
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                address: actor.address!,
              })
            : actor.address!,
      });
    }
  }
};

export const verifyCommentSignature: AuthHandler<
  typeof schemas.CanvasComment
> = async ({ actor, payload }) => {
  if (config.ENFORCE_SESSION_KEYS) {
    if (hasCanvasSignedDataApiArgs(payload)) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
      await verifyComment(canvasSignedData, {
        thread_id: payload.thread_id,
        parent_comment_id: payload.parent_id,
        text: payload.text,
        address:
          canvasSignedData.actionMessage.payload.address.split(':')[0] ==
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                address: actor.address!,
              })
            : actor.address,
      });
    }
  }
};

export const verifyReactionSignature: AuthHandler<
  typeof schemas.ThreadCanvasReaction | typeof schemas.CommentCanvasReaction
> = async ({ actor, payload }) => {
  if (config.ENFORCE_SESSION_KEYS) {
    if (hasCanvasSignedDataApiArgs(payload)) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
      await verifyReaction(canvasSignedData, {
        thread_id: 'thread_id' in payload ? payload.thread_id : undefined,
        comment_id: 'comment_id' in payload ? payload.comment_id : undefined,
        value: payload.reaction,
        address:
          canvasSignedData.actionMessage.payload.address.split(':')[0] ==
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                address: actor.address!,
              })
            : actor.address,
      });
    }
  }
};
