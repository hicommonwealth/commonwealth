import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

const viewGlobalActivity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const query = `
    SELECT nt.thread_id, nts.created_at as last_activity, nts.notification_data, nts.category_id,
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
    LEFT JOIN "OffchainComments" oc ON 'discussion_'||CAST(nt.thread_id AS VARCHAR) = oc.root_id
      --TODO: eval execution path with alternate aggregations
    LEFT JOIN "OffchainReactions" tr ON nt.thread_id = CAST(tr.thread_id AS VARCHAR)
    LEFT JOIN "OffchainReactions" cr ON oc.id = cr.comment_id
    LEFT JOIN "OffchainThreads" thr ON thr.id = CAST(nt.thread_id AS int)
    WHERE nt.thread_rank <= 50
    GROUP BY nt.thread_id, nts.created_at, nts.notification_data, nts.category_id
    ORDER BY nts.created_at DESC;
  `;

  const notifications = await models.sequelize.query(query, {
    type: 'SELECT',
    raw: true,
  });

  return res.json({ status: 'Success', result: notifications });
};

export default viewGlobalActivity;
