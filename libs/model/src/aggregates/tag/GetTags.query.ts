import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetTags(): Query<typeof schemas.GetTags> {
  return {
    ...schemas.GetTags,
    auth: [],
    secure: false,
    body: async () => {
      const tags = await models.Tags.findAll();
      return tags.map((tag) => tag.toJSON());
    },
  };
}
