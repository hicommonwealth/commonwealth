import { dispose } from '@hicommonwealth/core';
import { emitEvent, tokenBalanceCache } from '@hicommonwealth/model';
import { ChainNode, Community, EventPair, User } from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { UpgradeTierPolicy } from 'model/src/aggregates/user/UpgradeTier.policy';
import { models } from 'model/src/database';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { seed } from '../../src/tester';
import { drainOutbox } from '../utils';

const buildNamespaceTransferSingleEvent = (
  contractAddress: string,
  from: string,
  to: string,
  id: string,
  value: string,
) => ({
  event_name: 'NamespaceTransferSingle',
  event_payload: {
    eventSource: {
      ethChainId: 1,
    },
    rawLog: {
      address: contractAddress,
      topics: ['0xabcdef', '0x123456'],
      data: '0xdata',
      blockNumber: '123456' as unknown as bigint,
      blockHash: '0xblockhash',
      transactionIndex: 0,
      removed: false,
      transactionHash: '0xtxhash',
      logIndex: 0,
    },
    block: {
      number: '123456' as unknown as bigint,
      timestamp: '1678901234' as unknown as bigint,
      hash: '0xblockhash',
      logsBloom: '0xlogsbloom',
      parentHash: '0xparenthash',
      miner: '0xminer',
      gasLimit: '10000000' as unknown as bigint,
    },
    parsedArgs: {
      operator: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      from: from as `0x${string}`,
      to: to as `0x${string}`,
      id: id as unknown as bigint,
      value: value as unknown as bigint,
    },
  },
});

describe('Upgrade Tiers lifecycle', () => {
  let node: z.infer<typeof ChainNode>;
  let community: z.infer<typeof Community>;
  let user: z.infer<typeof User>;
  let userAddress: string = '0x8888888888888888888888888888888888888888';

  beforeAll(async () => {
    const [node1] = await seed('ChainNode', {
      id: 1,
      eth_chain_id: 1,
    });
    const [user1] = await seed('User', {
      tier: 0,
    });
    const [community1] = await seed('Community', {
      chain_node_id: node1!.id,
      profile_count: 1,
      namespace_address: '0xFFF1234567890123456789012345678901234567',
      Addresses: [
        {
          role: 'member',
          address: userAddress,
          user_id: user1!.id,
          verified: new Date(),
          last_active: new Date().toISOString(),
        },
      ],
    });

    node = node1!;
    user = user1!;
    community = community1!;

    vi.spyOn(tokenBalanceCache, 'getBalances').mockResolvedValue({
      [userAddress]: '5',
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should upgrade user to tier 4 when 5 or more nomination tokens are held', async () => {
    const userBefore = await models.User.findByPk(user.id);
    expect(userBefore?.tier).toBe(0);

    await emitEvent(models.Outbox, [
      buildNamespaceTransferSingleEvent(
        community.namespace_address!,
        ZERO_ADDRESS,
        userAddress,
        '3',
        '5',
      ) as EventPair<'NamespaceTransferSingle'>,
    ]);

    await drainOutbox(['NamespaceTransferSingle'], UpgradeTierPolicy);

    const userAfter = await models.User.findByPk(user.id);
    expect(userAfter?.tier).toBe(4);
  });
});
