import { models, TopicAttributes } from '@hicommonwealth/model';
import { Topic } from '@hicommonwealth/schemas';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';

type CWTopicWithDiscourseId = z.infer<typeof Topic> & {
  discourseCategoryId: number;
};

class DiscourseQueries {
  static fetchTopicsFromDiscourse = async (session: Sequelize) => {
    return session.query<{ id: any; name: string; description: string }>(
      `
        select * FROM public.categories
    `,
      { raw: true, type: QueryTypes.SELECT },
    );
  };
}

class CWQueries {
  static createCategory = async (
    category: {
      name: string;
      communityId: string;
      description: string;
      discourseCategoryId: number;
    },
    { transaction }: { transaction: Transaction },
  ): Promise<{
    createdCategory: { id: number; name: string };
    discourseCategoryId: number;
  }> => {
    const { name, communityId, description, discourseCategoryId } = category;

    let result: TopicAttributes | null = null;
    if (name === 'General') {
      // update existing general topic
      const originalTopic = await models.Topic.findOne({
        where: {
          name: 'General',
          community_id: communityId,
        },
      });
      if (originalTopic) {
        originalTopic.description = description;
        originalTopic.featured_in_sidebar = true;
        await originalTopic.save({ transaction });
        result = originalTopic;
      }
    } else {
      // create new topic
      result = await models.Topic.create(
        {
          name,
          description,
          community_id: communityId,
          featured_in_sidebar: true,
          featured_in_new_post: false,
        },
        { transaction },
      );
    }

    return { createdCategory: result, discourseCategoryId } as any;
  };
}

export const createAllCategoriesInCW = async (
  discourseConnection: Sequelize,
  { communityId }: { communityId: string },
  { transaction }: { transaction: Transaction },
) => {
  const categories = await DiscourseQueries.fetchTopicsFromDiscourse(
    discourseConnection,
  );
  const categoryPromises = categories.map(
    ({ id: discourseCategoryId, name, description }) =>
      CWQueries.createCategory(
        {
          discourseCategoryId,
          // eslint-disable-next-line no-useless-escape
          name: name.replace(/[\/\\]/g, ' '),
          description,
          communityId,
        },
        { transaction },
      ),
  );
  const createdCategories = await Promise.all(categoryPromises);
  return createdCategories.map(({ createdCategory, discourseCategoryId }) => ({
    discourseCategoryId,
    id: createdCategory.id,
    name: createdCategory.name,
  }));
};
