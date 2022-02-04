import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB, sequelize} from '../database';

const Op = Sequelize.Op;

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
  const { request } = req.body;

  const global =`SELECT nt.thread_id, nt.last_activity, nts.notification_data,
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
                  GROUP BY (n.notification_data::jsonb->>'root_id') 
                  ORDER BY MAX(n.created_at) DESC
                  LIMIT 50
                  ) nt 
                LEFT JOIN "Notifications" nts ON (nts.notification_data::jsonb->>'root_id') = nt.thread_id
                LEFT JOIN "OffchainViewCounts" ovc ON nt.thread_id = ovc.object_id
                LEFT JOIN "OffchainComments" oc ON 'discussion_'||CAST(nt.thread_id AS VARCHAR) = oc.root_id --TODO: eval execution path with alternate aggregations
                LEFT JOIN "OffchainReactions" tr ON nt.thread_id = CAST(tr.thread_id AS VARCHAR)
                LEFT JOIN "OffchainReactions" cr ON oc.id = cr.comment_id
                LEFT JOIN "OffchainThreads" thr ON thr.id = CAST(nt.thread_id AS int)
                GROUP BY nt.thread_id, nt.last_activity, nts.notification_data;`;

  const forYou = `SELECT nt.thread_id, nt.last_activity, nts.notification_data,
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
                  LEFT JOIN "OffchainViewCounts" ovc ON nt.thread_id = ovc.object_id
                  LEFT JOIN "OffchainComments" oc ON 'discussion_'||CAST(nt.thread_id AS VARCHAR) = oc.root_id --TODO: eval execution path with alternate aggregations
                  LEFT JOIN "OffchainReactions" tr ON nt.thread_id = CAST(tr.thread_id AS VARCHAR)
                  LEFT JOIN "OffchainReactions" cr ON oc.id = cr.comment_id
                  LEFT JOIN "OffchainThreads" thr ON thr.id = CAST(nt.thread_id AS int)
                  GROUP BY nt.thread_id, nt.last_activity, nts.notification_data;`;

  const chainEvents = `SELECT ce.* FROM "ChainEvents" ce 
                      INNER JOIN "ChainEventTypes" cet ON ce.chain_event_type_id = cet.id 
                      INNER JOIN "Addresses" a ON a."chain" = cet."chain" 
                      WHERE a.user_id = ${id}
                      ORDER BY ce.created_at DESC 
                      LIMIT 50;`;

  let query;
  switch (request) {
    case 'global':
      query = global;
      break;
    case 'chainEvents':
      query = chainEvents;
      break;
    case 'forYou': 
    default: 
      query = forYou;
  }

  const notifications = await models.sequelize.query(
    query,
    {
      type: 'SELECT',
      raw: true,
    });

  return res.json({ status: 'Success', result: notifications });
};
