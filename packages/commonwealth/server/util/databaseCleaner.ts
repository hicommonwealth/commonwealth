import { cache } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type { DB } from '@hicommonwealth/model';
import { CacheNamespaces } from '@hicommonwealth/shared';
import { fileURLToPath } from 'node:url';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);

/**
 * This class hosts a series of 'cleaner' functions that delete unnecessary data from the database. The class schedules
 * the cleaning functions to run at a specific hour each day as defined by the `hourToRun` constructor argument. This
 * class uses UTC so that deployments/execution in various timezones does not affect functionality.
 */
export class DatabaseCleaner {
  private readonly log = logger(__filename);
  private _models: DB;
  private _timeToRun: Date;
  private _completed = false;
  private _oneRunMax = false;
  private _timeoutID;
  private _lockName = 'cw_database_cleaner_locker';
  // lock times out in 12 hours
  private _lockTimeoutSeconds = 43200;

  public init(models: DB) {
    this._models = models;
  }

  /**
   * @param models An instance of the DB containing the sequelize instance and all the models.
   * @param hourToRun A number in [0, 24) indicating the hour in which to run the cleaner. Uses UTC!
   * @param oneRunMax If set to true the database clean will only occur once and will not be re-scheduled
   */
  public initLoop(models: DB, hourToRun: number, oneRunMax = false) {
    this.init(models);
    this._oneRunMax = oneRunMax;

    if (!hourToRun && hourToRun !== 0) {
      this.log.warn(`No hourToRun given. The cleaner will not run.`);
      return;
    }

    if (hourToRun < 0 || hourToRun >= 24) {
      this.log.error(
        `${hourToRun} is not a valid hour. The given hourToRun must be greater than or equal to 0 and less than 24`,
      );
      return;
    }

    const now = new Date();
    this._timeToRun = new Date(now);
    this._timeToRun.setUTCHours(hourToRun);
    this._timeToRun.setUTCMinutes(0);
    this._timeToRun.setUTCMilliseconds(0);

    this._timeoutID = setTimeout(this.startLoop.bind(this), this.getTimeout());

    this.log.info(
      `The current date is ${now.toString()}. The cleaner will run on ${this._timeToRun.toString()}`,
    );
  }

  public async startLoop() {
    // the lock will automatically time out so there is no need to unlock it
    const lockAcquired = await this.acquireLock();

    if (lockAcquired === false) {
      this.log.info('Unable to acquire lock. Skipping clean-up...');
    } else {
      await this.executeQueries();
    }

    this._completed = true;
    if (!this._oneRunMax) {
      this._timeoutID = setTimeout(
        this.startLoop.bind(this),
        this.getTimeout(),
      );
    }
  }

  public async executeQueries() {
    if (!this._models) {
      this.log.error(`Must initialize the cleaner before executing queries`);
      return;
    }
    this.log.info('Database clean-up starting...');

    try {
      await this.cleanNotifications(this._oneRunMax);
    } catch (e) {
      this.log.error('Failed to clean notifications', e);
    }

    try {
      await this.cleanSubscriptions(this._oneRunMax);
    } catch (e) {
      this.log.error('Failed to clean subscriptions', e);
    }

    try {
      await this.runMaintenance();
    } catch (e) {
      this.log.error('Failed to run pg_partman maintenance', e);
    }

    this.log.info('Database clean-up finished.');
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
          { replacements: [DELETE_NOTIF_THRESHOLD], transaction: t },
        );

        await this._models.sequelize.query(
          `
          DELETE FROM "NotificationsRead" NR
              USING notif_ids_to_delete ND
          WHERE NR.notification_id = ND.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t },
        );

        numNotifDeleted = await this._models.sequelize.query(
          `
          DELETE FROM "Notifications" N
              USING notif_ids_to_delete ND
          WHERE N.id = ND.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t },
        );

        await this._models.sequelize.query(
          `
          DROP TABLE notif_ids_to_delete;
        `,
          { transaction: t },
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
        await this._models.sequelize.query(
          `
            CREATE TEMPORARY TABLE sub_ids_to_delete as (
              WITH user_ids_to_delete AS MATERIALIZED (
                SELECT U.id
                FROM "Users" U
                LEFT JOIN "Addresses" A ON U.id = A.user_id
                GROUP BY U.id
                HAVING (${noAccountsAndIsOldUser}) OR (${noActiveAccountsQuery})
              )
              SELECT S.id
              FROM "Subscriptions" S
                JOIN user_ids_to_delete UD ON UD.id = S.subscriber_id
              ORDER BY UD.id
              LIMIT ?
            );
        `,
          { transaction: t, replacements: [DELETE_SUBS_THRESHOLD] },
        );

        await this._models.sequelize.query(
          `
          DELETE FROM "NotificationsRead" NR
              USING sub_ids_to_delete SD
          WHERE NR.subscription_id = SD.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t },
        );

        numSubsDeleted = await this._models.sequelize.query(
          `
          DELETE FROM "Subscriptions" S
              USING sub_ids_to_delete SD
          WHERE S.id = SD.id;
        `,
          { type: QueryTypes.BULKDELETE, transaction: t },
        );

        await this._models.sequelize.query(
          `
          DROP TABLE sub_ids_to_delete;
        `,
          { transaction: t },
        );
        totalSubsDeleted += numSubsDeleted;

        if (shouldContinueSubDelete()) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      });
    }

    this.log.info(`Deleted ${totalSubsDeleted} subscriptions`);
  }

  /**
   * This function executes the run_maintenance function of the pg_partman
   * Postgres extension. This creates new child partition tables and drops
   * any outdated ones according to the retention policy.
   * See: https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman.md#maintenance-functions
   */
  public async runMaintenance() {
    await this._models.sequelize.query(`
      SELECT run_maintenance();
    `);
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

  private async acquireLock() {
    // the lock will automatically time out so there is no need to unlock it
    return await cache().setKey(
      CacheNamespaces.Database_Cleaner,
      this._lockName,
      uuidv4(),
      this._lockTimeoutSeconds,
      true,
    );
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
