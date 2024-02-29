import { IDiscordMeta } from '@hicommonwealth/core';
import { ThreadAttributes } from '@hicommonwealth/model';
import {
  CanvasArguments,
  unpackCanvasArguments,
  verifyThread,
} from '../../../shared/canvas/serverVerify';
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
} & CanvasArguments;
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

  if (process.env.ENFORCE_SESSION_KEYS === 'true') {
    const parsedCanvasArguments = await unpackCanvasArguments(req.body);
    await verifyThread(parsedCanvasArguments, {
      title,
      body,
      address: address.address,
      community: community.id,
      topic: topicId ? parseInt(topicId, 10) : null,
    });
  }

  const [thread, notificationOptions, analyticsOptions] =
    await controllers.threads.createThread({
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
      canvasActionMessage: req.body.canvas_action_message,
      canvasActionMessageSignature: req.body.canvas_action_message_signature,
      canvasSessionMessage: req.body.canvas_session_message,
      canvasSessionMessageSignature: req.body.canvas_session_message_signature,
      discordMeta: discord_meta,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, thread);
};
