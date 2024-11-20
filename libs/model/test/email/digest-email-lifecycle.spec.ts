import { ExternalServiceUserIds, dispose, query } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Community } from '@hicommonwealth/schemas';
import { expect } from 'chai';
import { seed } from 'model/src/tester';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { z } from 'zod';
import { GetDigestEmailDataQuery } from '../../src/emails';
import { generateThreads } from './util';

describe('Digest email lifecycle', () => {
  let communityOne: z.infer<typeof Community> | undefined;
  let communityTwo: z.infer<typeof Community> | undefined;
  let communityThree: z.infer<typeof Community> | undefined;

  beforeAll(async () => {
    const [authorUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });

    [communityOne] = await seed('Community', {
      chain_node_id: undefined,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
        },
      ],
      topics: [{}],
    });
    [communityTwo] = await seed('Community', {
      chain_node_id: undefined,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
        },
      ],
      topics: [{}],
    });
    // create an additional community to ensure only specific threads are selected
    [communityThree] = await seed('Community', {
      chain_node_id: undefined,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
        },
      ],
      topics: [{}],
    });
  });

  afterEach(async () => {
    await models.Community.update(
      {
        include_in_digest_email: false,
      },
      {
        where: {
          id: [communityOne!.id!, communityTwo!.id!],
        },
      },
    );
    await models.sequelize.query(`DELETE FROM "Threads";`);
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should return an empty object if there are no relevant communities', async () => {
    await generateThreads(communityOne!, communityTwo!, communityThree!);
    const res = await query(GetDigestEmailDataQuery(), {
      actor: {
        user: {
          id: ExternalServiceUserIds.Knock,
          email: 'hello@knock.app',
        },
      },
      payload: {},
    });
    expect(res).to.deep.equal({});
    await models.Community.update(
      {
        include_in_digest_email: false,
      },
      {
        where: {
          id: [communityOne!.id!, communityTwo!.id!],
        },
      },
    );
  });

  test('should return an empty object if there are no relevant threads', async () => {
    await models.Community.update(
      {
        include_in_digest_email: true,
      },
      {
        where: {
          id: [communityOne!.id!, communityTwo!.id!],
        },
      },
    );

    const res = await query(GetDigestEmailDataQuery(), {
      actor: {
        user: {
          id: ExternalServiceUserIds.Knock,
          email: 'hello@knock.app',
        },
      },
      payload: {},
    });
    expect(res).to.deep.equal({});
  });

  test('should return enriched threads for each community', async () => {
    const { threadOne, threadTwo, threadFour } = await generateThreads(
      communityOne!,
      communityTwo!,
      communityThree!,
    );
    await models.Community.update(
      {
        include_in_digest_email: true,
      },
      {
        where: {
          id: [communityOne!.id!, communityTwo!.id!],
        },
      },
    );

    const res = await query(GetDigestEmailDataQuery(), {
      actor: {
        user: {
          id: ExternalServiceUserIds.Knock,
          email: 'hello@knock.app',
        },
      },
      payload: {},
    });

    expect(res![communityOne!.id!]!.length).to.equal(2);
    expect(res![communityTwo!.id!]!.length).to.equal(1);

    delete threadOne?.Address;
    delete threadOne?.collaborators;
    delete threadOne?.reactions;
    delete threadOne?.ThreadVersionHistories;
    delete threadTwo?.Address;
    delete threadTwo?.collaborators;
    delete threadTwo?.reactions;
    delete threadTwo?.ThreadVersionHistories;
    delete threadFour?.Address;
    delete threadFour?.collaborators;
    delete threadFour?.reactions;
    delete threadFour?.ThreadVersionHistories;

    expect(res![communityOne!.id!]![0]!).to.deep.equal({
      name: communityOne!.name,
      icon_url: communityOne!.icon_url,
      ...threadOne,
    });
    expect(res![communityOne!.id!]![1]!).to.deep.equal({
      name: communityOne!.name,
      icon_url: communityOne!.icon_url,
      ...threadTwo,
    });
    expect(res![communityTwo!.id!]![0]!).to.deep.equal({
      name: communityTwo!.name,
      icon_url: communityTwo!.icon_url,
      ...threadFour,
    });
  });
});
