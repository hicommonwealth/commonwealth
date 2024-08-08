import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetCommunities(): Query<typeof schemas.GetCommunities> {
  return {
    ...schemas.GetCommunities,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        base,
        include_node_info,
        stake_enabled,
        has_groups,
        tag_ids,
        cursor,
        limit,
        order_by,
        order_direction,
      } = payload;

      // pagination configuration
      const direction = order_direction || 'DESC';
      const order_col = order_by || 'profile_count';
      const offset = limit! * (cursor! - 1);

      // note that tags are queried based on the INTERSECTION of provided tags
      const filtering_tags = tag_ids && tag_ids.length > 0;
      const replacements = filtering_tags ? { tag_ids } : {};

      const communityCTE = `
        WITH "community_CTE" AS (
          SELECT  "Community"."id",
                  "Community"."chain_node_id",
                  "Community"."name",
                  "Community"."discord_config_id",
                  "Community"."description",
                  "Community"."token_name",
                  "Community"."social_links",
                  "Community"."default_symbol",
                  "Community"."network",
                  "Community"."base",
                  "Community"."ss58_prefix",
                  "Community"."icon_url",
                  "Community"."active",
                  "Community"."stages_enabled",
                  "Community"."custom_stages",
                  "Community"."custom_domain",
                  "Community"."block_explorer_ids",
                  "Community"."collapsed_on_homepage",
                  "Community"."type",
                  "Community"."substrate_spec",
                  "Community"."has_chain_events_listener",
                  "Community"."default_summary_view",
                  "Community"."default_page",
                  "Community"."has_homepage",
                  "Community"."hide_projects",
                  "Community"."terms",
                  "Community"."bech32_prefix",
                  "Community"."admin_only_polling",
                  "Community"."discord_bot_webhooks_enabled",
                  "Community"."directory_page_enabled",
                  "Community"."directory_page_chain_node_id",
                  "Community"."thread_count",
                  "Community"."profile_count",
                  "Community"."namespace",
                  "Community"."namespace_address",
                  "Community"."created_at",
                  "Community"."updated_at",
                  "Community"."redirect",
                  "Community"."snapshot_spaces",
                  "Community"."include_in_digest_email"
          FROM    "Communities" AS "Community"
          WHERE  "Community"."active" = true
                        ${
                          base
                            ? `
                          AND "Community"."base" = '${base}'
                        `
                            : ''
                        }
                        ${
                          has_groups
                            ? `
                          AND (
                            SELECT "community_id"
                            FROM   "Groups" AS "Groups"
                            WHERE  ( "Groups"."community_id" = "Community"."id" )
                            LIMIT  1
                          ) IS NOT NULL
                        `
                            : ''
                        }
                        ${
                          stake_enabled
                            ? `
                          AND (
                            SELECT "community_id"
                            FROM   "CommunityStakes" AS "CommunityStakes"
                            WHERE  (
                              "CommunityStakes"."stake_enabled" = true AND
                                "CommunityStakes"."community_id" = "Community"."id"
                            )
                            LIMIT  1
                          ) IS NOT NULL
                        `
                            : ''
                        }
                        ${
                          filtering_tags
                            ? `
                          AND (
                            SELECT COUNT  ( DISTINCT "CommunityTags"."tag_id" )
                            FROM  "CommunityTags" AS "CommunityTags"
                            WHERE (
                              "CommunityTags"."community_id" = "Community"."id" AND
                              "CommunityTags"."tag_id" IN (:tag_ids)
                            )
                          ) = ${tag_ids.length}
                        `
                            : ''
                        }
        )
      `,
        communityTagsCTE = `
        , "CommunityTags_CTE" AS (
          SELECT "community_id",
                json_agg(json_build_object(
                  'community_id', "community_id",
                  'tag_id', "tag_id",
                  'Tag', json_build_object('id', "CommunityTags->Tag"."id", 'name', "CommunityTags->Tag"."name")
                )) as "CommunityTags"
          FROM "CommunityTags"
          JOIN "Tags" AS "CommunityTags->Tag" ON "CommunityTags"."tag_id" = "CommunityTags->Tag"."id"
          WHERE "CommunityTags"."community_id" IN (SELECT "id" FROM "community_CTE")
          GROUP BY "community_id"
        )
      `,
        communityStakesCTE = `
        , "CommunityStakes_CTE" AS (
          SELECT "community_id",
                json_agg(json_build_object(
                  'community_id', "community_id",
                  'stake_id', "stake_id",
                  'stake_token', "stake_token",
                  'vote_weight', "vote_weight",
                  'stake_enabled', "stake_enabled",
                  'created_at', "created_at",
                  'updated_at', "updated_at"
                )) as "CommunityStakes"
          FROM "CommunityStakes"
          WHERE "CommunityStakes"."community_id" IN (SELECT "id" FROM "community_CTE")
          GROUP BY "community_id"
        )
      `,
        groupsCTE = has_groups
          ? `
        , "Groups_CTE" AS (
          SELECT "community_id",
                json_agg(json_build_object(
                    'id', "id",
                    'community_id', "community_id",
                    'metadata', "metadata",
                    'requirements', "requirements",
                    'is_system_managed', "is_system_managed",
                    'created_at', "created_at",
                    'updated_at', "updated_at",
                )) as "Groups"
          FROM "Groups"
          WHERE "Groups"."community_id" IN (SELECT "id" FROM "community_CTE")
          GROUP BY "community_id"
        )
        `
          : '',
        chainNodeCTE = include_node_info
          ? `
        , "ChainNode_CTE" AS (
          SELECT *
          FROM "ChainNodes"
          WHERE "ChainNode"."id" IN (SELECT DISTINCT "chain_node_id" FROM "community_CTE")
        )
        `
          : '';

      const sql = `
        ${communityCTE}
          ${communityTagsCTE}
          ${communityStakesCTE}
          ${groupsCTE}
          ${chainNodeCTE}
        SELECT 
            "community_CTE".*, 
            count(*) OVER() AS total,
            "CommunityTags_CTE"."CommunityTags" as "CommunityTags",
            "CommunityStakes_CTE"."CommunityStakes" as "CommunityStakes"
            ${
              has_groups
                ? `, (SELECT "Groups" FROM "Groups_CTE" WHERE "community_id" = "community_CTE"."id") AS "Groups"`
                : ''
            }
            ${
              include_node_info
                ? `, (SELECT "ChainNode" FROM "ChainNode_CTE" WHERE "id" = "community_CTE"."chain_node_id") AS "ChainNode"`
                : ''
            }
        FROM "community_CTE"
        LEFT OUTER JOIN "CommunityTags_CTE" ON "community_CTE"."id" = "CommunityTags_CTE"."community_id"
        LEFT OUTER JOIN "CommunityStakes_CTE" ON "community_CTE"."id" = "CommunityStakes_CTE"."community_id"
        ${
          has_groups
            ? 'LEFT OUTER JOIN "Groups_CTE" ON "community_CTE"."id" = "Groups_CTE"."community_id"'
            : ''
        }
        ${
          include_node_info
            ? 'LEFT OUTER JOIN "ChainNode_CTE" ON "community_CTE"."chain_node_id" = "ChainNode_CTE"."id"'
            : ''
        }
        ORDER BY "community_CTE"."${order_col}" ${direction} LIMIT ${limit} OFFSET ${offset};
      `;

      const communities = await models.sequelize.query<
        z.infer<typeof schemas.Community> & { total?: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        nest: true,
      });

      return schemas.buildPaginatedResponse(
        communities,
        +(communities.at(0)?.total ?? 0),
        {
          limit,
          offset,
        },
      );
    },
  };
}
