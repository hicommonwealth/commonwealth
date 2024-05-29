import { CacheNamespaces, cache, logger } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { DB } from './models/index';

export async function getActivityFeed(models: DB, id = 0) {
  /**
   * Last 50 updated threads
   */

  const filterByCommunityForUsers = id
    ? 'A.community_id = T.community_id and'
    : '';

  const query = `
    WITH ranked_thread_notifications AS (
      SELECT 
      T.id AS thread_id,
      T.updated_at as updated_at,
      json_build_object(
        'id', T.id,
        'body', T.body,
        'plaintext', T.plaintext,
        'title', T.title,
        'numberOfComments', T.comment_count,
        'created_at', T.created_at,
        'updated_at', T.updated_at,
        'deleted_at', T.deleted_at,
        'locked_at', T.locked_at,
        'kind', T.kind,
        'stage', T.stage,
        'archived_at', T.archived_at,
        'read_only', T.read_only,
        'has_poll', T.has_poll,
        'marked_as_spam_at', T.marked_as_spam_at::text,
        'discord_meta', T.discord_meta,
        'profile_id', P.id,
        'profile_name', P.profile_name,
        'profile_avatar_url', P.avatar_url,
        'user_id', P.user_id,
        'user_address', A.address
      ) as thread,
      T.max_notif_id
      FROM "Threads" T
      JOIN "Addresses" A on 
      ${filterByCommunityForUsers} 
      ${id ? 'A.user_id = ?' : `A.id = T.address_id`}
      JOIN "Profiles" P ON P.user_id = A.user_id
      WHERE deleted_at IS NULL
      ORDER BY T.max_notif_id DESC
      LIMIT 50
    ),
    recent_comments AS (
      -- get the recent comments data associated with the thread
      SELECT
        C.thread_id as thread_id,
        json_agg(json_strip_nulls(json_build_object(
        'id', C.id,
        'address', A.address,
        'text', C.text,
        'plainText', C.plainText,
        'created_at', C.created_at::text,
        'updated_at', C.updated_at::text,
        'deleted_at', C.deleted_at::text,
        'marked_as_spam_at', C.marked_as_spam_at::text,
        'discord_meta', C.discord_meta,
        'profile_id', P.id,
        'profile_name', P.profile_name,
        'profile_avatar_url', P.avatar_url,
        'user_id', P.user_id
      ))) as "recentComments"
      FROM (
        Select tempC.* FROM "Comments" tempC
        JOIN ranked_thread_notifications tempRTN ON tempRTN.thread_id = tempC.thread_id
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 2
      ) C
      JOIN "Addresses" A ON A.id = C.address_id
      JOIN "Profiles" P ON P.user_id = A.user_id
      GROUP BY C.thread_id
    )
    SELECT 
      N.id as notification_id,
      RTN."thread" as thread,
      RC."recentComments" as recentComments,
      N.category_id as category_id,
      community_id
    FROM ranked_thread_notifications RTN
    INNER JOIN "Notifications" N ON RTN.max_notif_id = N.id
    LEFT JOIN recent_comments RC ON RTN.thread_id = RC.thread_id
    WHERE (category_id = 'new-comment-creation') OR category_id = 'new-thread-creation'
    ORDER BY RTN.updated_at DESC;
  `;

  const notifications: any = await models.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: [id],
  });

  return notifications;
}

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

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
