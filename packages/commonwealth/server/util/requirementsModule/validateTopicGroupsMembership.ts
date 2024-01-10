import { Op } from 'sequelize';
import { FEATURE_FLAG_GROUP_CHECK_ENABLED } from '../../config';
import { DB } from '../../models';
import { AddressAttributes } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { MembershipRejectReason } from '../../models/membership';
import { TokenBalanceCache } from '../tokenBalanceCache/tokenBalanceCache';
import { refreshMembershipsForAddress } from './refreshMembershipsForAddress';

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic. Depending on the FEATURE_FLAG_GROUP_CHECK_ENABLED
 * feature flag, may use Gating API implementation or original TBC implementation.
 * @param models DB handle
 * @param tokenBalanceCache Token balance cache handle (new implementation)
 * @param topicId ID of the topic
 * @param community Community of the groups
 * @param address Address to check against requirements
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  topicId: number,
  community: CommunityInstance,
  address: AddressAttributes,
): Promise<{ isValid: boolean; message?: string }> {
  if (!FEATURE_FLAG_GROUP_CHECK_ENABLED) {
    // backwards compatibility with integration tests
    return { isValid: true };
  }
  // check via new TBC with groups

  // get all groups of topic
  const topic = await models.Topic.findOne({
    where: {
      community_id: community.id,
      id: topicId,
    },
  });
  if (!topic) {
    return { isValid: false, message: 'Topic not found' };
  }
  const groups = await models.Group.findAll({
    where: {
      id: { [Op.in]: topic.group_ids },
    },
  });
  if (groups.length === 0) {
    return { isValid: true };
  }

  // check membership for all groups of topic
  let numValidGroups = 0;
  const allErrorMessages: MembershipRejectReason[] = [];

  const memberships = await refreshMembershipsForAddress(
    models,
    tokenBalanceCache,
    address,
    groups,
    false, // use cached balances
  );

  for (const membership of memberships) {
    if (membership.reject_reason) {
      allErrorMessages.push(membership.reject_reason);
    } else {
      numValidGroups++;
    }
  }

  if (numValidGroups === 0) {
    return { isValid: false, message: allErrorMessages.join('\n') };
  }

  return { isValid: true };
}
