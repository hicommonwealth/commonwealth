import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { FindAndCountOptions } from 'sequelize';
import z from 'zod';
import { models } from '../database';
import { TopicAttributes } from '../models/index';
import { removeUndefined } from '../utils';
import { formatSequelizePagination } from '../utils/paginationUtils';

export function GetTopics(): Query<typeof schemas.GetTopics> {
  return {
    ...schemas.GetTopics,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, topic_id, include_threads } = payload;

      const includeArray = [];
      if (include_threads) {
        includeArray.push({
          model: models.Thread,
          as: 'threads',
        });
      }

      const { count, rows: topics } = await models.Topic.findAndCountAll({
        where: removeUndefined({ community_id, id: topic_id }),
        include: includeArray,
        ...formatSequelizePagination(payload),
        paranoid: false,
      } as unknown as FindAndCountOptions<TopicAttributes>);

      return schemas.buildPaginatedResponse(
        topics,
        count as number,
        payload,
      ) as unknown as z.infer<typeof schemas.GetTopics.output>;
    },
  };
}
