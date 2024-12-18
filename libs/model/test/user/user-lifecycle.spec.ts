import { Actor, command, dispose, query } from '@hicommonwealth/core';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import Chance from 'chance';
import { JoinCommunity } from 'model/src/community';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateComment, CreateCommentReaction } from '../../src/comment';
import { models } from '../../src/database';
import { CreateQuest, UpdateQuest } from '../../src/quest';
import { CreateThread } from '../../src/thread';
import {
  CreateReferralLink,
  GetReferralLink,
  GetUserProfile,
  GetXps,
  UpdateUser,
  Xp,
} from '../../src/user';
import { drainOutbox } from '../utils';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

describe('User lifecycle', () => {
  let admin: Actor, member: Actor, new_actor: Actor;
  let community_id: string;
  let topic_id: number;
  let base_id: string;

  beforeAll(async () => {
    const { base, community, actors } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    base_id = base!.id;
    community_id = community!.id;
    topic_id = community!.topics!.at(0)!.id!;
    admin = actors.admin;
    member = actors.member;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('referrals', () => {
    it('should create referral link when user is created', async () => {
      const response = await command(CreateReferralLink(), {
        actor: member,
        payload: {},
      });
      expect(response!.referral_link).toBeDefined();

      // make sure it's saved
      const response2 = await query(GetReferralLink(), {
        actor: member,
        payload: {},
      });
      expect(response2!.referral_link).to.eq(response?.referral_link);
    });

    it('should fail to create referral link when one already exists', async () => {
      expect(
        command(CreateReferralLink(), {
          actor: member,
          payload: {},
        }),
      ).rejects.toThrowError('Referral link already exists');
    });
  });

  describe('xp', () => {
    it('should project xp points', async () => {
      // setup quest
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          name: chance.name(),
          description: chance.sentence(),
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
        },
      });
      // setup quest actions
      const updated = await command(UpdateQuest(), {
        actor: admin,
        payload: {
          community_id,
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
            },
          ],
        },
      });
      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );

      // act on community, triggering quest rewards
      const thread = await command(CreateThread(), {
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
          thread_id: thread!.id!,
          body: 'Comment body 1',
        },
      });
      await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id: thread!.id!,
          body: 'Comment body 1',
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
          event_name: 'ThreadCreated',
          event_created_at: logs[0].event_created_at,
          user_id: member.user.id,
          xp_points: 10,
          action_meta_id: updated!.action_metas![0].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: logs[0].created_at,
        },
        {
          event_name: 'CommentCreated',
          event_created_at: logs[1].event_created_at,
          user_id: admin.user.id,
          xp_points: 5,
          action_meta_id: updated!.action_metas![1].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: logs[1].created_at,
        },
        {
          event_name: 'CommentCreated',
          event_created_at: logs[2].event_created_at,
          user_id: admin.user.id,
          xp_points: 5,
          action_meta_id: updated!.action_metas![1].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: logs[2].created_at,
        },
        {
          event_name: 'CommentUpvoted',
          event_created_at: logs[3].event_created_at,
          user_id: member.user.id,
          xp_points: 18,
          action_meta_id: updated!.action_metas![2].id,
          creator_user_id: admin.user.id,
          creator_xp_points: 2,
          created_at: logs[3].created_at,
        },
      ]);
    });

    it('should project xp points with participation limits', async () => {
      // setup quest
      const quest = await command(CreateQuest(), {
        actor: admin,
        payload: {
          name: chance.name(),
          description: chance.sentence(),
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
        },
      });
      // setup quest actions
      const updated = await command(UpdateQuest(), {
        actor: admin,
        payload: {
          community_id,
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

      // act on community, triggering quest rewards
      const thread = await command(CreateThread(), {
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
          thread_id: thread!.id!,
          body: 'Comment body 1',
        },
      });
      await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id: thread!.id!,
          body: 'Comment body 1',
        },
      });
      await command(CreateCommentReaction(), {
        actor: member,
        payload: {
          comment_id: comment!.id!,
          reaction: 'like',
        },
      });

      const referral_response = await query(GetReferralLink(), {
        actor: member,
        payload: {},
      });

      // TODO: command to create a new user
      const new_user = await models.User.create({
        profile: {
          name: 'New User',
          email: 'newuser@hi.com',
        },
        isAdmin: false,
        is_welcome_onboard_flow_complete: false,
        emailVerified: true,
      });
      new_actor = {
        address: '0x9000000000000000000000000000000000000000',
        user: {
          id: new_user.id,
          email: new_user.profile.email!,
        },
      };
      await models.Address.create({
        community_id: base_id,
        user_id: new_user.id,
        address: new_actor.address!,
        role: 'member',
        is_banned: false,
        verified: new Date(),
        ghost_address: false,
        is_user_default: false,
        verification_token: '1234',
      });
      // user signs up for the community with a referral link
      await command(UpdateUser(), {
        actor: new_actor,
        payload: {
          id: new_user.id!,
          referral_link: referral_response?.referral_link,
          profile: {
            name: 'New User Updated',
          },
        },
      });

      // the new user joins the community with a referral link
      await command(JoinCommunity(), {
        actor: new_actor,
        payload: {
          community_id,
          referral_link: referral_response?.referral_link,
        },
      });

      // drain the outbox
      await drainOutbox(
        [
          'CommunityJoined',
          'ThreadCreated',
          'CommentCreated',
          'CommentUpvoted',
          'SignUpFlowCompleted',
        ],
        Xp,
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
      // - 4 from the referral on a sign up flow completed
      expect(member_profile?.xp_points).to.equal(28 + 28 + 10 + 4);

      // expect xp points awarded to user joining the community
      const new_user_profile = await query(GetUserProfile(), {
        actor: {
          user: {
            id: new_user.id,
            email: new_user.profile.email!,
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
          event_name: 'ThreadCreated',
          event_created_at: last[0].event_created_at,
          user_id: member.user.id,
          xp_points: 10,
          action_meta_id: updated!.action_metas![0].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: last[0].created_at,
        },
        {
          event_name: 'CommentCreated',
          event_created_at: last[1].event_created_at,
          user_id: admin.user.id,
          xp_points: 5,
          action_meta_id: updated!.action_metas![1].id,
          creator_user_id: null,
          creator_xp_points: null,
          created_at: last[1].created_at,
        },
        {
          event_name: 'CommentUpvoted',
          event_created_at: last[2].event_created_at,
          user_id: member.user.id,
          xp_points: 18,
          action_meta_id: updated!.action_metas![2].id,
          creator_user_id: admin.user.id,
          creator_xp_points: 2,
          created_at: last[2].created_at,
        },
        {
          event_name: 'SignUpFlowCompleted',
          event_created_at: last[3].event_created_at,
          user_id: new_user.id,
          xp_points: 16,
          action_meta_id: null, // this is a site event and not a quest action
          creator_user_id: member.user.id,
          creator_xp_points: 4,
          created_at: last[3].created_at,
        },
        {
          event_name: 'CommunityJoined',
          event_created_at: last[4].event_created_at,
          user_id: new_user.id,
          xp_points: 10,
          action_meta_id: updated!.action_metas![3].id,
          creator_user_id: member.user.id,
          creator_xp_points: 10,
          created_at: last[4].created_at,
        },
      ]);
    });

    it('should query previous xp logs', async () => {
      // 8 events (by community id)
      const xps1 = await query(GetXps(), {
        actor: admin,
        payload: { community_id },
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

      // 5 events after first CommentUpvoted
      const xps3 = await query(GetXps(), {
        actor: admin,
        payload: { from: xps2!.at(-1)!.created_at },
      });
      expect(xps3!.length).to.equal(5);

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

      // 2 events for new actor (joining and sign up flow completed)
      const xps5 = await query(GetXps(), {
        actor: admin,
        payload: { user_id: new_actor.user.id },
      });
      expect(xps5!.length).to.equal(2);
      xps5?.forEach((xp) => {
        expect(
          ['SignUpFlowCompleted', 'CommunityJoined'].includes(xp.event_name),
        ).to.be.true;
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
  });
});
