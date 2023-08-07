import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { ThreadAttributes } from '../../models/thread';
import { AppError } from '../../../../common-common/src/errors';

export const Errors = {
  InvalidThreadID: 'Invalid thread ID',
  MissingText: 'Must provide text',
};

type UpdateThreadRequestBody = {
  body?: string;
  title?: string;
  kind?: string;
  stage?: string;
  url?: string;
  discord_meta?: any;
};
type UpdateThreadResponse = ThreadAttributes;

export const updateThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateThreadRequestBody, null, { id: string }>,
  res: TypedResponse<UpdateThreadResponse>
) => {
  const { user, address, chain } = req;
  const { id } = req.params;
  const { body, title, stage, url, discord_meta } = req.body;

  let threadId = parseInt(id, 10) || 0;

  // Special handling for discobot threads
  if (discord_meta !== undefined && discord_meta !== null) {
    const existingThread = await controllers.threads.models.Thread.findOne({
      where: { discord_meta: discord_meta },
    });
    if (existingThread) {
      threadId = existingThread.id;
    } else {
      throw new AppError(Errors.InvalidThreadID);
    }
  }

  if (!threadId) {
    throw new AppError(Errors.InvalidThreadID);
  }

  if (!body || !body.trim()) {
    throw new AppError(Errors.MissingText);
  }

  const [updatedThread, notificationOptions] =
    await controllers.threads.updateThread({
      user,
      address,
      chain,
      threadId,
      title,
      body,
      stage,
      url,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedThread);
};
