function getFilterString(chain_filter: string) {
  if (chain_filter) return ' AND S.chain_id = ? ';
  else return '';
}

export function buildChainEventQuery(
  user_id: number,
  chain_filter?: string
): { query: string; replacements: any[] } {
  const query = `
                SELECT S.id,
                   S.subscriber_id,
                   S.category_id,
                   S.object_id,
                   S.is_active,
                   S.created_at,
                   S.immediate_email,
                   COALESCE(S.chain_id, N.chain_id) as chain_id,
                   S.offchain_comment_id,
                   S.offchain_thread_id,
                   N.id         as notification_id,
                   N.notification_data,
                   N.created_at as notification_created_at
            FROM "Subscriptions" S
                     INNER JOIN "Notifications" N ON S.category_id = N.category_id AND S.chain_id = N.chain_id
            WHERE S.category_id = 'chain-event'
              AND S.subscriber_id = ?
              AND S.is_active = true
              ${getFilterString(chain_filter)}
              AND N.created_at >= S.created_at
            ORDER BY notification_created_at DESC;
  `;

  if (chain_filter) return { query, replacements: [user_id, chain_filter] };
  else return { query, replacements: [user_id] };
}

export function buildUserNotifQuery(
  user_id: number,
  chain_filter?: string
): { query: string; replacements: any[] } {
  const query = `
          SELECT S.id,
       S.subscriber_id,
       S.category_id,
       S.object_id,
       S.is_active,
       S.created_at,
       S.immediate_email,
       COALESCE(S.chain_id, N.chain_id) as chain_id,
       S.offchain_comment_id,
       S.offchain_thread_id,
       N.id         as notification_id,
       N.notification_data,
       N.created_at as notification_created_at
      FROM "Notifications" N
               INNER JOIN "Subscriptions" S ON S.category_id = N.category_id AND S.subscriber_id = N.user_id
      WHERE 
        user_id = ?
        AND (S.category_id = 'new-mention' OR S.category_id = 'new-collaboration')
        ${getFilterString(chain_filter)}
      ORDER BY notification_created_at DESC;
  `;

  if (chain_filter) return { query, replacements: [user_id, chain_filter] };
  else return { query, replacements: [user_id] };
}

export function buildCommentQuery(
  user_id: number,
  chain_filter?: string
): { query: string; replacements: any[] } {
  const query = `
            SELECT S.id,
               S.subscriber_id,
               S.category_id,
               S.object_id,
               S.is_active,
               S.created_at,
               S.immediate_email,
               COALESCE(S.chain_id, N.chain_id) as chain_id,
               S.offchain_comment_id,
               S.offchain_thread_id,
               N.id         as notification_id,
               N.notification_data,
               N.created_at as notification_created_at
        FROM "Subscriptions" S
                 INNER JOIN "Notifications" N ON S.category_id = N.category_id AND S.chain_id = N.chain_id AND
                                                 S.offchain_comment_id = N.parent_comment_id
        WHERE N.category_id = 'new-comment-creation'
          AND S.subscriber_id = ?
          AND S.is_active = true
          ${getFilterString(chain_filter)}
          AND N.created_at >= S.created_at
        UNION ALL
        -- root level comments
        SELECT S.id,
               S.subscriber_id,
               S.category_id,
               S.object_id,
               S.is_active,
               S.created_at,
               S.immediate_email,
               COALESCE(S.chain_id, N.chain_id) as chain_id,
               S.offchain_comment_id,
               S.offchain_thread_id,
               N.id         as notification_id,
               N.notification_data,
               N.created_at as notification_created_at
        FROM "Subscriptions" S
                 INNER JOIN "Notifications" N
                            ON S.category_id = N.category_id AND S.chain_id = N.chain_id AND S.offchain_thread_id = N.thread_id
        WHERE N.category_id = 'new-comment-creation'
          AND S.subscriber_id = ?
          AND S.is_active = true
          ${getFilterString(chain_filter)}
          AND N.created_at >= S.created_at
        ORDER BY notification_created_at DESC;
  `;

  if (chain_filter)
    return {
      query,
      replacements: [user_id, chain_filter, user_id, chain_filter],
    };
  else return { query, replacements: [user_id, user_id] };
}

export function buildReactionQuery(
  user_id: number,
  chain_filter?: string
): { query: string; replacements: any[] } {
  // WARNING: The MATERIALIZED CTE should not be removed/simplified as it is a carefully
  // constructed query plan optimization. Its purpose is to force PostgreSQL to filter
  // the Subscriptions table first which is hugely larger than the Notifications table
  const query = `
                WITH S AS MATERIALIZED (
              SELECT * FROM "Subscriptions" S
              WHERE S.category_id = 'new-reaction'
                AND S.subscriber_id = ?
                ${getFilterString(chain_filter)}
                AND S.is_active = true
          ) SELECT S.id,
                   S.subscriber_id,
                   S.category_id,
                   S.object_id,
                   S.is_active,
                   S.created_at,
                   S.immediate_email,
                   COALESCE(S.chain_id, N.chain_id) as chain_id,
                   S.offchain_comment_id,
                   S.offchain_thread_id,
                   N.id         as notification_id,
                   N.notification_data,
                   N.created_at as notification_created_at
          FROM S
                   INNER JOIN "Notifications" N ON S.category_id = N.category_id AND S.chain_id = N.chain_id AND
                                                   S.offchain_thread_id = N.thread_id
          WHERE N.created_at >= S.created_at
          UNION ALL
          -- child reactions
          SELECT S.id,
                 S.subscriber_id,
                 S.category_id,
                 S.object_id,
                 S.is_active,
                 S.created_at,
                 S.immediate_email,
                 COALESCE(S.chain_id, N.chain_id) as chain_id,
                 S.offchain_comment_id,
                 S.offchain_thread_id,
                 N.id         as notification_id,
                 N.notification_data,
                 N.created_at as notification_created_at
          FROM "Subscriptions" S
                   INNER JOIN "Notifications" N ON S.category_id = N.category_id AND S.chain_id = N.chain_id AND
                                                   S.offchain_comment_id = N.comment_id
          WHERE S.category_id = 'new-reaction'
            AND S.subscriber_id = ?
            AND S.is_active = true
            ${getFilterString(chain_filter)}
            AND N.created_at >= S.created_at
          ORDER BY notification_created_at DESC;
  `;

  if (chain_filter)
    return {
      query,
      replacements: [user_id, chain_filter, user_id, chain_filter],
    };
  else return { query, replacements: [user_id, user_id] };
}

export function buildThreadSnapshotQuery(
  user_id: number,
  chain_filter?: string
): { query: string; replacements: any[] } {
  const query = `
              SELECT S.id,
                 S.subscriber_id,
                 S.category_id,
                 S.object_id,
                 S.is_active,
                 S.created_at,
                 S.immediate_email,
                 COALESCE(S.chain_id, N.chain_id) as chain_id,
                 S.offchain_comment_id,
                 S.offchain_thread_id,
                 N.id         as notification_id,
                 N.notification_data,
                 N.created_at as notification_created_at
          FROM "Subscriptions" S
                   INNER JOIN "Notifications" N
                              ON N.category_id = S.category_id AND N.chain_id = S.chain_id
          WHERE S.category_id = 'new-thread-creation'
            AND S.subscriber_id = ?
            AND S.is_active = true
            ${getFilterString(chain_filter)}
            AND N.created_at >= S.created_at
          UNION ALL
          SELECT S.id,
                 S.subscriber_id,
                 S.category_id,
                 S.object_id,
                 S.is_active,
                 S.created_at,
                 S.immediate_email,
                 COALESCE(S.chain_id, N.chain_id) as chain_id,
                 S.offchain_comment_id,
                 S.offchain_thread_id,
                 N.id         as notification_id,
                 N.notification_data,
                 N.created_at as notification_created_at
          FROM "Subscriptions" S
                   INNER JOIN "Notifications" N ON S.category_id = N.category_id AND S.snapshot_id = N.snapshot_id
          WHERE S.category_id = 'snapshot-proposal'
            AND S.subscriber_id = ?
            AND S.is_active = true
            ${getFilterString(chain_filter)}
            AND N.created_at >= S.created_at
          ORDER BY notification_created_at DESC;
  `;

  if (chain_filter)
    return {
      query,
      replacements: [user_id, chain_filter, user_id, chain_filter],
    };
  else return { query, replacements: [user_id, user_id] };
}
