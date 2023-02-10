import { AppError, ServerError } from 'common-common/src/errors';
import moment from 'moment';
import { getNextPollEndingTime } from '../../shared/utils';
import type { DB } from '../models';
import { findOneRole } from '../util/roles';
import type { ValidateChainParams } from '../middleware/validateChain';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { Op } from 'sequelize';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  NotAuthor: 'Not the Author or Admin',
  NoThread: 'No thread provided',
  NoPoll: 'No poll found',
};

type DeletePollReq = {
  thread_id: number;
  poll_id: number;
  chain_id: string;
} & ValidateChainParams;

type DeletePollResp = {};

const deletePoll = async (
  models: DB,
  req: TypedRequestBody<DeletePollReq>,
  res: TypedResponse<DeletePollResp>
) => {
  if (!req.user) throw new AppError(Errors.NotLoggedIn);

  const { thread_id, poll_id, chain_id } = req.body;

  try {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
        chain: chain_id,
      },
    });

    if (!thread) throw new AppError(Errors.NoThread);

    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);

    const userMembership = await findOneRole(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      thread.chain,
      ['admin']
    );

    if (
      !userOwnedAddressIds.includes(thread.address_id) && // if not author
      !req.user.isAdmin && // if not site admin
      !userMembership // if not community admin
    ) {
      throw new AppError(Errors.NotAuthor);
    }

    const poll = await models.Poll.findOne({
      where: {
        thread_id,
        id: poll_id,
      },
    });
    if (!poll) throw new AppError(Errors.NoPoll);

    await poll.destroy();
  } catch (e) {
    throw new ServerError(e);
  }

  return success(res, {});
};

export default deletePoll;
