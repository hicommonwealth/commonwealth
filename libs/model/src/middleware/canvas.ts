import * as schemas from '@hicommonwealth/schemas';
import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyComment,
  verifyThread,
} from '@hicommonwealth/shared';
import { config } from '../config';
import { CommentAuth, ThreadAuth } from './authorization';

export const verifyThreadSignature: ThreadAuth<
  typeof schemas.CanvasThread
> = async ({ actor, payload }) => {
  if (config.ENFORCE_SESSION_KEYS) {
    if (hasCanvasSignedDataApiArgs(payload)) {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(payload);
      await verifyThread(canvasSignedData, {
        community: payload.community_id,
        topic: payload.topic_id,
        title: payload.title,
        body: payload.body,
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

export const verifyCommentSignature: CommentAuth<
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
