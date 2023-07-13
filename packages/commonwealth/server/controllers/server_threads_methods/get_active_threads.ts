import getThreadsWithCommentCount from '../../util/getThreadCommentsCount';
import { ServerThreadsController } from '../server_threads_controller';
import { ChainInstance } from '../../models/chain';
import { ThreadAttributes } from '../../models/thread';

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

  const communityWhere = { chain_id: chain.id };
  const communityTopics = await this.models.Topic.findAll({
    where: communityWhere,
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

  const allRecentTopicThreads = allRecentTopicThreadsRaw.map((t) => {
    return t.toJSON();
  });

  const allThreadsWithCommentsCount = await getThreadsWithCommentCount({
    threads: allRecentTopicThreads,
    models: this.models,
    chainId: chain.id,
  });

  communityTopics.forEach((topic) => {
    const threadsWithCommentsCount = allThreadsWithCommentsCount.filter(
      (thread) => thread.topic_id === topic.id
    );
    allThreads.push(...(threadsWithCommentsCount || []));
  });

  return allThreads;
}
