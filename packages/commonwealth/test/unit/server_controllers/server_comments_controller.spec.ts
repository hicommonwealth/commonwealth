import { CommunityInstance, commonProtocol } from '@hicommonwealth/model';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { SearchCommentsOptions } from 'server/controllers/server_comments_methods/search_comments';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

chai.use(chaiAsPromised);

describe('ServerCommentsController', () => {
  beforeEach(() => {
    vi.spyOn(
      commonProtocol.contractHelpers,
      'getNamespaceBalance',
    ).mockResolvedValue({
      '0x123': '0',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks;
  });

  describe('#searchComments', () => {
    test('should return comment search results', async () => {
      const db = {
        sequelize: {
          query: (sql: string) => {
            if (sql.includes('COUNT')) {
              return [{ count: '11' }];
            }
            return Array(5)
              .fill(0)
              .map((_, idx) => ({ id: idx + 1 }));
          },
        },
      };

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
      const community = { id: 'ethereum' };
      const searchOptions: SearchCommentsOptions = {
        community: community as CommunityInstance,
        search: 'hello',
        limit: 5,
        page: 2,
        orderBy: 'created_at',
        orderDirection: 'DESC',
        includeCount: true,
      };
      const comments =
        await serverCommentsController.searchComments(searchOptions);
      expect(comments.results).to.have.length(5);
      expect(comments.results[0].id).to.equal(1);
      expect(comments.results[1].id).to.equal(2);
      expect(comments.limit).to.equal(5);
      expect(comments.page).to.equal(2);
      expect(comments.totalPages).to.equal(3);
      expect(comments.totalResults).to.equal(11);
    });
  });
});
