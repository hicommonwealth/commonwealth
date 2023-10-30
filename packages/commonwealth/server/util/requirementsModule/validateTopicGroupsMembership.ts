import { DB } from '../../models';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import { CommunityInstance } from '../../models/chain';
import { AddressInstance } from '../../models/address';
import { FEATURE_FLAG_GROUP_CHECK_ENABLED } from '../../config';
import validateGroupMembership from './validateGroupMembership';
import validateTopicThreshold from '../validateTopicThreshold';
import { ServerError } from '../../../../common-common/src/errors';
import { Op } from 'sequelize';

export const Errors = {
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
};

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic. Depending on the FEATURE_FLAG_GROUP_CHECK_ENABLED
 * feature flag, may use Gating API implementation or original TBC implementation.
 * @param models DB handle
 * @param tokenBalanceCache Token balance cache handle
 * @param topicId ID of the topic
 * @param chain Chain of the groups
 * @param address Address to check against requirements
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  topicId: number,
  chain: CommunityInstance,
  address: AddressInstance
): Promise<{ isValid: boolean; message?: string }> {
  if (FEATURE_FLAG_GROUP_CHECK_ENABLED) {
    // check via groups

    // get all groups of topic
    const topic = await models.Topic.findOne({
      where: {
        chain_id: chain.id,
        id: topicId,
      },
    });
    const groups = await models.Group.findAll({
      where: {
        id: { [Op.in]: topic.group_ids },
      },
    });

    // check membership for all groups of topic
    for (const { requirements } of groups) {
      const { isValid, messages } = await validateGroupMembership(
        address.address,
        requirements,
        tokenBalanceCache
      );
      if (!isValid) {
        return { isValid: false, message: JSON.stringify(messages) };
      }
    }

    return { isValid: true };
  }

  // check via TBC
  try {
    const canReact = await validateTopicThreshold(
      tokenBalanceCache,
      models,
      topicId,
      address.address
    );
    if (!canReact) {
      return { isValid: false, message: Errors.InsufficientTokenBalance };
    }
    return { isValid: true };
  } catch (e) {
    throw new ServerError(Errors.BalanceCheckFailed, e);
  }
}
