import {
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommunityTierMap, SnapshotEventType } from '@hicommonwealth/shared';
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
import { models } from '../../src/database';
import { notifySnapshotProposalCreated } from '../../src/policies/handlers/notifySnapshotProposalCreated';
import { getSnapshotUrl } from '../../src/policies/utils/utils';
import * as tester from '../../src/tester';
import {
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
} from '../utils/mockedNotificationProvider';

const space = 'dydxgov.eth';
const proposalId = '0x1';

describe('snapshotProposalCreated Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined;
  let user: z.infer<typeof schemas.User> | undefined;

  beforeAll(async () => {
    [user] = await tester.seed('User', {});
    [community] = await tester.seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      chain_node_id: null,
      lifetime_thread_count: 0,
      profile_count: 0,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
        },
      ],
      snapshot_spaces: [space],
    });
  });

  beforeEach(async () => {
    await models.CommunityAlert.truncate();
  });

  afterEach(() => {
    const provider = notificationsProvider();
    disposeAdapter(provider.name);
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should not throw if the proposal event is not supported', async () => {
    const res = await notifySnapshotProposalCreated({
      id: 0,
      name: 'SnapshotProposalCreated',
      payload: { event: 'ranndommmm' } as z.infer<
        typeof schemas.events.SnapshotProposalCreated
      >,
    });
    expect(res).to.be.false;
  });

  test('should not throw if the proposal space or id is not provided', async () => {
    const res = await notifySnapshotProposalCreated({
      id: 0,
      name: 'SnapshotProposalCreated',
      payload: {
        event: SnapshotEventType.Created,
      } as z.infer<typeof schemas.events.SnapshotProposalCreated>,
    });
    expect(res).to.be.false;
  });

  test('should do nothing if there are no relevant community alert subscriptions', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    const res = await notifySnapshotProposalCreated({
      id: 0,
      name: 'SnapshotProposalCreated',
      payload: {
        event: SnapshotEventType.Created,
        space,
        id: proposalId,
      } as z.infer<typeof schemas.events.SnapshotProposalCreated>,
    });
    expect(res).to.be.true;
    expect(provider.triggerWorkflow as Mock).not.toHaveBeenCalled();
  });

  test('should execute triggerWorkflow with the appropriate data', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider(),
    });

    await tester.seed('CommunityAlert', {
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      user_id: user!.id,
    });

    const res = await notifySnapshotProposalCreated({
      id: 0,
      name: 'SnapshotProposalCreated',
      payload: {
        event: SnapshotEventType.Created,
        space,
        id: proposalId,
      } as z.infer<typeof schemas.events.SnapshotProposalCreated>,
    });
    expect(
      res,
      'The event handler should return true if it triggered a workflow',
    ).to.be.true;
    // triggerWorkflow should be called once
    expect(provider.triggerWorkflow as Mock).toHaveBeenCalledOnce();
    expect((provider.triggerWorkflow as Mock).mock.calls[0][0]).to.deep.equal({
      key: WorkflowKeys.SnapshotProposals,
      users: [{ id: String(user!.id) }],
      data: {
        community_id: community!.id,
        community_name: community!.name,
        space_name: space,
        snapshot_proposal_url: getSnapshotUrl(community!.id, space, proposalId),
      },
    });
  });

  test('should throw if triggerWorkflow fails', async () => {
    notificationsProvider({
      adapter: ThrowingSpyNotificationsProvider(),
    });

    await tester.seed('CommunityAlert', {
      // @ts-expect-error StrictNullChecks
      community_id: community.id,
      user_id: user!.id,
    });

    await expect(
      notifySnapshotProposalCreated({
        id: 0,
        name: 'SnapshotProposalCreated',
        payload: {
          event: SnapshotEventType.Created,
          space,
          id: proposalId,
        } as z.infer<typeof schemas.events.SnapshotProposalCreated>,
      }),
    ).rejects.toThrow(ProviderError);
  });
});
