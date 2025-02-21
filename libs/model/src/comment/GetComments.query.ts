import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommentsView } from '@hicommonwealth/schemas';
import { DEFAULT_NAME, getRandomAvatar } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { sanitizeDeletedComment } from '../utils/index';

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
      const offset = (cursor - 1) * limit;

      const orderByQueries = {
        newest: '"created_at" DESC',
        oldest: '"created_at" ASC',
        mostLikes: '"reaction_count" DESC',
      };

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
            C.${orderByQueries[order_by || 'newest']}
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

      return schemas.buildPaginatedResponse(
        sanitizedComments,
        comments?.length ? parseInt(`${comments!.at(0)!.total_count}`) : 0,
        { ...payload, offset },
      );
    },
  };
}
