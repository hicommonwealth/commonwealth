import { CommunityInstance, commonProtocol } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { SearchCommentsOptions } from 'server/controllers/server_comments_methods/search_comments';
import Sinon from 'sinon';
import { afterEach, beforeEach, describe, test } from 'vitest';

chai.use(chaiAsPromised);

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
    test('should create a comment reaction (new reaction)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        sequelize: {
          query: sandbox.stub().resolves([]),
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
          findOne: sandbox.stub().resolves(null),
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

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);

      const [newReaction, allAnalyticsOptions] =
        await serverCommentsController.createCommentReaction({
          // @ts-expect-error ignore type
          user,
          // @ts-expect-error ignore type
          address,
          // @ts-expect-error ignore type
          reaction,
          commentId,
        });

      expect(newReaction).to.be.ok;
      expect(allAnalyticsOptions[0]).to.include({
        event: 'Create New Reaction',
        community: 'ethereum',
      });
    });

    test('should throw error (comment not found)', () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        sequelize: {
          query: sandbox.stub().resolves([]),
          transaction: (callback) => Promise.resolve(callback()),
        },
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

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const reaction = {};

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
      expect(
        serverCommentsController.createCommentReaction({
          // @ts-expect-error ignore type
          user,
          // @ts-expect-error ignore type
          address,
          // @ts-expect-error ignore type
          reaction,
          commentId: 123,
        }),
      ).to.be.rejectedWith('Comment not found: 123');
    });

    test('should throw error (thread not found)', () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        sequelize: {
          query: sandbox.stub().resolves([]),
          transaction: (callback) => Promise.resolve(callback()),
        },
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

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const reaction = {};

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
      expect(
        serverCommentsController.createCommentReaction({
          // @ts-expect-error ignore type
          user,
          // @ts-expect-error ignore type
          address,
          // @ts-expect-error ignore type
          reaction,
          commentId: 123,
        }),
      ).to.be.rejectedWith('Thread not found for comment');
    });

    test('should throw error (token balance)', () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        sequelize: {
          query: sandbox.stub().resolves([]),
          transaction: (callback) => Promise.resolve(callback()),
        },
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

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const reaction = {};
      const commentId = 123;

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
      expect(
        serverCommentsController.createCommentReaction({
          // @ts-expect-error ignore type
          user,
          // @ts-expect-error ignore type
          address,
          // @ts-expect-error ignore type
          reaction,
          commentId,
        }),
      ).to.be.rejectedWith('Insufficient token balance');
    });
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

  describe('#updateComment', () => {
    test('should update a comment', async () => {
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
        CommentVersionHistory: {
          create: () => null,
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
          query: () => Promise.resolve([]),
        },
      };

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
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
      const [updatedComment] = await serverCommentsController.updateComment({
        // @ts-expect-error ignore type
        user,
        // @ts-expect-error ignore type
        address,
        commentId,
        commentBody,
      });
      expect(updatedComment).to.include({
        id: 123,
        text: 'Hello',
      });
    });

    test('should throw error (thread not found)', () => {
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
          query: Promise.resolve([]),
        },
      };

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
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
          // @ts-expect-error ignore type
          user,
          // @ts-expect-error ignore type
          address,
          commentId,
          commentBody,
        }),
      ).to.be.rejectedWith('Thread not found for comment');
    });
  });

  describe('#deleteComment', () => {
    test('should delete a comment', async () => {
      let didDestroy = false;
      const db = {
        sequelize: {
          query: Promise.resolve([]),
        },
        Address: {
          findAll: async () => [{ address_id: 1 }], // used in findOneRole
        },
        Comment: {
          findOne: async () => ({
            address_id: 1,
            Thread: { community_id: 1 },
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

      // @ts-expect-error ignore type
      const serverCommentsController = new ServerCommentsController(db);
      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = { id: 1 };
      const commentId = 1;
      await serverCommentsController.deleteComment({
        // @ts-expect-error ignore type
        user,
        // @ts-expect-error ignore type
        address,
        commentId,
      });
      expect(didDestroy).to.be.true;

      serverCommentsController.deleteComment({
        // @ts-expect-error ignore type
        user,
        // @ts-expect-error ignore type
        address,
        commentId,
      });
    });
  });
});
