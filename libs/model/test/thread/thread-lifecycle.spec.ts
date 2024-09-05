import {
  Actor,
  InvalidInput,
  InvalidState,
  command,
  dispose,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { PermissionEnum } from '@hicommonwealth/schemas';
import { Chance } from 'chance';
import { BannedActor, NonMember, RejectedMember } from 'model/src/middleware';
import { getCommentDepth } from 'model/src/utils/getCommentDepth';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreateComment,
  CreateCommentErrors,
  MAX_COMMENT_DEPTH,
} from '../../src/comment/CreateComment.command';
import { seed, seedRecord } from '../../src/tester';
import { CreateThread } from '../../src/thread/CreateThread.command';

const chance = Chance();

describe('Thread lifecycle', () => {
  let thread, archived, read_only;
  const roles = ['admin', 'member', 'nonmember', 'banned', 'rejected'] as const;
  const actors = {} as Record<(typeof roles)[number], Actor>;

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
    canvas_hash: '',
    canvas_signed_data: '',
    read_only: false,
  };

  beforeAll(async () => {
    const threadGroupId = 123456;
    const commentGroupId = 654321;
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
      groups: [{ id: threadGroupId }, { id: commentGroupId }],
      topics: [{ group_ids: [threadGroupId, commentGroupId] }],
    });
    await seed('GroupPermission', {
      group_id: threadGroupId,
      allowed_actions: [PermissionEnum.CREATE_THREAD],
    });
    await seed('GroupPermission', {
      group_id: commentGroupId,
      allowed_actions: [PermissionEnum.CREATE_COMMENT],
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
        group_id: threadGroupId,
        address_id: actors['member'].addressId!,
        last_checked: new Date(),
      },
      {
        group_id: commentGroupId,
        address_id: actors['member'].addressId!,
        last_checked: new Date(),
      },
      {
        group_id: threadGroupId,
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

    const [archived_thread] = await seed('Thread', {
      community_id: community?.id,
      address_id: community?.Addresses?.at(0)?.id,
      topic_id: community?.topics?.at(0)?.id,
      archived_at: new Date(),
      pinned: false,
      read_only: false,
    });
    archived = archived_thread;

    const [read_only_thread] = await seed('Thread', {
      community_id: community?.id,
      address_id: community?.Addresses?.at(0)?.id,
      topic_id: community?.topics?.at(0)?.id,
      pinned: false,
      read_only: true,
    });
    read_only = read_only_thread;

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
  } as Record<(typeof roles)[number], any>;

  roles.forEach((role) => {
    if (!authorizationTests[role]) {
      it(`should create thread as ${role}`, async () => {
        thread = await command(CreateThread(), {
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

  describe('comments', () => {
    it('should create a thread comment as member of group with permissions', async () => {
      const text = 'hello';
      const comment = await command(CreateComment(), {
        actor: actors.member,
        payload: {
          thread_id: thread!.id,
          text,
        },
      });
      expect(comment).to.include({
        thread_id: thread!.id,
        text,
        community_id: thread!.community_id,
      });
    });

    it('should throw error when thread not found', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            thread_id: thread!.id + 5,
            text: 'hi',
          },
        }),
      ).rejects.toThrowError(InvalidInput);
    });

    it('should throw error when actor is not member of group with permission', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.nonmember,
          payload: {
            thread_id: thread!.id,
            text: 'hi',
          },
        }),
      ).rejects.toThrowError(NonMember);
    });

    it('should throw an error when thread is archived', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            thread_id: archived!.id,
            text: 'hi',
          },
        }),
      ).rejects.toThrowError(CreateCommentErrors.ThreadArchived);
    });

    it('should throw an error when thread is read only', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            thread_id: read_only!.id,
            text: 'hi',
          },
        }),
      ).rejects.toThrowError(CreateCommentErrors.CantCommentOnReadOnly);
    });

    it('should throw error when parent not found', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            thread_id: thread!.id,
            parent_id: 1234567890,
            text: 'hi',
          },
        }),
      ).rejects.toThrowError(InvalidState);
    });

    it('should throw error when nesting is too deep', async () => {
      let parent_id = undefined,
        comment;
      for (let i = 0; i <= MAX_COMMENT_DEPTH; i++) {
        comment = await command(CreateComment(), {
          actor: actors.member,
          payload: {
            thread_id: thread!.id,
            parent_id,
            text: `level${i}`,
          },
        });
        parent_id = comment!.id;
        expect(parent_id).toBeDefined();
        const [exceeded, depth] = await getCommentDepth(
          comment as any,
          MAX_COMMENT_DEPTH,
        );
        expect(exceeded).to.be.false;
        expect(depth).toBe(i);
      }
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            thread_id: thread!.id,
            parent_id,
            text: 'hi',
          },
        }),
      ).rejects.toThrowError(CreateCommentErrors.NestingTooDeep);
    });
  });

  // @rbennettcw do we have contest validation tests to include here?
});
