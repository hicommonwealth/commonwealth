import {
  EventNames,
  SnapshotProposalCreated,
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { SnapshotEventType, getSnapshotUrl } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import z from 'zod';
import { processSnapshotProposalCreated } from '../../../server/workers/knock/eventHandlers/snapshotProposalCreated';
import {
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
} from './util';

chai.use(chaiAsPromised);

const space = 'dydxgov.eth';
const proposalId = '0x1';

describe('snapshotProposalCreated Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined;
  let user: z.infer<typeof schemas.User> | undefined;
  let userProfile: z.infer<typeof schemas.Profile> | undefined,
    sandbox: sinon.SinonSandbox;

  before(async () => {
    [user] = await tester.seed('User', {});
    [userProfile] = await tester.seed('Profile', {
      user_id: user!.id,
    });
    [community] = await tester.seed('Community', {
      chain_node_id: null,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
          profile_id: userProfile!.id,
        },
      ],
      snapshot_spaces: [space],
    });
  });

  beforeEach(async () => {
    await models.CommunityAlert.truncate();
  });

  afterEach(async () => {
    const provider = notificationsProvider();
    disposeAdapter(provider.name);

    if (sandbox) {
      sandbox.restore();
    }
  });

  after(async () => {
    await dispose()();
  });

  it('should not throw if the proposal event is not supported', async () => {
    const res = await processSnapshotProposalCreated({
      name: EventNames.SnapshotProposalCreated,
      payload: { event: 'ranndommmm' } as z.infer<
        typeof SnapshotProposalCreated
      >,
    });
    expect(res).to.be.false;
  });

  it('should not throw if the proposal space or id is not provided', async () => {
    const res = await processSnapshotProposalCreated({
      name: EventNames.SnapshotProposalCreated,
      payload: {
        event: SnapshotEventType.Created,
      } as z.infer<typeof SnapshotProposalCreated>,
    });
    expect(res).to.be.false;
  });

  it('should do nothing if there are no relevant community alert subscriptions', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    const res = await processSnapshotProposalCreated({
      name: EventNames.SnapshotProposalCreated,
      payload: {
        event: SnapshotEventType.Created,
        space,
        id: proposalId,
      } as z.infer<typeof SnapshotProposalCreated>,
    });
    expect(res).to.be.true;
    expect((provider.triggerWorkflow as sinon.SinonStub).notCalled).to.be.true;
  });

  it('should execute triggerWorkflow with the appropriate data', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(SpyNotificationsProvider(sandbox));

    await tester.seed('CommunityAlert', {
      community_id: community.id,
      user_id: user!.id,
    });

    const res = await processSnapshotProposalCreated({
      name: EventNames.SnapshotProposalCreated,
      payload: {
        event: SnapshotEventType.Created,
        space,
        id: proposalId,
      } as z.infer<typeof SnapshotProposalCreated>,
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    expect(
      (provider.triggerWorkflow as sinon.SinonStub).calledOnce,
      'triggerWorkflow should be called once',
    ).to.be.true;
    expect(
      (provider.triggerWorkflow as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      key: WorkflowKeys.SnapshotProposals,
      users: [{ id: String(user!.id) }],
      data: {
        community_name: community.name,
        space_name: space,
        snapshot_proposal_url: getSnapshotUrl(community!.id, space, proposalId),
      },
    });
  });

  it('should throw if triggerWorkflow fails', async () => {
    sandbox = sinon.createSandbox();
    notificationsProvider(ThrowingSpyNotificationsProvider(sandbox));

    await tester.seed('CommunityAlert', {
      community_id: community.id,
      user_id: user!.id,
    });

    await expect(
      processSnapshotProposalCreated({
        name: EventNames.SnapshotProposalCreated,
        payload: {
          event: SnapshotEventType.Created,
          space,
          id: proposalId,
        } as z.infer<typeof SnapshotProposalCreated>,
      }),
    ).to.eventually.be.rejectedWith(ProviderError);
  });
});
