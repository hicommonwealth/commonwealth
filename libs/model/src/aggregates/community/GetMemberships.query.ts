import { command, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { systemActor } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { RefreshCommunityMemberships } from './RefreshCommunityMemberships.command';

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
            model: models.GroupGatedAction,
            attributes: ['topic_id', 'gated_actions'],
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

      const topics = await models.Topic.findAll({
        where: { group_ids: { [Op.overlap]: groups.map((g) => g.id!) } },
        attributes: ['id', 'group_ids'],
      });

      // transform memberships to result shape
      return memberships.map(({ group_id, reject_reason }) => ({
        groupId: group_id,
        topics: topics
          .filter((t) => t.group_ids!.includes(group_id))
          .map((t) => ({
            id: t.id!,
            permissions:
              groups
                .find((g) => g.id === group_id)
                ?.GroupGatedActions?.find((gtp) => gtp.topic_id === t.id)
                ?.gated_actions || [],
          })),
        isAllowed: !reject_reason,
        rejectReason: reject_reason || undefined,
      }));
    },
  };
}
