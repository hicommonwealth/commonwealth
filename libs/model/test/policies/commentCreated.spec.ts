import {
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  Mock,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import z from 'zod';
import { models, tester } from '../../src';
import { notifyCommentCreated } from '../../src/policies/handlers/notifyCommentCreated';
import { getCommentUrl, getProfileUrl } from '../../src/policies/utils/utils';
import {
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
} from '../utils/mockedNotificationProvider';

chai.use(chaiAsPromised);

describe('CommentCreated Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined,
    author: z.infer<typeof schemas.User> | undefined,
    subscriber: z.infer<typeof schemas.User> | undefined,
    mentionedUser: z.infer<typeof schemas.User> | undefined,
    thread: z.infer<typeof schemas.Thread> | undefined,
    rootComment: z.infer<typeof schemas.Comment> | undefined,
    replyComment: z.infer<typeof schemas.Comment> | undefined,
    mentionedComment: z.infer<typeof schemas.Comment> | undefined;

  const customDomain = 'random_custom_domain.com';

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
    [author] = await tester.seed('User', {});
    [subscriber] = await tester.seed('User', {});
    [mentionedUser] = await tester.seed('User', {});

    [community] = await tester.seed('Community', {
      custom_domain: customDomain,
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
          user_id: subscriber!.id,
        },
        {
          role: 'member',
          user_id: mentionedUser!.id,
        },
      ],
      topics: [{}],
    });
    [thread] = await tester.seed('Thread', {
      community_id: community!.id!,
      address_id: community!.Addresses![1].id,
      topic_id: community!.topics![0]!.id!,
      deleted_at: null,
      read_only: false,
      pinned: false,
      reaction_weights_sum: '0',
    });
    [rootComment] = await tester.seed('Comment', {
      parent_id: null,
      thread_id: thread!.id!,
      address_id: community!.Addresses![0].id,
      deleted_at: null,
      reaction_weights_sum: '0',
    });
    [replyComment] = await tester.seed('Comment', {
      parent_id: rootComment!.id,
      thread_id: thread!.id!,
      address_id: community!.Addresses![0].id,
      deleted_at: null,
      reaction_weights_sum: '0',
    });
    [mentionedComment] = await tester.seed('Comment', {
      body: `Hi [@${mentionedUser!.profile.name}](/profile/id/${
        mentionedUser!.id
      }).`,
      parent_id: rootComment!.id,
      thread_id: thread!.id!,
      address_id: community!.Addresses![0].id,
      deleted_at: null,
      reaction_weights_sum: '0',
    });
  });

  beforeEach(async () => {
    await models.ThreadSubscription.truncate();
    await models.CommentSubscription.truncate();
  });

  afterEach(() => {
    const provider = notificationsProvider();
    disposeAdapter(provider.name);
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should not throw if a valid author is not found', async () => {
    const res = await notifyCommentCreated({
      name: 'CommentCreated',
      payload: { address_id: -999999 } as z.infer<
        typeof schemas.events.CommentCreated
      >,
    });
    expect(res).to.be.false;
  });

  test('should not throw if a valid community is not found', async () => {
    const res = await notifyCommentCreated({
      name: 'CommentCreated',
      payload: {
        // @ts-expect-error StrictNullChecks
        address_id: rootComment.address_id,
        community_id: '2f92ekf2fjpe9svk23',
      } as z.infer<typeof schemas.events.CommentCreated>,
    });
    expect(res).to.be.false;
  });

  test('should do nothing if there are no relevant subscriptions', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    const res = await notifyCommentCreated({
      name: 'CommentCreated',
      payload: {
        // @ts-expect-error StrictNullChecks
        address_id: rootComment.address_id,
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
        // @ts-expect-error StrictNullChecks
        id: rootComment.id,
        // @ts-expect-error StrictNullChecks
        thread_id: rootComment.thread_id,
      } as z.infer<typeof schemas.events.CommentCreated>,
    });
    expect(res).to.be.true;
    expect(provider.triggerWorkflow as Mock).not.toHaveBeenCalled();
  });

  test('should execute the triggerWorkflow function with appropriate data for a root comment', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    await tester.seed('ThreadSubscription', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
      // @ts-expect-error StrictNullChecks
      thread_id: rootComment.thread_id,
    });
    const res = await notifyCommentCreated({
      name: 'CommentCreated',
      // @ts-expect-error StrictNullChecks
      payload: { ...rootComment, community_id: community.id },
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    // The event handler should trigger a workflow
    expect(provider.triggerWorkflow as Mock).toHaveBeenCalledOnce();
    expect((provider.triggerWorkflow as Mock).mock.calls[0][0]).to.deep.equal({
      key: WorkflowKeys.CommentCreation,
      users: [{ id: String(subscriber!.id) }],
      data: {
        author: author?.profile.name,
        comment_parent_name: 'thread',
        community_name: community?.name,
        comment_body: rootComment?.body.substring(0, 255),
        comment_url: `https://${customDomain}/${community!
          .id!}/discussion/${thread!.id!}?comment=${rootComment!.id!}`,
        comment_created_event: {
          ...rootComment,
          community_id: community!.id,
        },
      },
      actor: {
        id: String(author!.id),
        email: author!.profile.email,
        profile_name: author!.profile.name,
        profile_url: getProfileUrl(author!.id!, customDomain),
        profile_avatar_url: author!.profile.avatar_url,
      },
    });
  });

  test('should execute the triggerWorkflow function with appropriate data for a reply comment', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    await tester.seed('CommentSubscription', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
      // @ts-expect-error StrictNullChecks
      comment_id: rootComment.id,
    });
    const res = await notifyCommentCreated({
      name: 'CommentCreated',
      // @ts-expect-error StrictNullChecks
      payload: { ...replyComment, community_id: community.id },
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    // The event handler should trigger a workflow
    expect(provider.triggerWorkflow as Mock).toHaveBeenCalledOnce();
    expect((provider.triggerWorkflow as Mock).mock.calls[0][0]).to.deep.equal({
      key: WorkflowKeys.CommentCreation,
      // @ts-expect-error StrictNullChecks
      users: [{ id: String(subscriber.id) }],
      data: {
        author: author?.profile.name,
        comment_parent_name: 'comment',
        community_name: community?.name,
        comment_body: replyComment?.body.substring(0, 255),
        comment_url: getCommentUrl(
          community!.id!,
          thread!.id!,
          replyComment!.id!,
          customDomain,
        ),
        comment_created_event: {
          ...replyComment,
          community_id: community!.id,
        },
      },
      actor: {
        id: String(author!.id),
        email: author!.profile.email,
        profile_name: author!.profile.name,
        profile_url: getProfileUrl(author!.id!, customDomain),
        profile_avatar_url: author!.profile.avatar_url,
      },
    });
  });

  test('should throw if triggerWorkflow fails', async () => {
    notificationsProvider({
      adapter: ThrowingSpyNotificationsProvider(),
    });

    await tester.seed('ThreadSubscription', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
      // @ts-expect-error StrictNullChecks
      thread_id: rootComment.thread_id,
    });

    await expect(
      notifyCommentCreated({
        name: 'CommentCreated',
        // @ts-expect-error StrictNullChecks
        payload: { ...rootComment, community_id: community.id },
      }),
    ).to.eventually.be.rejectedWith(ProviderError);
  });

  test('should not trigger workflow for mentioned users', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    await tester.seed('CommentSubscription', {
      user_id: subscriber!.id,
      comment_id: rootComment!.id,
    });
    await tester.seed('CommentSubscription', {
      user_id: mentionedUser!.id,
      comment_id: rootComment!.id,
    });

    const res = await notifyCommentCreated({
      name: 'CommentCreated',
      // @ts-expect-error StrictNullChecks
      payload: {
        ...mentionedComment,
        community_id: community!.id!,
        users_mentioned: [mentionedUser!.id!],
      },
    });

    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    // The event handler should trigger a workflow
    expect(provider.triggerWorkflow as Mock).toHaveBeenCalledOnce();
    expect((provider.triggerWorkflow as Mock).mock.calls[0][0]).to.deep.equal({
      key: WorkflowKeys.CommentCreation,
      users: [{ id: String(subscriber!.id) }],
      data: {
        author: author?.profile.name,
        comment_parent_name: 'comment',
        community_name: community?.name,
        comment_body: mentionedComment?.body.substring(0, 255),
        comment_url: getCommentUrl(
          community!.id!,
          thread!.id!,
          mentionedComment!.id!,
          customDomain,
        ),
        comment_created_event: {
          ...mentionedComment,
          users_mentioned: [mentionedUser!.id!],
          community_id: community!.id,
        },
      },
      actor: {
        id: String(author!.id),
        email: author!.profile.email,
        profile_name: author!.profile.name,
        profile_url: getProfileUrl(author!.id!, customDomain),
        profile_avatar_url: author!.profile.avatar_url,
      },
    });
  });
});
