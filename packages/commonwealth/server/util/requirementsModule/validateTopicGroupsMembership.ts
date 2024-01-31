import {
  AddressAttributes,
  DB,
  MembershipRejectReason,
  TokenBalanceCache,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { refreshMembershipsForAddress } from './refreshMembershipsForAddress';

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic.
 * @param models DB handle
 * @param tokenBalanceCache Token balance cache handle (new implementation)
 * @param topicId ID of the topic
 * @param communityId ID of the community of the groups
 * @param address Address to check against requirements
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  topicId: number,
  communityId: string,
  address: AddressAttributes,
): Promise<{ isValid: boolean; message?: string }> {
  // check via new TBC with groups

  // get all groups of topic
  const topic = await models.Topic.findOne({
    where: {
      community_id: communityId,
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
