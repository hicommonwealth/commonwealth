import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { ThreadAttributes } from '../../models/thread';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidThreadID: 'Invalid thread ID',
  MissingTextOrAttachment: 'Must provide text or attachment',
};

type UpdateThreadRequestBody = {
  body?: string;
  title?: string;
  kind?: string;
  stage?: string;
  url?: string;
};
type UpdateThreadResponse = ThreadAttributes;

export const updateThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateThreadRequestBody, null, { id: string }>,
  res: TypedResponse<UpdateThreadResponse>
) => {
  const { user, address, chain } = req;
  const { id } = req.params;
  const { body, title, kind, stage, url } = req.body;

  const threadId = parseInt(id, 10) || 0;
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadID);
  }

  if (
    (!body || !body.trim()) &&
    (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
  ) {
    throw new AppError(Errors.MissingTextOrAttachment);
  }

  const [updatedThread, notificationOptions] =
    await controllers.threads.updateThread(
      user,
      address,
      chain,
      threadId,
      title,
      body,
      kind,
      stage,
      url
    );

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedThread);
};
