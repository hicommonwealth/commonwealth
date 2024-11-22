import {
  communityStakesAbi,
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

export type EventRegistryType = {
  [key in ValidChains]: {
    [address in ContractAddresses[key]]: {
      abi: Readonly<Array<unknown>>;
      eventSignatures: Array<EvmEventSignature>;
    };
  };
};

const namespaceFactorySource = {
  abi: namespaceFactoryAbi,
  eventSignatures: [
    EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
    EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
  ],
};

const communityStakesSource = {
  abi: communityStakesAbi,
  eventSignatures: [EvmEventSignatures.CommunityStake.Trade],
};

const launchpadSource = {
  abi: launchpadFactoryAbi,
  eventSignatures: [EvmEventSignatures.Launchpad.TokenLaunched],
};

const lpBondingCurveSource = {
  abi: lpBondingCurveAbi,
  eventSignatures: [EvmEventSignatures.Launchpad.Trade],
};

const tokenCommunityManagerSource = {
  abi: tokenCommunityManagerAbi,
  eventSignatures: [],
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
} as const satisfies EventRegistryType;

const x =
  EventRegistry[84532]['0xc6e7B0AdDf35AE4a5A65bb3bCb78D11Db6c8fB8F'].abi;
