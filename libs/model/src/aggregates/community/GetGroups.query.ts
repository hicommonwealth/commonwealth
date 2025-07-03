import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { buildTopicPermissionsMap } from './GetMemberships.query';

export function GetGroups(): Query<typeof schemas.GetGroups> {
  return {
    ...schemas.GetGroups,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, group_id, include_members, include_topics } =
        payload;

      const groups = (
        await models.Group.findAll({
          where: {
            ...(community_id && { community_id }),
            ...(group_id && { id: group_id }),
          },
          include: [
            {
              model: models.GroupGatedAction,
              attributes: [
                'group_id',
                'topic_id',
                'is_private',
                'gated_actions',
              ],
            },
          ],
        })
      ).map((g) => g.toJSON());
      const ids = groups.map((g) => g.id!);

      const output = new Map<number, z.infer<typeof schemas.GroupView>>();
      groups.forEach((g) =>
        output.set(g.id!, {
          ...g,
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
          const group = output.get(m.group_id);
          if (group) {
            const plain = m.get ? m.get({ plain: true }) : m;
            group.memberships.push({
              ...plain,
              address: plain.address?.address || null,
            });
          }
        });
      }

      if (include_topics) {
        const topic_ids = groups
          .map((g) => g.GroupGatedActions || [])
          .flat()
          .map((p) => p.topic_id);
        const topics = await models.Topic.findAll({
          where: {
            ...(community_id && { community_id }),
            id: topic_ids,
          },
        });

        const topics_map = new Map<number, z.infer<typeof schemas.Topic>>();
        topics.forEach((t) => topics_map.set(t.id!, t.toJSON()));

        const topic_permissions = buildTopicPermissionsMap(groups);
        output.forEach((g) => {
          const perm = topic_permissions.get(g.id!);
          perm &&
            perm.forEach((p) => {
              const topic = topics_map.get(p.id);
              topic &&
                g.topics.push({
                  ...topic!,
                  is_private: p.is_private,
                  permissions: p.permissions,
                });
            });
        });
      }

      return Array.from(output.values());
    },
  };
}
