import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { buildChainNodeUrl } from '../utils/utils';

export function GetCommunities(): Query<typeof schemas.GetCommunities> {
  return {
    ...schemas.GetCommunities,
    auth: [],
    secure: false,
    body: async ({ payload, actor }) => {
      const {
        relevance_by,
        base,
        network,
        include_node_info,
        include_last_30_day_thread_count,
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
      const replacements: { tag_ids?: number[]; user_id?: number } = {};
      if (filtering_tags) replacements.tag_ids = tag_ids;
      if (relevance_by === 'membership')
        replacements.user_id = actor?.user?.id || 0;

      const date30DaysAgo = new Date(+new Date() - 1000 * 24 * 60 * 60 * 30);
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
                  "Community"."lifetime_thread_count",
                  "Community"."profile_count",
                  "Community"."namespace",
                  "Community"."namespace_address",
                  "Community"."created_at",
                  "Community"."updated_at",
                  "Community"."redirect",
                  "Community"."snapshot_spaces",
                  "Community"."include_in_digest_email"
                  ${
                    include_last_30_day_thread_count
                      ? // eslint-disable-next-line max-len
                        `,(SELECT COUNT("Threads".id)::int FROM "Threads" WHERE "Threads".community_id = "Community".id AND "Threads".created_at > '${date30DaysAgo.toISOString()}' AND "Threads".deleted_at IS NULL) as last_30_day_thread_count`
                      : ''
                  }
          FROM    "Communities" AS "Community"
          WHERE  "Community"."active" = true
                      ${
                        relevance_by === 'membership'
                          ? `
                        AND name NOT LIKE '%<%'
                        AND name NOT LIKE '%>%'
                        AND name NOT LIKE '%\`%'
                        AND name NOT LIKE '%"%'
                        AND name NOT LIKE '%''%'
                        `
                          : ''
                      }
                        ${
                          base
                            ? `
                          AND "Community"."base" = '${base}'
                        `
                            : ''
                        }${
                          network
                            ? `
                          AND "Community"."network" = '${network}'
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
                          filtering_tags && relevance_by !== 'tag_ids'
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
                    'updated_at', "updated_at"
                )) as "Groups"
          FROM "Groups"
          WHERE "Groups"."community_id" IN (SELECT "id" FROM "community_CTE")
          GROUP BY "community_id"
        )
        `
          : '';

      const sql = `
        ${communityCTE}
          ${communityTagsCTE}
          ${communityStakesCTE}
          ${groupsCTE}
        SELECT 
            "community_CTE".*, 
            count(*) OVER() AS total,
            "CommunityTags_CTE"."CommunityTags" as "CommunityTags",
            "CommunityStakes_CTE"."CommunityStakes" as "CommunityStakes"
            ${has_groups ? `, "Groups_CTE"."Groups" as "groups"` : ''}
            ${
              include_node_info
                ? `
              , "ChainNode"."id"                  AS "ChainNode.id",
                "ChainNode"."url"                 AS "ChainNode.url",
                "ChainNode"."eth_chain_id"        AS "ChainNode.eth_chain_id",
                "ChainNode"."cosmos_chain_id"     AS "ChainNode.cosmos_chain_id",
                "ChainNode"."alt_wallet_url"      AS "ChainNode.alt_wallet_url",
                "ChainNode"."balance_type"        AS "ChainNode.balance_type",
                "ChainNode"."name"                AS "ChainNode.name",
                "ChainNode"."description"         AS "ChainNode.description",
                "ChainNode"."health"              AS "ChainNode.health",
                "ChainNode"."ss58"                AS "ChainNode.ss58",
                "ChainNode"."bech32"              AS "ChainNode.bech32",
                "ChainNode"."cosmos_gov_version"  AS "ChainNode.cosmos_gov_version",
                "ChainNode"."block_explorer"      AS "ChainNode.block_explorer",
                "ChainNode"."slip44"              AS "ChainNode.slip44",
                "ChainNode"."created_at"          AS "ChainNode.created_at",
                "ChainNode"."updated_at"          AS "ChainNode.updated_at"
              `
                : ''
            }
        FROM "community_CTE"
        LEFT OUTER JOIN "CommunityTags_CTE" ON "community_CTE"."id" = "CommunityTags_CTE"."community_id"
        LEFT OUTER JOIN "CommunityStakes_CTE" ON "community_CTE"."id" = "CommunityStakes_CTE"."community_id"
        ${
          relevance_by === 'membership' && replacements.user_id
            ? // eslint-disable-next-line max-len
              `LEFT OUTER JOIN 
              (SELECT DISTINCT ON (community_id) * FROM "Addresses" WHERE user_id = :user_id) authUserAddresses 
              ON "community_CTE"."id" = authUserAddresses.community_id 
              AND authUserAddresses.user_id = :user_id`
            : ``
        }
        ${
          has_groups
            ? 'LEFT OUTER JOIN "Groups_CTE" ON "community_CTE"."id" = "Groups_CTE"."community_id"'
            : ''
        }
        ${
          include_node_info
            ? 'LEFT OUTER JOIN "ChainNodes" AS "ChainNode" ON "community_CTE"."chain_node_id" = "ChainNode"."id"'
            : ''
        }
        ORDER BY 
          ${
            filtering_tags && relevance_by === 'tag_ids'
              ? `CASE 
              WHEN jsonb_array_length("CommunityTags_CTE"."CommunityTags"::jsonb) = 0 IS NULL THEN 2
				      WHEN EXISTS (
                SELECT 1
                FROM jsonb_array_elements("CommunityTags_CTE"."CommunityTags"::jsonb) AS tag_element
                WHERE (tag_element->>'tag_id')::int = ANY(ARRAY[:tag_ids])
			        ) THEN 0
              ELSE 1
            END,
            "CommunityTags_CTE"."CommunityTags"::jsonb,`
              : ''
          }
          ${
            relevance_by === 'membership' && replacements.user_id
              ? `CASE
                WHEN authUserAddresses.user_id IS NOT NULL THEN 1
                ELSE 0
            END DESC,`
              : ''
          }
          "community_CTE"."${order_col}" ${direction}
          LIMIT ${limit} 
          OFFSET ${offset};
          `;

      const communities = await models.sequelize.query<
        z.infer<typeof schemas.Community> & { total?: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        nest: true,
      });

      if (include_node_info) {
        for (const community of communities) {
          community.ChainNode!.url = buildChainNodeUrl(
            community.ChainNode!.url!,
            'public',
          );
        }
      }

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
