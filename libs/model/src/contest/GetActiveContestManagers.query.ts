import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../database';
import { getChainNodeUrl } from '../utils/utils';

// GetActiveContestManagers returns all contest managers which are active
// in the specified community and topic, along with the actions within
// each manager's most recent contest
export function GetActiveContestManagers(): Query<
  typeof schemas.GetActiveContestManagers
> {
  return {
    ...schemas.GetActiveContestManagers,
    auth: [],
    body: async ({ payload }) => {
      const results = await models.sequelize.query<{
        eth_chain_id: number;
        url: string;
        private_url: string;
        contest_address: string;
        max_contest_id: number;
        actions: Array<z.infer<typeof schemas.ContestAction>>;
      }>(
        `
            SELECT cn.eth_chain_id,
                   cn.private_url,
                   cn.url,
                   cm.contest_address,
                   co.max_contest_id,
                   COALESCE(JSON_AGG(ca) FILTER (WHERE ca IS NOT NULL), '[]'::json) as actions
            FROM "Communities" c
                     JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
                     JOIN "ContestManagers" cm ON cm.community_id = c.id
                     JOIN (SELECT contest_address,
                                  MAX(contest_id) AS max_contest_id,
                                  MAX(start_time) as start_time,
                                  MAX(end_time)   as end_time
                           FROM "Contests"
                           GROUP BY contest_address) co ON cm.contest_address = co.contest_address
                     LEFT JOIN "ContestActions" ca on (
                ca.contest_address = cm.contest_address AND
                ca.created_at > co.start_time AND
                ca.created_at < co.end_time
                )
            WHERE c.topic_id = :topic_id
              AND cm.community_id = :community_id
              AND cm.cancelled IS NOT TRUE
              AND (
                cm.interval = 0 AND NOW() < co.end_time
                    OR
                cm.interval > 0
                )
            GROUP BY cn.eth_chain_id, cn.private_url, cn.url, cm.contest_address, co.max_contest_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            topic_id: payload.topic_id!,
            community_id: payload.community_id,
          },
        },
      );

      return results.map((r) => ({
        eth_chain_id: r.eth_chain_id,
        url: getChainNodeUrl(r),
        contest_address: r.contest_address,
        max_contest_id: r.max_contest_id,
        actions: r.actions,
      }));
    },
  };
}
