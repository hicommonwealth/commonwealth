import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export type TopicWithGatingGroups = z.infer<typeof schemas.Topic> & {
  gatingGroups?: Array<{ id: number; name: string | null }>;
};

export function GetTopicById(): Query<typeof schemas.GetTopicById> {
  return {
    ...schemas.GetTopicById,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { topic_id, includeGatingGroups } = payload;

      const topicInstance = await models.Topic.findOne({
        where: { id: topic_id },
      });
      mustExist('Topic', topicInstance);
      const topic = topicInstance.toJSON();

      if (includeGatingGroups) {
        const groupGatedActions = await models.GroupGatedAction.findAll({
          where: { topic_id },
          include: [{ model: models.Group, attributes: ['id', 'metadata'] }],
        });

        const topicWithGatingGroups: TopicWithGatingGroups = {
          ...topic,
          gatingGroups: groupGatedActions.map((gga) => ({
            id: gga.group_id,
            name: gga.Group?.metadata?.name ?? null,
          })),
        };

        return topicWithGatingGroups;
      }
      return topic;
    },
  };
}
