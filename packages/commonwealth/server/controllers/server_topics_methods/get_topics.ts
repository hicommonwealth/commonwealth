import { CommunityInstance, TopicAttributes } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { ServerTopicsController } from '../server_topics_controller';

export type GetTopicsOptions = {
  community: CommunityInstance;
  with_contest_managers: boolean;
};

const ContestManagerWithActions = schemas.ContestManager.extend({
  actions: z.array(schemas.ContestAction),
});

type TopicWithTotalThreads = TopicAttributes & {
  total_threads: number;
  active_contest_managers: Array<z.infer<typeof ContestManagerWithActions>>;
};
export type GetTopicsResult = TopicWithTotalThreads[];

export async function __getTopics(
  this: ServerTopicsController,
  { community, with_contest_managers }: GetTopicsOptions,
): Promise<GetTopicsResult> {
  const baseQuery = `
    WITH topic_data AS (
      SELECT
        t.*,
        (
          SELECT COUNT(*)::int
          FROM "Threads"
          WHERE community_id = :community_id AND topic_id = t.id AND deleted_at IS NULL
        ) as total_threads
      FROM "Topics" t
      WHERE t.community_id = :community_id AND t.deleted_at IS NULL
    )
  `;
  let sql = baseQuery;
  if (with_contest_managers) {
    sql += `
      SELECT
            td.*,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'contest_manager', cm,
                'actions', (
                  SELECT JSON_AGG(ca)
                  FROM "ContestActions" ca
                  WHERE
                    ca.contest_address = cm.contest_address
                    AND ca.created_at > co.start_time
                    AND ca.created_at < co.end_time
                )
              )
            ) as active_contest_managers
          FROM topic_data td
          LEFT JOIN "ContestTopics" ct ON ct.topic_id = td.id
          LEFT JOIN "ContestManagers" cm ON cm.contest_address = ct.contest_address
          JOIN (
              SELECT contest_address,
              MAX(contest_id) AS max_contest_id,
              MAX(start_time) as start_time,
              MAX(end_time) as end_time
              FROM "Contests"
              GROUP BY contest_address
          ) co ON cm.contest_address = co.contest_address
          WHERE ct.topic_id = td.id
          AND cm.community_id = :community_id
          AND cm.cancelled = false
          AND (
            cm.interval = 0 AND NOW() < co.end_time
            OR
            cm.interval > 0
          )
          GROUP BY
            td.id,
            td.name,
            td.created_at,
            td.updated_at,
            td.deleted_at,
            td.community_id,
            td.description,
            td.telegram,
            td.featured_in_sidebar,
            td.featured_in_new_post,
            td.default_offchain_template,
            td.order,
            td.channel_id,
            td.group_ids,
            td.default_offchain_template_backup,
            td.total_threads;
   `;
  } else {
    // only return topics
    sql += `SELECT * from topic_data`;
  }
  const topics = await this.models.sequelize.query<TopicWithTotalThreads>(sql, {
    replacements: { community_id: community.id },
    type: QueryTypes.SELECT,
  });
  return topics;
}
