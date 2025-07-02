import { dispose, query } from '@hicommonwealth/core';
import { Community, tester, type DB } from '@hicommonwealth/model';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

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
    expect(response?.length).toBe(0);
  });

  test('Correctly returns results if base matches some chainNode.name', async () => {
    const response = await query(Community.GetRelatedCommunities(), {
      actor: { user: { id: 1, email: '' } },
      payload: { chain_node_id: 2 },
    });
    expect(response!.length).toBe(3);

    const ethereumCommunity = response!.find((r) => r.community === 'Ethereum');
    expect(ethereumCommunity!.profile_count).toBe(2);
    expect(ethereumCommunity!.lifetime_thread_count).toBe(0);
    expect(ethereumCommunity!.icon_url).toBe('assets/img/protocols/eth.png');
    expect(ethereumCommunity!.description).toBe(null);

    const sushiCommunity = response!.find((r) => r.community === 'Sushi');
    expect(sushiCommunity!.profile_count).toBe(0);
    expect(sushiCommunity!.lifetime_thread_count).toBe(0);
    expect(sushiCommunity!.icon_url).toBe('assets/img/protocols/eth.png');
    expect(sushiCommunity!.description).toBe('sushi community description');

    const yearnFinanceCommunity = response!.find(
      (r) => r.community === 'yearn.finance',
    );
    expect(yearnFinanceCommunity!.profile_count).toBe(0);
    expect(yearnFinanceCommunity!.lifetime_thread_count).toBe(0);
    expect(yearnFinanceCommunity!.icon_url).toBe(
      'assets/img/protocols/eth.png',
    );
    expect(yearnFinanceCommunity!.description).toBe(null);
  });
});
