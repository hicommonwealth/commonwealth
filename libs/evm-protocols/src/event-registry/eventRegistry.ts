import {
  communityStakesAbi,
  launchpadFactoryAbi,
  lpBondingCurveAbi,
  namespaceFactoryAbi,
  singleContestAbi,
  tokenCommunityManagerAbi,
  veBridgeAbi,
} from '../abis';
import { recurringContestAbi } from '../abis/recurringContestAbi';
import { referralFeeManager } from '../abis/referralFeeManager';
import { ValidChains, factoryContracts } from '../common-protocol';
import { EvmEventSignature, EvmEventSignatures } from './eventSignatures';

type ContractAddresses = {
  [key in ValidChains]:
    | (typeof factoryContracts)[key]['factory']
    | (typeof factoryContracts)[key]['communityStake']
    | (key extends keyof typeof factoryContracts
        ? 'launchpad' extends keyof (typeof factoryContracts)[key]
          ? (typeof factoryContracts)[key]['launchpad']
          : never
        : never)
    | (key extends keyof typeof factoryContracts
        ? 'lpBondingCurve' extends keyof (typeof factoryContracts)[key]
          ? (typeof factoryContracts)[key]['lpBondingCurve']
          : never
        : never)
    | (key extends keyof typeof factoryContracts
        ? 'tokenCommunityManager' extends keyof (typeof factoryContracts)[key]
          ? (typeof factoryContracts)[key]['tokenCommunityManager']
          : never
        : never)
    | (key extends keyof typeof factoryContracts
        ? 'referralFeeManager' extends keyof (typeof factoryContracts)[key]
          ? (typeof factoryContracts)[key]['referralFeeManager']
          : never
        : never)
    | (key extends keyof typeof factoryContracts
        ? 'veBridge' extends keyof (typeof factoryContracts)[key]
          ? (typeof factoryContracts)[key]['veBridge']
          : never
        : never);
};

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

export type EventRegistryType = {
  [key in ValidChains]: {
    [address in ContractAddresses[key]]: ContractSource;
  };
};

const namespaceFactorySource = {
  abi: namespaceFactoryAbi,
  eventSignatures: [
    EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
    EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
    EvmEventSignatures.NamespaceFactory.NamespaceDeployedWithReferral,
  ],
  childContracts: {
    [ChildContractNames.RecurringContest]: {
      abi: recurringContestAbi,
      eventSignatures: [
        EvmEventSignatures.Contests.ContentAdded,
        EvmEventSignatures.Contests.RecurringContestStarted,
        EvmEventSignatures.Contests.RecurringContestVoterVoted,
      ],
    },
    [ChildContractNames.SingleContest]: {
      abi: singleContestAbi,
      eventSignatures: [
        EvmEventSignatures.Contests.ContentAdded,
        EvmEventSignatures.Contests.SingleContestStarted,
        EvmEventSignatures.Contests.SingleContestVoterVoted,
      ],
    },
  },
} satisfies ContractSource;

const communityStakesSource = {
  abi: communityStakesAbi,
  eventSignatures: [EvmEventSignatures.CommunityStake.Trade],
} satisfies ContractSource;

const launchpadSource: ContractSource = {
  abi: launchpadFactoryAbi,
  eventSignatures: [EvmEventSignatures.Launchpad.TokenLaunched],
} satisfies ContractSource;

const lpBondingCurveSource: ContractSource = {
  abi: lpBondingCurveAbi,
  eventSignatures: [EvmEventSignatures.Launchpad.Trade],
} satisfies ContractSource;

const tokenCommunityManagerSource: ContractSource = {
  abi: tokenCommunityManagerAbi,
  eventSignatures: [],
} satisfies ContractSource;

const referralFeeManagerSource: ContractSource = {
  abi: referralFeeManager,
  eventSignatures: [
    EvmEventSignatures.Referrals.ReferralSet,
    EvmEventSignatures.Referrals.FeeDistributed,
  ],
};

const tokenStakingSource: ContractSource = {
  abi: veBridgeAbi,
  eventSignatures: [
    EvmEventSignatures.TokenStaking.TokenLocked,
    EvmEventSignatures.TokenStaking.TokenLockDurationIncreased,
    EvmEventSignatures.TokenStaking.TokenUnlocked,
    EvmEventSignatures.TokenStaking.TokenPermanentConverted,
    EvmEventSignatures.TokenStaking.TokenDelegated,
    EvmEventSignatures.TokenStaking.TokenUndelegated,
    EvmEventSignatures.TokenStaking.TokenMerged,
  ],
};

/**
 * Note that this object does not contain details for contracts deployed by users
 * at runtime. Those contracts remain in the EvmEventSources table.
 */
export const EventRegistry = {
  [ValidChains.Base]: {
    [factoryContracts[ValidChains.Base].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Base].communityStake]: communityStakesSource,
  },
  [ValidChains.SepoliaBase]: {
    [factoryContracts[ValidChains.SepoliaBase].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.SepoliaBase].communityStake]:
      communityStakesSource,
    [factoryContracts[ValidChains.SepoliaBase].launchpad]: launchpadSource,
    [factoryContracts[ValidChains.SepoliaBase].lpBondingCurve]:
      lpBondingCurveSource,
    [factoryContracts[ValidChains.SepoliaBase].tokenCommunityManager]:
      tokenCommunityManagerSource,
    [factoryContracts[ValidChains.SepoliaBase].referralFeeManager]:
      referralFeeManagerSource,
    [factoryContracts[ValidChains.SepoliaBase].veBridge]: tokenStakingSource,
  },
  [ValidChains.Sepolia]: {
    [factoryContracts[ValidChains.Sepolia].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Sepolia].communityStake]:
      communityStakesSource,
  },
  [ValidChains.Blast]: {
    [factoryContracts[ValidChains.Blast].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Blast].communityStake]: communityStakesSource,
  },
  [ValidChains.Linea]: {
    [factoryContracts[ValidChains.Linea].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Linea].communityStake]: communityStakesSource,
  },
  [ValidChains.Optimism]: {
    [factoryContracts[ValidChains.Optimism].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Optimism].communityStake]:
      communityStakesSource,
  },
  [ValidChains.Mainnet]: {
    [factoryContracts[ValidChains.Mainnet].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Mainnet].communityStake]:
      communityStakesSource,
  },
  [ValidChains.Arbitrum]: {
    [factoryContracts[ValidChains.Arbitrum].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Arbitrum].communityStake]:
      communityStakesSource,
  },
  [ValidChains.BSC]: {
    [factoryContracts[ValidChains.BSC].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.BSC].communityStake]: communityStakesSource,
  },
  [ValidChains.SKALE_TEST]: {
    [factoryContracts[ValidChains.SKALE_TEST].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.SKALE_TEST].communityStake]:
      communityStakesSource,
  },
  [ValidChains.Anvil]: {
    [factoryContracts[ValidChains.Anvil].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Anvil].communityStake]: communityStakesSource,
    [factoryContracts[ValidChains.Anvil].launchpad]: launchpadSource,
    [factoryContracts[ValidChains.Anvil].lpBondingCurve]: lpBondingCurveSource,
    [factoryContracts[ValidChains.Anvil].tokenCommunityManager]:
      tokenCommunityManagerSource,
  },
} as const satisfies EventRegistryType;
