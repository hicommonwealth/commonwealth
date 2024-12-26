import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommentsView } from '@hicommonwealth/schemas';
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
      const { thread_id, comment_id, include_reactions, limit, cursor } =
        payload;
      const offset = (cursor - 1) * limit;

      const sql = `
        SELECT
            C.id,
            C.body,
            C.created_at,
            C.updated_at,
            C.deleted_at,
            C.marked_as_spam_at,
            C.reaction_count,
            CA.address,
            CA.last_active,
            CU.id AS "user_id",
            CU.profile->>'name' AS "profile_name",
            CU.profile->>'avatar_url' AS "avatar_url",
            ${
              include_reactions
                ? `
            json_agg(json_build_object(
                'id', R.id,
                'address_id', R.address_id,
                'reaction', R.reaction,
                'created_at', R.created_at::text,
                'updated_at', R.updated_at::text,
                'calculated_voting_weight', R.calculated_voting_weight::text,
                'address', RA.address,
                'last_active', RA.last_active::text,
                'profile_name', RU.profile->>'name',
                'avatar_url', RU.profile->>'avatar_url'
              )) AS "reactions",
                `
                : ''
            }
            COUNT(*) OVER() AS total_count
        FROM
            "Comments" AS C
            JOIN "Addresses" AS CA ON C."address_id" = CA."id"
            JOIN "Users" AS CU ON CA."user_id" = CU."id"
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
            C."thread_id" = :thread_id
            ${comment_id ? ' AND C."id" = :comment_id' : ''}
        ${
          include_reactions
            ? `
        GROUP BY
            C.id,
            C.created_at,
            C.updated_at,
            C.deleted_at,
            C.marked_as_spam_at,
            CA.address,
            CA.last_active,
            CU.id,
            CU.profile->>'name',
            CU.profile->>'avatar_url'
        `
            : ''
        }
        ORDER BY
            C."created_at"
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
