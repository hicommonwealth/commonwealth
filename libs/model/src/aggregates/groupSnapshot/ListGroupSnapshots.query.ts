import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function ListGroupSnapshots(): Query<typeof schemas.ListGroupSnapshots> {
  return {
    ...schemas.ListGroupSnapshots,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { groupId, status, limit, cursor, order_by, order_direction } =
        payload;

      const direction = order_direction || 'DESC';
      const order_col = order_by || 'snapshot_date';
      const offset = limit! * (cursor! - 1);

      const whereConditions = ['gs.group_id = :groupId'];
      const replacements: { [key: string]: any } = { groupId };

      if (status) {
        whereConditions.push('gs.status = :status');
        replacements.status = status;
      }

      const sql = `
        SELECT
          gs.id,
          gs.group_id,
          gs.block_height,
          gs.snapshot_source,
          gs.balance_map,
          gs.status,
          gs.error_message,
          gs.snapshot_date,
          gs.created_at,
          gs.updated_at,
          COUNT(*) OVER () AS total
        FROM "GroupSnapshots" gs
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY gs.${order_col} ${direction}
        LIMIT :limit
        OFFSET :offset
      `;

      replacements.limit = limit;
      replacements.offset = offset;

      const snapshots = await models.sequelize.query<
        z.infer<typeof schemas.GroupSnapshotView> & { total?: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });

      const totalResults = snapshots.length > 0 ? snapshots[0].total! : 0;

      return schemas.buildPaginatedResponse(
        snapshots.map(({ total, ...snapshot }) => ({
          ...snapshot,
          block_height: snapshot.block_height
            ? BigInt(snapshot.block_height)
            : null,
        })),
        totalResults,
        { limit, offset, cursor },
      );
    },
  };
}
