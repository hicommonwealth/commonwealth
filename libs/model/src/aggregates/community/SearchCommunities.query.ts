import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function SearchCommunities(): Query<typeof schemas.SearchCommunities> {
  return {
    ...schemas.SearchCommunities,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { search, limit, cursor, order_by, order_direction } = payload;

      const orderBy = ['name', 'created_at', 'default_symbol'].includes(
        order_by || '',
      )
        ? order_by
        : 'created_at';
      const { sql: paginationSort, bind: paginationBind } =
        schemas.buildPaginationSql({
          limit: Math.min(limit || 10, 100),
          page: cursor || 1,
          orderBy: `C.${orderBy}`,
          orderDirection: order_direction || 'ASC',
        });
      const bind = { searchTerm: search, ...paginationBind };

      const sqlWithoutPagination = `
    SELECT
      C.id,
      C.name,
      C.default_symbol,
      C.type,
      C.icon_url,
      C.created_at
    FROM
      "Communities" C
    WHERE
      C.active = TRUE AND
      (C.name ILIKE '%' || $searchTerm || '%' OR
      C.default_symbol ILIKE '%' || $searchTerm || '%')
  `;
      const [results, [{ count }]] = await Promise.all([
        models.sequelize.query<z.infer<typeof schemas.SearchCommunityView>>(
          `${sqlWithoutPagination} ${paginationSort}`,
          {
            bind,
            type: QueryTypes.SELECT,
          },
        ),
        models.sequelize.query<{ count: string }>(
          `SELECT COUNT(*) FROM ( ${sqlWithoutPagination} ) as count`,
          { bind, type: QueryTypes.SELECT },
        ),
      ]);
      return schemas.buildPaginatedResponse(results, parseInt(count, 10), bind);
    },
  };
}
