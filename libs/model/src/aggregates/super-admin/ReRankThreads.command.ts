import {
  cache,
  CacheNamespaces,
  Command,
  InvalidInput,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

// Will only rerank threads that are up to 1-week-old (avoids reranking every thread in the DB)
export function RerankThreads(): Command<typeof schemas.RerankThreads> {
  return {
    ...schemas.RerankThreads,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      if (config.APP_ENV === 'production')
        throw new InvalidInput('Not allowed in production');

      const { community_id } = payload;
      if (community_id) {
        const community = await models.Community.findByPk(community_id);
        if (!community) throw new InvalidInput('Community not found');
      }

      await models.sequelize.transaction(async (transaction) => {
        await models.ThreadRank.truncate({ transaction });

        await cache().deleteNamespaceKeys(CacheNamespaces.CommunityThreadRanks);
        await cache().deleteNamespaceKeys(CacheNamespaces.GlobalThreadRanks);

        const ranks = (await models.sequelize.query(
          `
            WITH ranks AS (SELECT T.id,
                                  T.user_tier_at_creation,
                                  T.view_count,
                                  T.created_at,
                                  CO.tier                      as community_tier,
                                  T.community_id,
                                  SUM(C.user_tier_at_creation) as comment_total,
                                  SUM(R.user_tier_at_creation) as reaction_total
                           FROM "Threads" T
                                  JOIN "Comments" C ON C.thread_id = T.id
                                  JOIN "Reactions" R ON R.thread_id = T.id
                                  JOIN "Communities" CO ON CO.id = T.community_id
                           WHERE T.created_at > T.created_at - INTERVAL '1 week'
                             AND T.marked_as_spam_at IS NULL
                             AND T.deleted_at IS NULL
                             ${community_id ? 'AND T.community_id = :community_id' : ''}
                           GROUP BY T.id, T.user_tier_at_creation, T.view_count, T.created_at, CO.tier, T.community_id),
                 base_ranks AS (SELECT id,
                                       view_count * :viewCountWeight +
                                       COALESCE(user_tier_at_creation, 3) * :creatorTierWeight +
                                       created_at * :createdDateWeight + COALESCE(comment_total, 0) * :commentWeight +
                                       COALESCE(reaction_total, 0) * :reactionWeight AS base_rank,
                                       community_tier,
                                       community_id
                                FROM ranks)
            UPDATE "ThreadRanks"
            SET community_rank = br.base_rank,
                global_rank    = br.base_rank + br.community_tier * :communityTierWeight
            FROM base_ranks br
            WHERE br.id = thread_id
            RETURNING thread_id, community_rank, global_rank, community_id;
          `,
          {
            type: QueryTypes.UPDATE,
            replacements: {
              community_id,
              viewCountWeight: config.HEURISTIC_WEIGHTS.VIEW_COUNT_WEIGHT,
              creatorTierWeight:
                config.HEURISTIC_WEIGHTS.CREATOR_USER_TIER_WEIGHT,
              createdDateWeight: config.HEURISTIC_WEIGHTS.CREATED_DATE_WEIGHT,
              commentWeight: config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT,
              reactionWeight: config.HEURISTIC_WEIGHTS.LIKE_WEIGHT,
              communityTierWeight:
                config.HEURISTIC_WEIGHTS.COMMUNITY_TIER_WEIGHT,
            },
            transaction,
          },
        )) as unknown as [
          {
            thread_id: number;
            community_rank: string;
            global_rank: string;
            community_id: string;
          }[],
          number,
        ];

        const communityRankUpdates: {
          [community_id: string]: { value: string; score: number }[];
        } = {};
        const globalRankUpdates: { value: string; score: number }[] = [];
        for (const {
          thread_id,
          community_rank,
          global_rank,
          community_id,
        } of ranks[0]) {
          if (!communityRankUpdates[community_id]) {
            communityRankUpdates[community_id] = [];
          }
          communityRankUpdates[community_id].push({
            value: String(thread_id),
            score: Number(community_rank),
          });
          globalRankUpdates.push({
            value: String(thread_id),
            score: Number(global_rank),
          });
        }

        for (const community_id in communityRankUpdates) {
          await cache().addToSortedSet(
            CacheNamespaces.CommunityThreadRanks,
            community_id,
            communityRankUpdates[community_id],
          );
        }
        await cache().addToSortedSet(
          CacheNamespaces.GlobalThreadRanks,
          'all',
          globalRankUpdates,
        );
      });
    },
  };
}
