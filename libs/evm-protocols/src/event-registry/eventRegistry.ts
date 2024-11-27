import {
  communityStakesAbi,
  contestAbi,
  EvmEventSignature,
  EvmEventSignatures,
  launchpadFactoryAbi,
  lpBondingCurveAbi,
  namespaceFactoryAbi,
  tokenCommunityManagerAbi,
} from '@hicommonwealth/evm-protocols';
import { factoryContracts, ValidChains } from '../common-protocol';

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
        : never);
};

// Unique names used to identify contracts that are deployed by users at runtime
export enum ChildContractNames {
  SingleContest = 'SingleContest',
  RecurringContest = 'RecurringContest',
}

type ContractSource = {
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
  ],
  childContracts: {
    [ChildContractNames.RecurringContest]: {
      abi: contestAbi,
      eventSignatures: [
        EvmEventSignatures.Contests.ContentAdded,
        EvmEventSignatures.Contests.RecurringContestStarted,
        EvmEventSignatures.Contests.RecurringContestVoterVoted,
      ],
    },
    [ChildContractNames.SingleContest]: {
      abi: contestAbi,
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
  [ValidChains.Anvil]: {
    [factoryContracts[ValidChains.Anvil].factory]: namespaceFactorySource,
    [factoryContracts[ValidChains.Anvil].communityStake]: communityStakesSource,
    [factoryContracts[ValidChains.Anvil].launchpad]: launchpadSource,
    [factoryContracts[ValidChains.Anvil].lpBondingCurve]: lpBondingCurveSource,
    [factoryContracts[ValidChains.Anvil].tokenCommunityManager]:
      tokenCommunityManagerSource,
  },
} as const satisfies EventRegistryType;
