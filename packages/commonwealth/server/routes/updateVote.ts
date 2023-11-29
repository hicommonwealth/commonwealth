import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import moment from 'moment';
import { sequelize } from '../database';
import type { DB } from '../models';
import type { VoteAttributes, VoteInstance } from '../models/vote';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

import { TokenBalanceCache as TokenBalanceCacheV1 } from '../../../token-balance-cache/src';
import { validateTopicGroupsMembership } from '../util/requirementsModule/validateTopicGroupsMembership';
import { TokenBalanceCache as TokenBalanceCacheV2 } from '../util/tokenBalanceCache/tokenBalanceCache';

export const Errors = {
  NoPoll: 'No corresponding poll found',
  NoThread: 'No corresponding thread found',
  InvalidUser: 'Invalid user',
  InvalidOption: 'Invalid response option',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
  InsufficientTokenBalance: 'Insufficient token balance',
};

type UpdateVoteReq = {
  poll_id: number;
  chain_id: string;
  address: string;
  author_chain: string;
  option: string;
};

type UpdateVoteResp = VoteAttributes;

const updateVote = async (
  models: DB,
  tokenBalanceCacheV1: TokenBalanceCacheV1,
  tokenBalanceCacheV2: TokenBalanceCacheV2,
  req: TypedRequestBody<UpdateVoteReq>,
  res: TypedResponse<UpdateVoteResp>,
  next: NextFunction,
) => {
  const community = req.chain;

  const { poll_id, address, author_chain, option } = req.body;

  const poll = await models.Poll.findOne({
    where: { id: poll_id, community_id: community.id },
  });
  if (!poll) return next(new AppError(Errors.NoPoll));
  if (!poll.ends_at && moment(poll.ends_at).utc().isBefore(moment().utc())) {
    return next(new AppError(Errors.PollingClosed));
  }

  // Ensure user has passed a valid poll response
  let selected_option;
  try {
    const pollOptions = JSON.parse(poll.options);
    selected_option = pollOptions.find((o: string) => o === option);
    if (!option) throw new AppError(Errors.InvalidOption);
  } catch (e) {
    return next(new AppError(Errors.InvalidOption));
  }

  const thread = await models.Thread.findOne({
    where: { id: poll.thread_id },
  });
  if (!thread) return next(new AppError(Errors.NoThread));

  try {
    // check token balance threshold if needed
    const { isValid } = await validateTopicGroupsMembership(
      models,
      tokenBalanceCacheV1,
      tokenBalanceCacheV2,
      thread.topic_id,
      community,
      req.address,
    );
    if (!isValid) {
      return next(new AppError(Errors.InsufficientTokenBalance));
    }
  } catch (e) {
    return next(new ServerError(Errors.BalanceCheckFailed, e));
  }

  let vote: VoteInstance;
  await sequelize.transaction(async (t) => {
    // delete existing votes
    await models.Vote.destroy({
      where: {
        poll_id: poll.id,
        address,
        author_community_id: author_chain,
        community_id: community.id,
      },
      transaction: t,
    });
    // create new vote
    vote = await models.Vote.create(
      {
        poll_id: poll.id,
        address,
        author_community_id: author_chain,
        community_id: community.id,
        option: selected_option,
      },
      { transaction: t },
    );
  });

  return success(res, vote.toJSON());
};

export default updateVote;
