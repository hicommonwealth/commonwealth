import {
  AddressAttributes,
  DB,
  GroupInstance,
  MembershipRejectReason,
} from '@hicommonwealth/model';
import { GroupPermissionAction } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { refreshMembershipsForAddress } from './refreshMembershipsForAddress';

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic.
 * @param models DB handle
 * @param topicId ID of the topic
 * @param communityId ID of the community of the groups
 * @param address Address to check against requirements
 * @param allowedAction The type of permission it is gating
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  topicId: number,
  communityId: string,
  address: AddressAttributes,
  allowedAction?: GroupPermissionAction,
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

  if (topic.group_ids.length === 0) {
    return { isValid: true };
  }

  const groups: (GroupInstance & {
    allowed_actions?: GroupPermissionAction[];
  })[] = await models.sequelize.query(
    `
        SELECT g.*, gp.allowed_actions FROM "Groups" as g LEFT JOIN "GroupPermissions" gp ON g.id = gp.group_id
        WHERE g.community_id = :communityId AND g.id IN(:groupIds);
      `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { communityId, groupIds: topic.group_ids },
    },
  );

  // There are 2 cases here. We either have the old group permission system where the group doesn't have
  // any allowed_actions, or we have the new fine-grained permission system where the action must be in
  // the allowed_actions list.
  const permissionedGroups = groups.filter(
    (g) => !g.allowed_actions || g.allowed_actions.includes(allowedAction),
  );

  // check membership for all groups of topic
  let numValidGroups = 0;
  const allErrorMessages: MembershipRejectReason[] = [];

  const memberships = await refreshMembershipsForAddress(
    models,
    address,
    permissionedGroups,
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
