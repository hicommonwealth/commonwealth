import {
  ExternalServiceUserIds,
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
  dispose,
  disposeAdapter,
  notificationsProvider,
  query,
} from '@hicommonwealth/core';
import { Comment, Community, Thread, User } from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { z } from 'zod';
import { GetRecapEmailDataQuery } from '../../src/emails';
import { seed } from '../../src/tester';
import {
  generateDiscussionData,
  generateGovernanceData,
  generateProtocolData,
} from './util';

chai.use(chaiAsPromised);

describe('Recap email lifecycle', () => {
  let community: z.infer<typeof Community> | undefined;
  let comment: z.infer<typeof Comment> | undefined;
  let thread: z.infer<typeof Thread> | undefined;
  let recipientUser: z.infer<typeof User> | undefined;
  let authorUser: z.infer<typeof User> | undefined;

  let sandbox: sinon.SinonSandbox;

  beforeAll(async () => {
    [recipientUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    [authorUser] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });

    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });
    [community] = await seed('Community', {
      chain_node_id: node?.id,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: authorUser!.id,
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

  afterAll(async () => {
    await dispose()();
  });

  test('should return enriched discussion notifications', async () => {
    const discussionData = generateDiscussionData(
      authorUser!,
      community!.Addresses![0]!,
      recipientUser!,
      community!,
      thread!,
      comment!,
    );

    sandbox = sinon.createSandbox();
    notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getMessagesStub: sandbox
          .stub()
          .onFirstCall()
          .returns(Promise.resolve(discussionData.messages))
          .onSecondCall()
          .returns(Promise.resolve([])),
      }),
    );

    const res = await query(GetRecapEmailDataQuery(), {
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
    expect(res?.discussion).to.exist;
    expect(res?.discussion).to.deep.equal(discussionData.enrichedNotifications);
  });

  test('should return enriched governance notifications', async () => {
    const governanceData = generateGovernanceData(
      {
        id: '0x5ed0465ba58b442f1e671789797d5e36b538a27603549639a34f95451b59ad32',
        space: 'dydxgov.eth',
      },
      recipientUser!,
      community!,
    );

    sandbox = sinon.createSandbox();
    notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getMessagesStub: sandbox
          .stub()
          .onFirstCall()
          .returns(Promise.resolve(governanceData.messages))
          .onSecondCall()
          .returns(Promise.resolve([])),
      }),
    );

    const res = await query(GetRecapEmailDataQuery(), {
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
    expect(res?.governance).to.exist;
    expect(res?.governance).to.deep.equal(governanceData.enrichedNotifications);
  });

  test('should return enriched protocol notifications', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(new Date().getDate() - 2);
    const protocolData = generateProtocolData(
      2,
      twoDaysAgo,
      recipientUser!,
      community!,
    );

    sandbox = sinon.createSandbox();
    notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getMessagesStub: sandbox
          .stub()
          .onFirstCall()
          .returns(Promise.resolve(protocolData.messages))
          .onSecondCall()
          .returns(Promise.resolve([])),
      }),
    );

    const res = await query(GetRecapEmailDataQuery(), {
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
    expect(res?.protocol).to.exist;
    expect(res?.protocol).to.deep.equal(protocolData.enrichedNotifications);
  });

  test.skip('should throw if the notifications provider fails', async () => {
    sandbox = sinon.createSandbox();
    notificationsProvider(ThrowingSpyNotificationsProvider(sandbox));

    await expect(
      await query(GetRecapEmailDataQuery(), {
        actor: {
          user: {
            id: ExternalServiceUserIds.Knock,
            email: 'hello@knock.app',
          },
        },
        payload: {
          user_id: String(recipientUser!.id),
        },
      }),
    ).to.eventually.be.rejectedWith(ProviderError);
  });
});
