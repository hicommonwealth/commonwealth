import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetTokens(): Query<typeof schemas.GetTokens> {
  return {
    ...schemas.GetTokens,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { search = '', cursor, limit, order_by, order_direction } = payload;

      // pagination configuration
      const direction = order_direction || 'DESC';
      const order_col = order_by || 'name';
      const offset = limit! * (cursor! - 1);
      const replacements: {
        search?: string;
        offset: number;
        order_col: string;
        direction: string;
        limit: number;
      } = {
        search: search ? `%${search.toLowerCase()}%` : '',
        offset,
        order_col,
        direction,
        limit,
      };

      const sql = `
        SELECT *,
        count(*) OVER() AS total
        FROM "Tokens"
        ${search ? 'WHERE LOWER(name) LIKE :search' : ''}
        ORDER BY ${order_col} :direction
        LIMIT :limit
        OFFSET :offset
      `;

      const tokens = await models.sequelize.query<
        z.infer<typeof schemas.Token> & { total?: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        nest: true,
      });

      return schemas.buildPaginatedResponse(
        tokens,
        +(tokens.at(0)?.total ?? 0),
        {
          limit,
          offset,
        },
      );
    },
  };
}
