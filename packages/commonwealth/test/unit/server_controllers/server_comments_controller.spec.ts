import BN from 'bn.js';
import { expect } from 'chai';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { ChainInstance } from 'server/models/chain';
import Sinon from 'sinon';

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
              chain: 'ethereum',
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
                chain: 'ethereum',
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
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const [newReaction, allNotificationOptions, allAnalyticsOptions] =
        await serverCommentsController.createCommentReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          commentId
        );

      expect(newReaction).to.be.ok;

      expect(allNotificationOptions[0]).to.have.property(
        'categoryId',
        'new-reaction'
      );
      expect(allNotificationOptions[0]).to.have.property(
        'objectId',
        'comment-3'
      );

      expect(allNotificationOptions[0]).to.have.property('notificationData');
      const { notificationData } = allNotificationOptions[0];
      expect(notificationData).to.have.property('created_at');
      expect(notificationData).to.include({
        thread_id: 4,
        comment_id: 3,
        comment_text: 'my comment body',
        root_title: 'Big Thread!',
        root_type: null,
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });

      expect(allNotificationOptions[0]).to.have.property('webhookData');
      const { webhookData } = allNotificationOptions[0];
      expect(webhookData).to.include({
        user: '0x123',
        author_chain: 'ethereum',
        url: 'http://localhost:8080/ethereum/discussion/4-big-thread',
        title: 'Big Thread!',
        chain: 'ethereum',
        body: 'my comment body',
      });

      expect(allNotificationOptions[0]).to.have.property('excludeAddresses');
      const { excludeAddresses } = allNotificationOptions[0];
      expect(excludeAddresses[0]).to.equal('0x123');

      expect(allAnalyticsOptions[0]).to.include({
        event: 'Create New Reaction',
        community: 'ethereum',
        isCustomDomain: null,
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
              chain: 'ethereum',
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
                chain: 'ethereum',
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
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverCommentsController.createCommentReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          123
        )
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
              chain: 'ethereum',
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
                chain: 'ethereum',
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
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverCommentsController.createCommentReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          123
        )
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
              chain: 'ethereum',
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
                chain: 'ethereum',
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
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverCommentsController.createCommentReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          commentId
        )
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
              chain: 'ethereum',
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
                chain: 'ethereum',
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
            chain: {
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
        CommunityRole: {
          findAll: sandbox.stub().resolves([
            {
              toJSON: () => ({}),
            },
          ]),
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
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverCommentsController.createCommentReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          commentId
        )
      ).to.be.rejectedWith('Could not verify user token balance');
    });
  });

  describe('#getCommentReactions', () => {
    it('should return comment reactions', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findAll: sandbox
            .stub()
            .resolves([
              { toJSON: () => ({ id: 1 }) },
              { toJSON: () => ({ id: 2 }) },
            ]),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const reactions = await serverCommentsController.getCommentReactions(777);
      expect(reactions).to.have.length(2);
    });
  });

  describe('#searchComments', () => {
    it('should return comment search results', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        sequelize: {
          query: sandbox.stub().resolves([{ id: 1 }, { id: 2 }]),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {};

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const chain = { id: 'ethereum' };
      const searchOptions = {
        search: 'hello',
        sort: 'blah',
        page: 7,
        pageSize: 5,
      };
      const comments = await serverCommentsController.searchComments(
        chain as ChainInstance,
        searchOptions.search,
        searchOptions.sort,
        searchOptions.page,
        searchOptions.pageSize
      );
      const sqlArgs = db.sequelize.query.args[0];
      expect(sqlArgs).to.have.length(2);
      expect(sqlArgs[1].bind).to.include({
        searchTerm: 'hello',
        limit: 5,
        offset: 30,
        chain: 'ethereum',
      });
      expect(comments).to.have.length(2);
      expect(comments[0].id).to.equal(1);
      expect(comments[1].id).to.equal(2);
    });
  });

  describe('#updateComment', () => {
    it('should update a comment', async () => {
      let data;
      data = {
        id: 123,
        thread_id: 2,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        chain: 'ethereum',
        Address: {
          address: '0x123',
          chain: 'ethereum',
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
        checkBan: async () => [true, null],
      };

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
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
      const chain = {
        id: 'ethereum',
      };
      const commentId = 123;
      const commentBody = 'Hello';
      const [updatedComment, allNotificationOptions] =
        await serverCommentsController.updateComment(
          user as any,
          address as any,
          chain as any,
          commentId,
          commentBody
        );

      expect(updatedComment).to.include({
        id: 123,
        text: 'Hello',
      });

      expect(allNotificationOptions[0]).to.have.property(
        'categoryId',
        'comment-edit'
      );

      expect(allNotificationOptions[0]).to.have.property('notificationData');
      const { notificationData } = allNotificationOptions[0];
      expect(notificationData).to.have.property('created_at');
      expect(notificationData).to.include({
        thread_id: 2,
        comment_id: 123,
        comment_text: 'Hello',
        root_title: 'Big Thread!',
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });

      expect(allNotificationOptions[0]).to.have.property('webhookData');
      const { webhookData } = allNotificationOptions[0];
      expect(webhookData).to.include({
        user: '0x123',
        url: 'http://localhost:8080/ethereum/discussion/1-big-thread?comment=123',
        title: 'Big Thread!',
        chain: 'ethereum',
      });

      expect(allNotificationOptions[0]).to.have.property('excludeAddresses');
      const { excludeAddresses } = allNotificationOptions[0];
      expect(excludeAddresses[0]).to.equal('0x123');
    });

    it('should throw error (banned)', async () => {
      let data;
      data = {
        id: 123,
        thread_id: 2,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        chain: 'ethereum',
        Address: {
          address: '0x123',
          chain: 'ethereum',
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
        banCache as any
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
      const chain = {
        id: 'ethereum',
      };
      const commentId = 123;
      const commentBody = 'Hello';
      expect(
        serverCommentsController.updateComment(
          user as any,
          address as any,
          chain as any,
          commentId,
          commentBody
        )
      ).to.be.rejectedWith('Ban error: banned');
    });

    it('should throw error (thread not found)', async () => {
      let data;
      data = {
        id: 123,
        thread_id: 2,
        text: 'Wasup',
        version_history: ['{"body":""}'],
        chain: 'ethereum',
        Address: {
          address: '0x123',
          chain: 'ethereum',
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
        banCache as any
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
      const chain = {
        id: 'ethereum',
      };
      const commentId = 123;
      const commentBody = 'Hello';
      expect(
        serverCommentsController.updateComment(
          user as any,
          address as any,
          chain as any,
          commentId,
          commentBody
        )
      ).to.be.rejectedWith('Thread not found for comment');
    });
  });

  describe('#deleteComment', () => {
    it('should delete a comment', async () => {
      const db = {
        Comment: {
          findOne: async () => ({
            destroy: async () => ({}),
          }),
        },
        Subscription: {
          destroy: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverCommentsController = new ServerCommentsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const user = {
        getAddresses: async () => [{ id: 1, verified: true }],
      };
      const address = {};
      const chain = {};
      const commentId = 1;
      await serverCommentsController.deleteComment(
        user as any,
        address as any,
        chain as any,
        commentId
      );
    });
  });
});
