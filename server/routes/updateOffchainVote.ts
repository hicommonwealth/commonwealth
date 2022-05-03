import moment from 'moment';
import { NextFunction } from 'express';

import { sequelize, DB } from '../database';
import validateChain from '../util/validateChain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { TypedRequestBody, TypedResponse, success } from '../types';
import {
  OffchainVoteAttributes,
  OffchainVoteInstance,
} from '../models/offchain_vote';

export const Errors = {
  NoPoll: 'No corresponding poll found',
  NoThread: 'No corresponding thread found',
  InvalidUser: 'Invalid user',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
};

type UpdateOffchainVoteReq = {
  poll_id: number;
  chain_id: string;
  address: string;
  author_chain: string;
  option: string;
};

type UpdateOffchainVoteResp = OffchainVoteAttributes;

const updateOffchainVote = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<UpdateOffchainVoteReq>,
  res: TypedResponse<UpdateOffchainVoteResp>,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (!author) return next(new Error(Errors.InvalidUser));
  if (authorError) return next(new Error(authorError));

  const { poll_id, address, author_chain, option } = req.body;

  // TODO: check that req.option is valid, and import options from shared/types
  // TODO: check and validate req.signature, instead of checking for author

  const poll = await models.OffchainPoll.findOne({
    where: { id: poll_id, chain_id: chain.id },
  });
  if (!poll) return next(new Error(Errors.NoPoll));
  if (!poll.ends_at && moment(poll.ends_at).utc().isBefore(moment().utc())) {
    return next(new Error(Errors.PollingClosed));
  }

  const thread = await models.OffchainThread.findOne({
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

  let vote: OffchainVoteInstance;
  await sequelize.transaction(async (t) => {
    // delete existing votes
    const destroyed = await models.OffchainVote.destroy({
      where: {
        poll_id: poll.id,
        address,
        author_chain,
        chain: chain.id,
      },
      transaction: t,
    });

    // create new vote
    vote = await models.OffchainVote.create(
      {
        poll_id: poll.id,
        address,
        author_chain,
        chain: chain.id,
        option,
      },
      { transaction: t }
    );

    // update denormalized vote count
    if (destroyed === 0) {
      poll.votes = (poll.votes ?? 0) + 1;
      await poll.save({ transaction: t });
    }
  });

  return success(res, vote.toJSON());
};

export default updateOffchainVote;
