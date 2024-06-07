import { CommunityInstance, commonProtocol } from '@hicommonwealth/model';
import { NotificationCategories } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { SearchCommentsOptions } from 'server/controllers/server_comments_methods/search_comments';
import Sinon from 'sinon';
import { BAN_CACHE_MOCK_FN } from 'test/util/banCacheMock';

describe('ServerCommentsController', () => {
  beforeEach(() => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      '0x123': '0',
    });
  });
  afterEach(() => {
    Sinon.restore();
  });
  describe('#createCommentReaction', () => {
    it('should create a comment reaction (new reaction)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        sequelize: {
          transaction: async (callback) => {
            return callback();
          },
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
        },
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            community_id: 'ethereum',
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
              community_id: 'ethereum',
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
          update: sandbox.stub().resolves(null),
          findOne: sandbox.stub().resolves({
            id: 3,
            text: 'my comment body',
            Thread: {
              id: 4,
              title: 'Big Thread!',
              community_id: 'ethereum',
            },
          }),
        },
        CommunityStake: {
          findOne: sandbox.stub().resolves({
            id: 5,
            stake_id: 1,
            vote_weight: 1,
          }),
        },
        Community: {
          findByPk: async () => ({
            id: 'ethereum',
            namespace: 'cake',
          }),
        },
        ChainNode: {
          findByPk: async () => ({
            eth_chain_id: 8453,
            url: 'test.com',
          }),
        },
      };
      const banCache = BAN_CACHE_MOCK_FN('ethereum');

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
        community_id: 'ethereum',
        save: async () => {},
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );

      const [newReaction, allNotificationOptions, allAnalyticsOptions] =
        await serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
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
      expect(notification.data).to.include({
        thread_id: 4,
        comment_id: 3,
        comment_text: 'my comment body',
        root_title: 'Big Thread!',
        root_type: null,
        community_id: 'ethereum',
        author_address: '0x123',
        author_community_id: 'ethereum',
      });

      expect(allNotificationOptions[0]).to.have.property('excludeAddresses');
      const { excludeAddresses } = allNotificationOptions[0];
      // @ts-expect-error StrictNullChecks
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
          update: sandbox.stub().resolves(null),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            community_id: 'ethereum',
          }),
        },
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const reaction = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
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
          update: sandbox.stub().resolves(null),
        },
        Thread: {
          findOne: sandbox.stub().resolves(null),
        },
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const reaction = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          reaction: reaction as any,
          commentId: 123,
        }),
      ).to.be.rejectedWith('Thread not found for comment');
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
            Thread: {
              id: 4,
              title: 'Big Thread!',
              community_id: 'ethereum',
            },
          }),
          update: sandbox.stub().resolves(null),
        },
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([false, 'big ban err']),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
          reaction: reaction as any,
          commentId,
        }),
      ).to.be.rejectedWith('Ban error: big ban err');
    });

    it('should throw error (token balance)', async () => {
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
            Thread: {
              id: 4,
              title: 'Big Thread!',
              community_id: 'ethereum',
              topic_id: 77,
            },
          }),
          update: sandbox.stub().resolves(null),
        },
        // for validateTopicThreshold
        Topic: {
          findOne: sandbox.stub().resolves({
            community: {
              ChainNode: {
                id: 99,
              },
            },
            group_ids: [1],
          }),
        },
        CommunityContract: {
          findOne: sandbox.stub().resolves({}),
        },
        // for findAllRoles
        Address: {
          findAll: sandbox.stub().resolves([]),
        },
        Group: {
          findAll: sandbox.stub().resolves([
            {
              id: 1,
              community_id: 'community-trial',
              metadata: {
                name: 'TRIAL Holders',
                description: 'Autogenerated',
                required_requirements: 1,
              },
              requirements: [
                {
                  rule: 'threshold',
                  data: {
                    threshold: '1',
                    source: {
                      source_type: 'erc721',
                      evm_chain_id: 1,
                      contract_address:
                        '0x301A373beBF0160c0583394855D5b10d00a4168a',
                    },
                  },
                },
              ],
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]),
        },
        Membership: {
          findOne: sandbox.stub().resolves({
            group_id: 1,
            last_checked: new Date(),
            reject_reason: 'filler',
          }),
          findAll: sandbox.stub().resolves([]),
          bulkCreate: sandbox.stub().resolves([]),
        },
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
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );

      expect(
        serverCommentsController.createCommentReaction({
          user: user as any,
          address: address as any,
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
      const banCache = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
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
        includeCount: true,
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
        address_id: 1,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        community_id: 'ethereum',
        Address: {
          id: 1,
          address: '0x123',
          community_id: 'ethereum',
          save: async () => ({}),
        },
        Thread: {
          id: 2,
          address_id: 1,
          address: '0x123',
          community_id: 'ethereum',
          title: 'Big Thread!',
        },
        save: async () => ({}),
        toJSON: () => data,
      };
      const db = {
        Address: {
          findAll: async () => [{ id: 1 }], // used in findOneRole
        },
        Comment: {
          findOne: async () => data,
          update: () => (data.text = 'Hello'),
        },
        sequelize: {
          transaction: (callback?: () => Promise<void>) => {
            if (callback) return callback();
            else
              return {
                rollback: () => Promise.resolve({}),
                commit: () => Promise.resolve({}),
              };
          },
        },
      };
      const banCache = {
        checkBan: async () => [true, null],
      };
      const serverCommentsController = new ServerCommentsController(
        db as any,
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
      const commentId = 123;
      const commentBody = 'Hello';
      const [updatedComment, allNotificationOptions] =
        await serverCommentsController.updateComment({
          user: user as any,
          address: address as any,
          commentId,
          commentBody,
        });
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
        community_id: 'ethereum',
        author_address: '0x123',
        author_community_id: 'ethereum',
      });
      expect(allNotificationOptions[0]).to.have.property('excludeAddresses');
      const { excludeAddresses } = allNotificationOptions[0];
      // @ts-expect-error StrictNullChecks
      expect(excludeAddresses[0]).to.equal('0x123');
    });

    it('should throw error (banned)', async () => {
      const data = {
        id: 123,
        thread_id: 2,
        address_id: 1,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        community_id: 'ethereum',
        Address: {
          id: 1,
          address: '0xbanned',
          community_id: 'ethereum',
          save: async () => ({}),
        },
        Thread: {
          id: 2,
          address_id: 1,
          address: '0xbanned',
          community_id: 'ethereum',
          title: 'Big Thread!',
        },
        save: async () => ({}),
        toJSON: () => data,
      };
      const db = {
        Comment: {
          findOne: async () => data,
          update: () => null,
        },
        sequelize: {
          transaction: (callback?: () => Promise<void>) => {
            if (callback) return callback();
            else
              return {
                rollback: () => Promise.resolve({}),
                commit: () => Promise.resolve({}),
              };
          },
        },
      };
      const banCache = BAN_CACHE_MOCK_FN('ethereum');
      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );
      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = {
        id: 1,
        address: '0xbanned',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const commentId = 123;
      const commentBody = 'Hello';
      expect(
        serverCommentsController.updateComment({
          user: user as any,
          address: address as any,
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
          update: () => null,
        },
        Thread: {
          findOne: async () => null,
        },
        sequelize: {
          transaction: (callback?: () => Promise<void>) => {
            if (callback) return callback();
            else
              return {
                rollback: () => Promise.resolve({}),
                commit: () => Promise.resolve({}),
              };
          },
        },
      };
      const banCache = {
        checkBan: async () => [true, null],
      };
      const serverCommentsController = new ServerCommentsController(
        db as any,
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
      const commentId = 123;
      const commentBody = 'Hello';
      expect(
        serverCommentsController.updateComment({
          user: user as any,
          address: address as any,
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
        Address: {
          findAll: async () => [{ address_id: 1 }], // used in findOneRole
        },
        Comment: {
          findOne: async () => ({
            address_id: 1,
            destroy: async () => {
              didDestroy = true;
            },
          }),
          update: () => ({}),
        },
        Subscription: {
          destroy: async () => ({}),
        },
      };
      const banCache = {
        checkBan: () => [true, null],
      };

      const serverCommentsController = new ServerCommentsController(
        db as any,
        banCache as any,
      );

      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = { id: 1 };
      const commentId = 1;
      await serverCommentsController.deleteComment({
        user: user as any,
        address: address as any,
        commentId,
      });
      expect(didDestroy).to.be.true;

      serverCommentsController.deleteComment({
        user: user as any,
        address: address as any,
        commentId,
      });
    });
  });
});
