import {
  AddressAttributes,
  DB,
  GroupInstance,
  MembershipRejectReason,
} from '@hicommonwealth/model';
import { ForumActions } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { refreshMembershipsForAddress } from './refreshMembershipsForAddress';

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic.
 * @param models DB handle
 * @param topicId ID of the topic
 * @param communityId ID of the community of the groups
 * @param address Address to check against requirements
 * @param action The type of permission allowed_action it is checking for
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  topicId: number,
  communityId: string,
  address: AddressAttributes,
  action: ForumActions,
): Promise<{ isValid: boolean; message?: string }> {
  const groups: (GroupInstance & {
    allowed_actions?: ForumActions[];
  })[] = await models.sequelize.query(
    `
        SELECT g.*, gp.allowed_actions FROM "Groups" as g LEFT JOIN "GroupPermissions" gp ON g.id = gp.group_id
        WHERE g.community_id = :communityId AND gp.topic_id = :topicId;
      `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { communityId, topicId: topicId },
    },
  );

  // if there are no groups for this topic, then anyone can perform any action on it (default behaviour).
  if (groups.length === 0) {
    return { isValid: true };
  }

  const groupsMatchingAction = groups.filter(
    (g) => !g.allowed_actions || g.allowed_actions.includes(action),
  );

  // if no group allows the specified action for the given topic, then reject because regardless of membership the user
  // will not be allowed.
  if (groupsMatchingAction.length === 0) {
    return {
      isValid: false,
      message: `User does not have permission to perform action ${action}`,
    };
  }

  // check membership for all groups of topic
  let numValidGroups = 0;
  const allErrorMessages: MembershipRejectReason[] = [];

  const memberships = await refreshMembershipsForAddress(
    models,
    address,
    groupsMatchingAction,
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
