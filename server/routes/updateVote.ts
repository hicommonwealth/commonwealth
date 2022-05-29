import moment from 'moment';
import { NextFunction } from 'express';

import { sequelize, DB } from '../database';
import validateChain from '../util/validateChain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { TypedRequestBody, TypedResponse, success } from '../types';
import {
  VoteAttributes,
  VoteInstance,
} from '../models/vote';

export const Errors = {
  NoPoll: 'No corresponding poll found',
  NoThread: 'No corresponding thread found',
  InvalidUser: 'Invalid user',
  InvalidOption: 'Invalid response option',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
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
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<UpdateVoteReq>,
  res: TypedResponse<UpdateVoteResp>,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (!author) return next(new Error(Errors.InvalidUser));
  if (authorError) return next(new Error(authorError));

  const { poll_id, address, author_chain, option } = req.body;

  const poll = await models.Poll.findOne({
    where: { id: poll_id, chain_id: chain.id },
  });
  if (!poll) return next(new Error(Errors.NoPoll));
  if (!poll.ends_at && moment(poll.ends_at).utc().isBefore(moment().utc())) {
    return next(new Error(Errors.PollingClosed));
  }

  // Ensure user has passed a valid poll response
  let selected_option;
  try {
    const pollOptions = JSON.parse(poll.options);
    selected_option = pollOptions.find((o: string) => o === option);
    if (!option) throw new Error();
  } catch (e) {
    return next(new Error(Errors.InvalidOption));
  }

  const thread = await models.Thread.findOne({
    where: { id: poll.thread_id },
  });
  if (!thread) return next(new Error(Errors.NoThread));

  // check token balance threshold if needed
  const canVote = await tokenBalanceCache.validateTopicThreshold(
    thread.topic_id,
    address
  );
  if (!canVote) {
    return next(new Error(Errors.BalanceCheckFailed));
  }

  let vote: VoteInstance;
  await sequelize.transaction(async (t) => {
    // delete existing votes
    await models.Vote.destroy({
      where: {
        poll_id: poll.id,
        address,
        author_chain,
        chain_id: chain.id,
      },
      transaction: t,
    });
    // create new vote
    vote = await models.Vote.create(
      {
        poll_id: poll.id,
        address,
        author_chain,
        chain_id: chain.id,
        option: selected_option,
      },
      { transaction: t }
    );
  });

  return success(res, vote.toJSON());
};

export default updateVote;
