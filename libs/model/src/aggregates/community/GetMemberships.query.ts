import { command, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { systemActor } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { GroupAttributes } from '../../models';
import { RefreshCommunityMemberships } from './RefreshCommunityMemberships.command';

/**
 * Builds a map index by group id of the topics and their permissions
 */
export function buildPermissionsMap(groups: GroupAttributes[]) {
  const permissions = groups.map((g) => g.GroupPermissions || []).flat();
  const map = new Map<number, z.infer<typeof schemas.MembershipTopicView>[]>();
  permissions.forEach((p) => {
    const entry = map.get(p.group_id);
    if (entry)
      entry.push({
        id: p.topic_id,
        permissions: p.allowed_actions,
      });
    else
      map.set(p.group_id, [
        {
          id: p.topic_id,
          permissions: p.allowed_actions,
        },
      ]);
  });
  return map;
}

export function GetMemberships(): Query<typeof schemas.GetMemberships> {
  return {
    ...schemas.GetMemberships,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, address, topic_id } = payload;

      const addr = await models.Address.findOne({
        where: { address, community_id },
      });
      mustExist('Address', addr);

      const groups = await models.Group.findAll({
        where: { community_id },
        include: [
          {
            model: models.GroupPermission,
            attributes: ['topic_id', 'allowed_actions'],
            where: topic_id ? { topic_id } : undefined,
          },
        ],
      });

      // TODO: resolve stale community memberships in a separate job
      await command(RefreshCommunityMemberships(), {
        actor: systemActor({}),
        payload: { community_id, address },
      });

      const memberships = await models.Membership.findAll({
        where: {
          group_id: { [Op.in]: groups.map((g) => g.id!) },
          address_id: addr.id!,
        },
        include: [{ model: models.Group, as: 'group' }],
      });

      const permissions = buildPermissionsMap(groups);

      // transform memberships to result shape
      return memberships.map(({ group_id, reject_reason }) => ({
        groupId: group_id,
        topics: permissions.get(group_id)!,
        isAllowed: !reject_reason,
        rejectReason: reject_reason || undefined,
      }));
    },
  };
}
