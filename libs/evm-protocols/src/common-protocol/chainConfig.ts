import * as abis from '@commonxyz/common-protocol-abis';

// Chains with deployed namespace factories. As new chains are enabled, add here.

export enum ValidChains {
  Base = 8453,
  SepoliaBase = 84532,
  Sepolia = 11155111,
  Blast = 81457,
  Linea = 59144,
  Optimism = 10,
  Mainnet = 1,
  Arbitrum = 42161,
  BSC = 56,
  SKALE_TEST = 974399131,
  // SKALE = 1564830818,
  Anvil = 31337,
}

const chains = Object.entries(ValidChains)
  .filter(([key]) => isNaN(Number(key)))
  .map(([name, id]) => ({ name, id: id as number }));

export const getChainName = (input: {
  id?: number;
  hex?: string;
}): string | undefined => {
  const id = input.id ?? (input.hex ? parseInt(input.hex, 16) : undefined);
  if (id === undefined) return undefined;
  return chains.find((c) => c.id === id)?.name ?? String(id);
};

export const getChainHex = (id: number): string => {
  return '0x' + id.toString(16);
};

/**
 * Type guard to verify if a given number is a value in the ValidChains enum.
 * @param chainId - The number to verify.
 * @returns boolean - true if the number is a valid chain ID.
 */
export function isValidChain(chainId: number): chainId is ValidChains {
  return Object.values(ValidChains).includes(chainId);
}

export function mustBeProtocolChainId(
  ethChainId?: number | null | undefined,
): asserts ethChainId is ValidChains {
  if (!ethChainId || !Object.values(ValidChains).includes(ethChainId)) {
    throw new Error(`${ethChainId} is not a valid protocol eth chain id`);
  }
}

export const STAKE_ID = 2;
export const CONTEST_VOTER_SHARE = 0;
export const CONTEST_FEE_SHARE = 100;
export const NOMINATION_FEE = 0.00005;

type AbiContractName = {
  [K in keyof typeof abis]: K extends `${infer Base}Abi` ? Base : never;
}[keyof typeof abis];

export type FactoryContractsType = {
  [chain in ValidChains]: {
    chainId: number;
  } & Partial<Record<AbiContractName, `0x${string}`>>;
};

// Requires a live contract for each enum chain. Add address of factory here on new deploy.
// WARNING: UPDATE THE EvmEventSources.parent_contract_address IN THE DB IF THE FACTORY ADDRESS IS UPDATED
export const factoryContracts: FactoryContractsType = {
  [ValidChains.Sepolia]: {
    NamespaceFactory: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
    CommunityStake: '0xf6C1B02257f0Ac4Af5a1FADd2dA8E37EC5f9E5fd',
    chainId: 11155111,
  },
  [ValidChains.SepoliaBase]: {
    NamespaceFactory: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
    CommunityStake: '0xd097926d8765A7717206559E7d19EECCbBa68c18',
    Launchpad: '0x0d3b664431FEB91E630DBAB864917DA60e1915b8',
    LPBondingCurve: '0x40F620b5191fF99d0290F27194383c6979011a68',
    TokenCommunityManager: '0x5620CfB48748c1bE2DFB919Eee7414B491CCba20',
    ReferralFeeManager: '0xb80174D6069F9c14CE694Bc8c842aAe0E8e0f8C5',
    // veBridge: '0xF481D80E5cC35fd55A4B68145C4DA0EFCf2687aE',
    CommunityNominations: '0xDB04d3bdf53e3F7d2314d9C19Ec8420b2EeCda93',
    TokenLaunchpad: '0x26B3f37507c38a84C5eFAB888D422170102cCF10',
    TokenBondingCurve: '0x112eAB263b0eEe88b6996Ff4A03D9629dad8a2b8',
    chainId: 84532,
  },
  [ValidChains.Blast]: {
    NamespaceFactory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
    CommunityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 81457,
  },
  [ValidChains.Base]: {
    NamespaceFactory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
    CommunityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    Launchpad: '0x0c1786961CfDac88EdEb5728E52F73A0DbBe7813',
    LPBondingCurve: '0x4bF195932E20Dc8459419Bc93a84B713bED20f38',
    TokenCommunityManager: '0x84A0CFb53a77202777fdbc845e7A5bb214311e88',
    ReferralFeeManager: '0x9d3BE262bed6F3A0AAb4E97c0232071EF730632f',
    chainId: 8453,
  },
  [ValidChains.Linea]: {
    NamespaceFactory: '0xE3AE9569f4523161742414480f87967e991741bd',
    CommunityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 59144,
  },
  [ValidChains.Optimism]: {
    NamespaceFactory: '0xE3AE9569f4523161742414480f87967e991741bd',
    CommunityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 10,
  },
  [ValidChains.Mainnet]: {
    NamespaceFactory: '0x90aa47bf6e754f69ee53F05b5187B320E3118B0f',
    CommunityStake: '0x9ed281E62dB1b1d98aF90106974891a4c1cA3a47',
    chainId: 1,
  },
  [ValidChains.Arbitrum]: {
    NamespaceFactory: '0xE3AE9569f4523161742414480f87967e991741bd',
    CommunityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 42161,
  },
  [ValidChains.BSC]: {
    NamespaceFactory: '0xE3AE9569f4523161742414480f87967e991741bd',
    CommunityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 56,
  },
  [ValidChains.SKALE_TEST]: {
    NamespaceFactory: '0x16da329328d9816b5e68D96Ec5944D939ed9727E',
    CommunityStake: '0xC49eEcf7af055c4dfA3E918662D9BbAC45544BD6',
    chainId: 974399131,
  },
  [ValidChains.Anvil]: {
    NamespaceFactory: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
    CommunityStake: '0xd097926d8765A7717206559E7d19EECCbBa68c18',
    Launchpad: '0x0d3b664431FEB91E630DBAB864917DA60e1915b8',
    LPBondingCurve: '0x40F620b5191fF99d0290F27194383c6979011a68',
    TokenCommunityManager: '0x5620CfB48748c1bE2DFB919Eee7414B491CCba20',
    ReferralFeeManager: '0xb80174D6069F9c14CE694Bc8c842aAe0E8e0f8C5',
    // veBridge: '0xF481D80E5cC35fd55A4B68145C4DA0EFCf2687aE',
    CommunityNominations: '0xDB04d3bdf53e3F7d2314d9C19Ec8420b2EeCda93',
    TokenLaunchpad: '0x26B3f37507c38a84C5eFAB888D422170102cCF10',
    TokenBondingCurve: '0x112eAB263b0eEe88b6996Ff4A03D9629dad8a2b8',
    chainId: 31337,
  },
};

const chainIdToValidChain: Record<number, keyof FactoryContractsType> =
  Object.entries(factoryContracts).reduce(
    (acc, [key, val]) => {
      acc[val.chainId] = key as unknown as keyof FactoryContractsType;
      return acc;
    },
    {} as Record<number, keyof FactoryContractsType>,
  );

// Type safe and runtime safe contract getter. Will throw an error if you
// Try to get a contract from a chain that does not have the contract deployed
export function getFactoryContract(ethChainId: number) {
  const chainKey = chainIdToValidChain[ethChainId];
  if (!chainKey) {
    throw new Error(`No contracts configured for chainId ${ethChainId}`);
  }

  const contracts = factoryContracts[chainKey];

  return new Proxy(contracts, {
    get(target, prop: string) {
      if (!(prop in target)) {
        throw new Error(
          `Contract "${prop}" not found on chain ${chainKey} (chainId ${ethChainId})`,
        );
      }
      return target[prop as keyof typeof target];
    },
  }) as Required<FactoryContractsType[keyof FactoryContractsType]>;
}
