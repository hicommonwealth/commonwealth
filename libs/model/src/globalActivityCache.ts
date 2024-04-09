import { CacheNamespaces, cache } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { DB } from './models/index';

export async function getActivityFeed(models: DB, id = 0) {
  /**
   * Last 50 updated threads
   */

  const filterByCommunityForUsers = id
    ? 'JOIN "Addresses" a on a.community_id=t.community_id and a.user_id = ?'
    : '';

  const query = `
    WITH ranked_thread_notifs AS (
        SELECT t.id AS thread_id, t.max_notif_id
        FROM "Threads" t
        ${filterByCommunityForUsers}
        WHERE deleted_at IS NULL
        ORDER BY t.max_notif_id DESC
        LIMIT 50
    ) SELECT
        nts.thread_id,
        nts.created_at AS last_activity,
        nts.notification_data,
        nts.category_id,
        thr.comment_count,
                COALESCE(
                    json_agg(
                        json_build_object('Addresses', json_build_array(row_to_json(A)))
                    ) FILTER (WHERE A.id IS NOT NULL),
                    json_build_array()
                ) as commenters
    FROM ranked_thread_notifs rtn
    INNER JOIN "Notifications" nts ON rtn.max_notif_id = nts.id
    JOIN "Threads" thr ON thr.id = rtn.thread_id
    LEFT JOIN "Comments" C ON C.id = (nts.notification_data::JSONB ->> 'comment_id')::INTEGER
    LEFT JOIN LATERAL (
        SELECT A.id, A.address, A.community_id, A.profile_id
        FROM "Addresses" A
        JOIN "Comments" C ON A.id = C.address_id AND C.thread_id = thr.id
        WHERE C.deleted_at IS NULL
        ORDER BY A.id
        LIMIT 4
    ) A ON TRUE
    WHERE (category_id = 'new-comment-creation' AND C.deleted_at IS NULL) OR category_id = 'new-thread-creation'
    GROUP BY nts.notification_data, nts.thread_id, nts.created_at, nts.category_id, thr.comment_count
    ORDER BY nts.created_at DESC;
  `;

  const notifications: any = await models.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: [id],
  });

  return notifications;
}

const log = logger(import.meta.filename);

export class GlobalActivityCache {
  private _cacheKey = 'global_activity';
  private _lockName = 'global_activity_cache_locker';
  private static _instance: GlobalActivityCache;

  constructor(
    private _models: DB,
    private _cacheTTL: number = 60 * 5, // cache TTL in seconds
  ) {}

  static getInstance(models: DB, cacheTTL?: number): GlobalActivityCache {
    if (!GlobalActivityCache._instance) {
      GlobalActivityCache._instance = new GlobalActivityCache(models, cacheTTL);
    }
    return GlobalActivityCache._instance;
  }

  public async start() {
    await this.refreshGlobalActivity();
    setInterval(this.refreshGlobalActivity.bind(this), this._cacheTTL * 1000);
  }

  public async getGlobalActivity() {
    const activity = await cache().getKey(
      CacheNamespaces.Activity_Cache,
      this._cacheKey,
    );

    if (!activity) {
      if (GlobalActivityCache._instance) {
        const msg = 'Failed to fetch global activity from Redis';
        log.error(msg);
      }
      return await getActivityFeed(this._models);
    }
    return JSON.parse(activity);
  }

  public async deleteActivityFromCache(
    threadId: number,
    commentId?: number,
  ): Promise<void> {
    const errorMsg = 'Failed to update global activity in Redis';

    try {
      const res = await cache().getKey(
        CacheNamespaces.Activity_Cache,
        this._cacheKey,
      );

      if (!res) {
        log.info('Global Activity Cache is empty');
        return;
      }

      let activity = JSON.parse(res);
      let updated = false;
      activity = activity.filter((a: any) => {
        let shouldKeep: boolean;
        if (commentId) {
          const notifData = JSON.parse(a.notification_data);
          shouldKeep =
            a.thread_id !== threadId && notifData.commentId !== commentId;
        } else {
          shouldKeep = a.thread_id !== threadId;
        }

        if (!shouldKeep) updated = true;
        return shouldKeep;
      });

      if (!updated) return;

      const result = await cache().setKey(
        CacheNamespaces.Activity_Cache,
        this._cacheKey,
        JSON.stringify(activity),
      );
      if (!result) {
        log.error(errorMsg);
      }
    } catch (e: any) {
      log.error(errorMsg, e);
    }
  }

  private async refreshGlobalActivity(): Promise<void> {
    try {
      const lockAcquired = await this.acquireLock();

      if (lockAcquired === false) {
        log.info('Unable to acquire lock. Skipping refresh...');
        return;
      }

      const activity = await getActivityFeed(this._models);
      const result = await cache().setKey(
        CacheNamespaces.Activity_Cache,
        this._cacheKey,
        JSON.stringify(activity),
      );

      if (!result) {
        const msg = 'Failed to save global activity in Redis';
        log.error(msg);
        return;
      }

      log.info('Activity cache successfully refreshed');
    } catch (e: any) {
      const msg = 'Failed to refresh the global cache';
      log.error(msg, e);
    }
  }

  private async acquireLock() {
    return await cache().setKey(
      CacheNamespaces.Activity_Cache,
      this._lockName,
      uuidv4(),
      // shorten by 5 seconds to eliminate any discrepancies
      // between setInterval delay and Redis TTL
      this._cacheTTL - 5,
      true,
    );
  }
}
