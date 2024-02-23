import { expect } from 'chai';
import {
  PaginationSqlOptions,
  PaginationSqlResult,
  buildPaginationSql,
} from '../../../server/util/queries';

describe('queries', () => {
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
