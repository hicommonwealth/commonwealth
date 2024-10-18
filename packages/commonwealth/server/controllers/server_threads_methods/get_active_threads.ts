import { ThreadAttributes, TopicAttributes } from '@hicommonwealth/model';
import { Includeable, WhereOptions } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';

const MIN_THREADS_PER_TOPIC = 0;
const MAX_THREADS_PER_TOPIC = 10;

export type GetActiveThreadsOptions = {
  communityId: string;
  threadsPerTopic: number;
  withXRecentComments?: number;
};

export type GetActiveThreadsResult = ThreadAttributes[];

export async function __getActiveThreads(
  this: ServerThreadsController,
  {
    communityId,
    threadsPerTopic,
    withXRecentComments = 0,
  }: GetActiveThreadsOptions,
): Promise<GetActiveThreadsResult> {
  const allThreads = [];
  if (
    !threadsPerTopic ||
    Number.isNaN(threadsPerTopic) ||
    threadsPerTopic < MIN_THREADS_PER_TOPIC ||
    threadsPerTopic > MAX_THREADS_PER_TOPIC
  ) {
    threadsPerTopic = 3;
  }

  const communityWhere: WhereOptions<TopicAttributes> = {
    community_id: communityId,
  };
  const communityTopics = await this.models.Topic.findAll({
    where: communityWhere,
  });

  const threadInclude: Includeable[] = [
    {
      model: this.models.Address,
      as: 'Address',
      attributes: ['id', 'address', 'community_id'],
      include: [
        {
          model: this.models.User,
          attributes: ['id', 'profile'],
        },
      ],
    },
    { model: this.models.Address, as: 'collaborators' },
    { model: this.models.Topic, as: 'topic', required: true },
  ];

  if (withXRecentComments) {
    threadInclude.push({
      model: this.models.Comment,
      limit: withXRecentComments > 10 ? 10 : withXRecentComments, // cap to 10,
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'address_id',
        'text',
        'created_at',
        'updated_at',
        'deleted_at',
        'marked_as_spam_at',
        'discord_meta',
        'content_url',
      ],
      include: [
        {
          model: this.models.Address,
          as: 'Address',
          attributes: ['address'],
          include: [
            {
              model: this.models.User,
              attributes: ['id', 'profile'],
            },
          ],
        },
      ],
    });
  }

  let allRecentTopicThreadsRaw = [];
  // @ts-expect-error StrictNullChecks
  allRecentTopicThreadsRaw = await Promise.all(
    communityTopics.map(async (topic) => {
      return await this.models.Thread.findAll({
        where: {
          topic_id: topic.id,
        },
        include: threadInclude,
        limit: threadsPerTopic,
        order: [
          ['created_at', 'DESC'],
          ['last_commented_on', 'DESC'],
        ],
      });
    }),
  );

  allRecentTopicThreadsRaw = allRecentTopicThreadsRaw.flat();

  const allRecentTopicThreads = allRecentTopicThreadsRaw.map((thread) => {
    // @ts-expect-error StrictNullChecks
    const tempThread = thread.toJSON();
    tempThread.numberOfComments = tempThread.comment_count || 0;
    if (tempThread.Address.User) {
      tempThread.user_id = tempThread.Address.User.id;
      tempThread.profile_name = tempThread.Address.User.profile.name;
      tempThread.avatar_url = tempThread.Address.User.profile.avatar_url;
      delete tempThread.Address.User;
    }

    if (withXRecentComments) {
      tempThread.recentComments = (tempThread.Comments || []).map((c) => {
        const temp = {
          ...c,
          address: c?.Address?.address || '',
        };
        if (temp.Address) {
          temp.user_id = temp.Address.User?.id;
          temp.profile_name = temp.Address.User?.profile.name;
          temp.profile_avatar = temp.Address.User?.profile.avatar_url;
          delete temp.Address;
        }
        return temp;
      });
      delete tempThread.Comments;
    }
    return tempThread;
  });

  communityTopics.forEach((topic) => {
    const threadsWithCommentsCount = allRecentTopicThreads.filter(
      (thread) => thread.topic_id === topic.id,
    );
    // @ts-expect-error StrictNullChecks
    allThreads.push(...(threadsWithCommentsCount || []));
  });

  return allThreads;
}
