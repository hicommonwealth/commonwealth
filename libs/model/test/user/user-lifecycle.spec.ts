import { Actor, command, dispose, query } from '@hicommonwealth/core';
import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import Chance from 'chance';
import moment from 'moment';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateComment, CreateCommentReaction } from '../../src/comment';
import { models } from '../../src/database';
import { CreateQuest, UpdateQuest } from '../../src/quest';
import { CreateThread } from '../../src/thread';
import {
  CreateReferralLink,
  GetReferralLink,
  GetUserProfile,
  Xp,
} from '../../src/user';
import { drainOutbox } from '../utils';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

describe('User lifecycle', () => {
  let admin: Actor, member: Actor;
  let community_id: string;
  let topic_id: number;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    community_id = community!.id;
    topic_id = community!.topics?.at(0)?.id!;
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

      // to drain the outbox
      const from = new Date();

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
        from,
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
          ],
        },
      });
      // hack start date to make it active
      await models.Quest.update(
        { start_date: moment().subtract(3, 'day').toDate() },
        { where: { id: quest!.id } },
      );

      // to drain the outbox
      const from = new Date();

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
        from,
      );

      // expect xp points awarded to admin who created two comments
      // and a share of the upvote reward
      const admin_profile = await query(GetUserProfile(), {
        actor: admin,
        payload: {},
      });
      // accumulating xp points from the first test (12 + 7)
      // notice that the second comment created action is not counted
      expect(admin_profile?.xp_points).to.equal(19);

      // expect xp points awarded to member who created a thread
      // and upvoted a comment
      const member_profile = await query(GetUserProfile(), {
        actor: member,
        payload: {},
      });
      // accumulating xp points from the second test (28 + 28)
      expect(member_profile?.xp_points).to.equal(56);

      // validate xp audit log
      const logs = await models.XpLog.findAll({
        where: { created_at: { [Op.gte]: from } },
      });
      // notice that the second comment created action is not counted
      expect(logs.length).to.equal(3);
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
          event_name: 'CommentUpvoted',
          event_created_at: logs[2].event_created_at,
          user_id: member.user.id,
          xp_points: 18,
          action_meta_id: updated!.action_metas![2].id,
          creator_user_id: admin.user.id,
          creator_xp_points: 2,
          created_at: logs[2].created_at,
        },
      ]);
    });
  });
});
