import { dispose } from '@hicommonwealth/core';
import {
  tester,
  tokenBalanceCache,
  type CommunityAttributes,
  type DB,
  type UserInstance,
} from '@hicommonwealth/model';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { assert } from 'chai';
import Sinon from 'sinon';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { Errors } from '../../../server/controllers/server_communities_methods/update_community';
import { buildUser } from '../../unit/unitHelpers';

const baseRequest: CommunityAttributes = {
  id: 'ethereum',
  name: 'ethereum',
  chain_node_id: 1,
  default_symbol: 'EDG',
  network: null,
  base: ChainBase.Substrate,
  icon_url: '/static/img/protocols/edg.png',
  active: true,
  type: ChainType.Chain,
  social_links: [],
};

describe('UpdateChain Tests', () => {
  let models: DB;

  before(async () => {
    models = await tester.seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('Correctly updates chain', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;

    let response = await controller.updateCommunity({
      ...baseRequest,
      directory_page_enabled: true,
      directory_page_chain_node_id: 1,
      type: ChainType.Offchain,
      user: user,
    });

    assert.equal(response.directory_page_enabled, true);
    assert.equal(response.directory_page_chain_node_id, 1);
    assert.equal(response.type, 'offchain');

    response = await controller.updateCommunity({
      ...baseRequest,
      directory_page_enabled: false,
      directory_page_chain_node_id: null,
      type: ChainType.Chain,
      user: user,
    });

    assert.equal(response.directory_page_enabled, false);
    assert.equal(response.directory_page_chain_node_id, null);
    assert.equal(response.type, 'chain');
  });

  it('Fails if namespace present but no transaction hash', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 2, isAdmin: false },
    }) as UserInstance;

    try {
      await controller.updateCommunity({
        ...baseRequest,
        user: user,
        namespace: 'tempNamespace',
        chain_node_id: 1263,
      });
    } catch (e) {
      assert.equal(e.message, Errors.InvalidTransactionHash);
    }
  });

  it('Fails if chain node of community does not match supported chain', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 2, isAdmin: false },
    }) as UserInstance;

    try {
      await controller.updateCommunity({
        ...baseRequest,
        user: user,
        namespace: 'tempNamespace',
        transactionHash: '0x1234',
        chain_node_id: 100000,
      });
    } catch (e) {
      assert.equal(e.message, 'Namespace not supported on selected chain');
    }
  });

  // skipped because public chainNodes are unreliable. If you want to test this functionality, update the goleri
  // chainNode and do it locally.
  xit('Correctly updates namespace', async () => {
    Sinon.stub(tokenBalanceCache, 'getBalances').resolves({
      '0x42D6716549A78c05FD8EF1f999D52751Bbf9F46a': '1',
    });

    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 2, isAdmin: false },
    }) as UserInstance;

    // change chain node to one that supports namespace
    await controller.updateCommunity({
      ...baseRequest,
      user: user,
      chain_node_id: 1263,
    });

    const response = await controller.updateCommunity({
      ...baseRequest,
      user: user,
      namespace: 'IanSpace',
      transactionHash:
        '0x474369b51a06b06327b292f25679dcc8765113e002689616e6ab02fa6332690b',
    });

    assert.equal(response.namespace, 'IanSpace');
    Sinon.restore();
  });
});
