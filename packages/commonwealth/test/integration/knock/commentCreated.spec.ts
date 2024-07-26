import {
  CommentCreated,
  EventNames,
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from 'vitest';
import z from 'zod';
import { processCommentCreated } from '../../../server/workers/knock/eventHandlers/commentCreated';
import { getCommentUrl } from '../../../server/workers/knock/util';

chai.use(chaiAsPromised);

describe('CommentCreated Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined,
    author: z.infer<typeof schemas.User> | undefined,
    subscriber: z.infer<typeof schemas.User> | undefined,
    authorProfile: z.infer<typeof schemas.Profile> | undefined,
    thread: z.infer<typeof schemas.Thread> | undefined,
    rootComment: z.infer<typeof schemas.Comment> | undefined,
    replyComment: z.infer<typeof schemas.Comment> | undefined,
    sandbox: sinon.SinonSandbox;

  beforeAll(async () => {
    const [chainNode] = await tester.seed(
      'ChainNode',
      {
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
        contracts: [],
      },
      { mock: false },
    );
    [author] = await tester.seed('User', {});
    [subscriber] = await tester.seed('User', {});
    [authorProfile] = await tester.seed('Profile', {
      // @ts-expect-error StrictNullChecks
      user_id: author.id,
      profile_name: author?.profile.name ?? '',
    });
    await tester.seed('Profile', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
    });
    [community] = await tester.seed('Community', {
      chain_node_id: chainNode?.id,
      Addresses: [
        {
          role: 'member',
          user_id: author!.id,
        },
        {
          role: 'member',
          user_id: subscriber!.id,
        },
      ],
    });

    [thread] = await tester.seed('Thread', {
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      // @ts-expect-error StrictNullChecks
      address_id: community.Addresses[1].id,
      topic_id: null,
      deleted_at: null,
      read_only: false,
      version_history: [],
      pinned: false,
    });
    [rootComment] = await tester.seed('Comment', {
      parent_id: null,
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      // @ts-expect-error StrictNullChecks
      thread_id: thread.id,
      // @ts-expect-error StrictNullChecks
      address_id: community.Addresses[0].id,
      deleted_at: null,
    });
    [replyComment] = await tester.seed('Comment', {
      // @ts-expect-error StrictNullChecks
      parent_id: String(rootComment.id),
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      // @ts-expect-error StrictNullChecks
      thread_id: thread.id,
      // @ts-expect-error StrictNullChecks
      address_id: community.Addresses[0].id,
      deleted_at: null,
    });
  });

  beforeEach(async () => {
    await models.ThreadSubscription.truncate();
    await models.CommentSubscription.truncate();
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

  test('should not throw if a valid author is not found', async () => {
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      payload: { address_id: -999999 } as z.infer<typeof CommentCreated>,
    });
    expect(res).to.be.false;
  });

  test('should not throw if a valid community is not found', async () => {
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      payload: {
        // @ts-expect-error StrictNullChecks
        address_id: rootComment.address_id,
        community_id: '2f92ekf2fjpe9svk23',
      } as z.infer<typeof CommentCreated>,
    });
    expect(res).to.be.false;
  });

  test('should do nothing if there are no relevant subscriptions', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      payload: {
        // @ts-expect-error StrictNullChecks
        address_id: rootComment.address_id,
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
        // @ts-expect-error StrictNullChecks
        id: rootComment.id,
        // @ts-expect-error StrictNullChecks
        thread_id: rootComment.thread_id,
      } as z.infer<typeof CommentCreated>,
    });
    expect(res).to.be.true;
    expect((provider.triggerWorkflow as sinon.SinonStub).notCalled).to.be.true;
  });

  test('should execute the triggerWorkflow function with appropriate data for a root comment', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    await tester.seed('ThreadSubscription', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
      // @ts-expect-error StrictNullChecks
      thread_id: rootComment.thread_id,
    });
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      // @ts-expect-error StrictNullChecks
      payload: { ...rootComment },
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    expect(
      (provider.triggerWorkflow as sinon.SinonStub).calledOnce,
      'The event handler should trigger a workflow',
    ).to.be.true;
    expect(
      (provider.triggerWorkflow as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      key: WorkflowKeys.CommentCreation,
      // @ts-expect-error StrictNullChecks
      users: [{ id: String(subscriber.id) }],
      data: {
        // @ts-expect-error StrictNullChecks
        author: authorProfile.profile_name,
        comment_parent_name: 'thread',
        // @ts-expect-error StrictNullChecks
        community_name: community.name,
        // @ts-expect-error StrictNullChecks
        comment_body: rootComment.text.substring(0, 255),
        // @ts-expect-error StrictNullChecks
        comment_url: getCommentUrl(community.id, thread.id, rootComment.id),
        comment_created_event: rootComment,
      },
      // @ts-expect-error StrictNullChecks
      actor: { id: String(author.id) },
    });
  });

  test('should execute the triggerWorkflow function with appropriate data for a reply comment', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    await tester.seed('CommentSubscription', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
      // @ts-expect-error StrictNullChecks
      comment_id: rootComment.id,
    });
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      // @ts-expect-error StrictNullChecks
      payload: { ...replyComment },
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    expect(
      (provider.triggerWorkflow as sinon.SinonStub).calledOnce,
      'The event handler should trigger a workflow',
    ).to.be.true;
    expect(
      (provider.triggerWorkflow as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      key: WorkflowKeys.CommentCreation,
      // @ts-expect-error StrictNullChecks
      users: [{ id: String(subscriber.id) }],
      data: {
        // @ts-expect-error StrictNullChecks
        author: authorProfile.profile_name,
        comment_parent_name: 'comment',
        // @ts-expect-error StrictNullChecks
        community_name: community.name,
        // @ts-expect-error StrictNullChecks
        comment_body: replyComment.text.substring(0, 255),
        // @ts-expect-error StrictNullChecks
        comment_url: getCommentUrl(community.id, thread.id, replyComment.id),
        comment_created_event: replyComment,
      },
      // @ts-expect-error StrictNullChecks
      actor: { id: String(author.id) },
    });
  });

  test('should throw if triggerWorkflow fails', async () => {
    sandbox = sinon.createSandbox();
    notificationsProvider(ThrowingSpyNotificationsProvider(sandbox));

    await tester.seed('ThreadSubscription', {
      // @ts-expect-error StrictNullChecks
      user_id: subscriber.id,
      // @ts-expect-error StrictNullChecks
      thread_id: rootComment.thread_id,
    });

    await expect(
      processCommentCreated({
        name: EventNames.CommentCreated,
        // @ts-expect-error StrictNullChecks
        payload: { ...rootComment },
      }),
    ).to.eventually.be.rejectedWith(ProviderError);
  });
});
