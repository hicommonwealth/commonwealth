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

      const sql = `
        SELECT DISTINCT ON ("Community"."id", "Community"."${order_col}") "Community".*, count(*) OVER() AS total,
              "CommunityTags"."community_id"    AS "CommunityTags.community_id",
              "CommunityTags"."tag_id"          AS "CommunityTags.tag_id",
              "CommunityTags->Tag"."id"         AS "CommunityTags.Tag.id",
              "CommunityTags->Tag"."name"       AS "CommunityTags.Tag.name",
              "CommunityStakes"."community_id"  AS "CommunityStakes.community_id",
              "CommunityStakes"."stake_id"      AS "CommunityStakes.stake_id",
              "CommunityStakes"."stake_token"   AS "CommunityStakes.stake_token",
              "CommunityStakes"."vote_weight"   AS "CommunityStakes.vote_weight",
              "CommunityStakes"."stake_enabled" AS "CommunityStakes.stake_enabled",
              "CommunityStakes"."created_at"    AS "CommunityStakes.created_at",
              "CommunityStakes"."updated_at"    AS "CommunityStakes.updated_at"
              ${
                has_groups
                  ? `
            , "Groups"."id"                     AS "Groups.id",
              "Groups"."community_id"           AS "Groups.community_id",
              "Groups"."metadata"               AS "Groups.metadata",
              "Groups"."requirements"           AS "Groups.requirements",
              "Groups"."is_system_managed"      AS "Groups.is_system_managed",
              "Groups"."created_at"             AS "Groups.created_at",
              "Groups"."updated_at"             AS "Groups.updated_at"
              `
                  : ''
              }
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
        FROM   (SELECT "Community"."id",
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
                FROM   "Communities" AS "Community"
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
                ) AS "Community"
              LEFT OUTER JOIN "CommunityTags" AS "CommunityTags"
                ON "Community"."id" = "CommunityTags"."community_id"
              LEFT OUTER JOIN "Tags" AS "CommunityTags->Tag"
                ON "CommunityTags"."tag_id" = "CommunityTags->Tag"."id"
              LEFT OUTER JOIN "CommunityStakes" AS "CommunityStakes"
                ON "Community"."id" = "CommunityStakes"."community_id"
              ${
                has_groups
                  ? `
                INNER JOIN "Groups" AS "Groups"
                  ON "Community"."id" = "Groups"."community_id"
              `
                  : ''
              }
              ${
                include_node_info
                  ? `
                LEFT OUTER JOIN "ChainNodes" AS "ChainNode"
                  ON "Community"."chain_node_id" = "ChainNode"."id"
              `
                  : ''
              }
        ORDER BY "Community"."${order_col}" ${direction} LIMIT ${limit} OFFSET ${offset};
      `;

      const communities = await models.sequelize.query<
        z.infer<typeof schemas.Community> & { total?: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });

      return schemas.buildPaginatedResponse(
        communities,
        communities.at(0)?.total ?? 0,
        {
          limit,
          offset,
        },
      );
    },
  };
}
