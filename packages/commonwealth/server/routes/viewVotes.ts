import { AppError, ServerError } from 'common-common/src/errors';
import type { VoteAttributes } from '../models/vote';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';

export const Errors = {
  NoPollSpecified: 'No poll has been specified',
};

type ViewVotesReq = { poll_id: string; chain_id: string };
type ViewVotesResp = VoteAttributes[];

const viewVotes = async (
  models: DB,
  req: TypedRequestQuery<ViewVotesReq>,
  res: TypedResponse<ViewVotesResp>
) => {
  // TODO: runtime validation based on params
  //   maybe something like https://www.npmjs.com/package/runtime-typescript-checker
  const chain = req.chain;

  if (!req.query.poll_id) {
    throw new AppError(Errors.NoPollSpecified);
  }

  try {
    const votes = await models.Vote.findAll({
      where: {
        poll_id: req.query.poll_id,
        chain_id: chain.id,
      },
    });
    return success(
      res,
      votes.map((v) => v.toJSON())
    );
  } catch (err) {
    throw new ServerError(err);
  }
};

export default viewVotes;
