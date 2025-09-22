import { VoteGovernanceAbi } from '@commonxyz/common-governance-abis';
import {
  CommunityNominationsAbi,
  CommunityStakeAbi,
  ContestGovernorAbi,
  ContestGovernorSingleAbi,
  LPBondingCurveAbi,
  LaunchpadAbi,
  NamespaceFactoryAbi,
  ReferralFeeManagerAbi,
  TokenBondingCurveAbi,
  TokenCommunityManagerAbi,
  TokenLaunchpadAbi,
} from '@commonxyz/common-protocol-abis';
import { ValidChains, getFactoryContract } from '../common-protocol';
import { EvmEventSignature, EvmEventSignatures } from './eventSignatures';

// Unique names used to identify contracts that are deployed by users at runtime
export enum ChildContractNames {
  SingleContest = 'SingleContest',
  RecurringContest = 'RecurringContest',
}

export type ContractSource = {
  abi: Readonly<Array<unknown>>;
  eventSignatures: Array<EvmEventSignature>;
  // Runtime/user deployed contract sources
  // Address for these contracts stored in EvmEventSources
  // TODO: Get address from projections instead?
  childContracts?: {
    [key in ChildContractNames]: {
      abi: Readonly<Array<unknown>>;
      eventSignatures: Array<EvmEventSignature>;
    };
  };
};

const namespaceFactorySource = {
  abi: NamespaceFactoryAbi,
  eventSignatures: [
    EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
    EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
    EvmEventSignatures.NamespaceFactory.NamespaceDeployedWithReferral,
  ],
  childContracts: {
    [ChildContractNames.RecurringContest]: {
      abi: ContestGovernorAbi,
      eventSignatures: [
        EvmEventSignatures.Contests.ContentAdded,
        EvmEventSignatures.Contests.RecurringContestStarted,
        EvmEventSignatures.Contests.RecurringContestVoterVoted,
      ],
    },
    [ChildContractNames.SingleContest]: {
      abi: ContestGovernorSingleAbi,
      eventSignatures: [
        EvmEventSignatures.Contests.ContentAdded,
        EvmEventSignatures.Contests.SingleContestStarted,
        EvmEventSignatures.Contests.SingleContestVoterVoted,
      ],
    },
  },
} satisfies ContractSource;

const communityNominationsSource = {
  abi: CommunityNominationsAbi,
  eventSignatures: [
    EvmEventSignatures.CommunityNominations.NominatorSettled,
    EvmEventSignatures.CommunityNominations.NominatorNominated,
    EvmEventSignatures.CommunityNominations.JudgeNominated,
  ],
} satisfies ContractSource;

const communityStakesSource = {
  abi: CommunityStakeAbi,
  eventSignatures: [EvmEventSignatures.CommunityStake.Trade],
} satisfies ContractSource;

const launchpadSource: ContractSource = {
  abi: LaunchpadAbi,
  eventSignatures: [EvmEventSignatures.Launchpad.TokenLaunched],
} satisfies ContractSource;

const lpBondingCurveSource: ContractSource = {
  abi: LPBondingCurveAbi,
  eventSignatures: [EvmEventSignatures.Launchpad.Trade],
} satisfies ContractSource;

const tokenCommunityManagerSource: ContractSource = {
  abi: TokenCommunityManagerAbi,
  eventSignatures: [
    EvmEventSignatures.TokenCommunityManager.CommunityNamespaceCreated,
  ],
} satisfies ContractSource;

const referralFeeManagerSource: ContractSource = {
  abi: ReferralFeeManagerAbi,
  eventSignatures: [EvmEventSignatures.Referrals.FeeDistributed],
};

const tokenLaunchpadSource: ContractSource = {
  abi: TokenLaunchpadAbi,
  eventSignatures: [
    EvmEventSignatures.TokenLaunchpad.LaunchpadCreated,
    EvmEventSignatures.TokenLaunchpad.NewTokenCreated,
    EvmEventSignatures.TokenLaunchpad.TokenRegistered,
  ],
};

const voteGovernanceSource: ContractSource = {
  abi: VoteGovernanceAbi,
  eventSignatures: [
    EvmEventSignatures.VoteGovernance.OzProposalCreated,
    EvmEventSignatures.VoteGovernance.TokenVoteCast,
    EvmEventSignatures.VoteGovernance.AddressVoteCast,
  ],
};

const tokenBondingCurveSource: ContractSource = {
  abi: TokenBondingCurveAbi,
  eventSignatures: [
    EvmEventSignatures.TokenBondingCurve.LiquidityTransferred,
    EvmEventSignatures.TokenBondingCurve.TokenRegistered,
    EvmEventSignatures.TokenBondingCurve.Trade,
  ],
};

const VoteGovernanceSource: ContractSource = {
  abi: VoteGovernanceAbi,
  eventSignatures: [
    EvmEventSignatures.VoteGovernance.AddressVoteCast,
    EvmEventSignatures.VoteGovernance.TokenVoteCast,
    EvmEventSignatures.VoteGovernance.OzProposalCreated,
  ],
};

/**
 * Note that this object does not contain details for contracts deployed by users
 * at runtime. Those contracts remain in the EvmEventSources table.
 */
export const EventRegistry = {
  [ValidChains.Base]: {
    [getFactoryContract(ValidChains.Base).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Base).CommunityStake]:
      communityStakesSource,
    [getFactoryContract(ValidChains.Base).Launchpad]: launchpadSource,
    [getFactoryContract(ValidChains.Base).LPBondingCurve]: lpBondingCurveSource,
    [getFactoryContract(ValidChains.Base).TokenCommunityManager]:
      tokenCommunityManagerSource,
    [getFactoryContract(ValidChains.Base).ReferralFeeManager]:
      referralFeeManagerSource,
  },
  [ValidChains.SepoliaBase]: {
    [getFactoryContract(ValidChains.SepoliaBase).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.SepoliaBase).CommunityNominations]:
      communityNominationsSource,
    [getFactoryContract(ValidChains.SepoliaBase).CommunityStake]:
      communityStakesSource,
    [getFactoryContract(ValidChains.SepoliaBase).Launchpad]: launchpadSource,
    [getFactoryContract(ValidChains.SepoliaBase).LPBondingCurve]:
      lpBondingCurveSource,
    [getFactoryContract(ValidChains.SepoliaBase).TokenCommunityManager]:
      tokenCommunityManagerSource,
    [getFactoryContract(ValidChains.SepoliaBase).ReferralFeeManager]:
      referralFeeManagerSource,
    [getFactoryContract(ValidChains.SepoliaBase).TokenLaunchpad]:
      tokenLaunchpadSource,
    [getFactoryContract(ValidChains.SepoliaBase).TokenBondingCurve]:
      tokenBondingCurveSource,
    [getFactoryContract(ValidChains.SepoliaBase).VoteGovernance]:
      voteGovernanceSource,
  },
  [ValidChains.Sepolia]: {
    [getFactoryContract(ValidChains.Sepolia).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Sepolia).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.Blast]: {
    [getFactoryContract(ValidChains.Blast).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Blast).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.Linea]: {
    [getFactoryContract(ValidChains.Linea).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Linea).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.Optimism]: {
    [getFactoryContract(ValidChains.Optimism).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Optimism).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.Mainnet]: {
    [getFactoryContract(ValidChains.Mainnet).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Mainnet).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.Arbitrum]: {
    [getFactoryContract(ValidChains.Arbitrum).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Arbitrum).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.BSC]: {
    [getFactoryContract(ValidChains.BSC).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.BSC).CommunityStake]: communityStakesSource,
  },
  [ValidChains.SKALE_TEST]: {
    [getFactoryContract(ValidChains.SKALE_TEST).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.SKALE_TEST).CommunityStake]:
      communityStakesSource,
  },
  [ValidChains.Anvil]: {
    [getFactoryContract(ValidChains.Anvil).NamespaceFactory]:
      namespaceFactorySource,
    [getFactoryContract(ValidChains.Anvil).CommunityStake]:
      communityStakesSource,
    [getFactoryContract(ValidChains.Anvil).CommunityNominations]:
      communityNominationsSource,
    [getFactoryContract(ValidChains.Anvil).Launchpad]: launchpadSource,
    [getFactoryContract(ValidChains.Anvil).LPBondingCurve]:
      lpBondingCurveSource,
    [getFactoryContract(ValidChains.Anvil).TokenCommunityManager]:
      tokenCommunityManagerSource,
    [getFactoryContract(ValidChains.Anvil).ReferralFeeManager]:
      referralFeeManagerSource,
    [getFactoryContract(ValidChains.Anvil).TokenLaunchpad]:
      tokenLaunchpadSource,
    [getFactoryContract(ValidChains.Anvil).TokenBondingCurve]:
      tokenBondingCurveSource,
  },
};
