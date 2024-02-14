import {
  AddressInstance,
  CommunityInstance,
  ThreadAttributes,
  TopicInstance,
  UserInstance,
  models,
  tester,
} from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import BanCache from 'server/util/banCheckCache';
import Sinon from 'sinon';
import { createAndVerifyAddress } from 'test/util/modelUtils';
import { contractHelpers } from '../../../../../libs/model/src/services/commonProtocol';

Sinon.stub(contractHelpers, 'getNamespaceBalance').resolves('50');

chai.use(chaiHttp);

const mockBanCache = {
  checkBan: async () => [true, null],
} as any as BanCache;

describe('Reaction vote weight', () => {
  const threadsController = new ServerThreadsController(models, mockBanCache);
  let user: UserInstance | null = null;
  let address: AddressInstance | null = null;
  let thread: ThreadAttributes | null = null;
  let community: CommunityInstance | null = null;
  let topic: TopicInstance | null = null;

  before(async () => {
    await tester.seedDb();

    const userRes = await createAndVerifyAddress({
      chain: 'ethereum',
    });
    user = await models.User.findByPk(userRes.user_id);
    address = await models.Address.findByPk(userRes.address_id);
    community = await models.Community.findByPk('ethereum');
    topic = await models.Topic.findOne({
      where: {
        community_id: 'ethereum',
      },
    });

    expect(user).not.to.be.null;
    expect(address).not.to.be.null;
    expect(community.id).to.eq('ethereum');
    expect(topic).not.to.be.null;

    // existing ethereum seed data
    await models.CommunityStake.update(
      {
        vote_weight: 200,
      },
      {
        where: {
          stake_id: 1,
        },
      },
    );

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
    thread = t[0];
  });

  it('should set reaction vote weight and thread vote sum correctly', async () => {
    const [reaction] = await threadsController.createThreadReaction({
      user,
      address,
      reaction: 'like',
      threadId: thread.id,
    });
    const expectedWeight = 1 + 50 * 200;
    expect(reaction.calculated_voting_weight).to.eq(expectedWeight);
    const [t] = await threadsController.getThreadsByIds({
      threadIds: [thread.id],
    });
    expect(t.reaction_weights_sum).to.eq(expectedWeight);
  });
});
