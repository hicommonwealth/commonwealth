import { CacheNamespaces, cache, logger } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * This class hosts a series of 'cleaner' functions that delete unnecessary data from the database. The class schedules
 * the cleaning functions to run at a specific hour each day as defined by the `hourToRun` constructor argument. This
 * class uses UTC so that deployments/execution in various timezones does not affect functionality.
 */
export class DatabaseCleaner {
  private readonly log = logger(import.meta);
  private _models: DB;
  private _timeToRun: Date;
  private _completed = false;
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
   */
  public initLoop(models: DB, hourToRun: number) {
    this.init(models);

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
  }

  public async executeQueries() {
    if (!this._models) {
      this.log.error(`Must initialize the cleaner before executing queries`);
      return;
    }
    this.log.info('Database clean-up starting...');

    try {
      await this.cleanSubscriptions();
    } catch (e) {
      this.log.error('Failed to clean subscriptions', e);
    }

    try {
      await this.cleanChainEventXpSources();
    } catch (e) {
      this.log.error('Failed to clean chain event XP sources', e);
    }

    try {
      await this.runMaintenance();
    } catch (e) {
      this.log.error('Failed to run pg_partman maintenance', e);
    }

    this.log.info('Database clean-up finished.');
  }

  /**
   * Deletes subscriptions that are associated with users that have not logged-in in the past year.
   */
  public async cleanSubscriptions() {
    let subsDeleted = 0;
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
            CREATE TEMPORARY TABLE user_ids_to_delete as (SELECT U.id
                                                          FROM "Users" U
                                                                   LEFT JOIN "Addresses" A ON U.id = A.user_id
                                                          GROUP BY U.id
                                                          HAVING (${noAccountsAndIsOldUser})
                                                              OR (${noActiveAccountsQuery}));
        `,
        { transaction: t },
      );

      subsDeleted += await this._models.sequelize.query(
        `
            DELETE
            FROM "ThreadSubscriptions" TS
                USING user_ids_to_delete U
            WHERE TS.user_id = U.id;
        `,
        { type: QueryTypes.BULKDELETE, transaction: t },
      );

      subsDeleted += await this._models.sequelize.query(
        `
            DELETE
            FROM "CommentSubscriptions" CS
                USING user_ids_to_delete U
            WHERE CS.user_id = U.id;
        `,
        { type: QueryTypes.BULKDELETE, transaction: t },
      );

      subsDeleted += await this._models.sequelize.query(
        `
            DELETE
            FROM "CommunityAlerts" CA
                USING user_ids_to_delete U
            WHERE CA.user_id = U.id;
        `,
        { type: QueryTypes.BULKDELETE, transaction: t },
      );

      await this._models.sequelize.query(
        `
            DROP TABLE user_ids_to_delete;
        `,
        { transaction: t },
      );
    });

    this.log.info(`Deleted ${subsDeleted} subscriptions`);
  }

  /**
   * Deactivates ChainEventXpSources (EVM CE sources) for quests that have ended
   */
  public async cleanChainEventXpSources() {
    const res = await this._models.sequelize.query(
      `
        UPDATE "ChainEventXpSources" CE
        SET active = false
        FROM "QuestActionMetas" QAM,
             "Quests" Q
        WHERE QAM.id = CE.quest_action_meta_id
          AND QAM.quest_id = Q.id
          AND Q.end_date < NOW()
          AND CE.active = true;
    `,
      { type: QueryTypes.BULKDELETE },
    );
    this.log.info(`Deactivated ${res} chain event XP sources`);
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
