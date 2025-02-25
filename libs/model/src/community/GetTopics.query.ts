import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { buildChainNodeUrl } from '../utils';

const includeContestManagersQuery = `
    SELECT td.*,
           coalesce((SELECT jsonb_agg(jsonb_set(to_jsonb(cm), -- Convert the contest manager (cm) row to JSONB
                                                '{content}', -- Set the 'content' key in the resulting JSONB
                                                coalesce(
                                                    -- Aggregates the filtered actions into content
                                                        (SELECT jsonb_agg(ca)
                                                         FROM "ContestActions" ca
                                                         WHERE ca.contest_address = cm.contest_address
                                                           AND ca.action = 'added'
                                                           AND ca.created_at > co.start_time
                                                           AND ca.created_at < co.end_time),
                                                    -- Use an empty array as fallback if no actions are found
                                                        '[]'::jsonb)
                                      ))
                     FROM "Topics" t
                              LEFT JOIN "ContestManagers" cm ON cm.topic_id = t.id
                              JOIN (
                         -- Subquery to get the max contest_id, start_time, and end_time for each contest address
                         SELECT contest_address,
                                max(contest_id) AS max_contest_id,
                                max(start_time) AS start_time,
                                max(end_time)   AS end_time
                         FROM "Contests"
                         GROUP BY contest_address) co ON cm.contest_address = co.contest_address
                     WHERE t.id = td.id
                       AND cm.community_id = :community_id
                       AND COALESCE(cm.cancelled, FALSE) = FALSE -- Exclude cancelled managers
                       AND (cm.interval = 0
                                AND now() < co.end_time -- Check if the interval is 0 and the contest is ongoing
                         OR cm.interval > 0 -- Or if there is a valid interval
                         )), '[]'::jsonb) AS active_contest_managers
    FROM topic_data td
`;

export function GetTopics(): Query<typeof schemas.GetTopics> {
  return {
    ...schemas.GetTopics,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, with_contest_managers, with_archived_topics } =
        payload;

      const contest_managers = with_contest_managers
        ? includeContestManagersQuery
        : `SELECT *, '[]'::json as active_contest_managers FROM topic_data`;

      const archivedTopicsQuery = with_archived_topics
        ? ''
        : 'AND archived_at IS NULL';

      const sql = `
          WITH topic_data AS (SELECT t.id,
                                     t.name,
                                     t.community_id,
                                     t.description,
                                     t.telegram,
                                     t.featured_in_sidebar,
                                     t.featured_in_new_post,
                                     t.default_offchain_template,
                                     t."order",
                                     t.channel_id,
                                     t.group_ids,
                                     t.weighted_voting,
                                     t.token_symbol,
                                     t.vote_weight_multiplier,
                                     t.token_address,
                                     cn.url as chain_node_url,
                                     cn.eth_chain_id as eth_chain_id,
                                     t.created_at::text           AS created_at,
                                     t.updated_at::text           AS updated_at,
                                     t.deleted_at::text           AS deleted_at,
                                     t.archived_at::text          AS archived_at,
                                     (SELECT count(*)::int
                                      FROM "Threads"
                                      WHERE community_id = :community_id
                                        AND topic_id = t.id
                                        AND deleted_at IS NULL) AS total_threads
                              FROM "Topics" t
                                LEFT JOIN "ChainNodes" cn
                                ON t.chain_node_id = cn.id
                              WHERE t.community_id = :community_id
                                AND t.deleted_at IS NULL ${archivedTopicsQuery})
              ${contest_managers}
      `;

      const results = await models.sequelize.query<
        z.infer<typeof schemas.TopicView>
      >(sql, {
        replacements: { community_id },
        type: QueryTypes.SELECT,
        raw: true,
      });

      results.forEach((r) => {
        if (r.chain_node_url) {
          r.chain_node_url = buildChainNodeUrl(r.chain_node_url, 'public');
        }
      });

      return results;
    },
  };
}
