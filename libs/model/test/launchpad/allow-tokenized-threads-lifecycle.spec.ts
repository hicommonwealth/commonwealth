import { command, dispose, query } from '@hicommonwealth/core';
import { expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { UpdateCommunity, UpdateTopic } from '../../src/aggregates/community';
import { GetTokenizedThreadsAllowed } from '../../src/aggregates/token';
import { seed } from '../../src/tester';

describe('allow_tokenized_threads lifecycle', () => {
  const topic_id = 1;
  const address = '0x0000000000000000000000000000000000000000';
  const community_id = 'eee';
  const user_id = 1;
  const actor = {
    user: {
      id: user_id,
      email: '',
      isAdmin: true,
    },
    address,
  };

  beforeAll(async () => {
    await seed('User', {
      id: user_id,
    });
    await seed('Community', {
      id: community_id,
      allow_tokenized_threads: false,
      profile_count: 0,
    });
    await seed('Address', {
      address,
      community_id,
      user_id,
      role: 'admin',
    });
    await seed('Topic', {
      community_id,
      id: topic_id,
      allow_tokenized_threads: false,
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  async function GetTokenizedThreadsAllowedResult() {
    const results = await query(GetTokenizedThreadsAllowed(), {
      actor,
      payload: {
        community_id,
        topic_id,
      },
    });

    return results!.tokenized_threads_enabled!;
  }

  test('Should return false if both community and topic are false', async () => {
    expect(await GetTokenizedThreadsAllowedResult()).to.eq(false);
  });

  test('Should return true if both community is true regardless of topic', async () => {
    await command(UpdateCommunity(), {
      actor,
      payload: {
        community_id,
        allow_tokenized_threads: true,
      },
    });

    expect(await GetTokenizedThreadsAllowedResult()).to.eq(true);

    await command(UpdateTopic(), {
      actor,
      payload: {
        topic_id,
        community_id,
        allow_tokenized_threads: true,
      },
    });

    expect(await GetTokenizedThreadsAllowedResult()).to.eq(true);

    await command(UpdateCommunity(), {
      actor,
      payload: {
        community_id,
        allow_tokenized_threads: false,
      },
    });

    expect(await GetTokenizedThreadsAllowedResult()).to.eq(true);
  });
});
