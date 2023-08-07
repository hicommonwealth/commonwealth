import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';
import { AppError } from '../../../../common-common/src/errors';
import { Op } from 'sequelize';

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

  await controllers.threads.deleteThread({ user, threadId });

  return success(res, undefined);
};

type DeleteBotThreadRequestParams = { message_id: string };

export const deleteBotThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteBotThreadRequestParams>,
  res: TypedResponse<DeleteThreadResponse>
) => {
  const { user } = req;
  const { message_id } = req.params;
  let threadId;

  // Special handling for discobot threads
  if (message_id) {
    const existingThread = await controllers.threads.models.Thread.findOne({
      where: {
        discord_meta: { [Op.contains]: { message_id: message_id } },
      },
    });
    if (existingThread) {
      threadId = existingThread.id;
    } else {
      throw new AppError(Errors.InvalidThreadID);
    }
  }

  await controllers.threads.deleteThread({ user, threadId });

  return success(res, undefined);
};
