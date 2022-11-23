import { TokenBalanceCache } from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainNetwork, ChainType } from 'common-common/src/types';

import validateTopicThreshold from './validateTopicThreshold';
import RuleCache from './rules/ruleCache';
import checkRule from './rules/checkRule';
import BanCache from './banCheckCache';
import { DB } from '../models';
import { ChainAttributes } from '../models/chain';
import { AddressAttributes } from '../models/address';
import { findAllRoles } from './roles';
import { AppError, ServerError } from './errors';

const log = factory.getLogger(formatFilename(__filename));

export enum ValidationErrors {
  RuleCheckFailed = 'Rule check failed',
  Banned = 'User is banned',
  BalanceCheckFailed = 'Could not verify user token balance',
  TopicNF = 'Topic not found',
}

// TODO: this should be middleware
const validateRestrictions = async (
  models: DB,
  ruleCache: RuleCache,
  banCache: BanCache,
  tokenBalanceCache: TokenBalanceCache,
  creator: AddressAttributes,
  chain: ChainAttributes,
  topicId?: number,
): Promise<void> => {
  // 1. check ban
  const [canInteract, banError] = await banCache.checkBan({
    chain: chain.id,
    address: creator.address,
  });
  if (!canInteract) {
    throw new AppError(banError || ValidationErrors.Banned);
  }
  if (!topicId) return;

  // find topic if passed
  const topic = await models.Topic.findOne({
    where: { id: topicId },
    include: [
      {
        model: models.Chain,
        required: true,
        as: 'chain',
        include: [{
          model: models.ChainNode,
          required: true,
        }]
      },
    ],
    attributes: ['id', 'rule_id', 'token_threshold'],
  });
  if (!topic) {
    throw new ServerError(ValidationErrors.TopicNF)
  }

  // 2. check rule
  if (topic?.rule_id) {
    const passesRules = await checkRule(
      ruleCache,
      models,
      topic.rule_id,
      creator.address
    );
    if (!passesRules) {
      throw new AppError(ValidationErrors.RuleCheckFailed);
    }
  }

  // 3. check TBC
  if (chain.type === ChainType.Token || chain.network === ChainNetwork.Ethereum) {
    // skip check for admins
    const isAdmin = await findAllRoles(
      models,
      { where: { address_id: creator.id } },
      chain.id,
      ['admin']
    );
    if (isAdmin.length === 0) {
      try {
        const canAct = await validateTopicThreshold(
          tokenBalanceCache,
          models,
          topic,
          creator.address,
        );
        if (!canAct) {
          throw new AppError(ValidationErrors.BalanceCheckFailed);
        }
      } catch (e) {
        log.error(`hasToken failed: ${e.message}`);
        throw new ServerError(ValidationErrors.BalanceCheckFailed);
      }
    }
  }
}

export default validateRestrictions;