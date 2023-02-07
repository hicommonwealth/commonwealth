import { AppError, ServerError } from 'common-common/src/errors';
import moment from 'moment';
import { getNextPollEndingTime } from '../../shared/utils';
import type { DB } from '../models';
import { findOneRole } from '../util/roles';
import type { ValidateChainParams } from '../middleware/validateChain';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  NotAuthor: 'Not the Author',
  NoThread: 'No thread provided',
};

type DeletePollReq = {
  thread_id: number;
  poll_id: number;
} & ValidateChainParams;

type DeletePollResp = {};

const deletePoll = async (
  models: DB,
  req: TypedRequestBody<DeletePollReq>,
  res: TypedResponse<DeletePollResp>
) => {
  if (!req.user) throw new AppError(Errors.NotLoggedIn);

  const { thread_id, poll_id } = req.body;
  // check chain
  // check if author of thread
  // check if admin?

  try {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
      },
    });

    if (!thread) throw new AppError(Errors.NoThread);
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    if (!userOwnedAddressIds.includes(thread.address_id) && !req.user.isAdmin) {
      throw new AppError(Errors.NotAuthor);
    }

    const poll = await models.Poll.findOne({
      where: {
        thread_id,
        id: poll_id,
      },
    });

    await poll.destroy();
  } catch (e) {
    throw new ServerError(e);
  }

  return success(res, {});
};

export default deletePoll;
