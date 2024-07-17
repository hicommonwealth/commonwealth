import { CacheNamespaces, cache, logger } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { DB } from './models/index';

export async function getActivityFeed(models: DB, id = 0) {
  /**
   * Last 50 updated threads and their comments
   */
  const query = `
      WITH 
      user_communities AS (SELECT community_id FROM "Addresses" WHERE user_id = :id),
      top_threads AS (
          SELECT T.*
          FROM "Threads" T
                   ${
                     id > 0
                       ? 'JOIN user_communities UC ON UC.community_id = T.community_id'
                       : ''
                   }
          WHERE T.deleted_at IS NULL
          ORDER BY T.activity_rank_date DESC NULLS LAST
          LIMIT 50
      ),
      ranked_threads AS (
        SELECT 
          T.id AS thread_id,
          T.activity_rank_date,
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
            'profile_name', U.profile->>'name',
            'profile_avatar_url', U.profile->>'avatar_url',
            'user_id', U.id,
            'user_address', A.address,
            'topic', Tp,
            'community_id', T.community_id
          ) as thread
        FROM
          top_threads T
          JOIN "Addresses" A ON A.id = T.address_id AND A.community_id = T.community_id
          JOIN "Users" U ON U.id = A.user_id
          JOIN "Topics" Tp ON Tp.id = T.topic_id
        ${id > 0 ? 'WHERE U.id != :id' : ''}),
      recent_comments AS ( -- get the recent comments data associated with the thread
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
            'profile_name', U.profile->>'name',
            'profile_avatar_url', U.profile->>'avatar_url',
            'user_id', U.id
          ))) as "recentComments"
        FROM (
          Select tempC.*
          FROM "Comments" tempC 
          JOIN top_threads tt ON tt.id = tempC.thread_id
            WHERE tempC.deleted_at IS NULL
            ORDER BY tempC.created_at DESC
            LIMIT 3 -- Optionally a prop can be added for this
          ) C
          JOIN "Addresses" A ON A.id = C.address_id
          JOIN "Users" U ON U.id = A.user_id
          GROUP BY C.thread_id
      )
      SELECT 
        RTS."thread" as thread,
        RC."recentComments" as recentComments
      FROM
        ranked_threads RTS
        LEFT JOIN recent_comments RC ON RTS.thread_id = RC.thread_id
      ORDER BY
        RTS.activity_rank_date DESC NULLS LAST;
  `;

  const threads: any = await models.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: { id },
  });

  return threads;
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

  public async deleteActivityFromCache(threadId: number): Promise<void> {
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
        let shouldKeep = true;
        if (a.thread_id === threadId) {
          updated = true;
          shouldKeep = false;
        }
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
