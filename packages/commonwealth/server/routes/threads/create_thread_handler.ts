import { IDiscordMeta, ThreadAttributes } from '@hicommonwealth/model';
import { verifyThread } from '../../../shared/canvas/serverVerify';
import { config } from '../../config';
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
  canvas_action?: any;
  canvas_session?: any;
  canvas_hash?: any;
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
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
    discord_meta,
  } = req.body;

  if (config.ENFORCE_SESSION_KEYS) {
    await verifyThread(canvasAction, canvasSession, canvasHash, {
      title,
      body,
      // @ts-expect-error StrictNullChecks
      address: address.address,
      // @ts-expect-error StrictNullChecks
      community: community.id,
      topic: topicId ? parseInt(topicId, 10) : null,
    });
  }

  const [thread, notificationOptions, analyticsOptions] =
    await controllers.threads.createThread({
      // @ts-expect-error StrictNullChecks
      user,
      // @ts-expect-error StrictNullChecks
      address,
      // @ts-expect-error StrictNullChecks
      community,
      title,
      body,
      kind,
      readOnly,
      topicId: parseInt(topicId, 10) || undefined,
      stage,
      url,
      canvasAction,
      canvasSession,
      canvasHash,
      discordMeta: discord_meta,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, thread);
};
