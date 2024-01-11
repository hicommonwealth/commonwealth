import { expect } from 'chai';
import { IPagination, OrderByOptions } from '../../../server/api/extApiTypes';
import {
  PaginationResult,
  PaginationSqlOptions,
  PaginationSqlResult,
  buildPaginationSql,
  formatPagination,
} from '../../../server/util/queries';

describe('queries', () => {
  describe('formatPagination', () => {
    it('should handle limit, page (case 1)', () => {
      const input: IPagination = { limit: 10, page: 1 };
      const expectedOutput: PaginationResult = {
        limit: 10,
        offset: 0,
        order: [[OrderByOptions.CREATED, 'DESC']],
      };
      const result = formatPagination(input);
      expect(result).deep.equals(expectedOutput);
    });

    it('should handle limit, page (case 2)', () => {
      const input: IPagination = { limit: 15, page: 3 };
      const expectedOutput: PaginationResult = {
        limit: 15,
        offset: 30,
        order: [[OrderByOptions.CREATED, 'DESC']],
      };
      const result = formatPagination(input);
      expect(result).deep.equals(expectedOutput);
    });

    it('should handle limit, page, sort', () => {
      const input: IPagination = {
        limit: 15,
        page: 3,
        sort: OrderByOptions.UPDATED,
      };
      const expectedOutput: PaginationResult = {
        limit: 15,
        offset: 30,
        order: [[OrderByOptions.UPDATED, 'DESC']],
      };
      const result = formatPagination(input);
      expect(result).deep.equals(expectedOutput);
    });
  });

  describe('buildPaginationSql', () => {
    it('should handle base case DESC', () => {
      const input: PaginationSqlOptions = {
        limit: 15,
        page: 3,
        orderBy: 'custom_column',
        orderDirection: 'DESC',
      };
      const expectedOutput: PaginationSqlResult = {
        sql: 'ORDER BY custom_column DESC LIMIT $limit OFFSET $offset',
        bind: {
          limit: 15,
          offset: 30,
        },
      };
      const result = buildPaginationSql(input);
      expect(result).deep.equals(expectedOutput);
    });

    it('should handle base case ASC', () => {
      const input: PaginationSqlOptions = {
        limit: 15,
        page: 3,
        orderBy: 'another_column',
        orderDirection: 'ASC',
      };
      const expectedOutput: PaginationSqlResult = {
        sql: 'ORDER BY another_column ASC LIMIT $limit OFFSET $offset',
        bind: {
          limit: 15,
          offset: 30,
        },
      };
      const result = buildPaginationSql(input);
      expect(result).deep.equals(expectedOutput);
    });
  });
});
