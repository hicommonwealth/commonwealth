import { commonProtocol } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ServerReactionsController } from 'server/controllers/server_reactions_controller';
import Sinon from 'sinon';
import { afterEach, beforeEach, describe, test } from 'vitest';

chai.use(chaiAsPromised);

describe('ServerReactionsController', () => {
  beforeEach(() => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      '0x123': '0',
    });
  });
  afterEach(() => {
    Sinon.restore();
  });
  describe('#deleteReaction', () => {
    test('should delete a reaction', async () => {
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
        sequelize: {
          transaction: async (callback) => {
            return callback();
          },
        },
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const serverReactionsController = new ServerReactionsController(
        db as any,
      );
      await serverReactionsController.deleteReaction({
        user: user as any,
        reactionId: 777,
        community: { id: 'ethereum' } as any,
        address: address as any,
      });
    });

    test('should throw error (reaction not found)', () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves(null),
        },
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const serverReactionsController = new ServerReactionsController(
        db as any,
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
  });
});
