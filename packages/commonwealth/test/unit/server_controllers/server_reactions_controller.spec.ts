import { expect } from 'chai';
import { ServerReactionsController } from 'server/controllers/server_reactions_controller';
import Sinon from 'sinon';
import { BAN_CACHE_MOCK_FN } from 'test/util/banCacheMock';

describe('ServerReactionsController', () => {
  describe('#deleteReaction', () => {
    it('should delete a reaction', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 777,
            community_id: 'ethereum',
            Address: {
              address: '0x123',
            },
            destroy: sandbox.stub(),
          }),
        },
      };
      const banCache = BAN_CACHE_MOCK_FN('ethereum');

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const serverReactionsController = new ServerReactionsController(
        db as any,
        banCache as any,
      );
      await serverReactionsController.deleteReaction({
        user: user as any,
        reactionId: 777,
        community: { id: 'ethereum' } as any,
        address: address as any,
      });

      expect(
        serverReactionsController.deleteReaction({
          user: user as any,
          reactionId: 777,
          community: { id: 'ethereum' } as any,
          address: {
            ...(address as any),
            address: '0xbanned',
          },
        }),
      ).to.be.rejectedWith('Ban error: banned');
    });

    it('should throw error (reaction not found)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves(null),
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
      const serverReactionsController = new ServerReactionsController(
        db as any,
        banCache as any,
      );
      expect(
        serverReactionsController.deleteReaction({
          user: user as any,
          reactionId: 888,
          address: address as any,
          community: { id: 'ethereum' } as any,
        }),
      ).to.be.rejectedWith(`Reaction not found: 888`);
    });

    it('should throw error (banned)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 999,
            community_id: 'ethereum',
            Address: {
              address: '0x123',
            },
            destroy: sandbox.stub(),
          }),
        },
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([false, 'big ban err']),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const serverReactionsController = new ServerReactionsController(
        db as any,
        banCache as any,
      );
      expect(
        serverReactionsController.deleteReaction({
          user: user as any,
          reactionId: 999,
          address: address as any,
          community: { id: 'ethereum' } as any,
        }),
      ).to.be.rejectedWith('Ban error: big ban err');
    });
  });
});
