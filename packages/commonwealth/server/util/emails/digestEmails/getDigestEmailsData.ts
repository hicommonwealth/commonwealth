import {
  NotificationCategories,
  NotificationCategory,
} from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import models from '../../../database';
import { NotificationAttributes } from '../../../models/notification';
import { UserInstance } from '../../../models/user';
import {
  ChainEventEmailData,
  ForumEmailData,
  getEmailData,
} from '../immediateEmails/getEmailData';
import { DigestEmailIntervals } from './dispatchDigestEmails';

type DigestEmailData =
  | { type: 'forum'; data: ForumEmailData }
  | {
      type: 'chain-event';
      data: ChainEventEmailData;
    };

type DigestEmailsData = {
  [userEmail: string]: Array<DigestEmailData>;
};

export async function getDigestEmailsData(
  users: UserInstance[],
  interval: DigestEmailIntervals,
): Promise<DigestEmailsData> {
  let intervalQuery = '24 hours';
  if (interval === 'weekly') {
    intervalQuery = '7 days';
  }

  const notifPerUser = (await models.sequelize.query(
    `
    SELECT U.email, json_agg(row_to_json(N.*)) as notifications
    FROM "Users" U
    JOIN "NotificationsRead" NR ON NR.user_id = U.id
    JOIN "Notifications" N ON N.id = NR.notification_id
    WHERE U.id IN (:users) 
        AND N.created_at > CURRENT_TIMESTAMP - INTERVAL '${intervalQuery}' 
        AND N.category_id NOT IN (
            '${NotificationCategories.ThreadEdit}', 
            '${NotificationCategories.CommentEdit}',
            '${NotificationCategories.SnapshotProposal}'
        )
    GROUP BY U.id;
  `,
    {
      logging: console.log,
      raw: true,
      type: QueryTypes.SELECT,
      replacements: {
        users: users.map((u) => u.id),
      },
    },
  )) as Array<{
    email: string;
    notifications: NotificationAttributes[];
  }>;

  const emailsData: DigestEmailsData = {};
  for (const user of notifPerUser) {
    for (const notif of user.notifications) {
      const data = await getEmailData({
        categoryId: notif.category_id as Exclude<
          NotificationCategory,
          | NotificationCategories.ThreadEdit
          | NotificationCategories.CommentEdit
          | NotificationCategories.SnapshotProposal
        >,
        data: JSON.parse(notif.notification_data),
      });

      if (!emailsData[user.email]) {
        emailsData[user.email] = [];
      }

      emailsData[user.email].push({
        type:
          notif.category_id === NotificationCategories.ChainEvent
            ? 'chain-event'
            : 'forum',
        data,
      } as DigestEmailData);
    }
  }

  return emailsData;
}
