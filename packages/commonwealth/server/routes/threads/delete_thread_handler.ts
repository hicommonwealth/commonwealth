import { ServerControllers } from 'server/routing/router';
import { TypedRequestParams, TypedResponse, success } from 'server/types';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidThreadID: 'Invalid thread ID',
};

type DeleteThreadRequestParams = { id: string };
type DeleteThreadResponse = void;

export const deleteThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteThreadRequestParams>,
  res: TypedResponse<DeleteThreadResponse>
) => {
  const { user } = req;
  const { id } = req.params;

  const threadId = parseInt(id, 10) || 0;
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadID);
  }

  await controllers.threads.deleteThread(user, threadId);

  return success(res, undefined);
};
