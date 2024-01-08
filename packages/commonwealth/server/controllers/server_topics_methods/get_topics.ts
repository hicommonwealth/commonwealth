import { QueryTypes } from 'sequelize';
import { CommunityInstance } from '../../models/community';
import { TopicAttributes } from '../../models/topic';
import { ServerTopicsController } from '../server_topics_controller';

export type GetTopicsOptions = {
  community: CommunityInstance;
};

type TopicWithTotalThreads = TopicAttributes & { total_threads: number };
export type GetTopicsResult = TopicWithTotalThreads[];

export async function __getTopics(
  this: ServerTopicsController,
  { community }: GetTopicsOptions,
): Promise<GetTopicsResult> {
  const topics = await this.models.sequelize.query<TopicWithTotalThreads>(
    `SELECT
        *,
        (
          SELECT COUNT(*)::int FROM "Threads"
          WHERE community_id = :community_id AND topic_id = t.id AND deleted_at IS NULL
        ) as total_threads
        FROM "Topics" t WHERE community_id = :community_id AND deleted_at IS NULL`,
    {
      replacements: { community_id: community.id },
      type: QueryTypes.SELECT,
    },
  );
  return topics;
}
