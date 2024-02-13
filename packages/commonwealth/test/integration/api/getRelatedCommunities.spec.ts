import { models, tester } from '@hicommonwealth/model';
import { assert } from 'chai';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';

describe('GetRelatedCommunities Tests', () => {
  before(async () => {
    await tester.seedDb();
  });

  it('Correctly returns nothing if base does not match chainNode', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const response = await controller.getRelatedCommunities({
      chainNodeId: -100,
    });

    assert.equal(response.length, 0);
  });

  it('Correctly returns results if base matches some chainNode.name', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const response = await controller.getRelatedCommunities({ chainNodeId: 2 });

    assert.equal(response.length, 3);

    const ethereumCommunity = response.find((r) => r.community === 'Ethereum');
    assert.equal(ethereumCommunity.address_count, 2);
    assert.equal(ethereumCommunity.thread_count, 0);
    assert.equal(ethereumCommunity.icon_url, '/static/img/protocols/eth.png');
    assert.equal(ethereumCommunity.description, null);

    const sushiCommunity = response.find((r) => r.community === 'Sushi');
    assert.equal(sushiCommunity.address_count, 0);
    assert.equal(sushiCommunity.thread_count, 0);
    assert.equal(sushiCommunity.icon_url, '/static/img/protocols/eth.png');
    assert.equal(sushiCommunity.description, 'sushi community description');

    const yearnFinanceCommunity = response.find(
      (r) => r.community === 'yearn.finance',
    );
    assert.equal(yearnFinanceCommunity.address_count, 0);
    assert.equal(yearnFinanceCommunity.thread_count, 0);
    assert.equal(
      yearnFinanceCommunity.icon_url,
      '/static/img/protocols/eth.png',
    );
    assert.equal(yearnFinanceCommunity.description, null);
  });
});
