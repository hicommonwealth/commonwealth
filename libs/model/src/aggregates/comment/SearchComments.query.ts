import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptionalVerified } from '../../middleware';
import { buildOpenGates } from '../../utils/gating';

export function SearchComments(): Query<typeof schemas.SearchComments> {
  return {
    ...schemas.SearchComments,
    auth: [authOptionalVerified],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id, search, limit, cursor, order_by, order_direction } =
        payload;

      const replacements = {
        address_id: actor.address_id,
        community_id:
          community_id && community_id !== ALL_COMMUNITIES
            ? community_id
            : undefined,
        search,
        limit,
        offset: limit * (cursor - 1),
      };

      const sql = `
WITH comments AS (
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
  T.topic_id,
  ts_rank_cd(C.search, tsquery) as rank
FROM
  "Comments" C
  JOIN "Addresses" A ON C.address_id = A.id
  JOIN "Threads" T ON C.thread_id = T.id
  , websearch_to_tsquery('english', :search) as tsquery
WHERE
  C.deleted_at IS NULL
  AND C.marked_as_spam_at IS NULL
  ${replacements.community_id ? 'AND T.community_id = :community_id' : ''}
  AND tsquery @@ C.search
),
${
  actor.address_id
    ? // authenticated users are gated by group memberships
      `
${buildOpenGates(actor)},
gated_comments AS (
  SELECT  
    C.*
  FROM
    comments C
    JOIN open_gates og ON C.topic_id = og.topic_id
)
`
    : // otherwise only public threads are returned
      `
private_gates AS (
  SELECT DISTINCT ga.topic_id
  FROM
    "GroupGatedActions" ga
    JOIN comments C ON ga.topic_id = C.topic_id
  WHERE
    ga.is_private = TRUE
),
gated_comments AS (
  SELECT
    C.*
  FROM
    comments C
    LEFT JOIN private_gates pg ON C.topic_id = pg.topic_id
  WHERE
    pg.topic_id IS NULL
)
`
}
SELECT
  C.*,
  COUNT(*) OVER()::INTEGER AS total_count
FROM
  gated_comments C
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
