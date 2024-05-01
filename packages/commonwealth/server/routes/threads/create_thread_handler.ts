import { IDiscordMeta } from '@hicommonwealth/core';
import { ThreadAttributes } from '@hicommonwealth/model';
import { CreateThreadOptions } from 'server/controllers/server_threads_methods/create_thread';
import {
  fromCanvasSignedDataApiArgs,
  hasCanvasSignedDataApiArgs,
} from 'shared/canvas/types';
import { addressSwapper } from 'shared/utils';
import { verifyThread } from '../../../shared/canvas/serverVerify';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateThreadRequestBody = {
  topic_id: string;
  topic_name: string;
  title: string;
  body: string;
  kind: string;
  stage: string;
  url?: string;
  readOnly: boolean;
  discord_meta?: IDiscordMeta;
};
type CreateThreadResponse = ThreadAttributes;

export const createThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateThreadRequestBody>,
  res: TypedResponse<CreateThreadResponse>,
) => {
  const { user, address, community } = req;
  const {
    topic_id: topicId,
    title,
    body,
    kind,
    stage,
    url,
    readOnly,
    discord_meta,
  } = req.body;

  const threadFields: CreateThreadOptions = {
    user,
    address,
    community,
    title,
    body,
    kind,
    readOnly,
    topicId: parseInt(topicId, 10) || undefined,
    stage,
    url,
    discordMeta: discord_meta,
  };

  if (hasCanvasSignedDataApiArgs(req.body)) {
    threadFields.canvasSignedData = req.body.canvas_signed_data;
    threadFields.canvasHash = req.body.canvas_hash;

    if (process.env.ENFORCE_SESSION_KEYS === 'true') {
      const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);

      await verifyThread(canvasSignedData, {
        title,
        body,
        address:
          canvasSignedData.actionMessage.payload.address.split(':')[0] ==
          'polkadot'
            ? addressSwapper({
                currentPrefix: 42,
                address: address.address,
              })
            : address.address,
        community: community.id,
        topic: topicId ? parseInt(topicId, 10) : null,
      });
    }
  }

  const [thread, notificationOptions, analyticsOptions] =
    await controllers.threads.createThread(threadFields);

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, thread);
};
