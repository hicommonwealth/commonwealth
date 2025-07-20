// This is autogenereated, do not modify manually. To modify run 'pnpm generate-event-schema'

import { z } from 'zod';

export const commonProtocolVersion = '1.4.11';

export const ChainEventBase = z.object({
  ethChainId: z.number(),
  block_number: z.string(),
  block_timestamp: z.number(),
  contract_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  transaction_hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});

export const commonProtocolEventSchema = {
  'CommunityNominations.FactoryUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      oldFactory: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newFactory: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      oldDestination: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newDestination: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'CommunityNominations.FeeTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
    }),
  }),
  'CommunityNominations.JudgeNominated': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      judge: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      judgeId: z.bigint(),
      nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      currentNominations: z.bigint(),
    }),
  }),
  'CommunityNominations.JudgeUnnominated': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string(),
      judge: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      judgeId: z.bigint(),
      nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'CommunityNominations.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'CommunityStake.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'CommunityStake.Trade': ChainEventBase.extend({
    parsedArgs: z.object({
      trader: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      isBuy: z.boolean(),
      communityTokenAmount: z.bigint(),
      ethAmount: z.bigint(),
      protocolEthAmount: z.bigint(),
      nameSpaceEthAmount: z.bigint(),
      supply: z.bigint(),
      exchangeToken: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ContestGovernor.ContentAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      contentId: z.bigint(),
      creator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
    }),
  }),
  'ContestGovernor.VoterVoted': ChainEventBase.extend({
    parsedArgs: z.object({
      voter: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      contentId: z.bigint(),
      contestId: z.bigint(),
      votingPower: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.ContentAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      contentId: z.bigint(),
      creator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ContestGovernorSingle.TokenSwept': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.TransferFailed': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
    }),
  }),
  'ContestGovernorSingle.VoterVoted': ChainEventBase.extend({
    parsedArgs: z.object({
      voter: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      contentId: z.bigint(),
      votingPower: z.bigint(),
    }),
  }),
  'FeeManager.BeneficiaryAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      weight: z.bigint(),
    }),
  }),
  'FeeManager.BeneficiaryRemoved': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'FeeManager.BeneficiaryUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      weight: z.bigint(),
    }),
  }),
  'FeeManager.ERC20_FeeDistributed': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'FeeManager.ETH_FeeDistributed': ChainEventBase.extend({
    parsedArgs: z.object({
      beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
    }),
  }),
  'INamespace.ApprovalForAll': ChainEventBase.extend({
    parsedArgs: z.object({
      account: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      operator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      approved: z.boolean(),
    }),
  }),
  'INamespace.TransferBatch': ChainEventBase.extend({
    parsedArgs: z.object({
      operator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      from: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      ids: z.bigint(),
      values: z.bigint(),
    }),
  }),
  'INamespace.TransferSingle': ChainEventBase.extend({
    parsedArgs: z.object({
      operator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      from: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      LPHook: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      tokensTransferred: z.bigint(),
      liquidityTransferred: z.bigint(),
    }),
  }),
  'LPBondingCurve.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      curveId: z.bigint(),
      totalSupply: z.bigint(),
      launchpadLiquidity: z.bigint(),
      reserveRatio: z.bigint(),
      initialPurchaseEthAmount: z.bigint(),
    }),
  }),
  'LPBondingCurve.Trade': ChainEventBase.extend({
    parsedArgs: z.object({
      trader: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      isBuy: z.boolean(),
      tokenAmount: z.bigint(),
      ethAmount: z.bigint(),
      protocolEthAmount: z.bigint(),
      floatingSupply: z.bigint(),
    }),
  }),
  'Launchpad.LaunchpadCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      launchpad: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'Launchpad.NewTokenCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      totalSupply: z.bigint(),
      name: z.string(),
      symbol: z.string(),
    }),
  }),
  'Launchpad.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      _feeManager: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      _signature: z.string(),
      _namespaceDeployer: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      nameSpaceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'NamespaceFactory.DeployedNamespaceWithReferral': ChainEventBase.extend({
    parsedArgs: z.object({
      name: z.string(),
      feeManager: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      referrer: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      referralFeeManager: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      signature: z.string(),
      namespaceDeployer: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      nameSpaceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'NamespaceFactory.Initialized': ChainEventBase.extend({
    parsedArgs: z.object({
      version: z.bigint(),
    }),
  }),
  'NamespaceFactory.NewContest': ChainEventBase.extend({
    parsedArgs: z.object({
      contest: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      interval: z.bigint(),
      oneOff: z.boolean(),
    }),
  }),
  'NamespaceFactory.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ReferralFeeManager.FeeDistributorAdded': ChainEventBase.extend({
    parsedArgs: z.object({
      newDistributor: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ReferralFeeManager.FeeDistributorRemoved': ChainEventBase.extend({
    parsedArgs: z.object({
      removedDistributor: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ReferralFeeManager.FeeSplitUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      newSplitPercentage: z.bigint(),
    }),
  }),
  'ReferralFeeManager.FeesDistributed': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      amount: z.bigint(),
      recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      recipientAmount: z.bigint(),
    }),
  }),
  'ReferralFeeManager.OwnershipTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ReferralFeeManager.ProtocolFeeDestinationUpdated': ChainEventBase.extend({
    parsedArgs: z.object({
      newDestination: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ReferralFeeManager.ReferralSet': ChainEventBase.extend({
    parsedArgs: z.object({
      namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      referral: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      account: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'ReferralFeeManager.RoleRevoked': ChainEventBase.extend({
    parsedArgs: z.object({
      role: z.string(),
      account: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'TokenBondingCurve.LiquidityTransferred': ChainEventBase.extend({
    parsedArgs: z.object({
      tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      LPHook: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      tokensTransferred: z.bigint(),
      liquidityTransferred: z.bigint(),
    }),
  }),
  'TokenBondingCurve.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      curveId: z.bigint(),
      totalSupply: z.bigint(),
      launchpadLiquidity: z.bigint(),
      reserveRatio: z.bigint(),
      initialPurchaseEthAmount: z.bigint(),
    }),
  }),
  'TokenBondingCurve.Trade': ChainEventBase.extend({
    parsedArgs: z.object({
      trader: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
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
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      namespaceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      governanceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'TokenLaunchpad.LaunchpadCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      launchpad: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    }),
  }),
  'TokenLaunchpad.NewTokenCreated': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      totalSupply: z.bigint(),
      name: z.string(),
      symbol: z.string(),
      threadId: z.bigint(),
    }),
  }),
  'TokenLaunchpad.TokenRegistered': ChainEventBase.extend({
    parsedArgs: z.object({
      token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      curveId: z.bigint(),
    }),
  }),
} as const;

export type CommonProtocolEventSchemaKey =
  keyof typeof commonProtocolEventSchema;
