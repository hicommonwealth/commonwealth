// This is autogenereated, do not modify manually. To modify run 'pnpm generate-event-schema'

import { z } from 'zod';

export const commonProtocolVersion = '1.4.11';

export const commonProtocolEventSchema = {
  'CommunityNominations.FactoryUpdated': z.object({
    oldFactory: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newFactory: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'CommunityNominations.FeeAmountUpdated': z.object({
    oldAmount: z.bigint(),
    newAmount: z.bigint(),
  }),
  'CommunityNominations.FeeDestinationUpdated': z.object({
    oldDestination: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newDestination: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'CommunityNominations.FeeTransferred': z.object({
    recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
  }),
  'CommunityNominations.JudgeNominated': z.object({
    namespace: z.string(),
    judge: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    judgeId: z.bigint(),
    nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    currentNominations: z.bigint(),
  }),
  'CommunityNominations.JudgeUnnominated': z.object({
    namespace: z.string(),
    judge: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    judgeId: z.bigint(),
    nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    currentNominations: z.bigint(),
  }),
  'CommunityNominations.NominationsConfigured': z.object({
    namespace: z.string(),
    judgeId: z.bigint(),
    referralModeEnabled: z.boolean(),
    maxNominations: z.bigint(),
  }),
  'CommunityNominations.NominatorNominated': z.object({
    namespace: z.string(),
    nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'CommunityNominations.NominatorSettled': z.object({
    namespace: z.string(),
  }),
  'CommunityNominations.NominatorUnnominated': z.object({
    namespace: z.string(),
    nominator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'CommunityNominations.OwnershipTransferred': z.object({
    previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'CommunityStake.OwnershipTransferred': z.object({
    previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'CommunityStake.Trade': z.object({
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
  'ContestGovernor.ContentAdded': z.object({
    contentId: z.bigint(),
    creator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    url: z.string(),
  }),
  'ContestGovernor.NewRecurringContestStarted': z.object({
    contestId: z.bigint(),
    startTime: z.bigint(),
    endTime: z.bigint(),
  }),
  'ContestGovernor.PrizeShareUpdated': z.object({
    newPrizeShare: z.bigint(),
  }),
  'ContestGovernor.TransferFailed': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
  }),
  'ContestGovernor.VoterVoted': z.object({
    voter: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    contentId: z.bigint(),
    contestId: z.bigint(),
    votingPower: z.bigint(),
  }),
  'ContestGovernorSingle.ContentAdded': z.object({
    contentId: z.bigint(),
    creator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    url: z.string(),
  }),
  'ContestGovernorSingle.NewSingleContestStarted': z.object({
    startTime: z.bigint(),
    endTime: z.bigint(),
  }),
  'ContestGovernorSingle.OwnershipTransferred': z.object({
    previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ContestGovernorSingle.TokenSwept': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
  }),
  'ContestGovernorSingle.TransferFailed': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
  }),
  'ContestGovernorSingle.VoterVoted': z.object({
    voter: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    contentId: z.bigint(),
    votingPower: z.bigint(),
  }),
  'FeeManager.BeneficiaryAdded': z.object({
    beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    weight: z.bigint(),
  }),
  'FeeManager.BeneficiaryRemoved': z.object({
    beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'FeeManager.BeneficiaryUpdated': z.object({
    beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    weight: z.bigint(),
  }),
  'FeeManager.ERC20_FeeDistributed': z.object({
    beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'FeeManager.ETH_FeeDistributed': z.object({
    beneficiary: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
  }),
  'INamespace.ApprovalForAll': z.object({
    account: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    operator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    approved: z.boolean(),
  }),
  'INamespace.TransferBatch': z.object({
    operator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    from: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    ids: z.bigint(),
    values: z.bigint(),
  }),
  'INamespace.TransferSingle': z.object({
    operator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    from: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    id: z.bigint(),
    value: z.bigint(),
  }),
  'INamespace.URI': z.object({
    value: z.string(),
    id: z.bigint(),
  }),
  'LPBondingCurve.LiquidityTransferred': z.object({
    tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    LPHook: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    tokensTransferred: z.bigint(),
    liquidityTransferred: z.bigint(),
  }),
  'LPBondingCurve.TokenRegistered': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    curveId: z.bigint(),
    totalSupply: z.bigint(),
    launchpadLiquidity: z.bigint(),
    reserveRatio: z.bigint(),
    initialPurchaseEthAmount: z.bigint(),
  }),
  'LPBondingCurve.Trade': z.object({
    trader: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    isBuy: z.boolean(),
    tokenAmount: z.bigint(),
    ethAmount: z.bigint(),
    protocolEthAmount: z.bigint(),
    floatingSupply: z.bigint(),
  }),
  'Launchpad.LaunchpadCreated': z.object({
    launchpad: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'Launchpad.NewTokenCreated': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    totalSupply: z.bigint(),
    name: z.string(),
    symbol: z.string(),
  }),
  'Launchpad.TokenRegistered': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    curveId: z.bigint(),
  }),
  'NamespaceFactory.ConfiguredCommunityStakeId': z.object({
    name: z.string(),
    tokenName: z.string(),
    id: z.bigint(),
  }),
  'NamespaceFactory.DeployedNamespace': z.object({
    name: z.string(),
    _feeManager: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    _signature: z.string(),
    _namespaceDeployer: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    nameSpaceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'NamespaceFactory.DeployedNamespaceWithReferral': z.object({
    name: z.string(),
    feeManager: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    referrer: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    referralFeeManager: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    signature: z.string(),
    namespaceDeployer: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    nameSpaceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'NamespaceFactory.Initialized': z.object({
    version: z.bigint(),
  }),
  'NamespaceFactory.NewContest': z.object({
    contest: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    interval: z.bigint(),
    oneOff: z.boolean(),
  }),
  'NamespaceFactory.OwnershipTransferred': z.object({
    previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.FeeDistributorAdded': z.object({
    newDistributor: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.FeeDistributorRemoved': z.object({
    removedDistributor: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.FeeSplitUpdated': z.object({
    newSplitPercentage: z.bigint(),
  }),
  'ReferralFeeManager.FeesDistributed': z.object({
    namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.bigint(),
    recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    recipientAmount: z.bigint(),
  }),
  'ReferralFeeManager.OwnershipTransferred': z.object({
    previousOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    newOwner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.ProtocolFeeDestinationUpdated': z.object({
    newDestination: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.ReferralSet': z.object({
    namespace: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    referral: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.RoleAdminChanged': z.object({
    role: z.string(),
    previousAdminRole: z.string(),
    newAdminRole: z.string(),
  }),
  'ReferralFeeManager.RoleGranted': z.object({
    role: z.string(),
    account: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'ReferralFeeManager.RoleRevoked': z.object({
    role: z.string(),
    account: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'TokenBondingCurve.LiquidityTransferred': z.object({
    tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    LPHook: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    tokensTransferred: z.bigint(),
    liquidityTransferred: z.bigint(),
  }),
  'TokenBondingCurve.TokenRegistered': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    curveId: z.bigint(),
    totalSupply: z.bigint(),
    launchpadLiquidity: z.bigint(),
    reserveRatio: z.bigint(),
    initialPurchaseEthAmount: z.bigint(),
  }),
  'TokenBondingCurve.Trade': z.object({
    trader: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    tokenAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    isBuy: z.boolean(),
    tokenAmount: z.bigint(),
    ethAmount: z.bigint(),
    protocolEthAmount: z.bigint(),
    floatingSupply: z.bigint(),
  }),
  'TokenCommunityManager.CommunityNamespaceCreated': z.object({
    name: z.string(),
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    namespaceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    governanceAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'TokenLaunchpad.LaunchpadCreated': z.object({
    launchpad: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  }),
  'TokenLaunchpad.NewTokenCreated': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    totalSupply: z.bigint(),
    name: z.string(),
    symbol: z.string(),
    threadId: z.bigint(),
  }),
  'TokenLaunchpad.TokenRegistered': z.object({
    token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    curveId: z.bigint(),
  }),
} as const;

export type CommonProtocolEventSchemaKey =
  keyof typeof commonProtocolEventSchema;
