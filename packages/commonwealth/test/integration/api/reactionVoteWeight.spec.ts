import { dispose } from '@hicommonwealth/core';
import type {
  AddressInstance,
  CommunityInstance,
  TopicInstance,
  UserInstance,
} from '@hicommonwealth/model';
import { commonProtocol } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import Sinon from 'sinon';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';

chai.use(chaiHttp);

describe('Reaction vote weight', () => {
  let server: TestServer;

  let user: UserInstance | null = null;
  let address: AddressInstance | null = null;
  let community: CommunityInstance | null = null;
  let topic: TopicInstance | null = null;

  let threadsController, commentsController;
  let createThread, createComment;

  beforeAll(async () => {
    server = await testServer();

    threadsController = new ServerThreadsController(server.models);
    commentsController = new ServerCommentsController(server.models);

    const userRes = await server.seeder.createAndVerifyAddress(
      { chain: 'ethereum' },
      'Alice',
    );

    createThread = async () =>
      await server.models.Thread.create({
        community_id: community!.id!,
        address_id: address!.id!,
        topic_id: topic!.id,
        title: 'Nice',
        body: 'Cool',
        plaintext: 'Cool',
        kind: 'discussion',
        stage: '',
        view_count: 0,
        comment_count: 0,
        reaction_count: 0,
        reaction_weights_sum: 0,
      });

    createComment = async (threadId: number) =>
      await server.models.Comment.create({
        address_id: address!.id!,
        thread_id: threadId,
        text: 'hello',
        plaintext: 'hello',
        reaction_count: 0,
      });

    user = await server.models.User.findByPk(userRes.user_id);
    address = await server.models.Address.findByPk(userRes.address_id);
    community = await server.models.Community.findByPk('ethereum');
    topic = await server.models.Topic.findOne({
      where: {
        community_id: 'ethereum',
      },
    });

    expect(user).not.to.be.null;
    expect(address).not.to.be.null;
    // @ts-expect-error StrictNullChecks
    expect(community.id).to.eq('ethereum');
    expect(topic).not.to.be.null;

    // existing ethereum seed data
    await server.models.CommunityStake.update(
      {
        vote_weight: 200,
      },
      {
        where: {
          stake_id: 1,
        },
      },
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(() => {
    Sinon.restore();
  });

  test('should set thread reaction vote weight and thread vote sum correctly', async () => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      // @ts-expect-error StrictNullChecks
      [address.address]: '50',
    });
    const thread = await createThread();
    const [reaction] = await threadsController.createThreadReaction({
      user,
      address,
      reaction: 'like',
      threadId: thread.id,
    });
    const expectedWeight = 50 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
    const t = await server.models.Thread.findByPk(thread.id);
    // @ts-expect-error StrictNullChecks
    expect(t.reaction_weights_sum).to.eq(expectedWeight);
  });

  test('should set comment reaction vote weight and comment vote sum correctly', async () => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      // @ts-expect-error StrictNullChecks
      [address.address]: '50',
    });
    const thread = await createThread();
    const comment = await createComment(thread.id);
    const [reaction] = await commentsController.createCommentReaction({
      user,
      address,
      reaction: 'like',
      commentId: comment.id,
    });
    const expectedWeight = 50 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
    const c = await server.models.Comment.findByPk(comment.id);
    // @ts-expect-error StrictNullChecks
    expect(c.reaction_weights_sum).to.eq(expectedWeight);
  });

  test('should set thread reaction vote weight to min 1', async () => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      // @ts-expect-error StrictNullChecks
      [address.address]: '17',
    });
    const thread = await createThread();
    const [reaction] = await threadsController.createThreadReaction({
      user,
      address,
      reaction: 'like',
      threadId: thread.id,
    });
    const expectedWeight = 17 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
  });

  test('should set comment reaction vote weight to min 1', async () => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      // @ts-expect-error StrictNullChecks
      [address.address]: '7',
    });
    const thread = await createThread();
    const comment = await createComment(thread.id);
    const [reaction] = await commentsController.createCommentReaction({
      user,
      address,
      reaction: 'like',
      commentId: comment.id,
    });
    const expectedWeight = 7 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
  });
});
