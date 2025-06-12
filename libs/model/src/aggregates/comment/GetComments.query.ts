import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommentsView } from '@hicommonwealth/schemas';
import { DEFAULT_NAME, getRandomAvatar } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { sanitizeDeletedComment } from '../../utils';

export function GetComments(): Query<typeof schemas.GetComments> {
  return {
    ...schemas.GetComments,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        thread_id,
        comment_id,
        parent_id,
        include_reactions,
        limit,
        cursor,
        order_by,
        include_spam_comments,
      } = payload;

      // Chat mode: reverse pagination for 'oldest' order
      const isChatMode = order_by === 'oldest';
      let offset, actualOrderBy, actualPage;

      if (isChatMode) {
        // For chat mode, we need to calculate reverse pagination
        // First, get total count to determine the actual page mapping
        const countSql = `
          SELECT COUNT(*) as total_count
          FROM "Comments" AS C
          WHERE
              (C."deleted_at" IS NULL OR C."reply_count" > 0)
              AND C."parent_id" ${parent_id ? '= :parent_id' : 'IS NULL'}
              ${thread_id ? `AND C."thread_id" = :thread_id` : ''}
              ${comment_id ? ' AND C."id" = :comment_id' : ''}
              ${!include_spam_comments ? 'AND C."marked_as_spam_at" IS NULL' : ''}
        `;

        const [countResult] = await models.sequelize.query<{
          total_count: string;
        }>(countSql, {
          replacements: {
            thread_id,
            comment_id,
            ...(parent_id && { parent_id: `${parent_id}` }),
          },
          type: QueryTypes.SELECT,
        });

        const totalCount = parseInt(countResult?.total_count || '0');

        // For chat mode: cursor=1 should show the most recent LIMIT comments
        // cursor=2 should show the next older LIMIT comments, etc.
        // We calculate offset from the end of all comments
        offset = Math.max(0, totalCount - cursor * limit);

        console.log(
          `Chat Mode Debug - totalCount: ${totalCount}, cursor: ${cursor}, limit: ${limit}, offset: ${offset}`,
        );

        actualPage = Math.floor(offset / limit) + 1;
        actualOrderBy = 'C."created_at" ASC'; // Always ASC for chat mode to get proper chronological order
      } else {
        // Normal pagination for non-chat modes
        offset = (cursor - 1) * limit;
        const orderByQueries = {
          newest: 'C."created_at" DESC',
          oldest: 'C."created_at" ASC',
          mostLikes: 'C."reaction_count" DESC',
        };
        actualOrderBy = orderByQueries[order_by || 'newest'];
        actualPage = cursor;
      }

      const sql = `
        SELECT
            C.id,
            C.body,
            C.created_at,
            C.updated_at,
            C.deleted_at,
            C.marked_as_spam_at,
            C.reaction_count,
            C.parent_id,
            C.thread_id,
            C.comment_level,
            C.reply_count,
            C.address_id,
            CA.address,
            CA.last_active,
            CA.community_id,
            CU.id AS "user_id",
            CU.tier AS "user_tier",
            COALESCE(CU.profile->>'name', '${DEFAULT_NAME}') AS "profile_name",
            COALESCE(CU.profile->>'avatar_url', '${getRandomAvatar()}') AS "avatar_url",
            CASE WHEN max(CVH.id) IS NOT NULL THEN
              json_agg(json_strip_nulls(json_build_object(
                  'id', CVH.id,
                  'comment_id', CVH.comment_id,
                  'body', CVH.body,
                  'timestamp', CVH.timestamp,
                  'content_url', CVH.content_url
              )))
            ELSE '[]'::json
            END AS "CommentVersionHistories",
            ${
              include_reactions
                ? `
            CASE WHEN max(R.id) IS NOT NULL THEN
                json_agg(json_build_object(
                  'id', R.id,
                  'address_id', R.address_id,
                  'reaction', R.reaction,
                  'created_at', R.created_at::text,
                  'updated_at', R.updated_at::text,
                  'calculated_voting_weight', R.calculated_voting_weight::text,
                  'address', RA.address,
                  'last_active', RA.last_active::text,
                  'profile_name', COALESCE(RU.profile->>'name', '${DEFAULT_NAME}'),
                  'avatar_url', COALESCE(RU.profile->>'avatar_url', '${getRandomAvatar()}')
                )) 
              ELSE '[]'::json
              END AS "reactions",
                `
                : ''
            }
            COUNT(*) OVER() AS total_count
        FROM
            "Comments" AS C
            JOIN "Addresses" AS CA ON C."address_id" = CA."id"
            JOIN "Users" AS CU ON CA."user_id" = CU."id"
            LEFT JOIN "CommentVersionHistories" AS CVH ON CVH."comment_id" = C."id"
            ${
              include_reactions
                ? `
            LEFT JOIN "Reactions" AS R ON C."id" = R."comment_id"
            LEFT JOIN "Addresses" AS RA ON R."address_id" = RA."id"
            LEFT JOIN "Users" AS RU ON RA."user_id" = RU."id"
            `
                : ''
            }
        WHERE
            (C."deleted_at" IS NULL OR C."reply_count" > 0)
            AND C."parent_id" ${parent_id ? '= :parent_id' : 'IS NULL'}
            ${thread_id ? `AND C."thread_id" = :thread_id` : ''}
            ${comment_id ? ' AND C."id" = :comment_id' : ''}
            ${!include_spam_comments ? 'AND C."marked_as_spam_at" IS NULL' : ''}
        GROUP BY
            C.id,
            C.created_at,
            C.updated_at,
            C.deleted_at,
            C.marked_as_spam_at,
            CA.address,
            CA.last_active,
            CA.community_id,
            CU.id,
            CU.profile->>'name',
            CU.profile->>'avatar_url'
        ORDER BY
            ${actualOrderBy}
        LIMIT :limit OFFSET :offset;      
      `;

      const comments = await models.sequelize.query<
        z.infer<typeof CommentsView> & {
          total_count: number;
        }
      >(sql, {
        replacements: {
          thread_id,
          comment_id,
          ...(parent_id && { parent_id: `${parent_id}` }),
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      });

      const sanitizedComments = comments.map((c) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { total_count, ...rest } = c;
        return {
          ...sanitizeDeletedComment(
            rest as unknown as z.infer<typeof schemas.Comment>,
          ),
        } as unknown as z.infer<typeof CommentsView>;
      });

      const totalCount = comments?.length
        ? parseInt(`${comments!.at(0)!.total_count}`)
        : 0;

      // For chat mode, results should be in chronological order (oldest first, newest last)
      // The reverse pagination logic handles which "page" of chronological comments to return
      const finalResults = sanitizedComments;

      const paginatedResponse = schemas.buildPaginatedResponse(
        finalResults,
        totalCount,
        {
          ...payload,
          offset,
        },
      );

      if (isChatMode) {
        console.log(
          `Chat Mode Response - page: ${paginatedResponse.page}, totalPages: ${paginatedResponse.totalPages}, results: ${finalResults.length}`,
        );
      }

      return paginatedResponse;
    },
  };
}
