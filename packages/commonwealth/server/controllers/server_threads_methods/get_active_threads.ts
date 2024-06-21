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
          model: this.models.Profile,
          attributes: [
            ['id', 'profile_id'],
            'profile_name',
            ['avatar_url', 'profile_avatar_url'],
            'user_id',
          ],
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
        ['plaintext', 'plainText'],
        'created_at',
        'updated_at',
        'deleted_at',
        'marked_as_spam_at',
        'discord_meta',
      ],
      include: [
        {
          model: this.models.Address,
          attributes: ['address'],
          include: [
            {
              model: this.models.Profile,
              attributes: [
                ['id', 'profile_id'],
                'profile_name',
                ['avatar_url', 'profile_avatar_url'],
                'user_id',
              ],
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
    let tempThread = thread.toJSON();
    tempThread = {
      ...tempThread,
      numberOfComments: tempThread.comment_count || 0,
      ...(tempThread?.Address?.Profile || {}),
    };
    if (tempThread?.Address?.Profile) delete tempThread.Address.Profile;

    if (withXRecentComments) {
      tempThread.recentComments = (tempThread.Comments || []).map((c) => {
        const temp = {
          ...c,
          ...(c?.Address?.Profile || {}),
          address: c?.Address?.address || '',
        };

        if (temp.Address) delete temp.Address;

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
