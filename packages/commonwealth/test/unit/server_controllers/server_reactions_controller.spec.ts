import { expect } from 'chai';
import { ServerReactionsController } from 'server/controllers/server_reactions_controller';
import Sinon from 'sinon';

describe('ServerReactionsController', () => {
  describe('#deleteReaction', () => {
    it('should delete a reaction', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 777,
            chain: 'ethereum',
            Address: {
              address: '0x123',
            },
            destroy: sandbox.stub(),
          }),
        },
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const serverReactionsController = new ServerReactionsController(
        db as any,
        banCache as any
      );
      await serverReactionsController.deleteReaction(user as any, 777);
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
      const serverReactionsController = new ServerReactionsController(
        db as any,
        banCache as any
      );
      expect(
        serverReactionsController.deleteReaction(user as any, 888)
      ).to.be.rejectedWith(`Reaction not found: 888`);
    });

    it('should throw error (banned)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 999,
            chain: 'ethereum',
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
      const serverReactionsController = new ServerReactionsController(
        db as any,
        banCache as any
      );
      expect(
        serverReactionsController.deleteReaction(user as any, 999)
      ).to.be.rejectedWith('Ban error: big ban err');
    });
  });
});
