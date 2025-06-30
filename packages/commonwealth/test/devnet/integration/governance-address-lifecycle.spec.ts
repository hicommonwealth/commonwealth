import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import {
  CommunityTierMap,
  DisabledCommunitySpamTier,
} from '@hicommonwealth/shared';
import { describe, expect, test, vi } from 'vitest';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

describe('Governance Lifecycle tests', () => {
  test(
    'Namespace created, governance address stored in db',
    async () => {
      const { chain, anvilAccounts } = await setupCommonwealthE2E();

      const namespaceName = 'tesadfzcbvcmpasdfzc';
      const namespaceAddress = await cp.deployNamespace(
        namespaceName,
        anvilAccounts[0].address,
        anvilAccounts[0].address,
        {
          rpc: chain.private_url!,
          eth_chain_id: chain.eth_chain_id,
        },
        anvilAccounts[0].privateKey,
      );

      const community = await models.Community.create({
        id: namespaceName,
        name: namespaceName,
        namespace: namespaceName,
        namespaceAddress: namespaceAddress,
        tier: CommunityTierMap.PremiumVerification,
        spam_tier_level: DisabledCommunitySpamTier,
        environment: 'development',
        chain_node_id: chain.id,
      });

      await vi.waitFor(
        async () => {
          const updatedCommunity = await models.Community.findOne({
            where: { id: community.id },
          });
          expect(updatedCommunity).toBeTruthy();
          expect(updatedCommunity?.namespace_governance_address).toBeTruthy();
        },
        {
          timeout: 100000,
          interval: 500,
        },
      );
    },
    { timeout: 1000000 },
  );
});
