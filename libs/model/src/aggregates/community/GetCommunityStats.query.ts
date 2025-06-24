import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod/v4';
import { models } from '../../database';
import { authRoles } from '../../middleware';

const NUM_PREV_DAYS = 28;

export function GetCommunityStats(): Query<typeof schemas.GetCommunityStats> {
  return {
    ...schemas.GetCommunityStats,
    auth: [authRoles('admin', 'moderator')],
    secure: false,
    body: async ({ payload }) => {
      const { community_id } = payload;

      const new_objects = async (table: string) => {
        const isComments = table === '"Comments"';
        return await models.sequelize.query<z.infer<typeof schemas.Batchable>>(
          `
          SELECT
            seq.date, COUNT(tbl.*) AS new_items
          FROM
            (SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${NUM_PREV_DAYS}) AS seq(date)) seq
            LEFT JOIN ${table} tbl ON tbl.created_at::date = seq.date
            ${isComments ? 'LEFT JOIN "Threads" t on t.id = tbl.thread_id' : ''}
          WHERE 
            ${isComments ? 't' : 'tbl'}.community_id = :community_id
          GROUP BY
            seq.date ${isComments ? ', t.community_id' : ''}
          ORDER BY
            seq.date DESC;`,
          {
            type: QueryTypes.SELECT,
            replacements: { community_id },
          },
        );
      };
      const roles = await new_objects('"Addresses"');
      const threads = await new_objects('"Threads"');
      const comments = await new_objects('"Comments"');

      const totals = async (table: string) => {
        const isComments = table === '"Comments"';
        const [result] = await models.sequelize.query<{ new_items: number }>(
          `
          SELECT
            COUNT(tbl.id) AS new_items 
          FROM
            ${table} tbl 
            ${isComments ? 'LEFT JOIN "Threads" t on t.id = tbl.thread_id' : ''}
          WHERE
            ${isComments ? 't' : 'tbl'}.community_id = :community_id;
          `,
          {
            type: QueryTypes.SELECT,
            replacements: { community_id },
          },
        );
        return result.new_items;
      };
      const total_roles = await totals('"Addresses"');
      const total_threads = await totals('"Threads"');
      const total_comments = await totals('"Comments"');

      const active_accounts = await models.sequelize.query<
        z.infer<typeof schemas.Batchable>
      >(
        `
    SELECT
      seq.date, COUNT(DISTINCT objs.address_id) AS new_items
    FROM
      (SELECT CURRENT_DATE - seq.date AS date FROM generate_series(0, ${NUM_PREV_DAYS}) AS seq(date)) seq
      LEFT JOIN (
        SELECT
          address_id, created_at
        FROM
          "Threads"
        WHERE
          created_at > CURRENT_DATE - ${NUM_PREV_DAYS}
          AND community_id = :community_id
        UNION
        SELECT 
          c.address_id, c.created_at 
        FROM
          "Comments" c 
          LEFT JOIN "Threads" t on t.id = c.thread_id
        WHERE
          c.created_at > CURRENT_DATE - ${NUM_PREV_DAYS}
          AND t.community_id = :community_id
        UNION
        SELECT 
          r.address_id, r.created_at 
        FROM
          "Reactions" r 
          LEFT JOIN "Threads" t on t.id = r.thread_id
        WHERE
          r.created_at > CURRENT_DATE - ${NUM_PREV_DAYS}
          AND community_id = :community_id
      ) objs ON objs.created_at::date = seq.date
    GROUP BY seq.date
    ORDER BY seq.date DESC;
    `,
        {
          type: QueryTypes.SELECT,
          replacements: { community_id },
        },
      );

      return {
        batches: {
          active_accounts,
          comments,
          roles,
          threads,
        },
        totals: {
          total_comments: +total_comments,
          total_roles: +total_roles,
          total_threads: +total_threads,
        },
      };
    },
  };
}
