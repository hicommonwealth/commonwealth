import { InvalidInput } from '@hicommonwealth/core';
import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyThread,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { config } from '../config';
import { ThreadMiddleware } from './authorization';

const ThreadSignature = z.object({
  title: z.string(),
  body: z.string(),
  address: z.string(),
  community_id: z.string(),
  topic_id: z.union([z.number(), z.null()]),
});

export const verifyThreadSignature: ThreadMiddleware = async ({
  actor,
  payload,
}) => {
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
