import {
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  BalanceType,
  CommunityTierMap,
  safeTruncateBody,
} from '@hicommonwealth/shared';
import {
  Mock,
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import z from 'zod';
import { notifyUserMentioned } from '../../src/policies/handlers/notifyUserMentioned';
import { getProfileUrl, getThreadUrl } from '../../src/policies/utils/utils';
import * as tester from '../../src/tester';
import {
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
} from '../utils/mockedNotificationProvider';

describe('userMentioned Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined;
  let user, author: z.infer<typeof schemas.User> | undefined;
  let thread: z.infer<typeof schemas.Thread> | undefined;

  beforeAll(async () => {
    const [chainNode] = await tester.seed(
      'ChainNode',
      {
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
      },
      { mock: false },
    );
    [user] = await tester.seed('User', {});
    [author] = await tester.seed('User', {});
    [community] = await tester.seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      chain_node_id: chainNode?.id,
      lifetime_thread_count: 0,
      profile_count: 2,
      Addresses: [
        {
          role: 'member',
          user_id: author!.id,
        },
        {
          role: 'member',
          user_id: user!.id,
        },
      ],
      topics: [{}],
    });
    [thread] = await tester.seed('Thread', {
      community_id: community!.id!,
      address_id: community!.Addresses![1].id!,
      topic_id: community!.topics![0]!.id!,
      deleted_at: null,
      pinned: false,
      read_only: false,
      body: 'some body',
      reaction_weights_sum: '0',
    });
  });

  afterEach(() => {
    const provider = notificationsProvider();
    disposeAdapter(provider.name);
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should not throw if relevant community is not found', async () => {
    const res = await notifyUserMentioned({
      id: 0,
      name: 'UserMentioned',
      payload: {
        communityId: 'nonexistent',
      } as z.infer<typeof schemas.events.UserMentioned>,
    });
    expect(res).to.be.false;
  });

  test('should execute the triggerWorkflow function with the appropriate data', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    const res = await notifyUserMentioned({
      name: 'UserMentioned',
      payload: {
        // @ts-expect-error StrictNullChecks
        authorAddressId: community!.Addresses[0].id,
        // @ts-expect-error StrictNullChecks
        authorUserId: author!.id,
        // @ts-expect-error StrictNullChecks
        authorAddress: community!.Addresses[0].address,
        mentionedUserId: user!.id,
        communityId: community!.id,
        thread,
      },
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    // The event handler should trigger a workflow
    expect(provider.triggerWorkflow as Mock).toHaveBeenCalledOnce();
    expect((provider.triggerWorkflow as Mock).mock.calls[0][0]).to.deep.equal({
      key: WorkflowKeys.UserMentioned,
      users: [{ id: String(user!.id) }],
      data: {
        community_id: community!.id,
        community_name: community!.name,
        author: author?.profile.name,
        author_address_id: community!.Addresses![0].id,
        author_address: community!.Addresses![0].address,
        author_user_id: author!.id?.toString(),
        author_profile_url: getProfileUrl(
          author!.id!,
          community!.custom_domain,
        ),
        author_email: author!.profile.email,
        author_avatar_url: author!.profile.avatar_url,
        object_body: safeTruncateBody(thread!.body!, 255),
        object_url: getThreadUrl(community!.id!, thread!.id!),
      },
    });
  });

  test('should throw if triggerWorkflow fails', async () => {
    notificationsProvider({
      adapter: ThrowingSpyNotificationsProvider(),
    });

    await expect(
      notifyUserMentioned({
        name: 'UserMentioned',
        payload: {
          // @ts-expect-error StrictNullChecks
          authorAddressId: community!.Addresses[0].id,
          // @ts-expect-error StrictNullChecks
          authorUserId: author!.id,
          // @ts-expect-error StrictNullChecks
          authorAddress: community!.Addresses[0].address,
          mentionedUserId: user!.id,
          communityId: community!.id,
          thread,
        },
      }),
    ).rejects.toThrow(ProviderError);
  });
});
