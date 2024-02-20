import { TypedPaginatedResult } from 'server/types';

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
    if (validateOrderDirection(orderDirection)) {
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
    if (validateOrderDirection(orderDirectionSecondary)) {
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
  bind: PaginationSqlBind,
): TypedPaginatedResult<T> {
  return {
    results: items,
    limit: bind.limit,
    page: Math.floor(bind.offset / bind.limit) + 1,
    totalPages: Math.floor(totalResults / bind.limit) + 1,
    totalResults,
  };
}
