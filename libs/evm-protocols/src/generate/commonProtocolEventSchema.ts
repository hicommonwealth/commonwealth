// This is autogenereated, do not modify manually. To modify run 'pnpm generate-event-schema'

import { z } from 'zod';

import {
  EVM_ADDRESS_STRICT,
  EVM_EVENT_SIGNATURE_STRICT_REGEX,
} from '@hicommonwealth/schemas';

export const commonProtocolVersion = '1.4.11';

export const ChainEventBase = z.object({
  eth_chain_id: z.number(),
  block_number: z.string(),
  block_timestamp: z.number(),
  contract_address: EVM_ADDRESS_STRICT,
  transaction_hash: EVM_EVENT_SIGNATURE_STRICT_REGEX,
});

export const commonProtocolEventSchema = {
  'CommunityNominations.FactoryUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      oldFactory: EVM_ADDRESS_STRICT,
      newFactory: EVM_ADDRESS_STRICT,
    }),
  }),
  'CommunityNominations.FeeAmountUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      oldAmount: z.bigint(),
      newAmount: z.bigint(),
    }),
  }),
  'CommunityNominations.FeeDestinationUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      oldDestination: EVM_ADDRESS_STRICT,
      newDestination: EVM_ADDRESS_STRICT,
    }),
  }),
  'CommunityNominations.FeeTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      recipient: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
    }),
  }),
  'CommunityNominations.JudgeNominated': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      judge: EVM_ADDRESS_STRICT,
      judgeId: z.bigint(),
      nominator: EVM_ADDRESS_STRICT,
      currentNominations: z.bigint(),
    }),
  }),
  'CommunityNominations.JudgeUnnominated': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      judge: EVM_ADDRESS_STRICT,
      judgeId: z.bigint(),
      nominator: EVM_ADDRESS_STRICT,
      currentNominations: z.bigint(),
    }),
  }),
  'CommunityNominations.NominationsConfigured': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      judgeId: z.bigint(),
      referralModeEnabled: z.boolean(),
      maxNominations: z.bigint(),
    }),
  }),
  'CommunityNominations.NominatorNominated': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      nominator: EVM_ADDRESS_STRICT,
    }),
  }),
  'CommunityNominations.NominatorSettled': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
    }),
  }),
  'CommunityNominations.NominatorUnnominated': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      nominator: EVM_ADDRESS_STRICT,
    }),
  }),
  'CommunityNominations.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: EVM_ADDRESS_STRICT,
      newOwner: EVM_ADDRESS_STRICT,
    }),
  }),
  'CommunityStake.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: EVM_ADDRESS_STRICT,
      newOwner: EVM_ADDRESS_STRICT,
    }),
  }),
  'CommunityStake.Trade': ChainEventBase.extend({
    parsedArgs: z.object({
      trader: EVM_ADDRESS_STRICT,
      namespace: EVM_ADDRESS_STRICT,
      isBuy: z.boolean(),
      communityTokenAmount: z.bigint(),
      ethAmount: z.bigint(),
      protocolEthAmount: z.bigint(),
      nameSpaceEthAmount: z.bigint(),
      supply: z.bigint(),
      exchangeToken: EVM_ADDRESS_STRICT,
    }),
  }),
  'ContestGovernor.ContentAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      contentId: z.bigint(),
      creator: EVM_ADDRESS_STRICT,
      url: z.string(),
    }),
  }),
  'ContestGovernor.NewRecurringContestStarted': ChainEventBase.extend({
    parsedArgs: z.object({
      contestId: z.bigint(),
      startTime: z.bigint(),
      endTime: z.bigint(),
    }),
  }),
  'ContestGovernor.PrizeShareUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      newPrizeShare: z.bigint(),
    }),
  }),
  'ContestGovernor.TransferFailed': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      to: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
    }),
  }),
  'ContestGovernor.VoterVoted': ChainEventBase.extend({
    parsedArgs: z.object({
      voter: EVM_ADDRESS_STRICT,
      contentId: z.bigint(),
      contestId: z.bigint(),
      votingPower: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.ContentAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      contentId: z.bigint(),
      creator: EVM_ADDRESS_STRICT,
      url: z.string(),
    }),
  }),
  'ContestGovernorSingle.NewSingleContestStarted': ChainEventBase.extend({
    parsedArgs: z.object({
      startTime: z.bigint(),
      endTime: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: EVM_ADDRESS_STRICT,
      newOwner: EVM_ADDRESS_STRICT,
    }),
  }),
  'ContestGovernorSingle.TokenSwept': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.TransferFailed': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      to: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.VoterVoted': ChainEventBase.extend({
    parsedArgs: z.object({
      voter: EVM_ADDRESS_STRICT,
      contentId: z.bigint(),
      votingPower: z.bigint(),
    }),
  }),
  'FeeManager.BeneficiaryAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: EVM_ADDRESS_STRICT,
      weight: z.bigint(),
    }),
  }),
  'FeeManager.BeneficiaryRemoved': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: EVM_ADDRESS_STRICT,
    }),
  }),
  'FeeManager.BeneficiaryUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: EVM_ADDRESS_STRICT,
      weight: z.bigint(),
    }),
  }),
  'FeeManager.ERC20_FeeDistributed': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
      token: EVM_ADDRESS_STRICT,
    }),
  }),
  'FeeManager.ETH_FeeDistributed': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
    }),
  }),
  'INamespace.ApprovalForAll': ChainEventBase.extend({
    parsedArgs: z.object({
      account: EVM_ADDRESS_STRICT,
      operator: EVM_ADDRESS_STRICT,
      approved: z.boolean(),
    }),
  }),
  'INamespace.TransferBatch': ChainEventBase.extend({
    parsedArgs: z.object({
      operator: EVM_ADDRESS_STRICT,
      from: EVM_ADDRESS_STRICT,
      to: EVM_ADDRESS_STRICT,
      ids: z.bigint(),
      values: z.bigint(),
    }),
  }),
  'INamespace.TransferSingle': ChainEventBase.extend({
    parsedArgs: z.object({
      operator: EVM_ADDRESS_STRICT,
      from: EVM_ADDRESS_STRICT,
      to: EVM_ADDRESS_STRICT,
      id: z.bigint(),
      value: z.bigint(),
    }),
  }),
  'INamespace.URI': ChainEventBase.extend({
    parsedArgs: z.object({
      value: z.string(),
      id: z.bigint(),
    }),
  }),
  'LPBondingCurve.LiquidityTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      tokenAddress: EVM_ADDRESS_STRICT,
      LPHook: EVM_ADDRESS_STRICT,
      tokensTransferred: z.bigint(),
      liquidityTransferred: z.bigint(),
    }),
  }),
  'LPBondingCurve.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      curveId: z.bigint(),
      totalSupply: z.bigint(),
      launchpadLiquidity: z.bigint(),
      reserveRatio: z.bigint(),
      initialPurchaseEthAmount: z.bigint(),
    }),
  }),
  'LPBondingCurve.Trade': ChainEventBase.extend({
    parsedArgs: z.object({
      trader: EVM_ADDRESS_STRICT,
      tokenAddress: EVM_ADDRESS_STRICT,
      isBuy: z.boolean(),
      tokenAmount: z.bigint(),
      ethAmount: z.bigint(),
      protocolEthAmount: z.bigint(),
      floatingSupply: z.bigint(),
    }),
  }),
  'Launchpad.LaunchpadCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      launchpad: EVM_ADDRESS_STRICT,
    }),
  }),
  'Launchpad.NewTokenCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      totalSupply: z.bigint(),
      name: z.string(),
      symbol: z.string(),
    }),
  }),
  'Launchpad.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      curveId: z.bigint(),
    }),
  }),
  'NamespaceFactory.ConfiguredCommunityStakeId': ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      tokenName: z.string(),
      id: z.bigint(),
    }),
  }),
  'NamespaceFactory.DeployedNamespace': ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      _feeManager: EVM_ADDRESS_STRICT,
      _signature: z.string(),
      _namespaceDeployer: EVM_ADDRESS_STRICT,
      nameSpaceAddress: EVM_ADDRESS_STRICT,
    }),
  }),
  'NamespaceFactory.DeployedNamespaceWithReferral': ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      feeManager: EVM_ADDRESS_STRICT,
      referrer: EVM_ADDRESS_STRICT,
      referralFeeManager: EVM_ADDRESS_STRICT,
      signature: z.string(),
      namespaceDeployer: EVM_ADDRESS_STRICT,
      nameSpaceAddress: EVM_ADDRESS_STRICT,
    }),
  }),
  'NamespaceFactory.Initialized': ChainEventBase.extend({
    parsedArgs: z.object({
      version: z.bigint(),
    }),
  }),
  'NamespaceFactory.NewContest': ChainEventBase.extend({
    parsedArgs: z.object({
      contest: EVM_ADDRESS_STRICT,
      namespace: EVM_ADDRESS_STRICT,
      interval: z.bigint(),
      oneOff: z.boolean(),
    }),
  }),
  'NamespaceFactory.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: EVM_ADDRESS_STRICT,
      newOwner: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.FeeDistributorAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      newDistributor: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.FeeDistributorRemoved': ChainEventBase.extend({
    parsedArgs: z.object({
      removedDistributor: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.FeeSplitUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      newSplitPercentage: z.bigint(),
    }),
  }),
  'ReferralFeeManager.FeesDistributed': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: EVM_ADDRESS_STRICT,
      token: EVM_ADDRESS_STRICT,
      amount: z.bigint(),
      recipient: EVM_ADDRESS_STRICT,
      recipientAmount: z.bigint(),
    }),
  }),
  'ReferralFeeManager.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: EVM_ADDRESS_STRICT,
      newOwner: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.ProtocolFeeDestinationUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      newDestination: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.ReferralSet': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: EVM_ADDRESS_STRICT,
      referral: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.RoleAdminChanged': ChainEventBase.extend({
    parsedArgs: z.object({
      role: z.string(),
      previousAdminRole: z.string(),
      newAdminRole: z.string(),
    }),
  }),
  'ReferralFeeManager.RoleGranted': ChainEventBase.extend({
    parsedArgs: z.object({
      role: z.string(),
      account: EVM_ADDRESS_STRICT,
      sender: EVM_ADDRESS_STRICT,
    }),
  }),
  'ReferralFeeManager.RoleRevoked': ChainEventBase.extend({
    parsedArgs: z.object({
      role: z.string(),
      account: EVM_ADDRESS_STRICT,
      sender: EVM_ADDRESS_STRICT,
    }),
  }),
  'TokenBondingCurve.LiquidityTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      tokenAddress: EVM_ADDRESS_STRICT,
      LPHook: EVM_ADDRESS_STRICT,
      tokensTransferred: z.bigint(),
      liquidityTransferred: z.bigint(),
    }),
  }),
  'TokenBondingCurve.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      curveId: z.bigint(),
      totalSupply: z.bigint(),
      launchpadLiquidity: z.bigint(),
      reserveRatio: z.bigint(),
      initialPurchaseEthAmount: z.bigint(),
    }),
  }),
  'TokenBondingCurve.Trade': ChainEventBase.extend({
    parsedArgs: z.object({
      trader: EVM_ADDRESS_STRICT,
      tokenAddress: EVM_ADDRESS_STRICT,
      isBuy: z.boolean(),
      tokenAmount: z.bigint(),
      ethAmount: z.bigint(),
      protocolEthAmount: z.bigint(),
      floatingSupply: z.bigint(),
    }),
  }),
  'TokenCommunityManager.CommunityNamespaceCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      token: EVM_ADDRESS_STRICT,
      namespaceAddress: EVM_ADDRESS_STRICT,
      governanceAddress: EVM_ADDRESS_STRICT,
    }),
  }),
  'TokenLaunchpad.LaunchpadCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      launchpad: EVM_ADDRESS_STRICT,
    }),
  }),
  'TokenLaunchpad.NewTokenCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      totalSupply: z.bigint(),
      name: z.string(),
      symbol: z.string(),
      threadId: z.bigint(),
    }),
  }),
  'TokenLaunchpad.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: EVM_ADDRESS_STRICT,
      curveId: z.bigint(),
    }),
  }),
} as const;

type CommonProtocolEventSchema = typeof commonProtocolEventSchema;
type InferEventPayload<T extends keyof CommonProtocolEventSchema> = z.infer<
  CommonProtocolEventSchema[T]
>;
export type CommonProtocolEventHandlerType = {
  [K in keyof CommonProtocolEventSchema]?: (
    payload: InferEventPayload<K>,
  ) => void;
};
