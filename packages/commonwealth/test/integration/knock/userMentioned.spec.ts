import {
  EventNames,
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
  UserMentioned,
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import z from 'zod';
import { processUserMentioned } from '../../../server/workers/knock/eventHandlers/userMentioned';
import { getThreadUrl } from '../../../server/workers/knock/util';

chai.use(chaiAsPromised);

describe('userMentioned Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined;
  let user, author: z.infer<typeof schemas.User> | undefined;
  let authorProfile: z.infer<typeof schemas.Profile> | undefined;
  let thread: z.infer<typeof schemas.Thread> | undefined;
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
    [user] = await tester.seed('User', {});
    [author] = await tester.seed('User', {});
    [authorProfile] = await tester.seed('Profile', {
      // @ts-expect-error StrictNullChecks
      user_id: author.id,
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
          user_id: user!.id,
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
      pinned: false,
      read_only: false,
      version_history: [],
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

  it('should not throw if relevant community is not found', async () => {
    const res = await processUserMentioned({
      name: EventNames.UserMentioned,
      payload: {
        communityId: 'nonexistent',
      } as z.infer<typeof UserMentioned>,
    });
    expect(res).to.be.false;
  });

  it('should execute the triggerWorkflow function with the appropriate data', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    const res = await processUserMentioned({
      name: EventNames.UserMentioned,
      payload: {
        // @ts-expect-error StrictNullChecks
        authorAddressId: community!.Addresses[0].id,
        // @ts-expect-error StrictNullChecks
        authorUserId: author!.id,
        // @ts-expect-error StrictNullChecks
        authorAddress: community!.Addresses[0].address,
        authorProfileId: authorProfile!.id,
        mentionedUserId: user!.id,
        // @ts-expect-error StrictNullChecks
        communityId: community!.id,
        thread,
      },
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
      key: WorkflowKeys.UserMentioned,
      users: [{ id: String(user!.id) }],
      data: {
        // @ts-expect-error StrictNullChecks
        author_address_id: community!.Addresses[0].id,
        author_user_id: author!.id,
        // @ts-expect-error StrictNullChecks
        author_address: community!.Addresses[0].address,
        author_profile_id: authorProfile!.id,
        community_id: community!.id,
        community_name: community!.name,
        author: authorProfile!.profile_name,
        // @ts-expect-error StrictNullChecks
        object_body: thread!.body.substring(255),
        // @ts-expect-error StrictNullChecks
        object_url: getThreadUrl(community!.id, thread!.id),
      },
    });
  });

  it('should throw if triggerWorkflow fails', async () => {
    sandbox = sinon.createSandbox();
    notificationsProvider(ThrowingSpyNotificationsProvider(sandbox));

    await expect(
      processUserMentioned({
        name: EventNames.UserMentioned,
        payload: {
          // @ts-expect-error StrictNullChecks
          authorAddressId: community!.Addresses[0].id,
          // @ts-expect-error StrictNullChecks
          authorUserId: author!.id,
          // @ts-expect-error StrictNullChecks
          authorAddress: community!.Addresses[0].address,
          authorProfileId: authorProfile!.id,
          mentionedUserId: user!.id,
          // @ts-expect-error StrictNullChecks
          communityId: community!.id,
          thread,
        },
      }),
    ).to.eventually.be.rejectedWith(ProviderError);
  });
});
