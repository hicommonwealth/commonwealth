import { AppError } from '@hicommonwealth/core';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

const Errors = {
  InvalidThreadID: 'Invalid thread ID',
};

type DeleteBotThreadRequestParams = { message_id: string };
type DeleteThreadResponse = void;

export const deleteBotThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteBotThreadRequestParams>,
  res: TypedResponse<DeleteThreadResponse>,
) => {
  const { user, address } = req;
  const { message_id } = req.params;

  if (!message_id) {
    throw new AppError(Errors.InvalidThreadID);
  }

  await controllers.threads.deleteThread({
    // @ts-expect-error StrictNullChecks
    user,
    messageId: message_id,
    // @ts-expect-error StrictNullChecks
    address,
  });

  return success(res, undefined);
};
