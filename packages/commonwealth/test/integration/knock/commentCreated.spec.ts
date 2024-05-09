import {
  CommentCreated,
  EventNames,
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
import z from 'zod';
import { processCommentCreated } from '../../../server/workers/knock/eventHandlers/commentCreated';
import { getCommentUrl } from '../../../server/workers/knock/util';
import {
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
} from './util';

chai.use(chaiAsPromised);

describe.only('CommentCreated Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined,
    author: z.infer<typeof schemas.User> | undefined,
    subscriber: z.infer<typeof schemas.User> | undefined,
    authorProfile: z.infer<typeof schemas.Profile> | undefined,
    subscriberProfile: z.infer<typeof schemas.Profile> | undefined,
    thread: z.infer<typeof schemas.Thread> | undefined,
    rootComment: z.infer<typeof schemas.Comment> | undefined,
    replyComment: z.infer<typeof schemas.Comment> | undefined;

  let sandbox: sinon.SinonSandbox;

  before(async () => {
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
      user_id: author.id,
    });
    [subscriberProfile] = await tester.seed('Profile', {
      user_id: subscriber.id,
    });
    [community] = await tester.seed('Community', {
      chain_node_id: chainNode?.id,
      Addresses: [
        {
          role: 'member',
          user_id: author!.id,
          profile_id: authorProfile!.id,
        },
        {
          role: 'member',
          user_id: subscriber!.id,
          profile_id: subscriberProfile!.id,
        },
      ],
    });

    [thread] = await tester.seed('Thread', {
      community_id: community.id,
      address_id: community.Addresses[1].id,
      topic_id: null,
      deleted_at: null,
    });
    [rootComment] = await tester.seed('Comment', {
      parent_id: null,
      community_id: community.id,
      thread_id: thread.id,
      address_id: community.Addresses[0].id,
      deleted_at: null,
    });
    [replyComment] = await tester.seed('Comment', {
      parent_id: String(rootComment.id),
      community_id: community.id,
      thread_id: thread.id,
      address_id: community.Addresses[0].id,
      deleted_at: null,
    });
  });

  beforeEach(async () => {
    await models.ThreadSubscription.truncate();
    await models.CommentSubscription.truncate();
  });

  after(async () => {
    await dispose()();
  });

  it('should not throw if a valid author is not found', async () => {
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      payload: { address_id: -999999 } as z.infer<typeof CommentCreated>,
    });
    expect(res).to.be.false;
  });

  it('should not throw if a valid community is not found', async () => {
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      payload: {
        address_id: rootComment.address_id,
        community_id: '2f92ekf2fjpe9svk23',
      } as z.infer<typeof CommentCreated>,
    });
    expect(res).to.be.false;
  });

  it('should do nothing if there are no relevant subscriptions', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
      payload: {
        address_id: rootComment.address_id,
        community_id: community.id,
        id: rootComment.id,
        thread_id: rootComment.thread_id,
      } as z.infer<typeof CommentCreated>,
    });
    expect(res).to.be.true;
    expect((provider.triggerWorkflow as sinon.SinonStub).notCalled).to.be.true;

    disposeAdapter(notificationsProvider.name);
    sandbox.restore();
  });

  it('should execute the triggerWorkflow function with appropriate data for a root comment', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    await tester.seed('ThreadSubscription', {
      user_id: subscriber.id,
      thread_id: rootComment.thread_id,
    });
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
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
      users: [{ id: String(subscriber.id) }],
      data: {
        author: authorProfile.profile_name,
        comment_parent_name: 'thread',
        community_name: community.name,
        comment_body: rootComment.text.substring(0, 255),
        comment_url: getCommentUrl(community.id, thread.id, rootComment.id),
        comment_created_event: rootComment,
      },
      actor: { id: String(author.id) },
    });

    disposeAdapter(notificationsProvider.name);
    sandbox.restore();
  });

  it('should execute the triggerWorkflow function with appropriate data for a reply comment', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    await tester.seed('CommentSubscription', {
      user_id: subscriber.id,
      comment_id: rootComment.id,
    });
    const res = await processCommentCreated({
      name: EventNames.CommentCreated,
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
      users: [{ id: String(subscriber.id) }],
      data: {
        author: authorProfile.profile_name,
        comment_parent_name: 'comment',
        community_name: community.name,
        comment_body: replyComment.text.substring(0, 255),
        comment_url: getCommentUrl(community.id, thread.id, replyComment.id),
        comment_created_event: replyComment,
      },
      actor: { id: String(author.id) },
    });

    disposeAdapter(notificationsProvider.name);
    sandbox.restore();
  });

  it('should throw if triggerWorkflow fails', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      ThrowingSpyNotificationsProvider(sandbox),
    );

    await tester.seed('ThreadSubscription', {
      user_id: subscriber.id,
      thread_id: rootComment.thread_id,
    });

    try {
      await processCommentCreated({
        name: EventNames.CommentCreated,
        payload: { ...rootComment },
      });
    } catch (error) {
      expect((provider.triggerWorkflow as sinon.SinonStub).threw('some error'))
        .to.be.true;
    }

    disposeAdapter(notificationsProvider.name);
    sandbox.restore();
  });
});
