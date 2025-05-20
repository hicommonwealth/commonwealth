import { dispose, query } from '@hicommonwealth/core';
import { Community, tester, type DB } from '@hicommonwealth/model';
import { assert } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';

describe('GetRelatedCommunities Tests', async () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('Correctly returns nothing if base does not match chainNode', async () => {
    const response = await query(Community.GetRelatedCommunities(), {
      actor: { user: { id: 1, email: '' } },
      payload: { chain_node_id: -100 },
    });
    assert.equal(response?.length, 0);
  });

  test('Correctly returns results if base matches some chainNode.name', async () => {
    const response = await query(Community.GetRelatedCommunities(), {
      actor: { user: { id: 1, email: '' } },
      payload: { chain_node_id: 2 },
    });
    assert.equal(response!.length, 3);

    const ethereumCommunity = response!.find((r) => r.community === 'Ethereum');
    assert.equal(ethereumCommunity!.profile_count, 2);
    assert.equal(ethereumCommunity!.lifetime_thread_count, 0);
    assert.equal(ethereumCommunity!.icon_url, 'assets/img/protocols/eth.png');
    assert.equal(ethereumCommunity!.description, null);

    const sushiCommunity = response!.find((r) => r.community === 'Sushi');
    assert.equal(sushiCommunity!.profile_count, 0);
    assert.equal(sushiCommunity!.lifetime_thread_count, 0);
    assert.equal(sushiCommunity!.icon_url, 'assets/img/protocols/eth.png');
    assert.equal(sushiCommunity!.description, 'sushi community description');

    const yearnFinanceCommunity = response!.find(
      (r) => r.community === 'yearn.finance',
    );
    assert.equal(yearnFinanceCommunity!.profile_count, 0);
    assert.equal(yearnFinanceCommunity!.lifetime_thread_count, 0);
    assert.equal(
      yearnFinanceCommunity!.icon_url,
      'assets/img/protocols/eth.png',
    );
    assert.equal(yearnFinanceCommunity!.description, null);
  });
});
