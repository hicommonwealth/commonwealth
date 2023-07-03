import type { DB } from '../models';
import { factory, formatFilename } from 'common-common/src/logging';
import { QueryTypes } from 'sequelize';

// 4 AM Paris time e.g. 2 AM UTC
export default class DatabaseCleaner {
  private readonly _models: DB;
  private _timeToRun: Date;
  private readonly log = factory.getLogger(formatFilename(__filename));
  private _completed = false;

  /**
   * @param models An instance of the DB containing the sequelize instance and all the models.
   * @param hourToRun A number in [0, 24) indicating the hour in which to run the cleaner
   */
  constructor(models: DB, hourToRun: number) {
    this._models = models;

    if (hourToRun < 0 || hourToRun >= 24) {
      this.log.error(
        `${hourToRun} is not a valid hour. The given hourToRun must be greater than or equal to 0 and less than 24`
      );
      return;
    }

    const now = new Date();
    this._timeToRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hourToRun,
      0
    );

    setTimeout(this.start.bind(this), this.getTimeout());
  }

  public async start() {
    this.log.info('Database clean-up starting...');

    this._completed = true;
    this.log.info('Database clean-up finished.');
    setTimeout(this.start.bind(this), this.getTimeout());
  }

  public async cleanNotifsAndSubs(
    maxNotifDeleted: number,
    maxUserSubsDeleted: number
  ) {
    // delete old notifications 10,000 at a time with a 5-second pause between each query
    const DELETE_NOTIF_THRESHOLD = 10000;
    let totalNotifDeleted = 0;
    let numNotifDeleted = DELETE_NOTIF_THRESHOLD;

    while (numNotifDeleted === DELETE_NOTIF_THRESHOLD) {
      numNotifDeleted = await this._models.sequelize.query(
        `
        WITH notif_ids_to_delete as MATERIALIZED (
          SELECT id FROM "Notifications"
          WHERE created_at < NOW() - interval '3 months'
          ORDER BY created_at
          LIMIT 10000
        )
        DELETE FROM "NotificationsRead"
            USING notif_ids_to_delete
        WHERE "NotificationsRead".notification_id = notif_ids_to_delete.id;
      `,
        { type: QueryTypes.BULKDELETE }
      );
      totalNotifDeleted += numNotifDeleted;

      if (numNotifDeleted === DELETE_NOTIF_THRESHOLD)
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // instead of one really long-running transaction that will block INSERTS and UPDATES we make many small
    // deletions of ~5k subscriptions at a time (100 users at a time)
    // The subscriptions table is so large that even this simple deletion is very time-consuming
    // (5 seconds per deletion).
    const DELETE_SUBS_THRESHOLD = 500;
    let totalNRDeleted = 0,
      totalSubsDeleted = 0;
    let numSubsDeleted = DELETE_SUBS_THRESHOLD;
    while (numSubsDeleted > DELETE_SUBS_THRESHOLD) {
      await this._models.sequelize.transaction(async (t) => {
        await this._models.sequelize.query(
          `
          CREATE TEMPORARY TABLE user_ids_to_delete as (
            SELECT U.id
            FROM "Users" U
            WHERE U.updated_at < NOW() - interval '12 months'
            ORDER U.updated_at
            LIMIT 50;
          );
        `,
          { transaction: t }
        );

        totalNRDeleted += await this._models.sequelize.query(
          `
          DELETE FROM "NotificationsRead" NR
          USING user_ids_to_delete ND
          WHERE NR.user_id = ND.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t }
        );

        numSubsDeleted = await this._models.sequelize.query(
          `
          DELETE FROM "Subscriptions" S
          USING user_ids_to_delete UD
          WHERE S.subscriber_id = UD.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t }
        );
        totalSubsDeleted += numSubsDeleted;

        if (numSubsDeleted > DELETE_SUBS_THRESHOLD) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      });
    }

    this.log.info(`Deletion summary: 
      Notifications: ${totalNotifDeleted},
      NotificationsRead: ${totalNRDeleted},
      Subscriptions: ${totalSubsDeleted}`);
  }

  public getTimeout() {
    const now = new Date();
    // if current time is in the given hour
    if (
      this._timeToRun.getTime() <= now.getTime() &&
      now.getTime() <= this._timeToRun.getTime() + 3600000
    ) {
      // if already completed then set new timeToRun as next day
      if (this._completed) {
        this._timeToRun.setDate(this._timeToRun.getDate() + 1);
        this._completed = false;
        return this._timeToRun.getTime() - now.getTime();
      }

      return 0;
    }

    this._completed = false;
    if (this._timeToRun.getTime() + 3600000 < now.getTime()) {
      this._timeToRun.setDate(this._timeToRun.getDate() + 1);
      return this._timeToRun.getTime() - now.getTime();
    } else {
      return this._timeToRun.getTime() - now.getTime();
    }
  }
}
