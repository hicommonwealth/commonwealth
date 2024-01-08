import { AppError } from '@hicommonwealth/adapters';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

const Errors = {
  InvalidThreadID: 'Invalid thread ID',
};

type DeleteThreadRequestParams = { id: string };
type DeleteThreadResponse = void;

export const deleteThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteThreadRequestParams>,
  res: TypedResponse<DeleteThreadResponse>,
) => {
  const { user, address } = req;
  const { id } = req.params;

  const threadId = parseInt(id, 10) || 0;
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadID);
  }

  await controllers.threads.deleteThread({ user, address, threadId });

  return success(res, undefined);
};
