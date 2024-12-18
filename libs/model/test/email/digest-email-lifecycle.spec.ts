import { ExternalServiceUserIds, dispose, query } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Community, User } from '@hicommonwealth/schemas';

import { expect } from 'chai';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { z } from 'zod';
import { GetDigestEmailDataQuery } from '../../src/emails';
import { seed } from '../../src/tester';
import { generateThreads } from './util';

describe('Digest email lifecycle', () => {
  let communityOne: z.infer<typeof Community> | undefined;
  let communityTwo: z.infer<typeof Community> | undefined;
  let communityThree: z.infer<typeof Community> | undefined;
  let recipientUser: z.infer<typeof User> | undefined;

  beforeAll(async () => {
    [recipientUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
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
      payload: {
        user_id: String(recipientUser!.id),
      },
    });
    expect(res).to.deep.equal({
      threads: [],
      numberOfThreads: 0,
    });
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
      payload: {
        user_id: String(recipientUser!.id),
      },
    });
    expect(res).to.deep.equal({
      threads: [],
      numberOfThreads: 0,
    });
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
      payload: {
        user_id: String(recipientUser!.id),
      },
    });

    const filtercommunityOne = res?.threads.filter(
      (thread) => thread.community_id == communityOne!.id,
    );
    const filtercommunityTwo = res?.threads.filter(
      (thread) => thread.community_id == communityTwo!.id,
    );

    expect(filtercommunityOne!.length).to.equal(2);
    expect(filtercommunityTwo!.length).to.equal(1);

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

    if (filtercommunityOne && filtercommunityOne.length > 0) {
      expect(filtercommunityOne[0]).to.deep.equal({
        name: communityOne!.name,
        icon_url: communityOne!.icon_url,
        author: null,
        ...threadOne,
      });
    }

    if (filtercommunityOne && filtercommunityOne.length >= 1) {
      expect(filtercommunityOne[1]).to.deep.equal({
        name: communityOne!.name,
        icon_url: communityOne!.icon_url,
        author: null,
        ...threadTwo,
      });
    }
    if (filtercommunityTwo && filtercommunityTwo.length > 0) {
      expect(filtercommunityTwo[0]).to.deep.equal({
        name: communityTwo!.name,
        icon_url: communityTwo!.icon_url,
        author: null,
        ...threadFour,
      });
    }
  });
});
