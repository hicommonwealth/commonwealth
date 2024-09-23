import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../database';
import { TopicAttributes } from '../models/index';

const ActiveContestManagers = schemas.ContestManager.extend({
  content: z.array(schemas.ContestAction),
  contest_manager: schemas.ContestManager,
});

type TopicWithTotalThreads = TopicAttributes & {
  total_threads: number;
  active_contest_managers: Array<z.infer<typeof ActiveContestManagers>>;
};

export function GetTopics(): Query<typeof schemas.GetTopics> {
  return {
    ...schemas.GetTopics,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        community_id,
        topic_id,
        include_threads,
        include_contest_managers,
      } = payload;

      const includeThreads = include_threads
        ? ` JOIN "Threads" th
        ON t.id = th.topic_id `
        : '';

      const baseQuery = `
    WITH topic_data AS (
      SELECT t.*, (
        SELECT COUNT(*)::int
        FROM "Threads"
        WHERE community_id = :community_id AND topic_id = t.id AND deleted_at IS NULL
      ) as total_threads
      FROM "Topics" t
      ${includeThreads}
      WHERE t.community_id = :community_id AND (:topic_id IS NULL OR t.id = :topic_id) AND t.deleted_at IS NULL
    )
  `;

      let sql = baseQuery;

      if (include_contest_managers) {
        sql += `
      SELECT td.*,
        COALESCE(
          (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'contest_manager', cm,
                'content', (
                  SELECT JSON_AGG(ca)
                  FROM "ContestActions" ca
                  WHERE ca.contest_address = cm.contest_address
                  AND ca.action = 'added'
                  AND ca.created_at > co.start_time
                  AND ca.created_at < co.end_time
                )
              )
            )
            FROM "ContestTopics" ct
            LEFT JOIN "ContestManagers" cm ON cm.contest_address = ct.contest_address
            JOIN (
              SELECT contest_address, MAX(contest_id) AS max_contest_id,
                MAX(start_time) as start_time, MAX(end_time) as end_time
              FROM "Contests"
              GROUP BY contest_address
            ) co ON cm.contest_address = co.contest_address
            WHERE ct.topic_id = td.id
              AND cm.community_id = :community_id
              AND cm.cancelled = false
              AND (
                cm.interval = 0 AND NOW() < co.end_time
                OR cm.interval > 0
              )
          ),
          '[]'::json
        ) as active_contest_managers
      FROM topic_data td
    `;
      } else {
        sql += `SELECT *, '[]'::json as active_contest_managers FROM topic_data`;
      }

      const topics = await models.sequelize.query<TopicWithTotalThreads>(sql, {
        replacements: { community_id, topic_id: topic_id ?? null },
        type: QueryTypes.SELECT,
      });

      return topics;
    },
  };
}
