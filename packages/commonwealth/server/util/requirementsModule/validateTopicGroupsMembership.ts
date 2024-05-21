import {
  AddressAttributes,
  DB,
  GroupInstance,
  MembershipRejectReason,
} from '@hicommonwealth/model';
import { GroupPermissionType } from '@hicommonwealth/schemas/src/index';
import { Op, QueryTypes } from 'sequelize';
import { refreshMembershipsForAddress } from './refreshMembershipsForAddress';

/**
 * Validates if a given user address passes a set of requirements and grants access for
 * all groups of the given topic.
 * @param models DB handle
 * @param topicId ID of the topic
 * @param communityId ID of the community of the groups
 * @param address Address to check against requirements
 * @param type The type of permission it is gating
 * @returns validity with optional error message
 */
export async function validateTopicGroupsMembership(
  models: DB,
  topicId: number,
  communityId: string,
  address: AddressAttributes,
  type?: GroupPermissionType,
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
  let groups = await models.Group.findAll({
    where: {
      id: { [Op.in]: topic.group_ids },
    },
  });
  if (groups.length === 0) {
    return { isValid: true };
  }

  const groupPermissions: (GroupInstance & { type: GroupPermissionType })[] =
    await models.sequelize.query(
      `
        SELECT g.*, gp.type FROM "GroupPermissions" as gp LEFT JOIN "Groups" g ON g.id = gp.group_id
        WHERE g.community_id = :communityId AND gp.id IN(:groupIds);
      `,
      {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: { communityId, groupIds: groups.map((g) => g.id) },
      },
    );

  // If groupPermissions exist for the group, then only check for groups with the type. Otherwise, treat it as a regular
  // logic and block all non-members.
  if (groupPermissions.length > 0) {
    groups = groupPermissions.filter((g) => g.type === type);
  }

  // check membership for all groups of topic
  let numValidGroups = 0;
  const allErrorMessages: MembershipRejectReason[] = [];

  const memberships = await refreshMembershipsForAddress(
    models,
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
