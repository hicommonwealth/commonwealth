import { groupBy, sortBy } from 'lodash';
import moment from 'moment';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

export const fetchPosts = async (session: Sequelize) => {
  return session.query<{
    id: any;
    post_number: number;
    user_id: any;
    reply_to_post_number: number;
    cooked: any;
    reply_count: number;
    topic_id: any;
    like_count: number;
    created_at: string;
    updated_at: string;
  }>(
    `
        select posts.id, post_number, posts.user_id, reply_to_post_number, cooked, posts.reply_count,
        posts.topic_id, posts.like_count, posts.created_at, posts.updated_at
        from posts
        inner join topics on topics.id = posts.topic_id
        where posts.deleted_at is null
        and topics.deleted_at is null
        and category_id is not null
        and posts.user_id > 0
        and topics.user_id > 0
        order by posts.created_at
    `,
    { raw: true, type: QueryTypes.SELECT },
  );
};

const createComment = async (
  session: Sequelize,
  {
    discourseThreadId,
    post_number,
    cwThreadId,
    communityId,
    parentId,
    addressId,
    text,
    like_count,
    created_at,
    updated_at,
  }: {
    discourseThreadId: any;
    post_number: number;
    cwThreadId: number;
    communityId: string;
    parentId: number;
    addressId: string;
    text: string;
    like_count: number;
    created_at: string;
    updated_at: string;
  },
  { transaction }: { transaction: Transaction },
) => {
  const [createdComment] = await session.query<{
    id: number;
    communityId: string;
    parent_id: number;
    address_id: string;
    text: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    version_history: any[];
    root_id: any;
    plaintext: string;
    _search: string;
  }>(
    `
        INSERT INTO "Comments"(
        id, community_id, parent_id, address_id, text, created_at, updated_at, deleted_at,
        version_history, plaintext, _search, thread_id)
        VALUES (
        default,
        '${communityId}',
        ${parentId || null},
        ${addressId},
        '${encodeURIComponent(text.replace(/'/g, "''"))}',
       '${moment(created_at).format('YYYY-MM-DD HH:mm:ss')}',
       '${moment(updated_at).format('YYYY-MM-DD HH:mm:ss')}',
        null,
        '{}',
        '${text.replace(/'/g, "''")}',
        null, '${cwThreadId}') RETURNING id;
    `,
    { type: QueryTypes.SELECT, transaction },
  );
  return {
    createdComment,
    discourseThreadId,
    post_number,
    cwThreadId,
    like_count,
  };
};

export const createAllCommentsInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  {
    addresses,
    communityId,
    threads,
  }: { addresses: any[]; communityId: string; threads: any[] },
  { transaction }: { transaction: Transaction },
) => {
  const parentComments: Record<any, any> = {};
  const discoursePosts = await fetchPosts(discourseConnection);
  const postsByThread = groupBy(discoursePosts, ({ topic_id }) => topic_id);
  const threadIds = Object.keys(postsByThread);
  const createdComments: any[] = [];
  for (let i = 0; i < threadIds.length; i++) {
    const discourseThreadId = parseInt(threadIds[i]);
    const posts = sortBy(
      postsByThread[discourseThreadId],
      ({ post_number }) => post_number,
    );
    const { id: cwThreadId } =
      threads.find(
        (thread) => parseInt(thread.discourseThreadId) === discourseThreadId,
      ) || {};
    for (let j = 0; j < posts.length; j++) {
      const {
        id: discourseCommentId,
        post_number,
        user_id,
        cooked,
        reply_to_post_number,
        like_count,
        created_at,
        updated_at,
      } = posts[j];
      if (post_number > 1) {
        const { id: addressId } =
          addresses.find(
            ({ discourseUserId }) => discourseUserId === user_id,
          ) || {};
        const { id: parentCommentId } =
          createdComments.find(
            (createdComment) =>
              discourseThreadId === createdComment.discourseThreadId &&
              reply_to_post_number === createdComment.post_number,
          ) || {};
        const parentId =
          parentCommentId &&
          reply_to_post_number > 1 &&
          post_number - 1 > reply_to_post_number
            ? parentCommentId
            : null;
        if (addressId) {
          if (!cwThreadId) {
            throw new Error(
              `Error: Thread ID not found for discourse post ${discourseCommentId}`,
            );
          }
          const { createdComment } = await createComment(
            cwConnection,
            {
              discourseThreadId,
              post_number,
              communityId,
              cwThreadId,
              addressId,
              text: cooked,
              parentId,
              like_count,
              created_at,
              updated_at,
            },
            { transaction },
          );
          createdComments.push({
            id: createdComment.id,
            discourseCommentId,
            discourseThreadId,
            post_number,
            cwThreadId,
            like_count,
          });
          // record child comments
          if (parentId) {
            if (parentComments[parentId]) {
              parentComments[
                parentId
              ] = `${parentComments[parentId]},${createdComment.id}`;
            } else {
              parentComments[parentId] = createdComment.id;
            }
          }
        } else {
          throw new Error(`Error: Address not found for user ${user_id}`);
        }
      }
    }
  }
  return createdComments;
};
