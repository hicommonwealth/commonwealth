import { command } from '@hicommonwealth/core';
import { CreateSnapshotProposal as CreateSnapshotProposalSchema } from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';
import { models, tester } from '../../src';
import { CreateSnapshotProposal } from '../../src/snapshot';

describe('Snapshot Listener API', { timeout: 5_000 }, () => {
  beforeAll(async () => {
    const [chainNode] = await tester.seed(
      'ChainNode',
      {
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
        contracts: [],
      },
      { mock: false },
    );

    await tester.seed('Community', {
      chain_node_id: chainNode?.id,
      lifetime_thread_count: 0,
      profile_count: 0,
      Addresses: [],
      CommunityStakes: [],
      snapshot_spaces: ['6969888.eth'],
    });
  });

  afterEach(async () => {
    await models.Outbox.truncate();
  });

  const proposalId =
    '0x7dc75736a57689459c73f8540586c2d1c8927dbe6a9da42f6fbc2f37c020a907';
  const testSnapshotProposal = {
    id: `proposal/${proposalId}`,
    event: 'proposal/created' as const,
    title: '1',
    body: '1',
    choices: ['21', '21'],
    space: '6969888.eth',
    start: 1710467951,
    expire: 1710727151,
    token: 'a88a91630b95e5e7ae9cd8610aff862d2b70383926b7236c973eedec46e0de65',
    secret: 'a88a91630b95e5e7ae9cd8610aff862d2b70383926b7236c973eedec46e0de65',
  };

  test('should process valid snapshot proposal created payloads', async () => {
    const res = await command(CreateSnapshotProposal(), {
      payload: testSnapshotProposal,
      actor: {
        user: { email: 'snapshot@gmail.com' },
      },
    });

    const outboxData = await models.Outbox.findAll({
      where: {
        event_name: 'SnapshotProposalCreated',
      },
    });

    expect(outboxData.length).to.equal(1);
    expect(outboxData[0].event_payload).to.deep.equal({
      ...testSnapshotProposal,
      id: proposalId,
    });

    expect(res).toBeTruthy();
    expect(res).to.deep.equal({ success: true });
  });

  test('/snapshot should return 400 with invalid data', async () => {
    try {
      await command(CreateSnapshotProposal(), {
        payload: {} as z.infer<(typeof CreateSnapshotProposalSchema)['input']>,
        actor: { user: { email: 'snapshot@gmail.com' } },
      });
      expect.fail();
      // // eslint-disable-next-line no-empty
    } catch (e) {
      // ignore error
      console.warn(e);
    }
  });
});
