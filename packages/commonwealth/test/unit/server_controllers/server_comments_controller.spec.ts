import { NotificationCategories } from '@hicommonwealth/core';
import BN from 'bn.js';
import { expect } from 'chai';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { SearchCommentsOptions } from 'server/controllers/server_comments_methods/search_comments';
import Sinon from 'sinon';
import { BAN_CACHE_MOCK_FN } from 'test/util/banCacheMock';
import { CommunityInstance } from '../../../server/models/community';

describe('ServerCommentsController', () => {
  describe('#createCommentReaction', () => {
    it('should create a comment reaction (new reaction)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              community_id: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                community_id: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Comment: {
          findOne: sandbox.stub().resolves({
            id: 3,
            text: 'my comment body',
          }),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = BAN_CACHE_MOCK_FN('ethereum');

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        save: async () => {},
      };
      const community = {
        id: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      const [newReaction, allNotificationOptions, allAnalyticsOptions] =
        await serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          community: community as any,
          reaction: reaction as any,
          commentId,
        });

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: {
            ...(address as any),
            address: '0xbanned',
          },
          community: community as any,
          reaction: reaction as any,
          commentId,
        }),
      ).to.be.rejectedWith('Ban error: banned');

      expect(newReaction).to.be.ok;

      expect(allNotificationOptions[0]).to.have.property('notification');
      const { notification } = allNotificationOptions[0];
      expect(notification).to.have.property(
        'categoryId',
        NotificationCategories.NewReaction,
      );

      expect(notification.data).to.have.property('created_at');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>', notification.data);
      expect(notification.data).to.include({
        thread_id: 4,
        comment_id: 3,
        comment_text: 'my comment body',
        root_title: 'Big Thread!',
        root_type: null,
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });

      expect(allNotificationOptions[0]).to.have.property('excludeAddresses');
      const { excludeAddresses } = allNotificationOptions[0];
      expect(excludeAddresses[0]).to.equal('0x123');

      expect(allAnalyticsOptions[0]).to.include({
        event: 'Create New Reaction',
        community: 'ethereum',
      });
    });

    it('should throw error (comment not found)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              community_id: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                community_id: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Comment: {
          findOne: sandbox.stub().resolves(null),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const community = {
        id: 'ethereum',
      };
      const reaction = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          community: community as any,
          reaction: reaction as any,
          commentId: 123,
        }),
      ).to.be.rejectedWith('Comment not found: 123');
    });

    it('should throw error (thread not found)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              community_id: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                community_id: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Comment: {
          findOne: sandbox.stub().resolves({
            id: 3,
            text: 'my comment body',
          }),
        },
        Thread: {
          findOne: sandbox.stub().resolves(null),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const community = {
        id: 'ethereum',
      };
      const reaction = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          community: community as any,
          reaction: reaction as any,
          commentId: 123,
        }),
      ).to.be.rejectedWith('Thread not found for comment: 123');
    });

    it('should throw error (banned)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              community_id: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                community_id: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Comment: {
          findOne: sandbox.stub().resolves({
            id: 3,
            text: 'my comment body',
          }),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: sandbox.stub().resolves([false, 'big ban err']),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const community = {
        id: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          community: community as any,
          reaction: reaction as any,
          commentId,
        }),
      ).to.be.rejectedWith('Ban error: big ban err');
    });

    it.skip('should throw error (token balance)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              community_id: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                community_id: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Comment: {
          findOne: sandbox.stub().resolves({
            id: 3,
            text: 'my comment body',
          }),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
            topic_id: 77,
          }),
        },
        // for validateTopicThreshold
        Topic: {
          findOne: sandbox.stub().resolves({
            community: {
              ChainNode: {
                id: 99,
              },
            },
            token_threshold: 1,
          }),
        },
        CommunityContract: {
          findOne: sandbox.stub().resolves({}),
        },
        // for findAllRoles
        Address: {
          findAll: sandbox.stub().resolves([]),
        },
      };
      const tokenBalanceCache = {
        fetchUserBalance: sandbox.stub().resolves(new BN(0.5)),
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const community = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          community: community as any,
          reaction: reaction as any,
          commentId,
        }),
      ).to.be.rejectedWith('Insufficient token balance');
    });
  });

  describe('#searchComments', () => {
    it('should return comment search results', async () => {
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
      const tokenBalanceCache = {};
      const banCache = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      const community = { id: 'ethereum' };
      const searchOptions: SearchCommentsOptions = {
        community: community as CommunityInstance,
        search: 'hello',
        limit: 5,
        page: 2,
        orderBy: 'created_at',
        orderDirection: 'DESC',
      };
      const comments = await serverCommentsController.searchComments(
        searchOptions,
      );
      expect(comments.results).to.have.length(5);
      expect(comments.results[0].id).to.equal(1);
      expect(comments.results[1].id).to.equal(2);
      expect(comments.limit).to.equal(5);
      expect(comments.page).to.equal(2);
      expect(comments.totalPages).to.equal(3);
      expect(comments.totalResults).to.equal(11);
    });
  });

  describe('#updateComment', () => {
    it('should update a comment', async () => {
      const data = {
        id: 123,
        thread_id: 2,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        community_id: 'ethereum',
        Address: {
          address: '0x123',
          community_id: 'ethereum',
          save: async () => ({}),
        },
        save: async () => ({}),
        toJSON: () => data,
      };

      const db = {
        Comment: {
          findOne: async () => data,
        },
        Thread: {
          findOne: async () => ({
            id: 1,
            address: '0x123',
            chain: 'ethereum',
            title: 'Big Thread!',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = BAN_CACHE_MOCK_FN('ethereum');

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const community = {
        id: 'ethereum',
      };
      const commentId = 123;
      const commentBody = 'Hello';
      const [updatedComment, allNotificationOptions] =
        await serverCommentsController.updateComment({
          user: user as any,
          address: address as any,
          community: community as any,
          commentId,
          commentBody,
        });

      expect(
        serverCommentsController.updateComment({
          user: user as any,
          address: {
            ...(address as any),
            address: '0xbanned',
          },
          community: community as any,
          commentId,
          commentBody,
        }),
      ).to.be.rejectedWith('Ban error: banned');

      expect(updatedComment).to.include({
        id: 123,
        text: 'Hello',
      });

      expect(allNotificationOptions[0]).to.have.property('notification');
      const { notification } = allNotificationOptions[0];
      expect(notification).to.have.property('categoryId', 'comment-edit');

      expect(notification.data).to.have.property('created_at');
      expect(notification.data).to.include({
        thread_id: 2,
        comment_id: 123,
        comment_text: 'Hello',
        root_title: 'Big Thread!',
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });

      expect(allNotificationOptions[0]).to.have.property('excludeAddresses');
      const { excludeAddresses } = allNotificationOptions[0];
      expect(excludeAddresses[0]).to.equal('0x123');
    });

    it('should throw error (banned)', async () => {
      const data = {
        id: 123,
        thread_id: 2,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        community_id: 'ethereum',
        Address: {
          address: '0x123',
          community_id: 'ethereum',
          save: async () => ({}),
        },
        save: async () => ({}),
        toJSON: () => data,
      };

      const db = {
        Comment: {
          findOne: async () => data,
        },
        Thread: {
          findOne: async () => ({
            id: 1,
            address: '0x123',
            chain: 'ethereum',
            title: 'Big Thread!',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [false, 'banned'],
      };

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const community = {
        id: 'ethereum',
      };
      const commentId = 123;
      const commentBody = 'Hello';
      expect(
        serverCommentsController.updateComment({
          user: user as any,
          address: address as any,
          community: community as any,
          commentId,
          commentBody,
        }),
      ).to.be.rejectedWith('Ban error: banned');
    });

    it('should throw error (thread not found)', async () => {
      const data = {
        id: 123,
        thread_id: 2,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        community_id: 'ethereum',
        Address: {
          address: '0x123',
          community_id: 'ethereum',
          save: async () => ({}),
        },
        save: async () => ({}),
        toJSON: () => data,
      };

      const db = {
        Comment: {
          findOne: async () => data,
        },
        Thread: {
          findOne: async () => null,
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const community = {
        id: 'ethereum',
      };
      const commentId = 123;
      const commentBody = 'Hello';
      expect(
        serverCommentsController.updateComment({
          user: user as any,
          address: address as any,
          community: community as any,
          commentId,
          commentBody,
        }),
      ).to.be.rejectedWith('Thread not found for comment');
    });
  });

  describe('#deleteComment', () => {
    it('should delete a comment', async () => {
      let didDestroy = false;
      const db = {
        Comment: {
          findOne: async () => ({
            destroy: async () => {
              didDestroy = true;
            },
          }),
        },
        Subscription: {
          destroy: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = BAN_CACHE_MOCK_FN('ethereum');

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        tokenBalanceCache as any,
        banCache as any,
      );

      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = {};
      const community = {
        id: 'ethereum',
      };
      const commentId = 1;
      await serverCommentsController.deleteComment({
        user: user as any,
        address: address as any,
        community: community as any,
        commentId,
      });
      expect(didDestroy).to.be.true;

      expect(
        serverCommentsController.deleteComment({
          user: user as any,
          address: {
            ...(address as any),
            address: '0xbanned',
          },
          community: community as any,
          commentId,
        }),
      ).to.be.rejectedWith('Ban error: banned');
    });
  });
});
