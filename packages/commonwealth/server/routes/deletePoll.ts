import { AppError, ServerError } from 'common-common/src/errors';
import moment from 'moment';
import { getNextPollEndingTime } from '../../shared/utils';
import type { DB } from '../models';
import { findOneRole } from '../util/roles';
import type { ValidateChainParams } from '../middleware/validateChain';
import type { TypedRequestBody, TypedResponse } from '../types';


export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
};

type DeletePollReq = {
} & ValidateChainParams;

type DeletePollResp = {
};

const deletePoll = async (
  models: DB,
  req: TypedRequestBody<DeletePollReq>,
  res: TypedResponse<DeletePollResp>,
) => {
  if (!req.user) throw new AppError(Errors.NotLoggedIn);

  // check chain
  // check if author of thread
  // check if admin
  try {
    return res.json({ status: 'Success', result: finalPoll.toJSON() });
  } catch (e) {
    throw new ServerError(e);
  }
};

export default deletePoll;
