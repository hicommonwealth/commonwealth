import { dispose } from '@hicommonwealth/core';
import { tester, type DB } from '@hicommonwealth/model';
import { assert } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';

describe('GetRelatedCommunities Tests', async () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('Correctly returns nothing if base does not match chainNode', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const response = await controller.getRelatedCommunities({
      chainNodeId: -100,
    });

    assert.equal(response.length, 0);
  });

  test('Correctly returns results if base matches some chainNode.name', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const response = await controller.getRelatedCommunities({ chainNodeId: 2 });

    assert.equal(response.length, 3);

    const ethereumCommunity = response.find((r) => r.community === 'Ethereum');

    assert.equal(ethereumCommunity.profile_count, 2);

    assert.equal(ethereumCommunity.thread_count, 0);

    assert.equal(ethereumCommunity.icon_url, 'assets/img/protocols/eth.png');

    assert.equal(ethereumCommunity.description, null);

    const sushiCommunity = response.find((r) => r.community === 'Sushi');

    assert.equal(sushiCommunity.profile_count, 0);

    assert.equal(sushiCommunity.thread_count, 0);

    assert.equal(sushiCommunity.icon_url, 'assets/img/protocols/eth.png');

    assert.equal(sushiCommunity.description, 'sushi community description');

    const yearnFinanceCommunity = response.find(
      (r) => r.community === 'yearn.finance',
    );

    assert.equal(yearnFinanceCommunity.profile_count, 0);

    assert.equal(yearnFinanceCommunity.thread_count, 0);
    assert.equal(
      yearnFinanceCommunity.icon_url,
      'assets/img/protocols/eth.png',
    );

    assert.equal(yearnFinanceCommunity.description, null);
  });
});
