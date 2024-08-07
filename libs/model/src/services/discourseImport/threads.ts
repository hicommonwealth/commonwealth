import {
  CWTopicWithDiscourseId,
  CWUserWithDiscourseId,
  models,
  ThreadAttributes,
} from '@hicommonwealth/model';
import { Thread } from '@hicommonwealth/schemas';
import moment from 'moment';
import {
  FindOrCreateOptions,
  QueryTypes,
  Sequelize,
  Transaction,
} from 'sequelize';
import { z } from 'zod';

export type CWThreadWithDiscourseId = z.infer<typeof Thread> & {
  discourseTopicId: number;
  created: boolean;
};

// Discourse Topic == CW Thread
type DiscourseTopic = {
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
};

class DiscourseQueries {
  static fetchTopics = async (session: Sequelize) => {
    return session.query<DiscourseTopic>(
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

  static fetchGeneralCategoryId = async (
    session: Sequelize,
  ): Promise<number> => {
    const [result] = await session.query<{
      id: number;
    }>(
      `
    SELECT id FROM categories WHERE name = 'General';
  `,
      { type: QueryTypes.SELECT },
    );
    return result?.id || 0;
  };
}

class CWQueries {
  static createOrFindThread = async (
    discourseTopic: DiscourseTopic,
    communityId: string,
    cwTopicId: number,
    addressId: number,
    { transaction }: { transaction: Transaction | null },
  ): Promise<CWThreadWithDiscourseId> => {
    const options: z.infer<typeof Thread> = {
      address_id: addressId,
      title: encodeURIComponent(discourseTopic.title.replace(/'/g, "''")),
      body: encodeURIComponent(discourseTopic.cooked.replace(/'/g, "''")),
      created_at: moment(discourseTopic.created_at).toDate(),
      updated_at: moment(discourseTopic.updated_at).toDate(),
      community_id: communityId,
      pinned: discourseTopic.pinned_globally,
      kind: 'discussion',
      topic_id: cwTopicId,
      plaintext: discourseTopic.raw.replace(/'/g, "''"),
      stage: 'discussion',
      view_count: discourseTopic.views,
      reaction_count: discourseTopic.like_count,
      reaction_weights_sum: 0,
      comment_count: 0,
      max_notif_id: 0,
    };
    const [thread, created] = await models.Thread.findOrCreate({
      where: {
        address_id: options.address_id,
        community_id: options.community_id,
        created_at: options.created_at,
        updated_at: options.updated_at,
      },
      defaults: options,
      transaction,
      skipOutbox: true,
    } as FindOrCreateOptions<ThreadAttributes> & {
      skipOutbox: boolean;
    });
    return {
      ...thread.get({ plain: true }),
      discourseTopicId: discourseTopic.id,
      created,
    };
  };
}

export const createAllThreadsInCW = async (
  discourseConnection: Sequelize,
  {
    users,
    topics,
    communityId,
  }: {
    users: Array<CWUserWithDiscourseId>;
    topics: Array<CWTopicWithDiscourseId>;
    communityId: string;
  },
  { transaction }: { transaction: Transaction | null },
): Promise<Array<CWThreadWithDiscourseId>> => {
  const discourseThreads = await DiscourseQueries.fetchTopics(
    discourseConnection,
  );
  const generalCwTopic = await models.Topic.findOne({
    where: {
      name: 'General',
      community_id: communityId,
    },
    transaction,
  });

  const generalDiscourseCategoryId =
    await DiscourseQueries.fetchGeneralCategoryId(discourseConnection);

  const threadPromises = discourseThreads
    .map((discourseThread) => {
      const user = users.find(
        ({ discourseUserId }) => discourseUserId === discourseThread.user_id,
      );
      return {
        ...discourseThread,
        user,
      };
    })
    .filter((discourseThread) => {
      // filter out threads where the cw user doesn't exist
      return !!discourseThread.user;
    })
    .map(async (discourseThread): Promise<CWThreadWithDiscourseId> => {
      const { category_id: discourseThreadCategoryId } = discourseThread;

      // get thread's associated cw topic
      let cwTopicId = generalCwTopic!.id!; // general by default
      if (discourseThreadCategoryId) {
        // find cw topic that matches the discourse thread's topic
        const cwTopic = topics.find(
          ({ discourseCategoryId: discourseCategoryId }) =>
            discourseCategoryId === discourseThreadCategoryId,
        );
        if (
          cwTopic &&
          (!generalDiscourseCategoryId ||
            cwTopic.discourseCategoryId !== generalDiscourseCategoryId)
        ) {
          cwTopicId = cwTopic.id!;
        }
      }

      // find address for user
      const address = await models.Address.findOne({
        where: {
          community_id: communityId,
          user_id: discourseThread.user!.id,
        },
        transaction,
      });
      if (!address) {
        throw new Error(
          `could not find address for user ${discourseThread.user!.id}`,
        );
      }

      // create thread
      return CWQueries.createOrFindThread(
        discourseThread,
        communityId,
        cwTopicId,
        address.id!,
        {
          transaction,
        },
      );
    });

  return Promise.all(threadPromises);
};
