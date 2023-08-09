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
  locked?: string;
  canvas_session?: string;
  canvas_action?: string;
  canvas_hash?: string;
};
type UpdateThreadResponse = ThreadAttributes;

export const updateThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateThreadRequestBody, null, { id: string }>,
  res: TypedResponse<UpdateThreadResponse>
) => {
  const { user, address, chain } = req;
  const { id } = req.params;
  const {
    body,
    title,
    stage,
    url,
    locked,
    canvas_session,
    canvas_action,
    canvas_hash,
  } = req.body;

  const threadId = parseInt(id, 10) || 0;
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadID);
  }

  // this is a patch update, so properties should be
  // `undefined` if they are not intended to be updated
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
      locked: locked === 'true' ? true : locked === 'false' ? false : undefined,
      canvas_session,
      canvas_action,
      canvas_hash,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedThread);
};
