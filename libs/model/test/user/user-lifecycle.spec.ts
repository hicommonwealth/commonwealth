import { Actor, command, dispose, query } from '@hicommonwealth/core';
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
  Xp,
} from '../../src/user';
import { drainOutbox } from '../utils';
import { seedCommunity } from '../utils/community-seeder';

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
          name: 'User quest',
          description: 'User quest description',
          community_id,
          start_date: moment().add(2, 'day').toDate(),
          end_date: moment().add(3, 'day').toDate(),
        },
      });
      // setup quest actions
      await command(UpdateQuest(), {
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
      await command(CreateComment(), {
        actor: admin,
        payload: {
          thread_id: thread!.id!,
          body: 'Comment body 1',
        },
      });
      const comment = await command(CreateComment(), {
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
      console.log(logs.map((l) => l.toJSON()));
    });
  });
});
