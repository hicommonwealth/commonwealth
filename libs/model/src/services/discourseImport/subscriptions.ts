import { QueryTypes, Sequelize, Transaction } from 'sequelize';

const fetchSubscriptionsFromDiscourse = (session: Sequelize) => {
  return session.query<{
    user_id: any;
    topic_id: any;
    notification_level: any;
    email: string;
  }>(
    `
        SELECT topic_users.user_id, topic_id, notification_level, email
        FROM public.topic_users
        inner join topics on topics.id = topic_users.topic_id
        inner join user_emails on user_emails.user_id=topic_users.user_id
        where notification_level > 0
        and deleted_at is null
        and category_id is not null
        and topic_users.user_id > 0
        and email != 'no_email'
        and email != 'discobot_email'
        `,
    { type: QueryTypes.SELECT },
  );
};

const createSubscription = async (
  session: Sequelize,
  {
    userId,
    threadId,
    communityId,
  }: { userId: number; threadId: number; communityId: string },
  { transaction }: { transaction: Transaction },
) => {
  const [subscription] = await session.query<{
    id: number;
  }>(
    `
        INSERT INTO "Subscriptions"(
        id, subscriber_id, category_id, is_active, created_at, updated_at, immediate_email, community_id,
        thread_id, comment_id, snapshot_id)
        VALUES (
        default,
        ${userId},
        'new-mention',
        true,
        NOW(),
        NOW(),
        false,
        '${communityId}',
        ${threadId}, 
        null, 
        null) Returning id;
        `,
    { type: QueryTypes.SELECT, transaction },
  );
  return subscription;
};

export const createAllSubscriptionsInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  {
    communityId,
    threads,
    users,
  }: { communityId: string; threads: any[]; users: any[] },
  { transaction }: { transaction: Transaction },
) => {
  const subscriptions = await fetchSubscriptionsFromDiscourse(
    discourseConnection,
  );
  const subscriptionPromises = subscriptions.map(({ user_id, topic_id }) => {
    const { id: threadId } =
      threads.find(({ discourseThreadId }) => discourseThreadId === topic_id) ||
      {};
    const { id: userId } = users.find(
      ({ discourseUserId }) => discourseUserId === user_id,
    );
    if (threadId && userId) {
      return createSubscription(
        cwConnection,
        { threadId, userId, communityId: communityId },
        { transaction },
      );
    }
    return null;
  });
  const createdSubscriptions = await Promise.all(subscriptionPromises);
  return createdSubscriptions
    .filter(Boolean)
    .map((subscription) => subscription!.id);
};
