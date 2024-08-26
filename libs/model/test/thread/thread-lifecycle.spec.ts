import { Actor, command, dispose } from '@hicommonwealth/core';
import { Chance } from 'chance';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { BanErrors } from '../../src/banCheckCache';
import { seed } from '../../src/tester';
import { CreateThread } from '../../src/thread/CreateThread.command';

const chance = Chance();

describe('Thread lifecycle', () => {
  let actor: Actor;
  const body = chance.paragraph();
  const title = chance.sentence();
  const stage = 'stage';
  const payload = {
    community_id: '',
    topic_id: 1,
    kind: 'discussion' as 'discussion',
    title,
    body,
    stage,
    url: 'http://blah',
    id: 0,
    canvas_hash: '',
    canvas_signed_data: '',
    read_only: false,
  };

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {});
    const [user] = await seed('User', { isAdmin: true });
    const [community] = await seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
        },
      ],
    });

    payload.community_id = community!.id!;
    actor = {
      user: { id: user!.id!, email: user!.email!, isAdmin: user!.isAdmin! },
      address: community!.Addresses!.at(0)!.address!,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create thread', async () => {
    const thread = await command(CreateThread(), {
      actor,
      payload,
    });
    expect(thread?.title).to.equal(title);
    expect(thread?.body).to.equal(body);
    expect(thread?.stage).to.equal(stage);
  });

  test('should reject banned address', async () => {
    expect(
      command(CreateThread(), {
        actor,
        payload,
      }),
    ).to.be.rejectedWith(`Ban error: ${BanErrors.Banned}`);
  });
});
