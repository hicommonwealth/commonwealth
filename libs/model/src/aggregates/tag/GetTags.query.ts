import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

type TagView = z.infer<typeof schemas.TagView>;

export function GetTags(): Query<typeof schemas.GetTags> {
  return {
    ...schemas.GetTags,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { with_community_count } = payload;

      const tags = await models.Tags.findAll();
      if (!tags?.length) return [];

      if (with_community_count) {
        const map = new Map<number, TagView>();
        tags.forEach((tag) => map.set(tag.id!, tag.toJSON()));
        const counts = await models.sequelize.query<{
          tag_id: number;
          count: number;
        }>(
          `
          SELECT tag_id, count(*) as count
          FROM "CommunityTags"
          GROUP BY tag_id
        `,
          { type: QueryTypes.SELECT },
        );
        counts.forEach(({ tag_id, count }) => {
          map.set(tag_id, { ...map.get(tag_id)!, community_count: +count });
        });
        return Array.from(map.values());
      } else return tags.map((tag) => tag.toJSON());
    },
  };
}
