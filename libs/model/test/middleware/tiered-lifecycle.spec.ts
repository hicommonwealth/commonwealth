import { Actor, command, dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import Chance from 'chance';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreateComment,
  CreateCommentReaction,
} from '../../src/aggregates/comment';
import {
  CreateThread,
  CreateThreadReaction,
} from '../../src/aggregates/thread';
import { seedCommunity } from '../utils';

const chance = Chance();

describe('Tiered middleware lifecycle', () => {
  let community_id: string;
  let topic_id: number;
  let admin: Actor;
  let member: Actor;
  let rejected: Actor;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member', 'rejected'],
    });
    community_id = community!.id;
    topic_id = community!.topics![0].id!;
    admin = actors.admin;
    member = actors.member;
    rejected = actors.rejected;

    // setup test tiers
    await models.User.update(
      { created_at: moment().subtract(2, 'weeks') },
      { where: { id: rejected.user.id } },
    );
    await models.User.update(
      { tier: 0 },
      { where: { id: [member.user.id!, rejected.user.id!] } },
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should throw after exceeding tier 1 creation limits', async () => {
    await command(CreateThread(), {
      actor: member,
      payload: {
        community_id,
        topic_id,
        title: chance.name(),
        body: chance.name(),
        kind: 'discussion',
        stage: '',
        read_only: false,
      },
    });

    expect(
      command(CreateThread(), {
        actor: member,
        payload: {
          community_id,
          topic_id,
          title: chance.name(),
          body: chance.name(),
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      }),
    ).rejects.toThrowError('Exceeded content creation limit');
  });

  it('should throw after exceeding tier 2 creation limits', async () => {
    const thread = await command(CreateThread(), {
      actor: rejected,
      payload: {
        community_id,
        topic_id,
        title: chance.name(),
        body: chance.name(),
        kind: 'discussion',
        stage: '',
        read_only: false,
      },
    });
    await command(CreateComment(), {
      actor: rejected,
      payload: {
        thread_id: thread!.id!,
        body: chance.name(),
      },
    });

    expect(
      command(CreateThread(), {
        actor: rejected,
        payload: {
          community_id,
          topic_id,
          title: chance.name(),
          body: chance.name(),
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
      }),
    ).rejects.toThrowError('Exceeded content creation limit');
  });

  it('should throw after exceeding tier 1 reaction limits', async () => {
    const thread = await command(CreateThread(), {
      actor: admin,
      payload: {
        community_id,
        topic_id,
        title: chance.name(),
        body: chance.name(),
        kind: 'discussion',
        stage: '',
        read_only: false,
      },
    });
    const comments = await Promise.all(
      [1, 2, 3, 4, 5].map(() =>
        command(CreateComment(), {
          actor: admin,
          payload: {
            thread_id: thread!.id!,
            body: chance.name(),
          },
        }),
      ),
    );

    await command(CreateThreadReaction(), {
      actor: member,
      payload: {
        thread_id: thread!.id!,
        reaction: 'like',
      },
    });

    for (let i = 0; i < 4; i++) {
      await command(CreateCommentReaction(), {
        actor: member,
        payload: {
          comment_id: comments[i]!.id!,
          reaction: 'like',
        },
      });
    }

    expect(
      command(CreateCommentReaction(), {
        actor: member,
        payload: {
          comment_id: comments[4]!.id!,
          reaction: 'like',
        },
      }),
    ).rejects.toThrowError('Exceeded upvote limit');
  });
});
