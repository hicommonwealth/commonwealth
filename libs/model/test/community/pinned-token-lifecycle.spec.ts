import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { ChainBase } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { GetPinnedTokens, PinToken, PinTokenErrors } from '../../src/community';
import { seed } from '../../src/tester';

const adminAddress = '0x0b84092914abaA89dDCb9C788Ace0B1fD6Ea7d90';
const ethMainnetUSDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ethMainnetUSDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';

describe('Pinned token lifecycle', () => {
  let community_id: string | undefined;
  let second_community_id: string | undefined;
  let chain_node_id: number | undefined;
  let unsupported_chain_node_id: number | undefined;
  let adminActor: Actor;
  let userActor: Actor;

  beforeAll(async () => {
    const [ethNode] = await seed('ChainNode', {
      url: 'https://eth-mainnet.g.alchemy.com/v2/',
      private_url: 'https://eth-mainnet.g.alchemy.com/v2/',
      eth_chain_id: 1,
      alchemy_metadata: {
        network_id: 'eth-mainnet',
        price_api_supported: true,
        transfer_api_supported: true,
      },
    });
    const [admin] = await seed('User', { isAdmin: false });
    const [user] = await seed('User', { isAdmin: false });
    const [randomNode] = await seed('ChainNode', {});
    const [community] = await seed('Community', {
      chain_node_id: randomNode!.id!,
      base: ChainBase.Ethereum,
      active: true,
      profile_count: 2,
      lifetime_thread_count: 0,
      Addresses: [
        {
          role: 'admin',
          user_id: admin!.id,
          verified: new Date(),
          address: adminAddress,
        },
        {
          role: 'member',
          user_id: user!.id,
          verified: new Date(),
        },
      ],
    });
    const [secondCommunity] = await seed('Community', {
      chain_node_id: randomNode!.id!,
      base: ChainBase.Ethereum,
      active: true,
      profile_count: 2,
      lifetime_thread_count: 0,
      Addresses: [
        {
          role: 'admin',
          user_id: admin!.id,
          verified: new Date(),
          address: adminAddress,
        },
        {
          role: 'member',
          user_id: user!.id,
          verified: new Date(),
        },
      ],
    });
    second_community_id = secondCommunity!.id!;
    community_id = community!.id!;
    chain_node_id = ethNode!.id!;
    unsupported_chain_node_id = randomNode!.id!;
    adminActor = {
      user: {
        id: admin!.id!,
        email: admin!.email!,
        isAdmin: admin!.isAdmin!,
      },
      address: adminAddress,
    };
    userActor = {
      user: {
        id: user!.id!,
        email: user!.email!,
        isAdmin: user!.isAdmin!,
      },
      address: community!.Addresses!.at(1)!.address!,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should to pin token if not admin', async () => {
    await expect(() =>
      command(PinToken(), {
        actor: userActor,
        payload: {
          community_id: community_id!,
          chain_node_id: unsupported_chain_node_id!,
          contract_address: ethMainnetUSDC,
        },
      }),
    ).rejects.toThrow('User is not admin in the community');
  });

  test('should fail to create a pinned token for an unsupported node', async () => {
    await expect(() =>
      command(PinToken(), {
        actor: adminActor,
        payload: {
          community_id: community_id!,
          chain_node_id: unsupported_chain_node_id!,
          contract_address: ethMainnetUSDC,
        },
      }),
    ).rejects.toThrow(PinTokenErrors.NotSupported);
  });

  test('should fail to create a pinned token for an invalid token', async () => {
    await expect(() =>
      command(PinToken(), {
        actor: adminActor,
        payload: {
          community_id: community_id!,
          chain_node_id: chain_node_id!,
          // random address
          contract_address: '0x0b84092914abaA89dDCb9C788Ace0B1fD6Ea7d91',
        },
      }),
    ).rejects.toThrow(PinTokenErrors.FailedToFetchPrice);
  });

  test('should pin a token', async () => {
    let res = await command(PinToken(), {
      actor: adminActor,
      payload: {
        community_id: community_id!,
        chain_node_id: chain_node_id!,
        contract_address: ethMainnetUSDC,
      },
    });
    expect(res?.community_id).to.equal(community_id);
    expect(res?.chain_node_id).to.equal(chain_node_id);
    expect(res?.contract_address).to.equal(ethMainnetUSDC);

    res = await command(PinToken(), {
      actor: adminActor,
      payload: {
        community_id: second_community_id!,
        chain_node_id: chain_node_id!,
        contract_address: ethMainnetUSDT,
      },
    });
    expect(res?.community_id).to.equal(second_community_id);
    expect(res?.chain_node_id).to.equal(chain_node_id);
    expect(res?.contract_address).to.equal(ethMainnetUSDT);
  });

  test('should fail to pin more than 1 token on the same community', async () => {
    await expect(() =>
      command(PinToken(), {
        actor: adminActor,
        payload: {
          community_id: community_id!,
          chain_node_id: chain_node_id!,
          contract_address: ethMainnetUSDC,
        },
      }),
    ).rejects.toThrow();

    await expect(() =>
      command(PinToken(), {
        actor: adminActor,
        payload: {
          community_id: community_id!,
          chain_node_id: chain_node_id!,
          contract_address: ethMainnetUSDT,
        },
      }),
    ).rejects.toThrow();
  });

  test('should return empty array if no pinned token', async () => {
    let res = await query(GetPinnedTokens(), {
      actor: adminActor,
      payload: {
        community_ids: 'random_community_id',
        with_chain_node: true,
      },
    });
    expect(res).to.deep.equal([]);

    res = await query(GetPinnedTokens(), {
      actor: userActor,
      payload: {
        community_ids: 'random_community_id',
        with_chain_node: true,
      },
    });
    expect(res).to.deep.equal([]);
  });

  test('should get a pinned token', async () => {
    let res = await query(GetPinnedTokens(), {
      actor: adminActor,
      payload: {
        community_ids: `${community_id}`,
        with_chain_node: true,
      },
    });
    if (!res) expect.fail('Result is null');
    expect(res[0].community_id).to.equal(community_id);
    expect(res[0].chain_node_id).to.equal(chain_node_id);
    expect(res[0].contract_address).to.equal(ethMainnetUSDC);

    res = await query(GetPinnedTokens(), {
      actor: userActor,
      payload: {
        community_ids: `${community_id}`,
        with_chain_node: true,
      },
    });
    if (!res) expect.fail('Result is null');
    expect(res[0].community_id).to.equal(community_id);
    expect(res[0].chain_node_id).to.equal(chain_node_id);
    expect(res[0].contract_address).to.equal(ethMainnetUSDC);

    res = await query(GetPinnedTokens(), {
      actor: userActor,
      payload: {
        community_ids: `${community_id},${second_community_id}`,
        with_chain_node: true,
      },
    });
    if (!res) expect.fail('Result is null');
    const pinnedToken1 = res.find((x) => x.community_id === community_id);
    const pinnedToken2 = res.find(
      (x) => x.community_id === second_community_id,
    );
    expect(pinnedToken1).to.exist;
    expect(pinnedToken2).to.exist;
    expect(pinnedToken1).toEqual(
      expect.objectContaining({
        community_id,
        chain_node_id,
        contract_address: ethMainnetUSDC,
      }),
    );
    expect(pinnedToken2).toEqual(
      expect.objectContaining({
        community_id: second_community_id,
        chain_node_id,
        contract_address: ethMainnetUSDT,
      }),
    );
  });
});
