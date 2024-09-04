import { InvalidInput } from '@hicommonwealth/core';
import {
  addressSwapper,
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
  verifyThread,
} from '@hicommonwealth/shared';
import { config } from '../config';
// eslint-disable-next-line import/no-cycle
import { ThreadMiddleware } from './authorization';

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
