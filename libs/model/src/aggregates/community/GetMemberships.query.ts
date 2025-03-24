import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

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

      // TODO: shouldn't refresh (mutate) in a query... this is eventually consistent
      // const memberships = await refreshMembershipsForAddress(
      //   this.models,
      //   address,
      //   groups,
      //   true, // use fresh balances
      // );

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
                ?.GroupPermissions?.find((gtp) => gtp.topic_id === t.id)
                ?.allowed_actions || [],
          })),
        isAllowed: !reject_reason,
        rejectReason: reject_reason || undefined,
      }));
    },
  };
}
