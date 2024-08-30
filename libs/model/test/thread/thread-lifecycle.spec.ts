import { Actor, command, dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { PermissionEnum } from '@hicommonwealth/schemas';
import { Chance } from 'chance';
import { BannedActor, NonMember, RejectedMember } from 'model/src/middleware';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seed, seedRecord } from '../../src/tester';
import { CreateThread } from '../../src/thread/CreateThread.command';

const chance = Chance();

describe('Thread lifecycle', () => {
  const roles = ['admin', 'member', 'nonmember', 'banned', 'rejected'] as const;
  const actors = {} as Record<typeof roles[number], Actor>;

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
    const users = await seedRecord('User', roles, (role) => ({
      profile: { name: role },
      isAdmin: role === 'admin',
    }));
    const [community] = await seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      profile_count: 1,
      Addresses: roles.map((role) => ({
        address: `0xaddressof${role}`,
        user_id: users[role].id,
        role: role === 'admin' ? 'admin' : 'member',
        is_banned: role === 'banned',
      })),
      groups: [{ id: groupId }],
      topics: [{ group_ids: [groupId] }],
    });
    await seed('GroupPermission', {
      group_id: groupId,
      allowed_actions: [PermissionEnum.CREATE_THREAD],
    });

    roles.forEach((role) => {
      const user = users[role];
      const address = community!.Addresses!.find((a) => a.user_id === user.id);
      actors[role] = {
        user: {
          id: user.id,
          email: user.profile.email!,
        },
        address: address!.address,
        addressId: address!.id,
      };
    });

    await models.Membership.bulkCreate([
      {
        group_id: groupId,
        address_id: actors['member'].addressId!,
        last_checked: new Date(),
      },
      {
        group_id: groupId,
        address_id: actors['rejected'].addressId!,
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

  const authorizationTests = {
    admin: undefined,
    member: undefined,
    nonmember: NonMember,
    banned: BannedActor,
    rejected: RejectedMember,
  } as Record<typeof roles[number], any>;

  roles.forEach((role) => {
    if (!authorizationTests[role]) {
      it(`should create thread as ${role}`, async () => {
        const thread = await command(CreateThread(), {
          actor: actors[role],
          payload,
        });
        expect(thread?.title).to.equal(title);
        expect(thread?.body).to.equal(body);
        expect(thread?.stage).to.equal(stage);
      });
    } else {
      it(`should reject create thread as ${role}`, async () => {
        await expect(
          command(CreateThread(), {
            actor: actors[role],
            payload,
          }),
        ).rejects.toThrowError(authorizationTests[role]);
      });
    }
  });

  // @rbennettcw do we have contest validation tests to include here?
});
