import type { DB } from '../models';
import { factory, formatFilename } from 'common-common/src/logging';
import { QueryTypes } from 'sequelize';
import Rollbar from 'rollbar';

/**
 * This class hosts a series of 'cleaner' functions that delete unnecessary data from the database. The class schedules
 * the cleaning functions to run at a specific hour each day as defined by the `hourToRun` constructor argument. This
 * class uses UTC so that deployments/execution in various timezones does not affect functionality.
 */
export default class DatabaseCleaner {
  private readonly log = factory.getLogger(formatFilename(__filename));
  private readonly _models: DB;
  private readonly _rollbar?: Rollbar;
  private readonly _timeToRun: Date;
  private _completed = false;
  private _timeoutID;

  /**
   * @param models An instance of the DB containing the sequelize instance and all the models.
   * @param hourToRun A number in [0, 24) indicating the hour in which to run the cleaner. Uses UTC!
   * @param rollbar A rollbar instance to report errors
   * @param oneRunMax If set to true the database clean will only occur once and will not be re-scheduled
   */
  constructor(
    models: DB,
    hourToRun: number,
    rollbar?: Rollbar,
    oneRunMax = false
  ) {
    this._models = models;
    this._rollbar = rollbar;

    if (!hourToRun || hourToRun < 0 || hourToRun >= 24) {
      this.log.error(
        `${hourToRun} is not a valid hour. The given hourToRun must be greater than or equal to 0 and less than 24`
      );
      this._rollbar?.error(
        `The database cleaner failed to initialize. ${hourToRun} is not a valid hour.`
      );
      return;
    }

    const now = new Date();
    this._timeToRun = new Date(now);
    this._timeToRun.setUTCHours(hourToRun);
    this._timeToRun.setUTCMinutes(0);
    this._timeToRun.setUTCMilliseconds(0);

    this._timeoutID = setTimeout(
      this.start.bind(this),
      this.getTimeout(),
      oneRunMax
    );

    this.log.info(
      `The current date is ${now.toString()}. The cleaner will run on ${this._timeToRun.toString()}`
    );
  }

  public async start(oneRunMax = false) {
    this.log.info('Database clean-up starting...');

    try {
      await this.cleanNotifications(oneRunMax);
    } catch (e) {
      this.log.error('Failed to clean notifications', e);
      this._rollbar?.error('Failed to clean notifications', e);
    }

    try {
      await this.cleanSubscriptions(oneRunMax);
    } catch (e) {
      this.log.error('Failed to clean subscriptions', e);
      this._rollbar?.error('Failed to clean subscriptions', e);
    }

    this._completed = true;
    this.log.info('Database clean-up finished.');
    if (!oneRunMax) {
      this._timeoutID = setTimeout(this.start.bind(this), this.getTimeout());
    }
  }

  /**
   * Deletes notifications that are older than 3 months. Only 10,000 notifications are deleted at a time to reduce
   * database load. Between each deletion there is a 5-second pause to again reduce database load and allow other
   * transactions to complete.
   * @param oneRunMax If set to true the deletion query will be executed just once (primarily used for testing).
   */
  public async cleanNotifications(oneRunMax = false) {
    // determines the maximum amount of notifications to delete in a single go
    // if the actual amount of notifications deleted is less than this then the
    // query will not rerun
    const DELETE_NOTIF_THRESHOLD = 10000;
    // the number of notifications deleted in a single execution of the transaction
    let numNotifDeleted;
    let totalNotifDeleted = 0;

    // determines whether the query should run again
    const shouldContinueNotifDelete = () => {
      // always run at least once
      if (numNotifDeleted === undefined) return true;
      else if (oneRunMax) return false;
      else return numNotifDeleted === DELETE_NOTIF_THRESHOLD;
    };

    while (shouldContinueNotifDelete()) {
      await this._models.sequelize.transaction(async (t) => {
        await this._models.sequelize.query(
          `
          CREATE TEMPORARY TABLE notif_ids_to_delete as (
            SELECT id FROM "Notifications"
            WHERE created_at < NOW() - interval '3 months'
            ORDER BY created_at
            LIMIT ?
          );
        `,
          { replacements: [DELETE_NOTIF_THRESHOLD], transaction: t }
        );

        await this._models.sequelize.query(
          `
          DELETE FROM "NotificationsRead" NR
              USING notif_ids_to_delete ND
          WHERE NR.notification_id = ND.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t }
        );

        numNotifDeleted = await this._models.sequelize.query(
          `
          DELETE FROM "Notifications" N
              USING notif_ids_to_delete ND
          WHERE N.id = ND.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t }
        );

        await this._models.sequelize.query(
          `
          DROP TABLE notif_ids_to_delete;
        `,
          { transaction: t }
        );
      });

      totalNotifDeleted += numNotifDeleted;

      if (shouldContinueNotifDelete())
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    this.log.info(`Deleted ${totalNotifDeleted} notifications.`);
  }

  /**
   * Deletes subscriptions that are associated with users that have not logged-in in the past year. Only 10,000
   * subscriptions are deleted at a time to reduce database load. Between each there is a 5-second pause to again
   * reduce database load and allow other transactions to complete.
   * @param oneRunMax If set to true the deletion query will be executed just once (primarily used for testing).
   */
  public async cleanSubscriptions(oneRunMax = false) {
    // instead of one really long-running transaction that will block INSERTS and UPDATES we make many small
    // deletions of ~10k subscriptions at a time
    // The subscriptions table is so large and unwieldy that even this simple deletion is very time-consuming
    // (5 seconds per deletion).
    const DELETE_SUBS_THRESHOLD = 10000;
    // the number of subscriptions deleted in a single execution of the transaction
    let numSubsDeleted;
    let totalSubsDeleted = 0;

    // determines whether the query should run again
    const shouldContinueSubDelete = () => {
      // always run at least once
      if (numSubsDeleted === undefined) return true;
      else if (oneRunMax) return false;
      else return numSubsDeleted === DELETE_SUBS_THRESHOLD;
    };

    while (shouldContinueSubDelete()) {
      await this._models.sequelize.transaction(async (t) => {
        await this._models.sequelize.query(
          `
            CREATE TEMPORARY TABLE sub_ids_to_delete as (
              WITH user_ids_to_delete as MATERIALIZED (
                  SELECT U.id, U.updated_at
                  FROM "Users" U
                  WHERE U.updated_at < NOW() - interval '12 months'
                  ORDER BY U.updated_at
              )
              SELECT S.id
              FROM "Subscriptions" S
                       JOIN user_ids_to_delete UD ON UD.id = S.subscriber_id
              ORDER BY UD.updated_at
              LIMIT ?
            );
        `,
          { transaction: t, replacements: [DELETE_SUBS_THRESHOLD] }
        );

        await this._models.sequelize.query(
          `
          DELETE FROM "NotificationsRead" NR
              USING sub_ids_to_delete SD
          WHERE NR.subscription_id = SD.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t }
        );

        numSubsDeleted = await this._models.sequelize.query(
          `
          DELETE FROM "Subscriptions" S
              USING sub_ids_to_delete SD
          WHERE S.id = SD.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t }
        );

        await this._models.sequelize.query(
          `
          DROP TABLE sub_ids_to_delete;
        `,
          { transaction: t }
        );
        totalSubsDeleted += numSubsDeleted;

        if (shouldContinueSubDelete()) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      });
    }

    this.log.info(`Deleted ${totalSubsDeleted} subscriptions`);
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
        this._timeToRun.setUTCDate(this._timeToRun.getUTCDate() + 1);
        this._completed = false;
        return this._timeToRun.getTime() - now.getTime();
      }

      return 0;
    }

    this._completed = false;
    if (this._timeToRun.getTime() + 3600000 < now.getTime()) {
      this._timeToRun.setUTCDate(this._timeToRun.getUTCDate() + 1);
      return this._timeToRun.getTime() - now.getTime();
    } else {
      return this._timeToRun.getTime() - now.getTime();
    }
  }

  public get timeToRun() {
    return this._timeToRun;
  }

  public get completed() {
    return this._completed;
  }

  public get timeoutID() {
    return this._timeoutID;
  }
}
