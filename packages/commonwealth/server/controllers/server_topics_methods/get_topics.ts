import { QueryTypes } from 'sequelize';
import { TopicAttributes } from '../../models/topic';
import { ChainInstance } from '../../models/chain';
import { ServerTopicsController } from '../server_topics_controller';

export type GetTopicsOptions = {
  community: ChainInstance;
};

type TopicWithTotalThreads = TopicAttributes & { total_threads: number };
export type GetTopicsResult = TopicWithTotalThreads[];

export async function __getTopics(
  this: ServerTopicsController,
  { community }: GetTopicsOptions
): Promise<GetTopicsResult> {
  const topics = await this.models.sequelize.query<TopicWithTotalThreads>(
    `SELECT
        *,
        (
          SELECT COUNT(*)::int FROM "Threads"
          WHERE chain = :community_id AND topic_id = t.id AND deleted_at IS NULL
        ) as total_threads
      FROM "Topics" t WHERE chain_id = :community_id AND deleted_at IS NULL`,
    {
      replacements: { community_id: community.id },
      type: QueryTypes.SELECT,
    }
  );
  return topics;
}
