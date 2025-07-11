import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

import { contractHelpers } from '../../src/services/commonProtocol';
const getNamespaceBalanceSpy = vi.spyOn(contractHelpers, 'getNamespaceBalance');

import {
  Actor,
  InvalidActor,
  InvalidInput,
  InvalidState,
  blobStorage,
  command,
  dispose,
  inMemoryBlobStorage,
  query,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  CommunityTierMap,
  GatedActionEnum,
  MAX_COMMENT_DEPTH,
  MAX_TRUNCATED_CONTENT_LENGTH,
  UserTierMap,
} from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { z } from 'zod';
import {
  CreateComment,
  CreateCommentErrors,
  CreateCommentReaction,
  DeleteComment,
  GetComments,
  SearchComments,
  UpdateComment,
} from '../../src/aggregates/comment';
import { DeleteReaction } from '../../src/aggregates/reaction';
import {
  CreateThread,
  CreateThreadReaction,
  CreateThreadReactionErrors,
  DeleteThread,
  GetThreads,
  UpdateThread,
  UpdateThreadErrors,
} from '../../src/aggregates/thread';
import { models } from '../../src/database';
import { BannedActor, NonMember, RejectedMember } from '../../src/middleware';
import { AddressAttributes } from '../../src/models';
import { seed, seedRecord } from '../../src/tester';
import { R2_ADAPTER_KEY } from '../../src/utils';
import { getCommentDepth } from '../../src/utils/getCommentDepth';
import { getSignersInfo, signCreateThread } from '../utils/canvas-signers';

const chance = Chance();

describe('Thread lifecycle', () => {
  let community: z.infer<typeof schemas.Community>,
    thread: z.infer<typeof schemas.Thread>,
    archived,
    read_only,
    comment: z.infer<typeof schemas.Comment>;
  const roles = ['admin', 'member', 'nonmember', 'banned', 'rejected'] as const;
  const addresses = {} as Record<(typeof roles)[number], AddressAttributes>;
  const actors = {} as Record<(typeof roles)[number], Actor>;
  const vote_weight = 200;

  const stage = 'stage';
  const payloadBase = {
    community_id: '',
    topic_id: 0,
    kind: 'discussion' as const,
    title: chance.sentence(),
    body: chance.paragraph(),
    stage,
    url: 'http://blah',
    canvas_msg_id: '',
    canvas_signed_data: '',
    read_only: false,
  };
  const payload = {
    ...payloadBase,
  };
  const largeBodyPayload = {
    ...payloadBase,
    body: chance.paragraph({ sentences: 50 }),
  };

  beforeAll(async () => {
    const signerInfo = await getSignersInfo(roles);
    const threadGroupId = 123456;
    const commentGroupId = 654321;
    const emptyGroupId = 987654;
    const [node] = await seed('ChainNode', { eth_chain_id: 1 });
    const users = await seedRecord('User', roles, (role) => ({
      profile: { name: role },
      isAdmin: role === 'admin',
      tier:
        role === 'member'
          ? UserTierMap.NewlyVerifiedWallet
          : UserTierMap.ManuallyVerified,
    }));
    const [_community] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      spam_tier_level: UserTierMap.NewlyVerifiedWallet,
      chain_node_id: node!.id!,
      namespace_address: '0x123',
      active: true,
      profile_count: 1,
      Addresses: roles.map((role, index) => {
        return {
          address: signerInfo[index].address,
          user_id: users[role].id,
          role: role === 'admin' ? 'admin' : 'member',
          is_banned: role === 'banned',
          verified: new Date(),
        };
      }),
      groups: [
        { id: threadGroupId },
        { id: commentGroupId },
        { id: emptyGroupId },
      ],
      topics: [
        {
          name: 'topic with gating',
          weighted_voting: TopicWeightedVoting.Stake,
        },
        { name: 'topic without gating' },
        { name: 'topic without groups' },
      ],
      CommunityStakes: [
        {
          stake_id: 1,
          stake_token: 'stake',
          stake_enabled: true,
          vote_weight,
        },
      ],
      custom_stages: ['one', 'two'],
    });
    await seed('GroupGatedAction', {
      group_id: threadGroupId,
      topic_id: _community!.topics![0]!.id,
      gated_actions: [
        GatedActionEnum.CREATE_THREAD,
        GatedActionEnum.CREATE_THREAD_REACTION,
        GatedActionEnum.CREATE_COMMENT_REACTION,
        GatedActionEnum.UPDATE_POLL,
      ],
    });
    await seed('GroupGatedAction', {
      group_id: commentGroupId,
      topic_id: _community!.topics![0]!.id,
      gated_actions: [GatedActionEnum.CREATE_COMMENT],
    });
    await seed('GroupGatedAction', {
      group_id: emptyGroupId,
      topic_id: _community!.topics![1]!.id,
      gated_actions: [],
    });

    community = _community!;
    roles.forEach((role) => {
      const user = users[role];
      const address = community!.Addresses!.find((a) => a.user_id === user.id);
      actors[role] = {
        user: {
          id: user.id,
          email: user.profile.email!,
        },
        address: address!.address,
      };
      addresses[role] = address!;
    });

    await models.Membership.bulkCreate([
      {
        group_id: threadGroupId,
        address_id: addresses['member'].id!,
        last_checked: new Date(),
      },
      {
        group_id: commentGroupId,
        address_id: addresses['member'].id!,
        last_checked: new Date(),
      },
      {
        group_id: threadGroupId,
        address_id: addresses['rejected'].id!,
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
      reaction_weights_sum: '0',
    });
    archived = archived_thread;

    const [read_only_thread] = await seed('Thread', {
      community_id: community?.id,
      address_id: community?.Addresses?.at(0)?.id,
      topic_id: community?.topics?.at(0)?.id,
      pinned: false,
      read_only: true,
      reaction_weights_sum: '0',
    });
    read_only = read_only_thread;

    payload.community_id = community!.id!;
    largeBodyPayload.community_id = community!.id!;
    payload.topic_id = community!.topics!.at(0)!.id!;
    largeBodyPayload.topic_id = community!.topics!.at(0)!.id!;

    // mock R2 adapter as in-memory
    blobStorage({
      key: R2_ADAPTER_KEY,
      adapter: inMemoryBlobStorage,
      isDefault: false,
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  describe.each([
    { instancePayload: payload, name: 'standard payload' },
    // Can't use ...payload because beforeAll executes after `describe.each`.
    // Payload must be pass by reference
    { instancePayload: largeBodyPayload, name: 'large body' },
  ])(`create thread with $name`, ({ instancePayload, name }) => {
    const authorizationTests = {
      admin: undefined,
      member: undefined,
      nonmember: NonMember,
      banned: BannedActor,
      rejected: RejectedMember,
    } as Record<(typeof roles)[number], any>;

    roles.forEach((role) => {
      if (!authorizationTests[role]) {
        test(`should create thread as ${role}`, async () => {
          const _thread = await command(CreateThread(), {
            actor: actors[role],
            payload: await signCreateThread(
              actors[role].address!,
              instancePayload,
            ),
          });
          expect(_thread?.title).to.equal(instancePayload.title);
          expect(_thread?.stage).to.equal(instancePayload.stage);
          if (role === 'member')
            // below spam tier level
            expect(_thread?.marked_as_spam_at).to.be.toBeDefined();
          else expect(_thread?.marked_as_spam_at).to.be.toBeNull();

          // capture as admin author for other tests
          if (!thread) thread = _thread!;

          if (name === 'large body') {
            expect(_thread?.content_url).toBeTruthy();
            expect(
              await blobStorage({ key: R2_ADAPTER_KEY }).exists({
                bucket: 'threads',
                key: _thread!.content_url!.split('/').pop()!,
              }),
            ).toBeTruthy();

            expect(_thread?.body).to.equal(
              instancePayload.body.slice(0, MAX_TRUNCATED_CONTENT_LENGTH),
            );
          } else {
            expect(_thread?.body).to.equal(instancePayload.body);
          }
        });
      } else {
        test(`should reject create thread as ${role}`, async () => {
          await expect(
            command(CreateThread(), {
              actor: actors[role],
              payload: instancePayload,
            }),
          ).rejects.toThrowError(authorizationTests[role]);
        });
      }
    });
  });

  describe('topic permissions', () => {
    test('should create thread in topic with no permissions', async () => {
      const topic_id = community!.topics!.at(2)!.id!; // no groups
      const thread = await command(CreateThread(), {
        actor: actors.member,
        payload: await signCreateThread(actors.member.address!, {
          ...payload,
          topic_id,
        }),
      });
      expect(thread?.topic_id).to.equal(topic_id);
    });

    test('should throw error when actor is not member of group with permission', async () => {
      await expect(
        command(CreateThread(), {
          actor: actors.nonmember,
          payload: await signCreateThread(actors.nonmember.address!, {
            ...payload,
            topic_id: community!.topics!.at(0)!.id!,
          }),
        }),
      ).rejects.toThrowError(NonMember);
    });
  });

  describe('updates', () => {
    test('should patch content', async () => {
      const payloadContent = {
        title: 'hello',
        body: chance.paragraph({ sentences: 50 }),
        canvas_msg_id: '',
        canvas_signed_data: '',
      };
      let updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...payloadContent,
        },
      });
      expect(updated).to.contain({
        ...payloadContent,
        body: payloadContent.body.slice(0, MAX_TRUNCATED_CONTENT_LENGTH),
      });
      expect(updated?.content_url).toBeTruthy();
      expect(
        await blobStorage({ key: R2_ADAPTER_KEY }).exists({
          bucket: 'threads',
          key: updated!.content_url!.split('/').pop()!,
        }),
      ).toBeTruthy();
      expect(updated?.ThreadVersionHistories?.length).to.equal(2);

      payloadContent.body = 'wasup';
      updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...payloadContent,
        },
      });
      expect(updated).to.contain(payloadContent);
      expect(updated?.content_url).toBeFalsy();
      expect(updated!.ThreadVersionHistories?.length).to.equal(3);
      const sortedHistory = updated!.ThreadVersionHistories!.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );

      expect(sortedHistory[0].content_url).toBeFalsy();
      expect(sortedHistory[1].content_url).toBeTruthy();
      expect(sortedHistory[2].content_url).toBeFalsy();
    });

    test('should add collaborators', async () => {
      const body = {
        collaborators: {
          toAdd: [
            addresses.member.id!,
            addresses.rejected.id!,
            addresses.banned.id!,
          ],
          toRemove: [],
        },
      };
      const updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...body,
        },
      });
      expect(updated?.collaborators?.length).to.eq(3);
    });

    test('should remove collaborator', async () => {
      const body = {
        collaborators: {
          toRemove: [addresses.banned.id!],
        },
      };
      const updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...body,
        },
      });
      expect(updated?.collaborators?.length).to.eq(2);
    });

    test('should fail when collaborators overlap', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.member,
          payload: {
            thread_id: thread.id!,
            collaborators: {
              toAdd: [addresses.banned.id!],
              toRemove: [addresses.banned.id!],
            },
          },
        }),
      ).rejects.toThrowError(UpdateThreadErrors.CollaboratorsOverlap);
    });

    test('should fail when not admin or author', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.member,
          payload: {
            thread_id: thread.id!,
            collaborators: {
              toRemove: [addresses.banned.id!],
            },
          },
        }),
      ).rejects.toThrowError('Must be super admin or author');
    });

    test('should fail when collaborator not found', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.admin,
          payload: {
            thread_id: thread.id!,
            collaborators: {
              toAdd: [999999999],
            },
          },
        }),
      ).rejects.toThrowError(UpdateThreadErrors.MissingCollaborators);
    });

    test('should patch admin or moderator attributes', async () => {
      const body = {
        pinned: true,
        spam: true,
      };
      const updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...body,
        },
      });
      expect(updated?.pinned).to.eq(true);
      expect(updated?.marked_as_spam_at).toBeDefined;
    });

    test('should update launchpad_token_address and is_linking_token', async () => {
      const body = {
        is_linking_token: true,
        launchpad_token_address: '0x0',
      };
      const updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...body,
        },
      });
      expect(updated?.is_linking_token).to.eq(true);
      expect(updated?.launchpad_token_address).to.eq('0x0');
    });

    test('should fail when collaborator actor non admin/moderator', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.rejected,
          payload: {
            thread_id: thread.id!,
            pinned: false,
            spam: false,
          },
        }),
      ).rejects.toThrowError('Must be admin or moderator');
    });

    test('should patch admin or moderator or owner attributes', async () => {
      const body = {
        locked: false,
        archived: false,
        stage: community.custom_stages.at(0),
        topic_id: thread.topic_id!,
      };
      const updated = await command(UpdateThread(), {
        actor: actors.admin,
        payload: {
          thread_id: thread.id!,
          ...body,
        },
      });
      expect(updated?.locked_at).toBeUndefined;
      expect(updated?.archived_at).toBeUndefined;
      expect(updated?.stage).to.eq(community.custom_stages.at(0));
      expect(updated?.topic_id).to.eq(thread.topic_id);
    });

    test('should fail when invalid stage is sent', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.admin,
          payload: {
            thread_id: thread.id!,
            stage: 'invalid',
          },
        }),
      ).rejects.toThrowError(UpdateThreadErrors.InvalidStage);
    });

    test('should fail when collaborator actor non admin/moderator/owner', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.rejected,
          payload: {
            thread_id: thread.id!,
            locked: true,
            archived: true,
          },
        }),
      ).rejects.toThrowError('Must be admin, moderator, or author');
    });

    test('should fail when collaborator not found', async () => {
      await expect(
        command(UpdateThread(), {
          actor: actors.nonmember,
          payload: {
            thread_id: thread.id!,
            title: 'new title',
          },
        }),
      ).rejects.toThrowError(InvalidActor);
    });
  });

  describe('deletes', () => {
    test('should delete a thread as author', async () => {
      const _thread = await command(CreateThread(), {
        actor: actors.member,
        payload: await signCreateThread(actors.member.address!, payload),
      });
      const _deleted = await command(DeleteThread(), {
        actor: actors.member,
        payload: { thread_id: _thread!.id! },
      });
      expect(_deleted?.thread_id).to.equal(_thread!.id);
    });

    test('should delete a thread as admin', async () => {
      const _thread = await command(CreateThread(), {
        actor: actors.member,
        payload: await signCreateThread(actors.member.address!, payload),
      });
      const _deleted = await command(DeleteThread(), {
        actor: actors.admin,
        payload: { thread_id: _thread!.id! },
      });
      expect(_deleted?.thread_id).to.equal(_thread!.id);
    });

    test('should throw error when thread not found', async () => {
      await expect(
        command(DeleteThread(), {
          actor: actors.member,
          payload: { thread_id: 123456789 },
        }),
      ).rejects.toThrowError(InvalidInput);
    });

    test('should throw error when not owned', async () => {
      const _thread = await command(CreateThread(), {
        actor: actors.member,
        payload: await signCreateThread(actors.member.address!, payload),
      });
      await expect(
        command(DeleteThread(), {
          actor: actors.rejected,
          payload: { thread_id: _thread!.id! },
        }),
      ).rejects.toThrowError(InvalidActor);
    });
  });

  describe('comments', () => {
    test('should create a thread comment as member of group with permissions', async () => {
      let body = chance.paragraph({ sentences: 50 });
      const threadInstance = await models.Thread.findOne({
        where: {
          id: thread.id!,
        },
      });
      const initialCommentCount = threadInstance!.comment_count;
      const firstComment = await command(CreateComment(), {
        actor: actors.member,
        payload: {
          parent_msg_id: thread!.canvas_msg_id,
          thread_id: thread.id!,
          body,
        },
      });
      await threadInstance!.reload();
      expect(threadInstance!.comment_count).to.equal(initialCommentCount! + 1);
      expect(firstComment).to.include({
        thread_id: thread!.id,
        body: body.slice(0, MAX_TRUNCATED_CONTENT_LENGTH),
        community_id: thread!.community_id,
      });
      expect(firstComment?.marked_as_spam_at).toBeDefined();
      expect(firstComment?.content_url).toBeTruthy();
      expect(
        await blobStorage({ key: R2_ADAPTER_KEY }).exists({
          bucket: 'comments',
          key: firstComment!.content_url!.split('/').pop()!,
        }),
      ).toBeTruthy();

      body = 'hello';
      const _comment = await command(CreateComment(), {
        actor: actors.member,
        payload: {
          parent_msg_id: thread!.canvas_msg_id,
          thread_id: thread.id!,
          body,
        },
      });
      if (!comment) comment = _comment!;
      expect(_comment).to.include({
        thread_id: thread!.id,
        body,
        community_id: thread!.community_id,
      });
      expect(_comment?.content_url).toBeFalsy();
      await threadInstance!.reload();
      expect(threadInstance!.comment_count).to.equal(initialCommentCount! + 2);
    });

    test('should throw error when thread not found', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            parent_msg_id: thread.canvas_msg_id,
            thread_id: thread.id! + 5,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(InvalidInput);
    });

    test('should throw error when actor is not member of group with permission', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.nonmember,
          payload: {
            parent_msg_id: thread.canvas_msg_id,
            thread_id: thread.id!,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(NonMember);
    });

    test('should throw an error when thread is archived', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            parent_msg_id: thread!.canvas_msg_id,
            thread_id: archived!.id,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(CreateCommentErrors.ThreadArchived);
    });

    test('should throw an error when thread is read only', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            parent_msg_id: thread!.canvas_msg_id,
            thread_id: read_only!.id,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(CreateCommentErrors.CantCommentOnReadOnly);
    });

    test('should throw error when parent not found', async () => {
      await expect(
        command(CreateComment(), {
          actor: actors.member,
          payload: {
            parent_msg_id: thread.canvas_msg_id,
            thread_id: thread.id!,
            parent_id: 1234567890,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(InvalidState);
    });

    test('should throw error when nesting is too deep', async () => {
      let parent_id = undefined,
        comment;
      for (let i = 0; i <= MAX_COMMENT_DEPTH; i++) {
        comment = await command(CreateComment(), {
          actor: actors.member,
          payload: {
            parent_msg_id: thread.canvas_msg_id,
            thread_id: thread.id!,
            parent_id,
            body: `level${i}`,
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
            parent_msg_id: thread.canvas_msg_id,
            thread_id: thread.id!,
            parent_id,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(CreateCommentErrors.NestingTooDeep);
    });

    test('should update comment', async () => {
      let body = chance.paragraph({ sentences: 50 });
      const threadInstance = await models.Thread.findOne({
        where: {
          id: thread.id!,
        },
      });
      const initialCommentCount = threadInstance!.comment_count;
      let updated = await command(UpdateComment(), {
        actor: actors.member,
        payload: {
          comment_id: comment!.id!,
          body,
        },
      });
      await threadInstance!.reload();
      expect(threadInstance!.comment_count).to.equal(initialCommentCount!);
      expect(updated).to.include({
        thread_id: thread!.id,
        body: body.slice(0, MAX_TRUNCATED_CONTENT_LENGTH),
        community_id: thread!.community_id,
      });
      expect(updated?.content_url).toBeTruthy();
      expect(
        await blobStorage({ key: R2_ADAPTER_KEY }).exists({
          bucket: 'comments',
          key: updated!.content_url!.split('/').pop()!,
        }),
      ).toBeTruthy();

      body = 'hello updated';
      updated = await command(UpdateComment(), {
        actor: actors.member,
        payload: {
          comment_id: comment!.id!,
          body,
        },
      });
      expect(updated).to.include({
        thread_id: thread!.id,
        body,
        community_id: thread!.community_id,
      });
      expect(updated?.content_url).toBeFalsy();

      expect(updated?.CommentVersionHistories?.length).to.equal(3);
      const sortedHistory = updated!.CommentVersionHistories!.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      expect(sortedHistory[0].content_url).toBeFalsy();
      expect(sortedHistory[1].content_url).toBeTruthy();
      expect(sortedHistory[2].content_url).toBeFalsy();
    });

    test('should throw not found when trying to update', async () => {
      await expect(
        command(UpdateComment(), {
          actor: actors.member,
          payload: {
            comment_id: 1234567890,
            body: 'hi',
          },
        }),
      ).rejects.toThrowError(InvalidInput);
    });

    test('should delete a comment as author', async () => {
      const body = 'to be deleted';
      const threadInstance = await models.Thread.findOne({
        where: {
          id: thread.id!,
        },
      });
      const initialCommentCount = threadInstance!.comment_count;
      const tbd = await command(CreateComment(), {
        actor: actors.member,
        payload: {
          thread_id: thread.id!,
          body,
        },
      });
      await threadInstance!.reload();
      expect(threadInstance!.comment_count).to.equal(initialCommentCount! + 1);
      expect(tbd).to.include({
        thread_id: thread!.id,
        body,
        community_id: thread!.community_id,
      });
      const deleted = await command(DeleteComment(), {
        actor: actors.admin,
        payload: { comment_id: tbd!.id! },
      });
      expect(deleted).to.include({ comment_id: tbd!.id! });

      // This is fails because we paranoidly delete the comment and comment count is used to correctly
      // render the comment tree. See DeleteComment.command.ts for more details.
      // await threadInstance!.reload();
      // expect(threadInstance!.comment_count).to.equal(initialCommentCount!);
    });

    test('should delete a comment as admin', async () => {
      const body = 'to be deleted';
      const tbd = await command(CreateComment(), {
        actor: actors.member,
        payload: {
          thread_id: thread.id!,
          body,
        },
      });
      expect(tbd).to.include({
        thread_id: thread!.id,
        body,
        community_id: thread!.community_id,
      });
      const deleted = await command(DeleteComment(), {
        actor: actors.admin,
        payload: { comment_id: tbd!.id! },
      });
      expect(deleted).to.include({ comment_id: tbd!.id! });
    });

    test('should throw delete when user is not author', async () => {
      await expect(
        command(DeleteComment(), {
          actor: actors.rejected,
          payload: {
            comment_id: comment!.id!,
          },
        }),
      ).rejects.toThrowError(InvalidActor);
    });

    test('should get comments with reactions', async () => {
      await command(CreateComment(), {
        actor: actors.admin,
        payload: {
          parent_msg_id: thread!.canvas_msg_id,
          thread_id: thread.id!,
          body: 'hello',
        },
      });
      await command(CreateComment(), {
        actor: actors.member,
        payload: {
          parent_msg_id: thread!.canvas_msg_id,
          thread_id: thread.id!,
          body: 'world',
        },
      });
      const response = await query(GetComments(), {
        actor: actors.member,
        payload: {
          limit: 50,
          cursor: 1,
          thread_id: thread.id!,
          include_reactions: true,
          include_spam_comments: true,
          order_by: 'oldest',
          is_chat_mode: true,
        },
      });
      expect(response!.results.length).to.equal(5);
      const last = response!.results.at(-1)!;
      const stl = response!.results.at(-2)!;
      expect(last!.address).to.equal(actors.member.address);
      expect(last!.user_id).to.equal(actors.member.user.id);
      expect(last!.body).to.equal('world');
      expect(stl!.address).to.equal(actors.admin.address);
      expect(stl!.user_id).to.equal(actors.admin.user.id);
      expect(stl!.body).to.equal('hello');

      // get second comment with reactions
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.member.address!]: '50',
      });
      await command(CreateCommentReaction(), {
        actor: actors.member,
        payload: {
          comment_id: last.id!,
          reaction: 'like',
          comment_msg_id: last!.canvas_msg_id || '',
        },
      });
      const response2 = await query(GetComments(), {
        actor: actors.member,
        payload: {
          limit: 50,
          cursor: 1,
          thread_id: thread.id!,
          comment_id: last!.id,
          include_reactions: true,
          include_spam_comments: true,
          order_by: 'oldest',
          is_chat_mode: true,
        },
      });
      const second = response2!.results.at(0)!;
      expect(second!.reactions!.length).to.equal(1);
    });

    test('should get comments without reactions', async () => {
      const response = await query(GetComments(), {
        actor: actors.member,
        payload: {
          limit: 50,
          cursor: 1,
          thread_id: thread.id!,
          include_reactions: false,
          include_spam_comments: true,
          order_by: 'oldest',
          is_chat_mode: true,
        },
      });
      expect(response!.results.length).to.equal(5);
      const last = response!.results.at(-1)!;
      const stl = response!.results.at(-2)!;
      expect(last!.address).to.equal(actors.member.address);
      expect(last!.user_id).to.equal(actors.member.user.id);
      expect(last!.body).to.equal('world');
      expect(stl!.address).to.equal(actors.admin.address);
      expect(stl!.user_id).to.equal(actors.admin.user.id);
      expect(stl!.body).to.equal('hello');

      // get second comment without reactions
      const response2 = await query(GetComments(), {
        actor: actors.member,
        payload: {
          limit: 50,
          cursor: 1,
          thread_id: thread.id!,
          comment_id: response?.results.at(1)!.id,
          include_reactions: false,
          include_spam_comments: true,
          order_by: 'newest',
          is_chat_mode: false,
        },
      });
      const second = response2!.results.at(0)!;
      expect(second!.reactions).to.be.undefined;
    });
  });

  describe('thread reaction', () => {
    afterEach(() => {
      getNamespaceBalanceSpy.mockClear();
    });

    test('should create a thread reaction as a member of a group with permissions', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.member.address!]: '50',
      });
      const reaction = await command(CreateThreadReaction(), {
        actor: actors.member,
        payload: {
          thread_msg_id: thread.canvas_msg_id,
          thread_id: thread.id!,
          reaction: 'like',
        },
      });
      expect(reaction).to.include({
        thread_id: thread!.id,
        reaction: 'like',
        community_id: thread!.community_id,
      });
    });

    test('should throw error when actor does not have stake', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.member.address!]: '0',
      });
      await expect(
        command(CreateThreadReaction(), {
          actor: actors.member,
          payload: {
            thread_msg_id: thread!.canvas_msg_id,
            thread_id: thread.id!,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(InvalidState);
    });

    test('should throw error when thread not found', async () => {
      await expect(
        command(CreateThreadReaction(), {
          actor: actors.member,
          payload: {
            thread_msg_id: thread.canvas_msg_id,
            thread_id: thread.id! + 5,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(InvalidInput);
    });

    test('should throw error when actor is not member of group with permission', async () => {
      await expect(
        command(CreateThreadReaction(), {
          actor: actors.nonmember,
          payload: {
            thread_msg_id: thread.canvas_msg_id,
            thread_id: thread.id!,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(NonMember);
    });

    test('should throw an error when thread is archived', async () => {
      await expect(
        command(CreateThreadReaction(), {
          actor: actors.member,
          payload: {
            thread_msg_id: thread!.canvas_msg_id,
            thread_id: archived!.id,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(CreateThreadReactionErrors.ThreadArchived);
    });

    test('should set thread reaction vote weight and thread vote sum correctly', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.admin.address!]: '50',
      });
      const threadInstance = await models.Thread.findOne({
        where: {
          id: read_only!.id!,
        },
      });
      const initialReactionCount = threadInstance!.reaction_count;
      const reaction = await command(CreateThreadReaction(), {
        actor: actors.admin,
        payload: {
          thread_msg_id: thread!.canvas_msg_id,
          thread_id: read_only!.id,
          reaction: 'like',
        },
      });
      await threadInstance!.reload();
      expect(threadInstance!.reaction_count).to.equal(
        initialReactionCount! + 1,
      );
      const expectedWeight = 50 * vote_weight;
      expect(`${reaction?.calculated_voting_weight}`).to.eq(
        `${expectedWeight}`,
      );
      expect(`${threadInstance!.reaction_weights_sum}`).to.eq(
        `${expectedWeight}`,
      );
    });

    // test('should handle ERC20 topic weight vote', async () => {
    //   const topic = await command(CreateTopic(), {
    //     actor: actors.admin,
    //     payload: {
    //       community_id: community.id,
    //       name: 'erc20 test topic',
    //       description: '',
    //       featured_in_sidebar: false,
    //       featured_in_new_post: false,
    //       weighted_voting: TopicWeightedVoting.ERC20,
    //       token_address: '0x0000000000000000000000000000000000000123',
    //       token_symbol: 'TEST',
    //       vote_weight_multiplier: 2,
    //       chain_node_id: community.chain_node_id,
    //     },
    //   });
    //   const thread = await command(CreateThread(), {
    //     actor: actors.admin,
    //     payload: {
    //       body: 'abc',
    //       community_id: community.id,
    //       topic_id: topic!.topic.id!,
    //       title: 'test thread',
    //       kind: 'discussion',
    //       stage: '',
    //       read_only: false,
    //     },
    //   });
    //   const reaction = await command(CreateThreadReaction(), {
    //     actor: actors.admin,
    //     payload: {
    //       thread_id: thread!.id!,
    //       reaction: 'like',
    //     },
    //   });
    //   expect(reaction?.calculated_voting_weight).to.eq('100');
    // });

    test('should delete a reaction', async () => {
      const threadInstance = await models.Thread.findOne({
        where: {
          id: read_only!.id!,
        },
      });
      const initialReactionCount = threadInstance!.reaction_count;
      // tries to create a duplicate reaction on the same thread
      const reaction = await command(CreateThreadReaction(), {
        actor: actors.admin,
        payload: {
          thread_msg_id: thread!.canvas_msg_id,
          thread_id: read_only!.id,
          reaction: 'like',
        },
      });
      await threadInstance!.reload();
      expect(threadInstance!.reaction_count).to.equal(initialReactionCount);
      const deleted = await command(DeleteReaction(), {
        actor: actors.admin,
        payload: {
          community_id: thread.community_id,
          reaction_id: reaction!.id!,
        },
      });
      await threadInstance!.reload();
      expect(threadInstance!.reaction_count).to.equal(
        initialReactionCount! - 1,
      );
      const tempReaction = { ...reaction } as Partial<typeof reaction>;
      if (tempReaction) {
        if (tempReaction.community_id) delete tempReaction.community_id;
        if (tempReaction.Address) delete tempReaction.Address;
      }
      expect(deleted).to.toEqual(tempReaction);
    });

    test('should throw error when reaction not found', () => {
      expect(
        command(DeleteReaction(), {
          actor: actors.admin,
          payload: {
            community_id: thread.community_id,
            reaction_id: 888,
          },
        }),
      ).rejects.toThrowError(InvalidInput);
    });
  });

  describe('comment reaction', () => {
    afterEach(() => {
      getNamespaceBalanceSpy.mockClear();
    });

    test('should create a comment reaction as a member of a group with permissions', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.member.address!]: '50',
      });
      const reaction = await command(CreateCommentReaction(), {
        actor: actors.member,
        payload: {
          comment_msg_id: comment!.canvas_msg_id || '',
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });
      expect(reaction).to.include({
        comment_id: comment!.id,
        reaction: 'like',
        community_id: thread!.community_id,
      });
    });

    test('should set comment reaction vote weight and comment vote sum correctly', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.admin.address!]: '50',
      });
      const commentInstance = await models.Comment.findOne({
        where: {
          id: comment!.id!,
        },
      });
      const initialReactionCount = commentInstance!.reaction_count;
      const reaction = await command(CreateCommentReaction(), {
        actor: actors.admin,
        payload: {
          comment_msg_id: comment!.canvas_msg_id || '',
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });
      const expectedWeight = 50 * vote_weight;
      expect(`${reaction?.calculated_voting_weight}`).to.eq(
        `${expectedWeight}`,
      );
      await commentInstance!.reload();
      expect(commentInstance!.reaction_count).to.equal(
        initialReactionCount! + 1,
      );
      expect(`${commentInstance!.reaction_weights_sum}`).to.eq(
        `${expectedWeight * 2}`,
      ); // *2 to account for first member reaction
    });

    test('should throw error when comment not found', async () => {
      await expect(
        command(CreateCommentReaction(), {
          actor: actors.member,
          payload: {
            comment_msg_id: comment!.canvas_msg_id || '',
            comment_id: 99999999,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(InvalidInput);
    });

    test('should throw error when actor does not have stake', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.member.address!]: '0',
      });
      await expect(
        command(CreateCommentReaction(), {
          actor: actors.member,
          payload: {
            comment_msg_id: comment!.canvas_msg_id || '',
            comment_id: comment!.id!,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(InvalidState);
    });

    test('should throw error when actor is not member of group with permission', async () => {
      await expect(
        command(CreateCommentReaction(), {
          actor: actors.nonmember,
          payload: {
            comment_msg_id: comment!.canvas_msg_id || '',
            comment_id: comment!.id!,
            reaction: 'like',
          },
        }),
      ).rejects.toThrowError(NonMember);
    });

    test('should delete a reaction', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.member.address!]: '50',
      });
      const commentInstance = await models.Comment.findOne({
        where: {
          id: comment!.id!,
        },
      });
      const initialReactionCount = commentInstance!.reaction_count;

      // tries to create a duplicate reaction on the same comment
      const reaction = await command(CreateCommentReaction(), {
        actor: actors.member,
        payload: {
          comment_msg_id: comment!.canvas_msg_id || '',
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });
      await commentInstance!.reload();
      expect(commentInstance!.reaction_count).to.equal(initialReactionCount);
      const deleted = await command(DeleteReaction(), {
        actor: actors.member,
        payload: {
          community_id: thread.community_id,
          reaction_id: reaction!.id!,
        },
      });
      await commentInstance!.reload();
      expect(commentInstance!.reaction_count).to.equal(
        initialReactionCount! - 1,
      );
      const tempReaction: Partial<typeof reaction> = { ...reaction };
      if (tempReaction) {
        if (tempReaction.community_id) delete tempReaction.community_id;
        if (tempReaction.Address) delete tempReaction.Address;
      }
      expect(deleted).to.toEqual(tempReaction);
    });

    test('should throw when trying to delete a reaction that is not yours', async () => {
      getNamespaceBalanceSpy.mockResolvedValue({
        [actors.admin.address!]: '50',
      });
      const reaction = await command(CreateCommentReaction(), {
        actor: actors.admin,
        payload: {
          comment_msg_id: comment!.canvas_msg_id || '',
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });
      await expect(
        command(DeleteReaction(), {
          actor: actors.member,
          payload: {
            community_id: thread.community_id,
            reaction_id: reaction!.id!,
          },
        }),
      ).rejects.toThrow('Not the author of the entity');
    });
  });

  describe('queries', () => {
    test('should query threads', async () => {
      // test GetThreads output schema validation
      // TODO: include contests, votes, and other fields

      const response = await query(GetThreads(), {
        actor: actors.member,
        payload: {
          community_id: thread.community_id,
          limit: 50,
          cursor: 1,
        },
      });

      expect(response!.results.length).to.equal(7);
    });

    test('should search comments', async () => {
      const comments = await query(SearchComments(), {
        actor: actors.member,
        payload: {
          community_id: thread.community_id,
          search: 'hello',
          limit: 5,
          cursor: 1,
          order_by: 'created_at',
          order_direction: 'DESC',
        },
      });
      expect(comments!.results).to.have.length(1);
      expect(comments!.limit).to.equal(5);
      expect(comments!.page).to.equal(1);
      expect(comments!.totalPages).to.equal(1);
      expect(comments!.totalResults).to.equal(1);
    });
  });
});
