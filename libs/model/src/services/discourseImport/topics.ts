import { models } from '@hicommonwealth/model';
import { Topic } from '@hicommonwealth/schemas';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';

export type CWTopicWithDiscourseId = z.infer<typeof Topic> & {
  discourseCategoryId: number;
};

// Discourse Category == CW Topic
type DiscourseCategory = {
  id: any;
  name: string;
  description: string;
};

class DiscourseQueries {
  static fetchCategories = async (session: Sequelize) => {
    return session.query<DiscourseCategory>(
      `
        select id, name, description FROM public.categories
    `,
      { raw: true, type: QueryTypes.SELECT },
    );
  };
}

class CWQueries {
  static createOrFindTopic = async (
    name: string,
    description: string,
    communityId: string,
    discourseCategoryId: number,
    { transaction }: { transaction: Transaction },
  ): Promise<CWTopicWithDiscourseId> => {
    const [topic] = await models.Topic.findOrCreate({
      where: {
        name,
        community_id: communityId,
      },
      defaults: {
        name,
        description: description || '',
        community_id: communityId,
        featured_in_sidebar: true,
        featured_in_new_post: false,
      },
      transaction,
    });
    return {
      ...(topic.get({ plain: true }) as z.infer<typeof Topic>),
      discourseCategoryId,
    };
  };
}

export const createAllTopicsInCW = async (
  discourseConnection: Sequelize,
  { communityId }: { communityId: string },
  { transaction }: { transaction: Transaction },
): Promise<Array<CWTopicWithDiscourseId>> => {
  const discourseTopics = await DiscourseQueries.fetchCategories(
    discourseConnection,
  );
  const promises = discourseTopics.map((discourseTopic) =>
    CWQueries.createOrFindTopic(
      // eslint-disable-next-line no-useless-escape
      discourseTopic.name.replace(/[\/\\]/g, ' '),
      discourseTopic.description,
      communityId,
      discourseTopic.id,
      { transaction },
    ),
  );
  return Promise.all(promises);
};
