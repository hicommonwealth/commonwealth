import { dispose } from '@hicommonwealth/core';
import type {
  AddressInstance,
  CommunityInstance,
  TopicInstance,
  UserInstance,
} from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { ServerCommentsController } from 'server/controllers/server_comments_controller';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import BanCache from 'server/util/banCheckCache';
import Sinon from 'sinon';
import { contractHelpers } from '../../../../../libs/model/src/services/commonProtocol';
import { TestServer, testServer } from '../../../server-test';

chai.use(chaiHttp);

const mockBanCache = {
  checkBan: async () => [true, null],
} as any as BanCache;
describe('Reaction vote weight', () => {
  let server: TestServer;

  let user: UserInstance | null = null;
  let address: AddressInstance | null = null;
  let community: CommunityInstance | null = null;
  let topic: TopicInstance | null = null;

  let threadsController, commentsController;
  let createThread, createComment;

  before(async () => {
    server = await testServer();

    threadsController = new ServerThreadsController(
      server.models,
      mockBanCache,
    );
    commentsController = new ServerCommentsController(
      server.models,
      mockBanCache,
    );

    const userRes = await server.seeder.createAndVerifyAddress(
      { chain: 'ethereum' },
      'Alice',
    );

    createThread = async () => {
      const t = await threadsController.createThread({
        user,
        address,
        community,
        topicId: topic.id,
        title: 'Hey',
        body: 'Cool',
        kind: 'discussion',
        readOnly: false,
      });
      return t[0];
    };

    createComment = async (threadId: number) => {
      const c = await threadsController.createThreadComment({
        user,
        address,
        parentId: 0,
        threadId,
        text: 'hello',
      });
      return c[0];
    };

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

  after(async () => {
    await dispose()();
  });

  afterEach(() => {
    Sinon.restore();
  });

  it('should set thread reaction vote weight and thread vote sum correctly', async () => {
    Sinon.stub(contractHelpers, 'getNamespaceBalance').resolves({
      [address.address]: '50',
    });
    const thread = await createThread();
    const [reaction] = await threadsController.createThreadReaction({
      user,
      address,
      reaction: 'like',
      threadId: thread.id,
    });
    const expectedWeight = 1 + 50 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
    const t = await server.models.Thread.findByPk(thread.id);
    expect(t.reaction_weights_sum).to.eq(expectedWeight);
  });

  it('should set comment reaction vote weight and comment vote sum correctly', async () => {
    Sinon.stub(contractHelpers, 'getNamespaceBalance').resolves({
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
    const expectedWeight = 1 + 50 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
    const c = await server.models.Comment.findByPk(comment.id);
    expect(c.reaction_weights_sum).to.eq(expectedWeight);
  });

  it('should set thread reaction vote weight to min 1', async () => {
    Sinon.stub(contractHelpers, 'getNamespaceBalance').resolves({
      [address.address]: '0',
    });
    const thread = await createThread();
    const [reaction] = await threadsController.createThreadReaction({
      user,
      address,
      reaction: 'like',
      threadId: thread.id,
    });
    const expectedWeight = 1;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
  });

  it('should set comment reaction vote weight to min 1', async () => {
    Sinon.stub(contractHelpers, 'getNamespaceBalance').resolves({
      [address.address]: '0',
    });
    const thread = await createThread();
    const comment = await createComment(thread.id);
    const [reaction] = await commentsController.createCommentReaction({
      user,
      address,
      reaction: 'like',
      commentId: comment.id,
    });
    const expectedWeight = 1;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
  });
});
