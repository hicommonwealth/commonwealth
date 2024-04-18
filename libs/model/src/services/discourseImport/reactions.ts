import { QueryTypes, Sequelize, Transaction } from 'sequelize';

const fetchThreadsReactionsFromDiscourse = async (session: Sequelize) => {
  return session.query<{
    user_id: any;
    topic_id: any;
    liked: any;
    email: string;
  }>(
    `
    SELECT topic_users.user_id, topic_id, liked, email
    FROM public.topic_users
    inner join topics on topics.id = topic_users.topic_id
    inner join user_emails on user_emails.user_id=topic_users.user_id
    where liked = true
    and topics.deleted_at is null
    and topics.category_id is not null
    and topic_users.user_id > 0
    and email != 'no_email'
    and email != 'discobot_email';
    `,
    { type: QueryTypes.SELECT },
  );
};

const fetchCommentsReactionsFromDiscourse = async (session: Sequelize) => {
  return session.query<{
    id: any;
    post_id: any;
    user_id: any;
    post_action_type_id: any;
    deleted_at: any;
    name_key: any;
  }>(
    `
        SELECT post_actions.id, post_id, user_id, post_action_type_id, deleted_at, name_key
        FROM public.post_actions inner join post_action_types
        on post_actions.post_action_type_id = post_action_types.id
        where name_key = 'like'
        and deleted_at is null
        and user_id > 0
        order by user_id
        `,
    { type: QueryTypes.SELECT },
  );
};

const createReaction = async (
  session: Sequelize,
  {
    communityId,
    addressId,
    threadId,
    commentId,
  }: {
    communityId: string;
    addressId: number;
    threadId: number;
    commentId: number;
  },
  { transaction }: { transaction: Transaction },
) => {
  const [reaction] = await session.query<{
    id: number;
  }>(
    `
    INSERT INTO "Reactions"(
    id, community_id, address_id, reaction, created_at, updated_at, thread_id, comment_id, proposal_id)
    VALUES (
    default,
    '${communityId}',
    ${addressId},
    'like',
    NOW(),
    NOW(),
    ${threadId || null},
    ${commentId || null},
    null) Returning id;`,
    { type: QueryTypes.SELECT, transaction },
  );
  return reaction;
};

export const createAllReactionsInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  {
    addresses,
    communityId,
    threads,
    comments,
  }: { addresses: any[]; communityId: string; threads: any[]; comments: any[] },
  { transaction }: { transaction: Transaction },
) => {
  const [threadReactions, commentReactions] = await Promise.all([
    fetchThreadsReactionsFromDiscourse(discourseConnection),
    fetchCommentsReactionsFromDiscourse(discourseConnection),
  ]);
  const reactions = [...threadReactions, ...commentReactions];
  const reactionPromises = reactions.map(
    ({ user_id, topic_id, post_id }: any) => {
      const { id: addressId } =
        addresses.find(({ discourseUserId }) => discourseUserId === user_id) ||
        {};
      const { id: threadId } =
        threads.find(
          ({ discourseThreadId }) => discourseThreadId === topic_id,
        ) || {};
      const { id: commentId } =
        comments.find(
          ({ discourseCommentId }) => discourseCommentId === post_id,
        ) || {};
      if (threadId || commentId) {
        return createReaction(
          cwConnection,
          { communityId: communityId, addressId, threadId, commentId },
          { transaction },
        );
      }
      return null;
    },
  );
  const createdReactions = await Promise.all(reactionPromises);
  return createdReactions.filter(Boolean).map((reaction) => reaction!.id);
};
