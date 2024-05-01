import { QueryTypes, Sequelize, Transaction } from 'sequelize';

export const fetchTopicsFromDiscourse = async (session: Sequelize) => {
  return session.query<{ id: any; name: string; description: string }>(
    `
        select * FROM public.categories
    `,
    { raw: true, type: QueryTypes.SELECT },
  );
};

const createCategory = async (
  session: Sequelize,
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

  let result;
  if (name === 'General') {
    result = await session.query(
      `
      UPDATE "Topics"
      SET description = '${description}',
          updated_at = NOW(),
          featured_in_sidebar = true
      WHERE name = 'General' AND community_id = '${communityId}'
      RETURNING id, name;
    `,
      { type: QueryTypes.UPDATE, transaction },
    );
  } else {
    result = await session.query(
      `
      INSERT INTO "Topics"(
      id, name, created_at, updated_at, deleted_at, community_id, description,
      telegram, featured_in_sidebar, featured_in_new_post)
      VALUES (default, '${name}', NOW(), NOW(), null, '${communityId}', '${description}', null, true, false)
      RETURNING id, name;
    `,
      { type: QueryTypes.SELECT, transaction },
    );
  }

  return { createdCategory: result[0], discourseCategoryId } as any;
};

export const createAllCategoriesInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  { communityId }: { communityId: string },
  { transaction }: { transaction: Transaction },
) => {
  const categories = await fetchTopicsFromDiscourse(discourseConnection);
  const categoryPromises = categories.map(
    ({ id: discourseCategoryId, name, description }) =>
      createCategory(
        cwConnection,
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
