import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

type CommunityView = {
  id: string;
  name: string;
};

export function GetTagUsage(): Query<typeof schemas.GetTagUsage> {
  return {
    ...schemas.GetTagUsage,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { id } = payload;

      const communities = await models.sequelize.query<CommunityView>(
        `
        SELECT c.id, c.name
        FROM "Communities" c
        JOIN "CommunityTags" ct ON c.id = ct.community_id
        WHERE ct.tag_id = :tagId
        ORDER BY c.name ASC
        `,
        {
          replacements: { tagId: id },
          type: QueryTypes.SELECT,
        },
      );

      return {
        communities: communities || [],
      };
    },
  };
}
