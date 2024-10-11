import { CacheNamespaces, cache, logger } from '@hicommonwealth/core';
import { ActivityFeed, ActivityThread } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { models } from './database';

/**
 * Gets last updated threads and their recent comments
 * @param user_id by user id communities, 0 for global
 * @param thread_limit thread limit
 * @param comment_limit comment limit
 */
export async function getUserActivityFeed({
  user_id = 0,
  thread_limit = 50,
  comment_limit = 3,
}: Omit<z.infer<typeof ActivityFeed.input>, 'is_global'> & {
  user_id?: number;
}) {
  const query = `
WITH 
user_communities AS (
    SELECT DISTINCT community_id 
    FROM "Addresses" 
    WHERE user_id = :user_id
),
top_threads AS (
    SELECT T.*
    FROM "Threads" T
    ${user_id ? 'JOIN user_communities UC ON UC.community_id = T.community_id' : ''}
    WHERE T.deleted_at IS NULL
    ORDER BY T.activity_rank_date DESC NULLS LAST
    LIMIT :thread_limit
)
SELECT 
  jsonb_set(
    jsonb_build_object(
      'community_id', C.id,
      'community_icon', C.icon_url,
      'id', T.id,
      'user_id', U.id,
      'user_address', A.address,
      'profile_name', U.profile->>'name',
      'profile_avatar', U.profile->>'avatar_url',
      'body', T.body,
      'title', T.title,
      'kind', T.kind,
      'stage', T.stage,
      'number_of_comments', coalesce(T.comment_count, 0),
      'created_at', T.created_at::text,
      'updated_at', T.updated_at::text,
      'deleted_at', T.deleted_at::text,
      'locked_at', T.locked_at::text,
      'archived_at', T.archived_at::text,
      'marked_as_spam_at', T.marked_as_spam_at::text,
      'read_only', T.read_only,
      'has_poll', T.has_poll,
      'discord_meta', T.discord_meta,
      'topic', jsonb_build_object(
        'id', T.topic_id,
        'name', Tp.name,
        'description', Tp.description
      )
    ),
    '{recent_comments}', 
    COALESCE(
      (SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', C.id,
        'address', C.address,
        'user_id', C.user_id,
        'profile_name', C.profile_name,
        'profile_avatar', C.profile_avatar,
        'text', C.text,
        'created_at', C.created_at::text,
        'updated_at', C.updated_at::text,
        'deleted_at', C.deleted_at::text,
        'marked_as_spam_at', C.marked_as_spam_at::text,
        'discord_meta', C.discord_meta
      )) ORDER BY C.created_at DESC)
      FROM (
          SELECT 
            C.*,
            A.address,
            U.id as user_id,
            U.profile->>'name' as profile_name, 
            U.profile->>'avatar_url' as profile_avatar, 
            ROW_NUMBER() OVER (PARTITION BY C.thread_id ORDER BY C.created_at DESC) AS rn
          FROM "Comments" C
            JOIN "Addresses" A on C.address_id = A.id
            JOIN "Users" U on A.user_id = U.id
          WHERE 
            C.thread_id = T.id 
            AND C.deleted_at IS NULL
      ) C WHERE C.rn <= :comment_limit), '[]')
  ) AS thread
FROM
  top_threads T
  JOIN "Communities" C ON T.community_id = C.id
  JOIN "Addresses" A ON A.id = T.address_id AND A.community_id = T.community_id
  JOIN "Users" U ON U.id = A.user_id
  JOIN "Topics" Tp ON Tp.id = T.topic_id
ORDER BY
  T.activity_rank_date DESC NULLS LAST;
  `;

  const threads = await models.sequelize.query<{
    thread: z.infer<typeof ActivityThread>;
  }>(query, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: { user_id, thread_limit, comment_limit },
  });

  return threads.map((t) => t.thread);
}

const log = logger(import.meta);

export class GlobalActivityCache {
  private _cacheKey = 'global_activity';
  private _lockName = 'global_activity_cache_locker';
  private static _instance: GlobalActivityCache;

  constructor(
    private _cacheTTL: number = 60 * 5, // cache TTL in seconds
  ) {}

  static getInstance(cacheTTL?: number): GlobalActivityCache {
    if (!GlobalActivityCache._instance) {
      GlobalActivityCache._instance = new GlobalActivityCache(cacheTTL);
    }
    return GlobalActivityCache._instance;
  }

  public async start() {
    await this.refreshGlobalActivity();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
      return await getUserActivityFeed({});
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

      const activity = await getUserActivityFeed({});
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
