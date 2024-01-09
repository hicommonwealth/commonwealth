import { ChainBase, ChainType } from '@hicommonwealth/core';
import { assert } from 'chai';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import models from '../../../server/database';
import { CommunityAttributes } from '../../../server/models/community';
import { UserInstance } from '../../../server/models/user';
import { buildUser } from '../../unit/unitHelpers';
import { resetDatabase } from '../../util/resetDatabase';

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
  before(async () => {
    await resetDatabase();
  });

  it('Correctly updates chain', async () => {
    const controller = new ServerCommunitiesController(models, null, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;

    let response = await controller.updateCommunity({
      directory_page_enabled: true,
      directory_page_chain_node_id: 1,
      ...baseRequest,
      user: user,
    });

    assert.equal(response.directory_page_enabled, true);
    assert.equal(response.directory_page_chain_node_id, 1);

    response = await controller.updateCommunity({
      directory_page_enabled: false,
      directory_page_chain_node_id: null,
      ...baseRequest,
      user: user,
    });

    assert.equal(response.directory_page_enabled, false);
    assert.equal(response.directory_page_chain_node_id, null);
  });

  it('Correctly updates namespace', async () => {
    const controller = new ServerCommunitiesController(models, null, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;

    const response = await controller.updateCommunity({
      ...baseRequest,
      user: user,
      namespace: 'tempNamespace',
      transactionHash: '0x1234',
      chain_node_id: 1263,
    });

    assert.equal(response.namespace, 'tempNamespace');
  });
});
