import {
  CWThreadWithDiscourseId,
  CWUserWithDiscourseId,
  models,
  SubscriptionAttributes,
} from '@hicommonwealth/model';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

type CWSubscriptionWithDiscourseId = SubscriptionAttributes & {
  created: boolean;
};

class DiscourseQueries {
  static fetchSubscriptions = (session: Sequelize) => {
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
}

class CWQueries {
  static createSubscription = async (
    {
      userId,
      threadId,
      communityId,
    }: { userId: number; threadId: number; communityId: string },
    { transaction }: { transaction: Transaction | null },
  ): Promise<CWSubscriptionWithDiscourseId> => {
    const options: SubscriptionAttributes = {
      subscriber_id: userId,
      category_id: 'new-mention',
      is_active: true,
      immediate_email: false,
      community_id: communityId,
      thread_id: threadId,
    };
    const [subscription, created] = await models.Subscription.findOrCreate({
      where: options,
      defaults: options,
      transaction,
    });
    return {
      ...subscription.get({ plain: true }),
      created,
    };
  };
}

export const createAllSubscriptionsInCW = async (
  discourseConnection: Sequelize,
  {
    communityId,
    threads,
    users,
  }: {
    communityId: string;
    threads: Array<CWThreadWithDiscourseId>;
    users: Array<CWUserWithDiscourseId>;
  },
  { transaction }: { transaction: Transaction | null },
) => {
  const subscriptions = await DiscourseQueries.fetchSubscriptions(
    discourseConnection,
  );
  const subscriptionPromises = subscriptions.map(({ user_id, topic_id }) => {
    const { id: threadId } =
      threads.find(({ discourseTopicId }) => discourseTopicId === topic_id) ||
      {};
    const { id: userId } =
      users.find(({ discourseUserId }) => discourseUserId === user_id) || {};
    if (threadId && userId) {
      return CWQueries.createSubscription(
        { threadId, userId, communityId: communityId },
        { transaction },
      );
    }
    return null;
  });
  const createdSubscriptions = await Promise.all(subscriptionPromises);
  return createdSubscriptions.filter(
    Boolean,
  ) as Array<CWSubscriptionWithDiscourseId>;
};
