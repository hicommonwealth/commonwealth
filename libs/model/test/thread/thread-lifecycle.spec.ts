import { Actor, command, dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { PermissionEnum } from '@hicommonwealth/schemas';
import { Chance } from 'chance';
import { BannedActor, NonMember, RejectedMember } from 'model/src/middleware';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { seed } from '../../src/tester';
import { CreateThread } from '../../src/thread/CreateThread.command';

const chance = Chance();

describe('Thread lifecycle', () => {
  let adminActor: Actor,
    memberActor: Actor,
    nonmemberActor: Actor,
    bannedActor: Actor,
    rejectedActor: Actor;

  const body = chance.paragraph();
  const title = chance.sentence();
  const stage = 'stage';
  const payload = {
    community_id: '',
    topic_id: 0,
    kind: 'discussion' as const,
    title,
    body,
    stage,
    url: 'http://blah',
    id: 0,
    canvas_hash: '',
    canvas_signed_data: '',
    read_only: false,
  };

  beforeAll(async () => {
    const groupId = 123456;
    const [node] = await seed('ChainNode', {});

    const [admin] = await seed('User', { isAdmin: true });
    const [member] = await seed('User', {});
    const [nonmember] = await seed('User', {});
    const [banned] = await seed('User', {});
    const [rejected] = await seed('User', {});

    const [community] = await seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: admin!.id,
          is_banned: false,
        },
        {
          role: 'member',
          user_id: member!.id,
          is_banned: false,
        },
        {
          role: 'member',
          user_id: nonmember!.id,
          is_banned: false,
        },
        {
          role: 'member',
          user_id: banned!.id,
          is_banned: true,
        },
        {
          role: 'member',
          user_id: rejected!.id,
          is_banned: false,
        },
      ],
      groups: [{ id: groupId }],
      topics: [
        {
          group_ids: [groupId],
        },
      ],
    });
    await seed('GroupPermission', {
      group_id: groupId,
      allowed_actions: [PermissionEnum.CREATE_THREAD],
    });

    adminActor = {
      user: { id: admin!.id!, email: admin!.email!, isAdmin: admin!.isAdmin! },
      address: community!.Addresses!.at(0)!.address!,
    };
    memberActor = {
      user: { id: member!.id!, email: member!.email! },
      address: community!.Addresses!.at(1)!.address!,
    };
    nonmemberActor = {
      user: { id: nonmember!.id!, email: nonmember!.email! },
      address: community!.Addresses!.at(2)!.address!,
    };
    bannedActor = {
      user: { id: banned!.id!, email: banned!.email! },
      address: community!.Addresses!.at(3)!.address!,
    };
    rejectedActor = {
      user: { id: rejected!.id!, email: rejected!.email! },
      address: community!.Addresses!.at(4)!.address!,
    };

    await models.Membership.bulkCreate([
      {
        group_id: groupId,
        address_id: community!.Addresses!.at(1)!.id!,
        last_checked: new Date(),
      },
      {
        group_id: groupId,
        address_id: community!.Addresses!.at(4)!.id!,
        reject_reason: [
          {
            message: 'User Balance of 0 below threshold 1',
            requirement: {
              data: {
                source: {
                  source_type: 'eth_native',
                  evm_chain_id: 1,
                },
                threshold: '1',
              },
              rule: 'threshold',
            },
          },
        ],
        last_checked: new Date(),
      },
    ]);

    payload.community_id = community!.id!;
    payload.topic_id = community!.topics!.at(0)!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create thread as admin', async () => {
    const thread = await command(CreateThread(), {
      actor: adminActor,
      payload,
    });
    expect(thread?.title).to.equal(title);
    expect(thread?.body).to.equal(body);
    expect(thread?.stage).to.equal(stage);
  });

  test('should create thread as member', async () => {
    const thread = await command(CreateThread(), {
      actor: memberActor,
      payload,
    });
    expect(thread?.title).to.equal(title);
    expect(thread?.body).to.equal(body);
    expect(thread?.stage).to.equal(stage);
  });

  test('should reject non members', async () => {
    await expect(
      command(CreateThread(), {
        actor: nonmemberActor,
        payload,
      }),
    ).rejects.toThrowError(NonMember);
  });

  test('should reject banned members', async () => {
    await expect(
      command(CreateThread(), {
        actor: bannedActor,
        payload,
      }),
    ).rejects.toThrowError(BannedActor);
  });

  test('should reject rejected members', async () => {
    await expect(
      command(CreateThread(), {
        actor: rejectedActor,
        payload,
      }),
    ).rejects.toThrowError(RejectedMember);
  });

  // @rbennettcw do we have contest validation tests to include here?
});
