import moment from 'moment';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

export const fetchThreadsFromDiscourse = async (session: Sequelize) => {
  return session.query<{
    id: number;
    title: string;
    cooked: string;
    raw: any;
    pinned_globally: any;
    category_id: any;
    user_id: any;
    views: number;
    like_count: number;
    created_at: string;
    updated_at: string;
  }>(
    `
        select *,
        (select cooked from posts where topic_id=topics.id and post_number=1),
        (select raw from posts where topic_id=topics.id and post_number=1)
        FROM topics
        where deleted_at is null
        and user_id > 0
    `,
    { raw: true, type: QueryTypes.SELECT },
  );
};

const createThread = async (
  session: Sequelize,
  {
    title,
    communityId,
    text,
    plaintext,
    pinned,
    cwTopicId,
    email,
    discourseThreadId,
    views,
    like_count,
    created_at,
    updated_at,
  }: {
    title: string;
    communityId: string;
    text: string;
    plaintext: string;
    pinned: boolean;
    cwTopicId: number;
    email: string;
    discourseThreadId: any;
    views: number;
    like_count: number;
    created_at: string;
    updated_at: string;
  },
  { transaction }: { transaction: Transaction },
) => {
  const [createdThread] = await session.query<{
    id: number;
    address_id: number;
    topic_id: number;
  }>(
    `
        INSERT INTO "Threads"(
        id, address_id, title, body, created_at, updated_at, deleted_at, community_id, pinned, kind, url,
        version_history, read_only, topic_id, plaintext, _search, stage, has_poll, last_commented_on, view_count)
        VALUES (default,
        (
        SELECT addresses.id
        FROM "Addresses" addresses
        INNER JOIN "Users" users ON users.id = addresses.user_id
        WHERE email = '${email}' LIMIT 1
        ),
        '${encodeURIComponent(title.replace(/'/g, "''"))}',
        '${encodeURIComponent(text.replace(/'/g, "''"))}',
        '${moment(created_at).format('YYYY-MM-DD HH:mm:ss')}',
        '${moment(updated_at).format('YYYY-MM-DD HH:mm:ss')}',
        null,
        '${communityId}',
        ${pinned},
        'discussion',
        null,
        '{}',
        false,
        ${cwTopicId},
       '${plaintext.replace(/'/g, "''")}',
        null,
        'discussion',
        false,
        null,
        ${views}
        ) RETURNING id, address_id, topic_id;
    `,
    { type: QueryTypes.SELECT, transaction },
  );
  return { createdThread, discourseThreadId, views, like_count };
};

export const createAllThreadsInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  {
    users,
    categories,
    communityId,
  }: { users: any[]; categories: any[]; communityId: string },
  { transaction }: { transaction: Transaction },
) => {
  const topics = await fetchThreadsFromDiscourse(discourseConnection);
  const generalCwTopicId = (
    await cwConnection.query<{ id: number }>(
      `
    SELECT id FROM "Topics" WHERE name = 'General' and community_id = '${communityId}';
  `,
      {
        type: QueryTypes.SELECT,
      },
    )
  )[0].id;
  const generalDiscourseCategoryId = await discourseConnection.query<{
    id: number;
  }>(
    `
    SELECT id FROM categories WHERE name = 'General';
  `,
    { type: QueryTypes.SELECT },
  );
  const threadPromises = topics
    .map((topic) => {
      const {
        id: discourseThreadId,
        title,
        cooked: text,
        raw,
        pinned_globally,
        category_id,
        user_id,
        views,
        like_count,
        created_at,
        updated_at,
      } = topic;

      let cwTopicId = generalCwTopicId;
      if (category_id) {
        const category = categories.find(
          ({ discourseCategoryId }) => discourseCategoryId === category_id,
        );
        if (
          generalDiscourseCategoryId.length === 0 ||
          (generalDiscourseCategoryId.length > 0 &&
            category?.discourseCategoryId !== generalDiscourseCategoryId[0].id)
        ) {
          cwTopicId = category.id;
        }
      }

      const userId = users.find(
        ({ discourseUserId }) => discourseUserId === user_id,
      );

      const email = userId?.email;
      if (!email) {
        return null;
      }
      return {
        communityId,
        discourseThreadId,
        text,
        plaintext: raw,
        title,
        pinned: pinned_globally,
        cwTopicId,
        email,
        views,
        like_count,
        created_at,
        updated_at,
      };
    })
    .map((options) => {
      if (!options) {
        return null;
      }
      return createThread(cwConnection, options, { transaction });
    });

  const createdThreads = await Promise.all(threadPromises);
  return createdThreads
    .map((options) => {
      if (!options) {
        return null;
      }
      const { createdThread, discourseThreadId, views, like_count } = options;
      return {
        id: createdThread.id,
        address_id: createdThread.address_id,
        topic_id: createdThread.topic_id,
        discourseThreadId,
        views,
        like_count,
      };
    })
    .filter(Boolean);
};
