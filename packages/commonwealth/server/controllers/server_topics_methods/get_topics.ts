import { QueryTypes } from 'sequelize';
import { CommunityInstance } from '../../models/community';
import { TopicAttributes } from '../../models/topic';
import { ServerTopicsController } from '../server_topics_controller';

export type GetTopicsOptions = {
  chain: CommunityInstance;
};

type TopicWithTotalThreads = TopicAttributes & { total_threads: number };
export type GetTopicsResult = TopicWithTotalThreads[];

export async function __getTopics(
  this: ServerTopicsController,
  { chain }: GetTopicsOptions,
): Promise<GetTopicsResult> {
  const topics = await this.models.sequelize.query<TopicWithTotalThreads>(
    `SELECT
        *,
        (
          SELECT COUNT(*)::int FROM "Threads"
          WHERE chain = :chain_id AND topic_id = t.id AND deleted_at IS NULL
        ) as total_threads
      FROM "Topics" t WHERE chain_id = :chain_id AND deleted_at IS NULL`,
    {
      replacements: { chain_id: chain.id },
      type: QueryTypes.SELECT,
    },
  );
  return topics;
}
