import { ExternalServiceUserIds, dispose, query } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Community } from '@hicommonwealth/schemas';
import { expect } from 'chai';
import { z } from 'zod';
import { GetDigestEmailDataQuery } from '../../src/emails';
import { seed } from '../../src/tester';
import { generateThreads } from './util';

describe.only('Digest email lifecycle', () => {
  let communityOne: z.infer<typeof Community> | undefined;
  let communityTwo: z.infer<typeof Community> | undefined;
  let communityThree: z.infer<typeof Community> | undefined;

  before(async () => {
    const [authorUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    const [authorProfile] = await seed('Profile', {
      user_id: authorUser!.id,
    });

    [communityOne] = await seed('Community', {
      chain_node_id: undefined,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
          profile_id: authorProfile!.id,
        },
      ],
    });
    [communityTwo] = await seed('Community', {
      chain_node_id: undefined,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
          profile_id: authorProfile!.id,
        },
      ],
    });
    // create an additional community to ensure only specific threads are selected
    [communityThree] = await seed('Community', {
      chain_node_id: undefined,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
          profile_id: authorProfile!.id,
        },
      ],
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

  after(async () => {
    await dispose()();
  });

  it('should return an empty object if there are no relevant communities', async () => {
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

  it('should return an empty object if there are no relevant threads', async () => {
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

  it('should return enriched threads for each community', async () => {
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
    delete threadTwo?.Address;
    delete threadFour?.Address;

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
