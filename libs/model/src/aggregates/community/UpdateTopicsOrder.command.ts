import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function UpdateTopicsOrder(): Command<typeof schemas.UpdateTopicsOrder> {
  return {
    ...schemas.UpdateTopicsOrder,
    auth: [authRoles('admin', 'moderator')],
    body: async ({ payload }) => {
      const { ordered_ids } = payload;
      if (!ordered_ids?.length) return [];

      const found = await models.Topic.findAll({
        where: {
          id: ordered_ids,
          featured_in_sidebar: true,
        },
        attributes: ['id'],
      });
      if (found.length !== ordered_ids.length)
        throw new InvalidInput('Not all topics found');

      const ids = ordered_ids.join(', ');
      const whens = ordered_ids
        .map((id, idx) => `WHEN ${id} THEN ${idx + 1}\n`)
        .join(' ');
      await models.sequelize.query(
        `UPDATE "Topics" SET "order" = CASE id
        ${whens}
        END WHERE id IN (${ids})`,
      );

      const topics = await models.Topic.findAll({
        where: {
          id: ordered_ids,
          featured_in_sidebar: true,
        },
        order: [['order', 'ASC']],
      });
      return topics.map((t) => t.toJSON());
    },
  };
}
