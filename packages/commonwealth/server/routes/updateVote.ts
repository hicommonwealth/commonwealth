import moment from 'moment';
import { NextFunction } from 'express';
import TokenBalanceCache from 'token-balance-cache/src/index';

import validateTopicThreshold from '../util/validateTopicThreshold';
import { sequelize, DB } from '../database';
import validateChain from '../util/validateChain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { TypedRequestBody, TypedResponse, success } from '../types';
import {
  VoteAttributes,
  VoteInstance,
} from '../models/vote';
import checkRule from '../util/rules/checkRule';
import RuleCache from '../util/rules/ruleCache';
import { AppError, ServerError } from '../util/errors';

export const Errors = {
  NoPoll: 'No corresponding poll found',
  NoThread: 'No corresponding thread found',
  InvalidUser: 'Invalid user',
  InvalidOption: 'Invalid response option',
  PollingClosed: 'Polling already finished',
  BalanceCheckFailed: 'Could not verify user token balance',
  RuleCheckFailed: 'Rule check failed',
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
  ruleCache: RuleCache,
  req: TypedRequestBody<UpdateVoteReq>,
  res: TypedResponse<UpdateVoteResp>,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (!author) return next(new AppError(Errors.InvalidUser));
  if (authorError) return next(new AppError(authorError));

  const { poll_id, address, author_chain, option } = req.body;

  const poll = await models.Poll.findOne({
    where: { id: poll_id, chain_id: chain.id },
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
    if (!option) throw new AppError("Invalid Poll Response");
  } catch (e) {
    return next(new AppError(Errors.InvalidOption));
  }

  const thread = await models.Thread.findOne({
    where: { id: poll.thread_id },
  });
  if (!thread) return next(new AppError(Errors.NoThread));

  // check token balance threshold if needed
  const canVote = await validateTopicThreshold(
    tokenBalanceCache,
    models,
    thread.topic_id,
    address
  );
  if (!canVote) {
    return next(new AppError(Errors.BalanceCheckFailed));
  }

  const topic = await models.Topic.findOne({
    where: { id: thread.topic_id },
    attributes: ['rule_id'],
  });
  if (topic?.rule_id) {
    const passesRules = await checkRule(ruleCache, models, topic.rule_id, author.address);
    if (!passesRules) {
      return next(new AppError(Errors.RuleCheckFailed));
    }
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
