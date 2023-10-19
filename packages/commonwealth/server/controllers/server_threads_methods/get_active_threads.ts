import { ChainInstance } from '../../models/chain';
import { ThreadAttributes } from '../../models/thread';
import { ServerThreadsController } from '../server_threads_controller';

const MIN_THREADS_PER_TOPIC = 0;
const MAX_THREADS_PER_TOPIC = 10;

export type GetActiveThreadsOptions = {
  chain: ChainInstance;
  threadsPerTopic: number;
};

export type GetActiveThreadsResult = ThreadAttributes[];

export async function __getActiveThreads(
  this: ServerThreadsController,
  { chain, threadsPerTopic }: GetActiveThreadsOptions
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

  const communityTopics = await this.models.Topic.findAll({
    where: {
      community_id: chain.id,
    },
  });

  const threadInclude = [
    { model: this.models.Address, as: 'Address' },
    { model: this.models.Address, as: 'collaborators' },
    { model: this.models.Topic, as: 'topic', required: true },
  ];

  let allRecentTopicThreadsRaw = [];
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
    })
  );

  allRecentTopicThreadsRaw = allRecentTopicThreadsRaw.flat();

  const allRecentTopicThreads = allRecentTopicThreadsRaw.map((thread) => {
    const t = thread.toJSON();
    t.numberOfComments = t.comment_count || 0;
    return t;
  });

  communityTopics.forEach((topic) => {
    const threadsWithCommentsCount = allRecentTopicThreads.filter(
      (thread) => thread.topic_id === topic.id
    );
    allThreads.push(...(threadsWithCommentsCount || []));
  });

  return allThreads;
}
