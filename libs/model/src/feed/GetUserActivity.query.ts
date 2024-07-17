import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

/**
 * Last 50 updated threads
 */
export function GetUserActivity(): Query<typeof schemas.ThreadFeed> {
  return {
    ...schemas.ThreadFeed,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const query = `
WITH ranked_thread_notifs AS (
  SELECT
    t.id AS thread_id,
    t.max_notif_id
  FROM
    "Threads" t
    ${
      actor.user.id
        ? 'JOIN "Addresses" a on a.community_id = t.community_id and a.user_id = :user_id'
        : ''
    }
  WHERE
    deleted_at IS NULL
  ORDER BY
    t.max_notif_id DESC
  LIMIT 50
)
SELECT
  nts.thread_id,
  nts.created_at AS last_activity,
  nts.notification_data,
  nts.category_id,
  thr.comment_count,
  COALESCE(
    json_agg(json_build_object('Addresses', json_build_array(row_to_json(A)))) FILTER (WHERE A.id IS NOT NULL),
    json_build_array()
  ) as commenters
FROM
  ranked_thread_notifs rtn
  JOIN "Notifications" nts ON rtn.max_notif_id = nts.id
  JOIN "Threads" thr ON thr.id = rtn.thread_id
  LEFT JOIN "Comments" C ON C.id = (nts.notification_data::JSONB ->> 'comment_id')::INTEGER
  LEFT JOIN LATERAL (
    SELECT
      A.id,
      A.address,
      A.community_id
    FROM
      "Addresses" A
      JOIN "Comments" C ON A.id = C.address_id AND C.thread_id = thr.id
    WHERE
      C.deleted_at IS NULL
    ORDER BY
      A.id
    LIMIT 4
  ) A ON TRUE
WHERE
  (category_id = 'new-comment-creation' AND C.deleted_at IS NULL) 
  OR category_id = 'new-thread-creation'
GROUP BY
  nts.notification_data, 
  nts.thread_id, 
  nts.created_at, 
  nts.category_id, 
  thr.comment_count
ORDER BY 
  nts.created_at DESC;
  `;

      const notifications = await models.sequelize.query<
        z.infer<typeof schemas.ThreadFeedRecord>
      >(query, {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: { user_id: actor.user.id },
      });

      return notifications;
    },
  };
}
