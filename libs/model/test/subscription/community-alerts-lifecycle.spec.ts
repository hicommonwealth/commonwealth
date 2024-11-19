import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';

import { seed } from 'model/src/tester';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import z from 'zod';
import { models } from '../../src/database';
import {
  CreateCommunityAlert,
  DeleteCommunityAlerts,
  GetCommunityAlerts,
} from '../../src/subscription';

describe('Community alerts lifecycle', () => {
  let actor: Actor;
  let community: z.infer<typeof schemas.Community> | undefined;
  let communityTwo: z.infer<typeof schemas.Community> | undefined;

  beforeAll(async () => {
    const [user] = await seed('User', {
      isAdmin: false,
    });

    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });
    [community] = await seed('Community', {
      chain_node_id: node?.id,
      lifetime_thread_count: 0,
      profile_count: 0,
    });
    [communityTwo] = await seed('Community', {
      chain_node_id: node?.id,
      lifetime_thread_count: 0,
      profile_count: 0,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address: '0x',
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.CommunityAlert.truncate({});
  });

  test('should create a new community alert', async () => {
    const payload = {
      id: actor.user.id!,
      community_id: community!.id!,
    };

    const res = await command(CreateCommunityAlert(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      user_id: actor.user.id,
      community_id: community!.id!,
    });
  });

  test('should delete a single community alert via id', async () => {
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    const payload = {
      id: actor.user.id!,
      community_ids: [community!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(1);
  });

  test('should delete multiple community alerts via ids', async () => {
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: communityTwo!.id!,
    });
    const payload = {
      id: actor.user.id!,
      community_ids: [community!.id!, communityTwo!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });

  test('should delete a single community alert via community id', async () => {
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    const payload = {
      id: actor.user.id!,
      community_ids: [community!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(1);
  });

  test('should delete multiple community alerts via community ids', async () => {
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: communityTwo!.id!,
    });
    const payload = {
      id: actor.user.id!,
      community_ids: [community!.id!, communityTwo!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });

  test('should get community alerts', async () => {
    const [alertOne] = await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    const [alertTwo] = await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: communityTwo!.id!,
    });

    const res = await query(GetCommunityAlerts(), {
      actor,
      payload: {},
    });

    expect(res).to.have.deep.members([alertOne, alertTwo]);
  });
});
