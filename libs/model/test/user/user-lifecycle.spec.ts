import { Actor, command, dispose, query } from '@hicommonwealth/core';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { ChainBase, ChainType, WalletSsoSource } from '@hicommonwealth/shared';
import Chance from 'chance';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreateComment,
  CreateCommentReaction,
} from '../../src/aggregates/comment';
import { CreateCommunity } from '../../src/aggregates/community';
import { CreateQuest, UpdateQuest } from '../../src/aggregates/quest';
import { CreateThread } from '../../src/aggregates/thread';
import {
  GetUserProfile,
  GetXps,
  UpdateUser,
  Xp,
} from '../../src/aggregates/user';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { emitEvent } from '../../src/utils/utils';
import { drainOutbox } from '../utils';
import { seedCommunity } from '../utils/community-seeder';
import { signIn } from '../utils/sign-in';

const chance = new Chance();

describe('User lifecycle', () => {
  let admin: Actor, member: Actor, new_actor: Actor, superadmin: Actor;
  let community_id: string;
  let topic_id: number;
  let thread_id: number;
  let chain_node_id: number;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member', 'superadmin'],
    });
    community_id = community!.id;
    topic_id = community!.topics!.at(0)!.id!;
    chain_node_id = community!.chain_node_id!;
    admin = actors.admin;
    member = actors.member;
    superadmin = actors.superadmin;

    // to vote on comments
    const [thread] = await seed('Thread', {
      community_id,
      address_id: community!.Addresses!.at(0)!.id!,
      topic_id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });
    thread_id = thread!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('xp', () => {
    it('should project xp points', async () => {
      // setup quest
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'xp quest 1',
          description: chance.sentence(),
          image_url: chance.url(),
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
          max_xp_to_end: 100,
          quest_type: 'common',
        },
      });
      // setup quest actions
      const updated = await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest!.id!,
          action_metas: [
            {
              event_name: 'ThreadCreated',
              reward_amount: 10,
              creator_reward_weight: 0,
            },
            {
              event_name: 'CommentCreated',
              reward_amount: 5,
              creator_reward_weight: 0,
              participation_limit: QuestParticipationLimit.OncePerPeriod,
              participation_period: QuestParticipationPeriod.Monthly,
              participation_times_per_period: 2,
            },
            {
              event_name: 'CommentUpvoted',
              reward_amount: 20,
              creator_reward_weight: 0.1,
              content_id: `thread:${thread_id}`,
            },
          ],
        },
      });
      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );

      const watermark = new Date();

      // act on community, triggering quest rewards
      await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'Thread title',
          body: 'Thread body',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      const comment = await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id,
          body: 'Comment body 1.1',
        },
      });
      await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id,
          body: 'Comment body 1.2',
        },
      });
      await command(CreateCommentReaction(), {
        actor: member,
        payload: {
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });

      // drain the outbox
      await drainOutbox(
        ['ThreadCreated', 'CommentCreated', 'CommentUpvoted'],
        Xp,
        watermark,
      );

      // expect xp points awarded to admin who created two comments
      // and a share of the upvote reward
      const admin_profile = await query(GetUserProfile(), {
        actor: admin,
        payload: {},
      });
      expect(admin_profile?.xp_points).to.equal(12);

      // expect xp points awarded to member who created a thread
      // and upvoted a comment
      const member_profile = await query(GetUserProfile(), {
        actor: member,
        payload: {},
      });
      expect(member_profile?.xp_points).to.equal(28);

      // validate xp audit log
      const logs = await models.XpLog.findAll();
      expect(logs.length).to.equal(4);
      expect(logs.map((l) => l.toJSON())).to.deep.equal([
        {
          event_created_at: logs[0].event_created_at,
          user_id: member.user.id,
          xp_points: 10,
          action_meta_id: updated!.action_metas![0].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: logs[0].created_at,
        },
        {
          event_created_at: logs[1].event_created_at,
          user_id: admin.user.id,
          xp_points: 5,
          action_meta_id: updated!.action_metas![1].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: logs[1].created_at,
        },
        {
          event_created_at: logs[2].event_created_at,
          user_id: admin.user.id,
          xp_points: 5,
          action_meta_id: updated!.action_metas![1].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: logs[2].created_at,
        },
        {
          event_created_at: logs[3].event_created_at,
          user_id: member.user.id,
          xp_points: 18,
          action_meta_id: updated!.action_metas![2].id,
          creator_user_id: admin.user.id,
          creator_xp_points: 2,
          created_at: logs[3].created_at,
        },
      ]);

      // hack end date to make it inactive
      await models.Quest.update(
        { end_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );
    });

    it('should project xp points with participation limits in a global quest', async () => {
      // setup quest
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'xp quest 2',
          description: chance.sentence(),
          image_url: chance.url(),
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
          max_xp_to_end: 100,
          quest_type: 'common',
        },
      });
      // setup quest actions
      const updated = await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest!.id!,
          action_metas: [
            {
              event_name: 'ThreadCreated',
              reward_amount: 10,
              creator_reward_weight: 0,
            },
            {
              event_name: 'CommentCreated',
              reward_amount: 5,
              creator_reward_weight: 0,
              participation_limit: QuestParticipationLimit.OncePerPeriod,
              participation_period: QuestParticipationPeriod.Daily,
            },
            {
              event_name: 'CommentUpvoted',
              reward_amount: 20,
              creator_reward_weight: 0.1,
              participation_limit: QuestParticipationLimit.OncePerPeriod,
              participation_period: QuestParticipationPeriod.Daily,
              participation_times_per_period: 3,
              content_id: `thread:${thread_id}`,
            },
            {
              event_name: 'CommunityJoined',
              reward_amount: 20,
              creator_reward_weight: 0.5, // referrer reward
            },
          ],
        },
      });
      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );

      const watermark = new Date();

      // act on community, triggering quest rewards
      await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'Thread title',
          body: 'Thread body',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      const comment = await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id,
          body: 'Comment body 2.1',
        },
      });
      // not awarded the second time per limits
      await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id,
          body: 'Comment body 2.2',
        },
      });
      await command(CreateCommentReaction(), {
        actor: member,
        payload: {
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });

      // seed system quest and action metas
      await models.Quest.create({
        id: -1,
        name: 'System Quest',
        description: 'Referrals and address linking system-level quest',
        image_url: '',
        xp_awarded: 0,
        max_xp_to_end: 100,
        start_date: new Date(),
        end_date: new Date(),
        quest_type: 'common',
      });

      await models.QuestActionMeta.bulkCreate([
        {
          id: -1,
          quest_id: -1,
          event_name: 'SignUpFlowCompleted',
          reward_amount: 20,
          creator_reward_weight: 0.2,
          participation_limit: QuestParticipationLimit.OncePerQuest,
        },
        {
          id: -2,
          quest_id: -1,
          event_name: 'WalletLinked',
          reward_amount: 10,
          creator_reward_weight: 0,
          participation_limit: QuestParticipationLimit.OncePerQuest,
        },
        {
          id: -3,
          quest_id: -1,
          event_name: 'SSOLinked',
          reward_amount: 10,
          creator_reward_weight: 0,
          participation_limit: QuestParticipationLimit.OncePerQuest,
        },
      ]);

      // user signs in a referral link, creating a new user and address
      const new_address = await signIn(community_id, member.address);
      new_actor = {
        address: new_address!.address,
        user: {
          id: new_address!.user_id!,
          email: '',
        },
      };

      // complete the sign up flow
      await command(UpdateUser(), {
        actor: new_actor,
        payload: {
          id: new_address!.user_id!,
          profile: {
            name: 'new_user_updated',
            email: 'new_user@email.com',
          },
        },
      });

      // upgrade tier for testing
      await models.User.update(
        { tier: 4 },
        { where: { id: new_address!.user_id! } },
      );

      // drain the outbox to award xp points
      await drainOutbox(
        [
          'CommunityJoined',
          'ThreadCreated',
          'CommentCreated',
          'CommentUpvoted',
          'SignUpFlowCompleted',
        ],
        Xp,
        watermark,
      );

      // expect xp points awarded to admin who created two comments
      // and a share of the upvote reward
      const admin_profile = await query(GetUserProfile(), {
        actor: admin,
        payload: {},
      });
      // accumulating xp points from the first test (12 + 7)
      // notice that the second comment created action is not counted
      expect(admin_profile?.xp_points).to.equal(12 + 7);

      // expect xp points awarded to member who created a thread
      // and upvoted a comment, plus a referrer reward of 10 (50% of 20)
      const member_profile = await query(GetUserProfile(), {
        actor: member,
        payload: {},
      });
      // accumulating xp points
      // - 28 from the first test
      // - 28 from the second test
      // - 10 from the referral when new user joined the community
      // - 4 from the referral on a sign-up flow completed
      expect(member_profile?.xp_points).to.equal(28 + 28 + 10 + 4);

      // expect xp points awarded to user joining the community
      const new_user_profile = await query(GetUserProfile(), {
        actor: {
          user: {
            id: new_address!.user_id!,
            email: '',
          },
        },
        payload: {},
      });
      // joining community awards 10 xp points (50% of 20)
      // sign up flow completed awards 16 xp points (80% of 20)
      expect(new_user_profile?.xp_points).to.equal(10 + 16);

      // validate xp audit log
      const logs = await models.XpLog.findAll({});
      // 4 events of first test
      // 3 events of second test (second comment created action is not counted)
      // 1 event of joining community
      // 1 event of sign up flow completed
      expect(logs.length).to.equal(4 + 3 + 1 + 1);

      const last = logs.slice(-5); // last 5 event logs
      expect(last.map((l) => l.toJSON())).to.deep.equal([
        {
          event_created_at: last[0].event_created_at,
          user_id: member.user.id,
          xp_points: 10,
          action_meta_id: updated!.action_metas![0].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: last[0].created_at,
        },
        {
          event_created_at: last[1].event_created_at,
          user_id: admin.user.id,
          xp_points: 5,
          action_meta_id: updated!.action_metas![1].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: last[1].created_at,
        },
        {
          event_created_at: last[2].event_created_at,
          user_id: member.user.id,
          xp_points: 18,
          action_meta_id: updated!.action_metas![2].id,
          creator_user_id: admin.user.id,
          creator_xp_points: 2,
          created_at: last[2].created_at,
        },
        {
          event_created_at: last[3].event_created_at,
          user_id: new_address!.user_id!,
          xp_points: 10,
          action_meta_id: updated!.action_metas![3].id,
          creator_user_id: member.user.id,
          creator_xp_points: 10,
          created_at: last[3].created_at,
        },
        {
          event_created_at: last[4].event_created_at,
          user_id: new_address!.user_id!,
          xp_points: 16,
          action_meta_id: -1, // this is system quest action
          creator_user_id: member.user.id,
          creator_xp_points: 4,
          created_at: last[4].created_at,
        },
      ]);

      // hack end date to make it inactive
      await models.Quest.update(
        { end_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );
    });

    it('should query previous xp logs', async () => {
      // 8 events (skipping negative system quest id)
      const xps1 = await query(GetXps(), {
        actor: admin,
        payload: {},
      });
      expect(xps1!.length).to.equal(8);
      xps1?.forEach((xp) => {
        expect(xp.quest_id).to.be.a('number');
        expect(xp.quest_action_meta_id).to.be.a('number');
      });

      // 2 CommentUpvoted events (by event name)
      const xps2 = await query(GetXps(), {
        actor: admin,
        payload: { event_name: 'CommentUpvoted' },
      });
      expect(xps2!.length).to.equal(2);
      xps2?.forEach((xp) => {
        expect(xp.event_name).to.equal('CommentUpvoted');
      });

      // 4 events after first CommentUpvoted
      const xps3 = await query(GetXps(), {
        actor: admin,
        payload: { from: xps2!.at(-1)!.created_at },
      });
      expect(xps3!.length).to.equal(4);

      // 4 events for member (ThreadCreated and CommentUpvoted)
      const xps4 = await query(GetXps(), {
        actor: admin,
        payload: { user_id: member.user.id },
      });
      expect(xps4!.length).to.equal(4);
      xps4?.forEach((xp) => {
        expect(['ThreadCreated', 'CommentUpvoted'].includes(xp.event_name)).to
          .be.true;
      });

      // 1 event for new actor (joining)
      const xps5 = await query(GetXps(), {
        actor: admin,
        payload: { user_id: new_actor.user.id },
      });
      expect(xps5!.length).to.equal(1);
      xps5?.forEach((xp) => {
        expect(['CommunityJoined'].includes(xp.event_name)).to.be.true;
      });

      // 3 CommentCreated events for admin
      const xps6 = await query(GetXps(), {
        actor: admin,
        payload: { user_id: admin.user.id },
      });
      expect(xps6!.length).to.equal(3);
      xps6?.forEach((xp) => {
        expect(xp.event_name).to.equal('CommentCreated');
      });
    });

    it('should project xp points on same action with multiple active quests', async () => {
      // setup quests
      const quest1 = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'xp concurrent 1',
          description: chance.sentence(),
          image_url: chance.url(),
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
          max_xp_to_end: 100,
          quest_type: 'common',
        },
      });
      const quest2 = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'xp concurrent 2',
          description: chance.sentence(),
          image_url: chance.url(),
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
          max_xp_to_end: 100,
          quest_type: 'common',
        },
      });

      // setup quest actions
      await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest1!.id!,
          action_metas: [
            {
              event_name: 'ThreadCreated',
              reward_amount: 10,
              creator_reward_weight: 0,
            },
          ],
        },
      });
      await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest2!.id!,
          action_metas: [
            {
              event_name: 'ThreadCreated',
              reward_amount: 10,
              creator_reward_weight: 0,
            },
          ],
        },
      });

      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest1!.id } },
      );
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest2!.id } },
      );

      // act on community, triggering quest rewards
      await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'double xp',
          body: 'Thread body',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });

      // drain the outbox
      await drainOutbox(['ThreadCreated'], Xp);

      // expect 20 (double xp) points awarded to member who created the thread
      const member_profile = await query(GetUserProfile(), {
        actor: member,
        payload: {},
      });
      expect(member_profile?.xp_points).to.equal(28 + 28 + 10 + 4 + 20);
    });

    it('should end quest when max_xp_to_end is reached', async () => {
      // setup quest
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'xp quest with low cap',
          description: chance.sentence(),
          image_url: chance.url(),
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
          max_xp_to_end: 20,
          quest_type: 'common',
        },
      });
      // setup quest actions
      await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest!.id!,
          action_metas: [
            {
              event_name: 'ThreadCreated',
              reward_amount: 12,
              creator_reward_weight: 0,
            },
            {
              event_name: 'CommentCreated',
              reward_amount: 25,
              creator_reward_weight: 0,
              participation_limit: QuestParticipationLimit.OncePerPeriod,
              participation_period: QuestParticipationPeriod.Daily,
            },
          ],
        },
      });
      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );

      const watermark = new Date();

      // act on community, triggering quest rewards
      await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'Thread title 3',
          body: 'Thread body',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      await command(CreateComment(), {
        actor: member,
        payload: {
          thread_id,
          body: 'Comment body 3',
        },
      });

      // drain the outbox
      await drainOutbox(['ThreadCreated', 'CommentCreated'], Xp, watermark);

      const final = await models.Quest.findOne({
        where: { id: quest!.id },
      });
      expect(final!.end_date < new Date()).toBe(true);
      expect(final!.xp_awarded).toBe(37);
    });

    it('should award xp points to scoped actions', async () => {
      // setup quest
      const quest = await command(CreateQuest(), {
        actor: superadmin,
        payload: {
          name: 'xp quest with scoped actions',
          description: chance.sentence(),
          image_url: chance.url(),
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
          max_xp_to_end: 200,
          quest_type: 'common',
        },
      });
      // setup quest actions
      await command(UpdateQuest(), {
        actor: superadmin,
        payload: {
          quest_id: quest!.id!,
          action_metas: [
            {
              event_name: 'CommunityCreated',
              reward_amount: 12,
              creator_reward_weight: 0,
              content_id: `chain:${chain_node_id}`,
            },
            {
              event_name: 'SSOLinked',
              reward_amount: 11,
              creator_reward_weight: 0,
              content_id: `sso:google`,
            },
          ],
        },
      });
      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );

      const watermark = new Date();

      await command(CreateCommunity(), {
        actor: member,
        payload: {
          id: 'scoped-community',
          name: chance.name(),
          chain_node_id,
          type: ChainType.Offchain,
          default_symbol: 'TEST',
          base: ChainBase.Ethereum,
          social_links: [],
          directory_page_enabled: false,
          tags: [],
        },
      });

      // simulate SSO event
      await emitEvent(models.Outbox, [
        {
          event_name: 'SSOLinked',
          event_payload: {
            community_id,
            user_id: member.user.id!,
            oauth_provider: WalletSsoSource.Google,
            new_user: false,
            created_at: new Date(),
          },
        },
      ]);

      // drain the outbox
      await drainOutbox(['CommunityCreated', 'SSOLinked'], Xp, watermark);

      const final = await models.Quest.findOne({
        where: { id: quest!.id },
      });
      expect(final!.xp_awarded).toBe(23);
    });
  });
});
