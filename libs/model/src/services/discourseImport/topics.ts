import { models, TopicAttributes } from '@hicommonwealth/model';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';

export type CWTopicWithDiscourseId = TopicAttributes & {
  discourseCategoryId: number;
  created: boolean;
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
  static bulkCreateTopics = async (
    entries: {
      name: string;
      description: string;
      communityId: string;
      discourseCategoryId: number;
    }[],
    { transaction }: { transaction: Transaction | null },
  ): Promise<Array<CWTopicWithDiscourseId>> => {
    const topicsToCreate: TopicAttributes[] = entries.map(
      ({ name, description, communityId }) => ({
        name,
        description: description || '',
        community_id: communityId,
        featured_in_sidebar: true,
        featured_in_new_post: false,
      }),
    );

    const existingTopics = await models.Topic.findAll({
      where: {
        [Op.or]: topicsToCreate.map((t) => ({
          name: t.name,
          community_id: t.community_id,
        })),
      },
    });

    const filteredAddressesToCreate = topicsToCreate.filter(
      (t) =>
        !existingTopics.find(
          (et) => t.name === et.name && t.community_id === et.community_id,
        ),
    );

    const createdTopics = await models.Topic.bulkCreate(
      filteredAddressesToCreate,
      {
        transaction,
      },
    );

    return [
      ...existingTopics.map((a) => ({
        ...a.get({ plain: true }),
        created: false,
      })),
      ...createdTopics.map((a) => ({
        ...a.get({ plain: true }),
        created: true,
      })),
    ].map((topic) => ({
      ...topic,
      discourseCategoryId: entries.find(
        (e) => e.name === topic.name && e.communityId === topic.community_id,
      )!.discourseCategoryId,
    }));
  };
}

export const createAllTopicsInCW = async (
  discourseConnection: Sequelize,
  { communityId }: { communityId: string },
  { transaction }: { transaction: Transaction | null },
): Promise<Array<CWTopicWithDiscourseId>> => {
  const discourseCategories = await DiscourseQueries.fetchCategories(
    discourseConnection,
  );
  const entries = discourseCategories.map((discourseTopic) => ({
    // eslint-disable-next-line no-useless-escape
    name: discourseTopic.name.replace(/[\/\\]/g, ' '),
    description: discourseTopic.description,
    communityId,
    discourseCategoryId: discourseTopic.id,
  }));
  return CWQueries.bulkCreateTopics(entries, { transaction });
};
