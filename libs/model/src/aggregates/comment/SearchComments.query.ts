import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptional } from '../../middleware';
import { filterGates, joinGates, withGates } from '../../utils/gating';

export function SearchComments(): Query<typeof schemas.SearchComments> {
  return {
    ...schemas.SearchComments,
    auth: [authOptional],
    secure: true,
    body: async ({ payload, context }) => {
      const { community_id, search, limit, cursor, order_by, order_direction } =
        payload;
      const address_id = context?.address?.id;

      const replacements = {
        address_id,
        community_id:
          community_id && community_id !== ALL_COMMUNITIES
            ? community_id
            : undefined,
        search,
        limit,
        offset: limit * (cursor - 1),
      };

      const sql = `
${withGates(address_id)}
SELECT
  'comment' as type,
  C.id,
  C.created_at,
  C.body,
  C.thread_id,
  A.id as address_id,
  A.address,
  A.community_id as address_community_id,
  T.title,
  T.community_id,
  COUNT(*) OVER()::INTEGER AS total_count,
  ts_rank_cd(C.search, tsquery) as rank
FROM
  "Comments" C
  JOIN "Addresses" A ON C.address_id = A.id
  JOIN "Threads" T ON C.thread_id = T.id
  ${joinGates(address_id)}
  , websearch_to_tsquery('english', :search) as tsquery
WHERE
  C.deleted_at IS NULL
  AND C.marked_as_spam_at IS NULL
  ${replacements.community_id ? 'AND T.community_id = :community_id' : ''}
  ${filterGates(address_id)}
  AND tsquery @@ C.search
ORDER BY
  ${order_by === 'created_at' ? `C.created_at ${order_direction || 'DESC'}` : `rank, C.created_at DESC`}
LIMIT :limit OFFSET :offset
  `;

      const comments = await models.sequelize.query<
        z.infer<typeof schemas.CommentSearchView> & { total_count: number }
      >(sql, {
        type: QueryTypes.SELECT,
        replacements,
      });

      return schemas.buildPaginatedResponse(
        comments,
        comments?.at(0)?.total_count || 0,
        {
          cursor,
          limit,
        },
      );
    },
  };
}
