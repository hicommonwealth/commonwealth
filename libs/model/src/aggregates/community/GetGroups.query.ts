import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetGroups(): Query<typeof schemas.GetGroups> {
  return {
    ...schemas.GetGroups,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, group_id, include_members, include_topics } =
        payload;

      const groups = await models.Group.findAll({
        where: {
          ...(community_id && { community_id }),
          ...(group_id && { id: group_id }),
        },
        include: [
          {
            model: models.GroupPermission,
            attributes: ['topic_id', 'allowed_actions'],
          },
        ],
      });
      const ids = groups.map((g) => g.id!);
      const map = new Map<number, z.infer<typeof schemas.GroupView>>();
      groups.forEach((g) =>
        map.set(g.id!, {
          ...g.toJSON(),
          id: g.id!,
          name: g.metadata.name,
          memberships: [],
          topics: [],
        }),
      );

      if (include_members) {
        const members = await models.Membership.findAll({
          where: { group_id: { [Op.in]: ids } },
          include: [{ model: models.Address, as: 'address' }],
        });
        members.forEach((m) => {
          const group = map.get(m.group_id);
          group && group.memberships.concat(m);
        });
      }

      if (include_topics) {
        const topics = await models.Topic.findAll({
          where: {
            ...(community_id && { community_id }),
            group_ids: { [Op.overlap]: ids },
          },
        });
        groups.forEach((g) => {
          const group = map.get(g.id!);
          group &&
            group.topics.concat(
              topics
                .filter((t) => t.group_ids.includes(group.id))
                .map((t) => ({
                  ...t.toJSON(),
                  permissions: (g.GroupPermissions || []).find(
                    (gtp) => gtp.topic_id === t.id,
                  )?.allowed_actions as schemas.PermissionEnum[],
                })),
            );
        });
      }

      return Array.from(map.values());
    },
  };
}
