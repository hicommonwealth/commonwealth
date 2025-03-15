import { Actor, command, dispose } from '@hicommonwealth/core';
import Chance from 'chance';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateThread } from '../../src/aggregates/thread';
import { seedCommunity } from '../utils';

const chance = Chance();

describe('Tiered middleware lifecycle', () => {
  let community_id: string;
  let topic_id: number;
  let member: Actor;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({ roles: ['member'] });
    community_id = community!.id;
    topic_id = community!.topics![0].id!;
    member = actors.member;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should throw after exceedin tier 1 limits', async () => {
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
});
