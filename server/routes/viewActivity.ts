import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB, sequelize } from '../database';

const { Op } = Sequelize;

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  const { id } = req.user;
  const { request: activity_type } = req.body;

  const global_activity = `SELECT nt.thread_id, nts.created_at as last_activity, nts.notification_data, nts.category_id,
  MAX(ovc.view_count) as view_count, 
  COUNT(DISTINCT oc.id) AS comment_count,
  COUNT(DISTINCT tr.id) + COUNT(DISTINCT cr.id) AS reaction_count
FROM 
  (SELECT nnn.mx_not_id, nnn.thread_id,
      ROW_NUMBER() OVER (ORDER BY mx_not_id DESC) as thread_rank
    FROM
    (SELECT DISTINCT nn.thread_id, nn.mx_not_id 
      FROM (SELECT (n.notification_data::jsonb->>'root_id') AS thread_id,
              MAX(n.id) OVER (PARTITION BY (n.notification_data::jsonb->>'root_id')) AS mx_not_id
            FROM "Notifications" n 
            WHERE n.category_id IN('new-thread-creation','new-comment-creation')
            ORDER BY id DESC
            FETCH FIRST 500 ROWS ONLY
            ) nn
      ) nnn
  ) nt
INNER JOIN "Notifications" nts ON nt.mx_not_id = nts.id
LEFT JOIN "OffchainViewCounts" ovc ON nt.thread_id = ovc.object_id
LEFT JOIN "OffchainComments" oc ON 'discussion_'||CAST(nt.thread_id AS VARCHAR) = oc.root_id --TODO: eval execution path with alternate aggregations
LEFT JOIN "OffchainReactions" tr ON nt.thread_id = CAST(tr.thread_id AS VARCHAR)
LEFT JOIN "OffchainReactions" cr ON oc.id = cr.comment_id
LEFT JOIN "OffchainThreads" thr ON thr.id = CAST(nt.thread_id AS int)
WHERE nt.thread_rank <= 50
GROUP BY nt.thread_id, nts.created_at, nts.notification_data, nts.category_id
ORDER BY nts.created_at DESC;`;

  const user_activity = `SELECT nt.thread_id, nt.last_activity, nts.notification_data, nts.category_id,
                    MAX(ovc.view_count) as view_count, 
                    COUNT(DISTINCT oc.id) AS comment_count,
                    COUNT(DISTINCT tr.id) + COUNT(DISTINCT cr.id) AS reaction_count
                  FROM 
                    (SELECT   
                      (n.notification_data::jsonb->>'root_id') AS thread_id,
                      MAX(n.created_at) AS last_activity 
                    FROM "Notifications" n 
                    WHERE n.chain_event_id IS NULL --redundant with category_id filter, but performances seems better; TODO review path
                      AND category_id IN('new-thread-creation','new-comment-creation')
                      AND n.chain_id IN(SELECT a."chain" FROM "Addresses" a WHERE a.user_id = ${id}) --commenting this line makes query global
                    GROUP BY (n.notification_data::jsonb->>'root_id') 
                    ORDER BY MAX(n.created_at) DESC
                    LIMIT 50
                    ) nt 
                  LEFT JOIN "Notifications" nts ON (nts.notification_data::jsonb->>'root_id') = nt.thread_id
                    AND nts.category_id IN('new-thread-creation','new-comment-creation')
                  LEFT JOIN "OffchainViewCounts" ovc ON nt.thread_id = ovc.object_id
                  LEFT JOIN "OffchainComments" oc ON 'discussion_'||CAST(nt.thread_id AS VARCHAR) = oc.root_id --TODO: eval execution path with alternate aggregations
                  LEFT JOIN "OffchainReactions" tr ON nt.thread_id = CAST(tr.thread_id AS VARCHAR)
                  LEFT JOIN "OffchainReactions" cr ON oc.id = cr.comment_id
                  LEFT JOIN "OffchainThreads" thr ON thr.id = CAST(nt.thread_id AS int)
                  GROUP BY nt.thread_id, nt.last_activity, nts.notification_data, nts.category_id;`;

  const chain_events = `SELECT ce.*, cet.chain, cet.event_network, c.icon_url FROM "ChainEvents" ce
                      INNER JOIN "ChainEventTypes" cet ON ce.chain_event_type_id = cet.id 
                      INNER JOIN "Addresses" a ON a."chain" = cet."chain" 
                      INNER JOIN "Chains" c ON c.id = cet.chain 
                      WHERE a.user_id = ${id}
                      ORDER BY ce.created_at DESC 
                      LIMIT 50;`;

  let query;
  switch (activity_type) {
    case 'global':
      query = global_activity;
      break;
    case 'chainEvents':
      query = chain_events;
      break;
    case 'forYou':
    default:
      query = user_activity;
  }

  const notifications = await models.sequelize.query(query, {
    type: 'SELECT',
    raw: true,
  });

  return res.json({ status: 'Success', result: notifications });
};
