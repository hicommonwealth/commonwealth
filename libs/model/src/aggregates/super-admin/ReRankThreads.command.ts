import {
  cache,
  CacheNamespaces,
  Command,
  InvalidInput,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommunityTierMap } from '@hicommonwealth/shared';
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

      let ranks:
        | [
            {
              thread_id: number;
              community_rank: string;
              global_rank: string;
            }[],
            number,
          ]
        | undefined;
      await models.sequelize.transaction(async (transaction) => {
        if (!community_id) {
          await models.ThreadRank.truncate({ transaction });
        } else {
          await models.sequelize.query(
            `
              DELETE
              FROM "ThreadRanks"
                USING "Threads"
              WHERE "ThreadRanks".thread_id = "Threads".id
                AND "Threads".community_id = :community_id;
            `,
            { replacements: { community_id }, transaction },
          );
        }

        if (!community_id) {
          await cache().deleteNamespaceKeys(CacheNamespaces.GlobalThreadRanks);
          await cache().deleteNamespaceKeys(
            CacheNamespaces.CommunityThreadRanks,
          );
        } else {
          await cache().deleteKey(
            CacheNamespaces.CommunityThreadRanks,
            community_id,
          );
        }

        ranks = (await models.sequelize.query(
          `
            WITH ranks AS (SELECT T.id,
                                  T.user_tier_at_creation,
                                  T.view_count,
                                  T.created_at,
                                  CO.tier                      as community_tier,
                                  T.community_id,
                                  SUM(COALESCE(C.user_tier_at_creation, 0)) as comment_total,
                                  SUM(COALESCE(R.user_tier_at_creation, 0)) as reaction_total
                           FROM "Threads" T
                                  LEFT JOIN "Comments" C ON C.thread_id = T.id
                                  LEFT JOIN "Reactions" R ON R.thread_id = T.id
                                  JOIN "Communities" CO ON CO.id = T.community_id
                           WHERE T.created_at > NOW() - INTERVAL '7 weeks'
                             AND T.marked_as_spam_at IS NULL
                             AND T.deleted_at IS NULL
                             AND T.user_tier_at_creation IS NOT NULL
                             AND C.marked_as_spam_at IS NULL
                             AND CO.tier >= ${CommunityTierMap.ManuallyVerified}
                             AND LENGTH(T.body) >= 32
                             AND LENGTH(C.body) >= 32
                             AND CO.id != 'common'
                             ${community_id ? 'AND T.community_id = :community_id' : ''}
                           GROUP BY T.id, T.user_tier_at_creation, T.view_count, T.created_at, CO.tier, T.community_id),
                 base_ranks AS (SELECT id,
                                       view_count * :viewCountWeight +
                                       user_tier_at_creation * :creatorTierWeight +
                                       EXTRACT(EPOCH FROM created_at)::INTEGER / 60 * :createdDateWeight +
                                       comment_total * :commentWeight +
                                       reaction_total * :reactionWeight AS base_rank,
                                       community_tier,
                                       community_id
                                FROM ranks)
            INSERT
            INTO "ThreadRanks" (thread_id, community_rank, global_rank, updated_at)
            SELECT br.id,
                   br.base_rank,
                   br.base_rank + (br.community_tier * :communityTierWeight),
                   NOW()
            FROM base_ranks br
            RETURNING thread_id, community_rank, global_rank;
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
          }[],
          number,
        ];

        const communityIds = (
          await models.Thread.findAll({
            attributes: ['id', 'community_id'],
            where: {
              id: ranks[0].map((r) => r.thread_id),
            },
          })
        ).reduce(
          (acc, val) => {
            acc[String(val.id)] = val.community_id;
            return acc;
          },
          {} as Record<string, string>,
        );

        const communityRankUpdates: {
          [community_id: string]: { value: string; score: number }[];
        } = {};
        const globalRankUpdates: { value: string; score: number }[] = [];
        for (const { thread_id, community_rank, global_rank } of ranks[0]) {
          const commmunityId = communityIds[String(thread_id)];
          if (!communityRankUpdates[commmunityId]) {
            communityRankUpdates[commmunityId] = [];
          }
          communityRankUpdates[commmunityId].push({
            value: String(thread_id),
            score: Number(community_rank),
          });
          globalRankUpdates.push({
            value: String(thread_id),
            score: Number(global_rank),
          });
        }

        for (const community_id in communityRankUpdates) {
          if (communityRankUpdates[community_id].length > 0) {
            await cache().addToSortedSet(
              CacheNamespaces.CommunityThreadRanks,
              community_id,
              communityRankUpdates[community_id],
            );
          }
        }

        if (globalRankUpdates.length > 0) {
          await cache().addToSortedSet(
            CacheNamespaces.GlobalThreadRanks,
            'all',
            globalRankUpdates,
          );
        }
      });

      return { numThreadsReranked: ranks ? ranks[0].length : 0 };
    },
  };
}
