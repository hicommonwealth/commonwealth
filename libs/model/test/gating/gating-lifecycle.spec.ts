import { Actor, command, dispose } from '@hicommonwealth/core';
import { GatedActionEnum } from '@hicommonwealth/shared';
import Chance from 'chance';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreateGroup,
  RefreshCommunityMemberships,
} from '../../src/aggregates/community';
import { CreateThread } from '../../src/aggregates/thread';
import { NonMember, RejectedMember } from '../../src/middleware/errors';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

describe('Gating lifecycle', () => {
  let admin: Actor, member: Actor, rejected: Actor;
  let community_id: string;
  let topic_id: number;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member', 'rejected'],
    });
    community_id = community!.id;
    topic_id = community!.topics!.at(0)!.id!;
    admin = actors.admin;
    member = actors.member;
    rejected = actors.rejected;
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
            title: 'thread title',
            body: 'thread body',
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
          title: 'thread title',
          body: 'thread body',
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
            title: 'thread title',
            body: 'thread body',
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
            title: 'thread title',
            body: 'thread body',
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
          title: 'thread title',
          body: 'thread body',
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
            title: 'thread title',
            body: 'thread body',
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
          title: 'thread title',
          body: 'thread body',
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
            title: 'thread title',
            body: 'thread body',
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
            title: 'thread title',
            body: 'thread body',
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
          title: 'thread title',
          body: 'thread body',
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
            title: 'thread title',
            body: 'thread body',
            kind: 'discussion',
            stage: '',
            read_only: false,
          },
        }),
      ).rejects.toThrowError(RejectedMember);
    });
  });
});
