import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetTopicById(): Query<typeof schemas.GetTopicById> {
  return {
    ...schemas.GetTopicById,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { topic_id } = payload;

      const result = await models.Topic.findOne({
        where: { id: topic_id },
      });

      return result?.toJSON();
    },
  };
}
