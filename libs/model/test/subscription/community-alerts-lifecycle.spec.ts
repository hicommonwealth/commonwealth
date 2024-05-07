import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import z from 'zod';
import { models } from '../../src/database';
import {
  CreateCommunityAlert,
  DeleteCommunityAlerts,
  GetCommunityAlerts,
} from '../../src/subscription';
import { seed } from '../../src/tester';

describe('Community alerts lifecycle', () => {
  let actor: Actor;
  let community: z.infer<typeof schemas.Community> | undefined;
  let communityTwo: z.infer<typeof schemas.Community> | undefined;
  before(async () => {
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
    });
    [communityTwo] = await seed('Community', {
      chain_node_id: node?.id,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: '0x',
    };
  });

  after(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.CommunityAlert.truncate({});
  });

  it('should create a new community alert', async () => {
    const payload = {
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

  it('should delete a single community alert via id', async () => {
    const [alert] = await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    const payload = {
      community_ids: [community!.id!],
      ids: [alert!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(1);
  });

  it('should delete multiple community alerts via ids', async () => {
    const [alertOne] = await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    const [alertTwo] = await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: communityTwo!.id!,
    });
    const payload = {
      community_ids: [community!.id!, communityTwo!.id!],
      ids: [alertOne!.id!, alertTwo!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });

  it('should delete a single community alert via community id', async () => {
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    const payload = {
      community_ids: [community!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(1);
  });

  it('should delete multiple community alerts via community ids', async () => {
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: community!.id!,
    });
    await seed('CommunityAlert', {
      user_id: actor.user.id,
      community_id: communityTwo!.id!,
    });
    const payload = {
      community_ids: [community!.id!, communityTwo!.id!],
    };
    const res = await command(DeleteCommunityAlerts(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });

  it('should get community alerts', async () => {
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
