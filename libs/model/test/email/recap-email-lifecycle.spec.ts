import {
  SpyNotificationsProvider,
  dispose,
  disposeAdapter,
  notificationsProvider,
  query,
} from '@hicommonwealth/core';
import {
  Comment,
  Community,
  Profile,
  Thread,
  User,
} from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import sinon from 'sinon';
import { z } from 'zod';
import { GetRecapEmailDataQuery } from '../../src/emails';
import { seed } from '../../src/tester';
import { generateDiscussionData } from './util';

describe('Recap email lifecycle', () => {
  let community: z.infer<typeof Community> | undefined;
  let comment: z.infer<typeof Comment> | undefined;
  let thread: z.infer<typeof Thread> | undefined;
  let recipientUser: z.infer<typeof User> | undefined;
  let authorUser: z.infer<typeof User> | undefined;
  let authorProfile: z.infer<typeof Profile> | undefined;

  let sandbox: sinon.SinonSandbox;

  before(async () => {
    [recipientUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    [authorUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    [authorProfile] = await seed('Profile', {
      user_id: authorUser!.id,
    });

    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });
    [community] = await seed('Community', {
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
          profile_id: authorProfile!.id,
        },
        {
          role: 'member',
          user_id: recipientUser!.id,
        },
      ],
    });

    [thread] = await seed('Thread', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      topic_id: community?.topics?.at(0)?.id,
      pinned: false,
      read_only: false,
      version_history: [],
    });

    [comment] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      thread_id: thread!.id!,
    });
  });

  afterEach(() => {
    const provider = notificationsProvider();
    disposeAdapter(provider.name);

    if (sandbox) {
      sandbox.restore();
    }
  });

  after(async () => {
    await dispose()();
  });

  it('should return enriched discussion notifications', async () => {
    const discussionData = generateDiscussionData(
      authorUser!,
      authorProfile!,
      community!.Addresses![0]!,
      recipientUser!,
      community!,
      thread!,
      comment!,
    );

    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getMessagesStub: sandbox
          .stub()
          .returns(Promise.resolve(discussionData.messages)),
      }),
    );

    const res = await query(GetRecapEmailDataQuery(), {
      payload: {
        user_id: String(recipientUser!.id),
      },
    });
    expect(res?.discussion).to.exist;
    expect(res?.discussion).to.deep.contains({});
  });

  it('should return enriched governance notifications');
  it('should return enriched protocol notifications');
  it('should throw if the notifications provider fails');
});
