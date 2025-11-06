import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { GatedActionEnum, UserTierMap } from '@hicommonwealth/shared';
import Chance from 'chance';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CreateComment } from '../../src/aggregates/comment';
import {
  CreateGroup,
  RefreshCommunityMemberships,
} from '../../src/aggregates/community';
import {
  CreateThread,
  GetActiveThreads,
  GetThreads,
  SearchThreads,
} from '../../src/aggregates/thread';
import { config } from '../../src/config';
import { models } from '../../src/database';
import { systemActor } from '../../src/middleware/auth';
import { NonMember, RejectedMember } from '../../src/middleware/errors';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

// Generate a test-specific bot user address (not using the real env var)
const TEST_BOT_USER_ADDRESS = '0xTestBotAddress123';

// Mock the config.AI.BOT_USER_ADDRESS to use our test value
vi.spyOn(config.AI, 'BOT_USER_ADDRESS', 'get').mockReturnValue(
  TEST_BOT_USER_ADDRESS,
);

describe('Gating lifecycle', () => {
  let admin: Actor, member: Actor, rejected: Actor;
  let community_id: string;
  let topic_id: number;

  beforeAll(async () => {
    // add missing enum_GroupGatedActions_gated_actions type
    // since it's not defined in the model
    await models.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_GroupGatedActions_gated_actions') THEN
          CREATE TYPE "enum_GroupGatedActions_gated_actions" AS ENUM (
            'CREATE_THREAD',
            'CREATE_COMMENT',
            'CREATE_THREAD_REACTION',
            'CREATE_COMMENT_REACTION',
            'UPDATE_POLL'
          );
        END IF;
      END
      $$;
    `);

    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member', 'rejected'],
    });
    community_id = community!.id;
    topic_id = community!.topics!.at(0)!.id!;
    admin = actors.admin;
    member = actors.member;
    rejected = actors.rejected;

    // Seed the bot user for testing (after community is created)
    const existingBotUser = await models.User.findOne({
      where: { email: 'ai-bot@common.xyz' },
    });

    if (!existingBotUser) {
      const botUser = await models.User.create({
        email: 'ai-bot@common.xyz',
        emailVerified: true,
        isAdmin: false,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });

      // Create a bot address in the test community (required since community_id cannot be null)
      await models.Address.create({
        user_id: botUser.id,
        address: TEST_BOT_USER_ADDRESS,
        community_id: community_id,
        verified: new Date(),
        ghost_address: false,
        is_banned: false,
        role: 'member',
        verification_token: '1234567890',
      });
    }
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('single public gates', () => {
    it('should allow gated actions to members', async () => {
      await command(CreateGroup(), {
        actor: admin,
        payload: {
          community_id,
          topics: [
            {
              id: topic_id,
              permissions: [GatedActionEnum.CREATE_THREAD],
              is_private: false,
            },
          ],
          metadata: {
            name: 'Allow member',
            description: chance.sentence(),
            required_requirements: 1,
            membership_ttl: 100000,
          },
          requirements: [{ rule: 'allow', data: { allow: [member.address!] } }],
        },
      });

      // should throw before refreshing memberships
      await expect(
        command(CreateThread(), {
          actor: member,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(NonMember);

      await command(RefreshCommunityMemberships(), {
        actor: admin,
        payload: { community_id },
      });

      // should succeed after refreshing memberships
      const thread = await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'thread title 1',
          body: 'thread body 1',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      expect(thread?.id).to.be.a('number');
    });

    it('should not allow gated actions to non-members', async () => {
      await expect(
        command(CreateThread(), {
          actor: rejected,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(RejectedMember);
    });
  });

  describe('many public gates', () => {
    it('should allow gated actions to members', async () => {
      await command(CreateGroup(), {
        actor: admin,
        payload: {
          community_id,
          topics: [
            {
              id: topic_id,
              permissions: [GatedActionEnum.CREATE_THREAD],
              is_private: false,
            },
          ],
          metadata: {
            name: 'Allow member 2',
            description: chance.sentence(),
            required_requirements: 1,
            membership_ttl: 100000,
          },
          requirements: [{ rule: 'allow', data: { allow: [member.address!] } }],
        },
      });

      // should fail before refreshing memberships
      await expect(
        command(CreateThread(), {
          actor: member,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(NonMember);

      await command(RefreshCommunityMemberships(), {
        actor: admin,
        payload: { community_id },
      });

      // should succeed after refreshing memberships
      const thread = await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'thread title 2',
          body: 'thread body 2',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      expect(thread?.id).to.be.a('number');
    });
  });

  describe('default private gates', () => {
    it('should allow gated actions to members', async () => {
      await command(CreateGroup(), {
        actor: admin,
        payload: {
          community_id,
          topics: [
            {
              id: topic_id,
              permissions: [], // defaults to all actions
              is_private: true,
            },
          ],
          metadata: {
            name: 'Allow member private 1',
            description: chance.sentence(),
            required_requirements: 1,
            membership_ttl: 100000,
          },
          requirements: [{ rule: 'allow', data: { allow: [member.address!] } }],
        },
      });

      // should fail before refreshing memberships
      await expect(
        command(CreateThread(), {
          actor: member,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(NonMember);

      await command(RefreshCommunityMemberships(), {
        actor: admin,
        payload: { community_id },
      });

      // should succeed after refreshing memberships
      const thread = await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'thread title 3',
          body: 'thread body 3',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      expect(thread?.id).to.be.a('number');
    });

    it('should not allow gated actions to non-members', async () => {
      await expect(
        command(CreateThread(), {
          actor: rejected,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(RejectedMember);
    });
  });

  describe('gated private gates', () => {
    it('should allow gated actions to members', async () => {
      await command(CreateGroup(), {
        actor: admin,
        payload: {
          community_id,
          topics: [
            {
              id: topic_id,
              permissions: [GatedActionEnum.CREATE_THREAD],
              is_private: true,
            },
          ],
          metadata: {
            name: 'Allow member private 2',
            description: chance.sentence(),
            required_requirements: 1,
            membership_ttl: 100000,
          },
          requirements: [{ rule: 'allow', data: { allow: [member.address!] } }],
        },
      });

      // should fail before refreshing memberships
      await expect(
        command(CreateThread(), {
          actor: member,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(NonMember);

      await command(RefreshCommunityMemberships(), {
        actor: admin,
        payload: { community_id },
      });

      // should succeed after refreshing memberships
      const thread = await command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: 'thread title 4',
          body: 'thread body 4',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });
      expect(thread?.id).to.be.a('number');
    });

    it('should not allow gated actions to non-members', async () => {
      await expect(
        command(CreateThread(), {
          actor: rejected,
          payload: {
            community_id,
            topic_id,
            title: 'failed thread title',
            body: 'failed thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(RejectedMember);
    });

    it('should be able to view threads in private topics', async () => {
      const getResults = await query(GetThreads(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          cursor: 1,
          limit: 30,
        },
      });
      expect(getResults?.results.length).to.equal(4);

      const searchResults = await query(SearchThreads(), {
        actor: member,
        payload: {
          community_id,
          search_term: 'thread title',
          thread_title_only: true,
          include_count: true,
          cursor: 1,
          limit: 30,
        },
      });
      expect(searchResults?.results.length).to.equal(4);

      const activeResults = await query(GetActiveThreads(), {
        actor: member,
        payload: {
          community_id,
          threads_per_topic: 5,
        },
      });
      expect(activeResults?.length).to.equal(4);
    });

    it('should not be able to view threads in private topics', async () => {
      const getResults = await query(GetThreads(), {
        actor: rejected,
        payload: {
          community_id,
          topic_id,
          cursor: 1,
          limit: 30,
        },
      });
      expect(getResults?.results.length).to.equal(0);

      const searchResults = await query(SearchThreads(), {
        actor: rejected,
        payload: {
          community_id,
          search_term: 'thread title',
          thread_title_only: true,
          include_count: true,
          cursor: 1,
          limit: 30,
        },
      });
      expect(searchResults?.results.length).to.equal(0);

      const activeResults = await query(GetActiveThreads(), {
        actor: rejected,
        payload: {
          community_id,
          threads_per_topic: 5,
        },
      });
      expect(activeResults?.length).to.equal(0);
    });
  });

  describe('AI bot gating bypass', () => {
    it('should allow bot to comment in gated topics', async () => {
      // Create a gated topic for comments
      const group = await command(CreateGroup(), {
        actor: admin,
        payload: {
          community_id,
          topics: [
            {
              id: topic_id,
              permissions: [GatedActionEnum.CREATE_COMMENT],
              is_private: false,
            },
          ],
          metadata: {
            name: 'Comment gate',
            description: 'Only members can comment',
            required_requirements: 1,
            membership_ttl: 100000,
          },
          requirements: [{ rule: 'allow', data: { allow: [member.address!] } }],
        },
      });

      await command(RefreshCommunityMemberships(), {
        actor: admin,
        payload: { community_id },
      });

      // Create a thread for testing
      const thread = await command(CreateThread(), {
        actor: admin,
        payload: {
          community_id,
          topic_id,
          title: 'Test thread for bot comments',
          body: 'Testing bot gating bypass',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });

      // Get bot user (directly from database, seeded in beforeAll)
      const botUser = await models.User.findOne({
        where: { email: 'ai-bot@common.xyz' },
        include: [{ model: models.Address, required: true }],
      });

      if (!botUser || !botUser.Addresses || botUser.Addresses.length === 0) {
        throw new Error('Bot user not seeded properly in test setup');
      }

      const botAddress = botUser.Addresses[0];

      // Join community as bot if not already joined
      const botCommunityAddress = await models.Address.findOne({
        where: {
          user_id: botUser.id,
          community_id,
        },
      });

      if (!botCommunityAddress) {
        // Create bot address in community
        await models.Address.create({
          user_id: botUser.id,
          address: botAddress.address,
          community_id,
          role: 'member',
          verified: new Date(),
          ghost_address: false,
          is_banned: false,
        });
      }

      // Create bot actor (using regular actor, not system actor to test the bypass logic)
      const botActor: Actor = {
        user: {
          id: botUser.id!,
          email: botUser.email!,
        },
        address: botAddress.address,
      };

      // Bot should be able to comment even though the topic is gated
      const comment = await command(CreateComment(), {
        actor: botActor,
        payload: {
          thread_id: thread!.id!,
          body: 'Bot comment in gated topic',
        },
      });

      expect(comment?.id).to.be.a('number');
      expect(comment?.body).to.equal('Bot comment in gated topic');
    });

    it('should allow system actor bot to comment in gated topics', async () => {
      // Create a thread for testing
      const thread = await command(CreateThread(), {
        actor: admin,
        payload: {
          community_id,
          topic_id,
          title: 'Test thread for system bot comments',
          body: 'Testing system actor bot gating bypass',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      });

      // Get bot user (directly from database, seeded in beforeAll)
      const botUser = await models.User.findOne({
        where: { email: 'ai-bot@common.xyz' },
        include: [{ model: models.Address, required: true }],
      });

      if (!botUser || !botUser.Addresses || botUser.Addresses.length === 0) {
        throw new Error('Bot user not seeded properly in test setup');
      }

      const botAddress = botUser.Addresses[0];

      // Create system actor for bot (this is how CreateAICompletionComment does it)
      const botSystemActor = systemActor({
        address: botAddress.address,
        id: botUser.id!,
        email: botUser.email || 'ai-bot@common.xyz',
      });

      // System actor bot should be able to comment even though the topic is gated
      const comment = await command(CreateComment(), {
        actor: botSystemActor,
        payload: {
          thread_id: thread!.id!,
          body: 'System bot comment in gated topic',
        },
      });

      expect(comment?.id).to.be.a('number');
      expect(comment?.body).to.equal('System bot comment in gated topic');
    });
  });
});
