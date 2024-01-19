import { models, UserInstance } from '@hicommonwealth/model';
import { assert } from 'chai';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { Errors } from '../../../server/controllers/server_communities_methods/create_chain_node';
import { buildUser } from '../../unit/unitHelpers';

describe('create chain tests', () => {
  it('fails when no eth_chain_id is provided when chain is ethereum', async () => {
    const controller = new ServerCommunitiesController(models, null, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;
    try {
      await controller.createChainNode({
        user,
        url: 'wss://',
        name: 'test',
        balanceType: 'ethereum',
      });
    } catch (e) {
      assert.equal(e.status, 400);
      assert.equal(e.message, Errors.ChainIdNaN);
      return;
    }

    assert.fail(0, 1, 'Exception not thrown');
  });

  it('fails when eth_chain_id is not a number', async () => {
    const controller = new ServerCommunitiesController(models, null, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;
    try {
      await controller.createChainNode({
        user,
        url: 'wss://',
        balanceType: 'ethereum',
        name: 'test',
        eth_chain_id: 'test' as unknown as number,
      });
    } catch (e) {
      assert.equal(e.status, 400);
      assert.equal(e.message, Errors.ChainIdNaN);
      return;
    }

    assert.fail(0, 1, 'Exception not thrown');
  });
});
