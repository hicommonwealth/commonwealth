import type { IPagination } from 'common-common/src/api/extApiTypes';
import { OrderByOptions } from 'common-common/src/api/extApiTypes';

/*
These methods are for generating the sequelize formatting for
different types of query options. Enumerated methods here
for ORDERING, GROUPING, LIMIT, OFFSET
*/

// Yields `LIMIT count`
export const limitBy = (count: number) => {
  return { limit: count };
};

// Yields `LIMIT count OFFSET page`
export const paginate = (count: number, page: number) => {
  return { limit: count, offset: count * (page - 1) };
};

// helper methods
export type PaginationResult = {
  limit?: number;
  offset?: number;
  order?: any;
};
export const formatPagination = (query: IPagination): PaginationResult => {
  const { limit, page } = query;
  let pagination: PaginationResult = {};
  if (limit && page) pagination = paginate(limit, page);
  else if (limit) pagination = limitBy(limit);

  pagination.order = [[OrderByOptions.CREATED, 'DESC']];
  if (query.sort === OrderByOptions.UPDATED)
    pagination.order = [[OrderByOptions.UPDATED, 'DESC']];

  return pagination;
};

export const formatPaginationNoSort = (query: {
  limit?: number;
  page?: number;
}) => {
  const { limit, page } = query;
  let pagination: any = {};
  if (limit && page) pagination = paginate(limit, page);
  else if (limit) pagination = limitBy(limit);

  return pagination;
};

export const flattenIncludedAddresses = (entities) => {
  entities.forEach((e) => {
    e.dataValues['address'] = e.dataValues.Address.address;
    delete e.dataValues.Address;
  });
};

export type PaginationSqlOptions = {
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
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

export const buildPaginationSql = (
  options: PaginationSqlOptions
): PaginationSqlResult => {
  const { limit, page, orderBy, orderDirection, nullsLast } = options;
  let sql = '';
  const bind: PaginationSqlBind = {};
  if (typeof limit === 'number') {
    sql += `ORDER BY ${orderBy} `;
    if (['ASC', 'DESC'].includes(orderDirection)) {
      sql += `${orderDirection} `;
      if (nullsLast) {
        sql += 'NULLS LAST ';
      }
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
