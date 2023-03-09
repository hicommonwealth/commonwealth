import type { Profile } from 'models';
import type { DB } from '../models';

export type GlobalActivity = Array<{
  category_id: string;
  comment_count: string;
  last_activity: string;
  notification_data: string; // actually object but stringified
  reaction_count: string;
  thread_id: string;
  view_count: number;
  commenters: Profile[];
}>;

export default async function queryGlobalActivity(
  models: DB
): Promise<GlobalActivity> {
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
    LEFT JOIN "ViewCounts" ovc ON nt.thread_id = CAST(ovc.object_id AS VARCHAR)
    LEFT JOIN "Comments" oc ON 'discussion_'||CAST(nt.thread_id AS VARCHAR) = oc.root_id
      --TODO: eval execution path with alternate aggregations
    LEFT JOIN "Reactions" tr ON nt.thread_id = CAST(tr.thread_id AS VARCHAR)
    LEFT JOIN "Reactions" cr ON oc.id = cr.comment_id
    LEFT JOIN "Threads" thr ON thr.id = CAST(nt.thread_id AS int)
    WHERE nt.thread_rank <= 50
    GROUP BY nt.thread_id, nts.created_at, nts.notification_data, nts.category_id
    ORDER BY nts.created_at DESC;
  `;

  const notifications: any = await models.sequelize.query(query, {
    type: 'SELECT',
    raw: true,
  });

  const comments = await models.Comment.findAll({
    where: {
      root_id: notifications.map((n) => `discussion_${n.thread_id}`),
    },
  });

  const addresses = await models.Address.findAll({
    where: {
      id: comments.map((c) => c.address_id),
    },
  });

  const profiles = await models.Profile.findAll({
    where: {
      id: addresses.map((a) => a.profile_id),
    },
    include: [
      {
        model: models.Address,
      },
    ],
  });

  const notificationsWithProfiles = notifications.map((notification) => {
    const filteredComments = comments.filter(
      (c) => c.root_id === `discussion_${notification.thread_id}`
    );
    const notificationProfiles = filteredComments.map((c) => {
      const filteredAddress = addresses.find((a) => a.id === c.address_id);

      return profiles.find((p) => p.id === filteredAddress.profile_id);
    });
    return {
      ...notification,
      commenters: [...new Set(notificationProfiles)],
    };
  });

  // TODO: verify output type
  return notificationsWithProfiles as GlobalActivity;
}
