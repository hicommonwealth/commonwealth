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

// Purpose of this function is to get around the satisfies in the
// factoryContract type in order to check existence of fields
export function toContractObject<T extends factoryContractsType[ValidChains]>(
  obj: T,
): Required<factoryContractsType[ValidChains]> {
  return obj as Required<factoryContractsType[ValidChains]>;
}

export const STAKE_ID = 2;
export const CONTEST_VOTER_SHARE = 0;
export const CONTEST_FEE_SHARE = 100;
export const NOMINATION_FEE = 0.00005;

type factoryContractsType = {
  [key in ValidChains]: {
    factory: string;
    communityStake: string;
    launchpad?: string;
    lpBondingCurve?: string;
    tokenCommunityManager?: string;
    referralFeeManager?: string;
    veBridge?: string;
    communityNomination?: string;
    postTokenLaunchpad?: string;
    postTokenBondingCurve?: string;
    chainId: number;
  };
};

// Requires a live contract for each enum chain. Add address of factory here on new deploy.
// WARNING: UPDATE THE EvmEventSources.parent_contract_address IN THE DB IF THE FACTORY ADDRESS IS UPDATED
export const factoryContracts = {
  [ValidChains.Sepolia]: {
    factory: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
    communityStake: '0xf6C1B02257f0Ac4Af5a1FADd2dA8E37EC5f9E5fd',
    chainId: 11155111,
  },
  [ValidChains.SepoliaBase]: {
    factory: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
    communityStake: '0xd097926d8765A7717206559E7d19EECCbBa68c18',
    launchpad: '0x0d3b664431FEB91E630DBAB864917DA60e1915b8',
    lpBondingCurve: '0x40F620b5191fF99d0290F27194383c6979011a68',
    tokenCommunityManager: '0x5620CfB48748c1bE2DFB919Eee7414B491CCba20',
    referralFeeManager: '0xb80174D6069F9c14CE694Bc8c842aAe0E8e0f8C5',
    veBridge: '0xF481D80E5cC35fd55A4B68145C4DA0EFCf2687aE',
    communityNomination: '0xDB04d3bdf53e3F7d2314d9C19Ec8420b2EeCda93',
    postTokenLaunchpad: '0x26B3f37507c38a84C5eFAB888D422170102cCF10',
    postTokenBondingCurve: '0x112eAB263b0eEe88b6996Ff4A03D9629dad8a2b8',
    chainId: 84532,
  },
  [ValidChains.Blast]: {
    factory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 81457,
  },
  [ValidChains.Base]: {
    factory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    launchpad: '0x0c1786961CfDac88EdEb5728E52F73A0DbBe7813',
    lpBondingCurve: '0x4bF195932E20Dc8459419Bc93a84B713bED20f38',
    tokenCommunityManager: '0x84A0CFb53a77202777fdbc845e7A5bb214311e88',
    referralFeeManager: '0x9d3BE262bed6F3A0AAb4E97c0232071EF730632f',
    chainId: 8453,
  },
  [ValidChains.Linea]: {
    factory: '0xE3AE9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 59144,
  },
  [ValidChains.Optimism]: {
    factory: '0xE3AE9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 10,
  },
  [ValidChains.Mainnet]: {
    factory: '0x90aa47bf6e754f69ee53F05b5187B320E3118B0f',
    communityStake: '0x9ed281E62dB1b1d98aF90106974891a4c1cA3a47',
    chainId: 1,
  },
  [ValidChains.Arbitrum]: {
    factory: '0xE3AE9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 42161,
  },
  [ValidChains.BSC]: {
    factory: '0xE3AE9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 56,
  },
  [ValidChains.SKALE_TEST]: {
    factory: '0x16da329328d9816b5e68D96Ec5944D939ed9727E',
    communityStake: '0xC49eEcf7af055c4dfA3E918662D9BbAC45544BD6',
    chainId: 974399131,
  },
  [ValidChains.Anvil]: {
    factory: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
    communityStake: '0xd097926d8765A7717206559E7d19EECCbBa68c18',
    launchpad: '0x0d3b664431FEB91E630DBAB864917DA60e1915b8',
    lpBondingCurve: '0x40F620b5191fF99d0290F27194383c6979011a68',
    tokenCommunityManager: '0x5620CfB48748c1bE2DFB919Eee7414B491CCba20',
    referralFeeManager: '0xb80174D6069F9c14CE694Bc8c842aAe0E8e0f8C5',
    veBridge: '0xF481D80E5cC35fd55A4B68145C4DA0EFCf2687aE',
    communityNomination: '0xDB04d3bdf53e3F7d2314d9C19Ec8420b2EeCda93',
    postTokenLaunchpad: '0x26B3f37507c38a84C5eFAB888D422170102cCF10',
    postTokenBondingCurve: '0x112eAB263b0eEe88b6996Ff4A03D9629dad8a2b8',
    chainId: 31337,
  },
} as const satisfies factoryContractsType;
