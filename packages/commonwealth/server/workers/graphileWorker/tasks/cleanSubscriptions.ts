import { logger } from '@hicommonwealth/core';
import { TaskPayloads } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

export const cleanSubscriptions = async () => {
  let subsDeleted = 0;
  await models.sequelize.transaction(async (t) => {
    // user has no addresses at all, and user was last updated before a year ago
    const noAccountsAndIsOldUser = `
          COUNT(A.user_id) = 0 AND MIN(U.updated_at) < NOW() - INTERVAL '12 months'
        `;
    // user has no addresses that were active within the last year
    const noActiveAccountsQuery = `
          SUM(
            CASE
              WHEN A.last_active >= NOW() - INTERVAL '12 months' THEN 1
              ELSE 0
            END
          ) = 0
        `;
    await models.sequelize.query(
      `
          CREATE TEMPORARY TABLE user_ids_to_delete as (SELECT U.id
                                                        FROM "Users" U
                                                                 LEFT JOIN "Addresses" A ON U.id = A.user_id
                                                        GROUP BY U.id
                                                        HAVING (${noAccountsAndIsOldUser})
                                                            OR (${noActiveAccountsQuery}));
      `,
      { transaction: t },
    );

    subsDeleted += await models.sequelize.query(
      `
          DELETE
          FROM "ThreadSubscriptions" TS
              USING user_ids_to_delete U
          WHERE TS.user_id = U.id;
      `,
      { type: QueryTypes.BULKDELETE, transaction: t },
    );

    subsDeleted += await models.sequelize.query(
      `
          DELETE
          FROM "CommentSubscriptions" CS
              USING user_ids_to_delete U
          WHERE CS.user_id = U.id;
      `,
      { type: QueryTypes.BULKDELETE, transaction: t },
    );

    subsDeleted += await models.sequelize.query(
      `
          DELETE
          FROM "CommunityAlerts" CA
              USING user_ids_to_delete U
          WHERE CA.user_id = U.id;
      `,
      { type: QueryTypes.BULKDELETE, transaction: t },
    );

    await models.sequelize.query(
      `
          DROP TABLE user_ids_to_delete;
      `,
      { transaction: t },
    );
  });

  log.info(`Deleted ${subsDeleted} subscriptions`);
};

export const cleanSubscriptionsTask = {
  input: TaskPayloads.CleanSubscriptions,
  fn: cleanSubscriptions,
};
