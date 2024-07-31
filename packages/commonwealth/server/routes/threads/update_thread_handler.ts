import { IDiscordMeta, ThreadAttributes } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

export const Errors = {
  InvalidThreadID: 'Invalid thread ID',
  MissingText: 'Must provide text',
};

type UpdateThreadRequestBody = {
  title?: string;
  body: string;
  stage?: string;
  url?: string;
  locked?: boolean;
  pinned?: boolean;
  archived?: boolean;
  spam?: boolean;
  topicId?: number;
  collaborators?: {
    toAdd?: number[];
    toRemove?: number[];
  };
  canvasSignedData?: string;
  canvasMsgId?: string;
  discord_meta?: IDiscordMeta; // Only comes from the discord bot
};
type UpdateThreadResponse = ThreadAttributes;

export const updateThreadHandler = async (
  controllers: ServerControllers,
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<UpdateThreadRequestBody, null, { id: string }>,
  res: TypedResponse<UpdateThreadResponse>,
) => {
  const { user, address } = req;
  // @ts-expect-error StrictNullChecks
  const { id } = req.params;
  const {
    // @ts-expect-error StrictNullChecks
    title,
    // @ts-expect-error StrictNullChecks
    body,
    // @ts-expect-error StrictNullChecks
    stage,
    // @ts-expect-error StrictNullChecks
    url,
    // @ts-expect-error StrictNullChecks
    locked,
    // @ts-expect-error StrictNullChecks
    pinned,
    // @ts-expect-error StrictNullChecks
    archived,
    // @ts-expect-error StrictNullChecks
    spam,
    // @ts-expect-error StrictNullChecks
    topicId,
    // @ts-expect-error StrictNullChecks
    collaborators,
    // @ts-expect-error StrictNullChecks
    canvasSignedData,
    // @ts-expect-error StrictNullChecks
    canvasMsgId,
    // @ts-expect-error StrictNullChecks
    discord_meta: discordMeta,
  } = req.body;

  const threadId = parseInt(id, 10) || null;

  // this is a patch update, so properties should be
  // `undefined` if they are not intended to be updated
  const [updatedThread, notificationOptions, analyticsOptions] =
    await controllers.threads.updateThread({
      // @ts-expect-error StrictNullChecks
      user,
      // @ts-expect-error StrictNullChecks
      address,
      // @ts-expect-error StrictNullChecks
      threadId,
      title,
      body,
      stage,
      url,
      locked,
      pinned,
      archived,
      spam,
      topicId,
      collaborators,
      canvasSignedData,
      canvasMsgId,
      discordMeta,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  for (const a of analyticsOptions) {
    controllers.analytics.track(a).catch(console.error);
  }

  return success(res, updatedThread);
};
