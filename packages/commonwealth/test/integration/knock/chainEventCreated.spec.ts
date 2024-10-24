import {
  ChainEventCreated,
  EventNames,
  ProviderError,
  SpyNotificationsProvider,
  ThrowingSpyNotificationsProvider,
  WorkflowKeys,
  dispose,
  disposeAdapter,
  notificationsProvider,
} from '@hicommonwealth/core';
import {
  communityStakeTradeEventSignature,
  models,
  tester,
} from '@hicommonwealth/model';
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
import { processChainEventCreated } from '../../../server/workers/knock/eventHandlers/chainEventCreated';
import { getCommunityUrl } from '../../../shared/utils';

chai.use(chaiAsPromised);

const namespaceAddress = '0x123';

describe('chainEventCreated Event Handler', () => {
  let community: z.infer<typeof schemas.Community> | undefined;
  let chainNode: z.infer<typeof schemas.ChainNode> | undefined;
  let user: z.infer<typeof schemas.User> | undefined;
  let sandbox: sinon.SinonSandbox;

  beforeAll(async () => {
    [chainNode] = await tester.seed(
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
    [community] = await tester.seed('Community', {
      chain_node_id: chainNode!.id,
      namespace_address: namespaceAddress,
      lifetime_thread_count: 0,
      profile_count: 0,
      Addresses: [],
    });
  });

  beforeEach(async () => {
    await models.CommunityAlert.truncate();
    await models.Address.destroy({
      where: {},
    });
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

  test('should do nothing if the event signature is unsupported', async () => {
    const res = await processChainEventCreated({
      name: EventNames.ChainEventCreated,
      payload: {
        eventSource: {
          eventSignature: '0xunsupported',
        },
      } as unknown as z.infer<typeof ChainEventCreated>,
    });
    expect(res).to.be.false;
  });

  describe('Community Stakes', () => {
    test('should not throw if the community is invalid', async () => {
      const res = await processChainEventCreated({
        name: EventNames.ChainEventCreated,
        payload: {
          eventSource: {
            eventSignature: communityStakeTradeEventSignature,
          },
          parsedArgs: ['0x1', '0xunsupported', true],
        } as unknown as z.infer<typeof ChainEventCreated>,
      });
      expect(res).to.be.false;
    });

    test('should do nothing if there are no relevant subscriptions', async () => {
      sandbox = sinon.createSandbox();
      const provider = notificationsProvider({
        adapter: SpyNotificationsProvider(sandbox),
      });

      const res = await processChainEventCreated({
        name: EventNames.ChainEventCreated,
        payload: {
          eventSource: {
            eventSignature: communityStakeTradeEventSignature,
          },
          parsedArgs: ['0x1', namespaceAddress, true],
        } as unknown as z.infer<typeof ChainEventCreated>,
      });
      expect(res).to.be.true;
      expect((provider.triggerWorkflow as sinon.SinonStub).notCalled).to.be
        .true;
    });

    test('should execute triggerWorkflow with the appropriate data', async () => {
      sandbox = sinon.createSandbox();
      const provider = notificationsProvider({
        adapter: SpyNotificationsProvider(sandbox),
      });

      await tester.seed('Address', {
        community_id: community!.id,
        role: 'admin',
        user_id: user!.id,
      });

      const res = await processChainEventCreated({
        name: EventNames.ChainEventCreated,
        payload: {
          eventSource: {
            eventSignature: communityStakeTradeEventSignature,
          },
          parsedArgs: ['0x1', namespaceAddress, true],
        } as unknown as z.infer<typeof ChainEventCreated>,
      });
      expect(res).to.be.true;
      expect((provider.triggerWorkflow as sinon.SinonStub).calledOnce).to.be
        .true;
      expect(
        (provider.triggerWorkflow as sinon.SinonStub).getCall(0).args[0],
      ).to.deep.equal({
        key: WorkflowKeys.CommunityStake,
        users: [{ id: String(user!.id) }],
        data: {
          community_id: community!.id,
          transaction_type: 'minted',
          community_name: community!.name,
          community_stakes_url: getCommunityUrl(community!.id),
        },
      });
    });

    test('should throw if triggerWorkflow fails', async () => {
      sandbox = sinon.createSandbox();
      notificationsProvider({
        adapter: ThrowingSpyNotificationsProvider(sandbox),
      });

      await tester.seed('Address', {
        community_id: community!.id,
        role: 'admin',
        user_id: user!.id,
      });

      await expect(
        processChainEventCreated({
          name: EventNames.ChainEventCreated,
          payload: {
            eventSource: {
              eventSignature: communityStakeTradeEventSignature,
            },
            parsedArgs: ['0x1', namespaceAddress, true],
          } as unknown as z.infer<typeof ChainEventCreated>,
        }),
      ).to.eventually.be.rejectedWith(ProviderError);
    });
  });
});
