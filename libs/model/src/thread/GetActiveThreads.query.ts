import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ThreadView } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../database';

export function GetActiveThreads(): Query<typeof schemas.GetActiveThreads> {
  return {
    ...schemas.GetActiveThreads,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, threads_per_topic, withXRecentComments } = payload;

      const topThreadsByTopic = await models.Topic.findAll({
        where: { community_id },
        include: [
          {
            model: models.Thread,
            as: 'threads',
            required: true,
            order: [
              ['created_at', 'DESC'],
              ['last_commented_on', 'DESC'],
            ],
            limit: threads_per_topic ?? 3,
            include: [
              {
                model: models.Address,
                as: 'Address',
                attributes: ['id', 'address', 'community_id'],
                include: [
                  {
                    model: models.User,
                    attributes: ['id', 'profile'],
                  },
                ],
              },
              { model: models.Address, as: 'collaborators' },
              { model: models.Topic, as: 'topic', required: true },
              {
                model: models.Comment,
                limit: Math.min(withXRecentComments ?? 0, 10), // cap to 10
                order: [['created_at', 'DESC']],
                attributes: [
                  'id',
                  'address_id',
                  'body',
                  'created_at',
                  'updated_at',
                  'deleted_at',
                  'marked_as_spam_at',
                  'discord_meta',
                  'content_url',
                ],
                include: [
                  {
                    model: models.Address,
                    as: 'Address',
                    attributes: ['address'],
                    include: [
                      {
                        model: models.User,
                        attributes: ['id', 'profile'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      return topThreadsByTopic
        .map((topic) => topic.toJSON().threads ?? [])
        .flat() as z.infer<typeof ThreadView>[];
    },
  };
}
