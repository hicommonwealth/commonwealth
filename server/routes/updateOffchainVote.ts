import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import BN from 'bn.js';

import { sequelize, DB } from '../database';
import validateChain from '../util/validateChain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import TokenBalanceCache from '../util/tokenBalanceCache';

export const Errors = {
  InvalidThread: 'Invalid thread',
  InvalidUser: 'Invalid user',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
};

const updateOffchainVote = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (!author) return next(new Error(Errors.InvalidUser));
  if (authorError) return next(new Error(authorError));

  // TODO: check that req.option is valid, and import options from shared/types
  // TODO: check and validate req.signature, instead of checking for author

  const thread = await models.OffchainThread.findOne({
    where: { id: req.body.thread_id, chain: chain.id }
  });
  if (!thread) return next(new Error(Errors.InvalidThread));

  if (!thread.offchain_voting_ends_at && moment(thread.offchain_voting_ends_at).utc().isBefore(moment().utc())) {
    return next(new Error(Errors.PollingClosed));
  }

  // check token balance threshold if needed
  const canVote = await tokenBalanceCache.validateTopicThreshold(thread.topic_id, req.body.address);
  if (!canVote) {
    return next(new Error(Errors.BalanceCheckFailed));
  }

  let vote;
  await sequelize.transaction(async (t) => {
    // delete existing votes
    const destroyed = await models.OffchainVote.destroy({
      where: {
        thread_id: req.body.thread_id,
        address: req.body.address,
        author_chain: req.body.author_chain,
        chain: req.body.chain,
      },
      transaction: t
    });

    // create new vote
    vote = await models.OffchainVote.create({
      thread_id: req.body.thread_id,
      address: req.body.address,
      author_chain: req.body.author_chain,
      chain: req.body.chain,
      option: req.body.option,
    }, { transaction: t });

    // update denormalized vote count
    if (destroyed === 0) {
      thread.offchain_voting_votes = (thread.offchain_voting_votes ?? 0) + 1;
      await thread.save({ transaction: t });
    }
  });

  return res.json({ status: 'Success', result: vote.toJSON() });
};

export default updateOffchainVote;
