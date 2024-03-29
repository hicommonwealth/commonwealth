import z from 'zod';

export const PaginationParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  cursor: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe(
      'required for tRPC useInfiniteQuery hook, equivalent to page number',
    ),
  order_by: z.enum(['name', 'groups', 'stakeBalance', 'lastActive']).optional(),
  order_direction: z.enum(['ASC', 'DESC']).optional(),
});

export type TypedPaginatedResult<T> = {
  results: T[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

export const PaginatedResultSchema = z.object({
  limit: z.number().int(),
  page: z.number().int(),
  totalPages: z.number().int(),
  totalResults: z.number().int(),
});

/*
These methods are for generating the sequelize formatting for
different types of query options. Enumerated methods here
for ORDERING, GROUPING, LIMIT, OFFSET
*/

export type PaginationSqlOptions = {
  limit?: number;
  page?: number;
  orderBy?: string;
  orderBySecondary?: string;
  orderDirection?: 'ASC' | 'DESC';
  orderDirectionSecondary?: 'ASC' | 'DESC';
  nullsLast?: boolean;
};
export type PaginationSqlResult = {
  sql: string;
  bind: {
    limit?: number;
    offset?: number;
    orderDirection?: string;
  };
};
export type PaginationSqlBind = PaginationSqlResult['bind'];

export const validateOrderDirection = (
  orderDirection: string,
  allowEmpty?: boolean,
): boolean => {
  if (allowEmpty && !orderDirection) {
    return true;
  }
  return ['ASC', 'DESC'].includes(orderDirection);
};

export const buildPaginationSql = (
  options: PaginationSqlOptions,
): PaginationSqlResult => {
  const {
    limit,
    page,
    orderBy,
    orderBySecondary,
    orderDirection,
    orderDirectionSecondary,
    nullsLast,
  } = options;
  let sql = '';
  const bind: PaginationSqlBind = {};
  if (typeof limit === 'number') {
    sql += `ORDER BY ${orderBy} `;
    if (validateOrderDirection(orderDirection!)) {
      sql += `${orderDirection} `;
      if (nullsLast) {
        sql += 'NULLS LAST ';
      }
    } else {
      sql += 'DESC ';
    }
  }
  // TODO: check if nullsLast works with secondary order
  if (orderBy && orderBySecondary) {
    sql += `, ${orderBySecondary} `;
    if (validateOrderDirection(orderDirectionSecondary!)) {
      sql += `${orderDirectionSecondary} `;
    } else {
      sql += 'DESC ';
    }
  }
  if (typeof limit === 'number') {
    sql += 'LIMIT $limit ';
    bind.limit = limit;
    if (typeof page === 'number') {
      sql += 'OFFSET $offset';
      bind.offset = limit * (page - 1);
    }
  }
  return { sql, bind };
};

export function buildPaginatedResponse<T>(
  items: T[],
  totalResults: number,
  options: {
    limit?: number;
    offset?: number;
  },
): TypedPaginatedResult<T> {
  const limit = options.limit || 10;
  return {
    results: items,
    limit: options.limit!,
    page: Math.floor(options.offset! / limit) + 1,
    totalPages: Math.floor(totalResults / limit) + 1,
    totalResults,
  };
}
