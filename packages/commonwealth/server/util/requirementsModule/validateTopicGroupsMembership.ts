import { Op } from 'sequelize';
import { ServerError } from '../../../../common-common/src/errors';

import { TokenBalanceCache as TokenBalanceCacheV1 } from '../../../../token-balance-cache/src';
import { FEATURE_FLAG_GROUP_CHECK_ENABLED } from '../../config';
import { DB } from '../../models';
import { AddressAttributes } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { TokenBalanceCache as TokenBalanceCacheV2 } from '../tokenBalanceCache/tokenBalanceCache';
import validateTopicThreshold from '../validateTopicThreshold';
import { makeGetBalancesOptions } from './makeGetBalancesOptions';
import validateGroupMembership from './validateGroupMembership';

export const Errors = {
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
};

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic. Depending on the FEATURE_FLAG_GROUP_CHECK_ENABLED
 * feature flag, may use Gating API implementation or original TBC implementation.
 * @param models DB handle
 * @param tokenBalanceCacheV1 Token balance cache handle (old implementation)
 * @param tokenBalanceCacheV2 Token balance cache handle (new implementation)
 * @param topicId ID of the topic
 * @param chain Chain of the groups
 * @param address Address to check against requirements
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  tokenBalanceCacheV1: TokenBalanceCacheV1,
  tokenBalanceCacheV2: TokenBalanceCacheV2,
  topicId: number,
  chain: CommunityInstance,
  address: AddressAttributes,
): Promise<{ isValid: boolean; message?: string }> {
  if (FEATURE_FLAG_GROUP_CHECK_ENABLED) {
    // check via new TBC with groups

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
    let numValidGroups = 0;
    const allErrorMessages: string[] = [];

    const getBalancesOptions = makeGetBalancesOptions(groups, [address]);
    const balances = await Promise.all(
      getBalancesOptions.map(async (options) => {
        return {
          options,
          balances: await tokenBalanceCacheV2.getBalances(options),
        };
      }),
    );

    for (const { metadata, requirements } of groups) {
      const { isValid, messages } = await validateGroupMembership(
        address.address,
        requirements,
        balances,
        metadata.required_requirements || 0,
      );
      if (isValid) {
        numValidGroups++;
      } else {
        for (const message of messages) {
          allErrorMessages.push(JSON.stringify(message));
        }
      }
    }

    if (numValidGroups === 0) {
      return { isValid: false, message: allErrorMessages.join('\n') };
    }

    return { isValid: true };
  }

  // check via old TBC without groups
  try {
    const canReact = await validateTopicThreshold(
      tokenBalanceCacheV1,
      models,
      topicId,
      address.address,
    );
    if (!canReact) {
      return { isValid: false, message: Errors.InsufficientTokenBalance };
    }
    return { isValid: true };
  } catch (e) {
    throw new ServerError(Errors.BalanceCheckFailed, e);
  }
}
