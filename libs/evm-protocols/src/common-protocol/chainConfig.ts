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
    launchpad: '0xc6e7B0AdDf35AE4a5A65bb3bCb78D11Db6c8fB8F',
    lpBondingCurve: '0x2ECc0af0e4794F0Ab4797549a5a8cf97688D7D21',
    tokenCommunityManager: '0xC8fe1F23AbC4Eb55f4aa9E52dAFa3761111CF03a',
    referralFeeManager: '0xb80174D6069F9c14CE694Bc8c842aAe0E8e0f8C5',
    veBridge: '0xF481D80E5cC35fd55A4B68145C4DA0EFCf2687aE',
    communityNomination: '0xDB04d3bdf53e3F7d2314d9C19Ec8420b2EeCda93',
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
    launchpad: '0x94Dd2adCaBe419eaEbc7041f42fa7553b0E6DF5c',
    lpBondingCurve: '0x1bb3bfbeB844a453dcC36a6d7C26eD4A19847815',
    tokenCommunityManager: '0x2A813BDF2eAC0C5cB270570218bC436a996Da6c1',
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
    factory: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    communityStake: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    launchpad: '0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB',
    lpBondingCurve: '0xc5a5C42992dECbae36851359345FE25997F5C42d',
    tokenCommunityManager: '0x851356ae760d987E095750cCeb3bC6014560891C',
    veBridge: '0xF481D80E5cC35fd55A4B68145C4DA0EFCf2687aE', // TODO: Double check this address
    chainId: 31337,
  },
} as const satisfies factoryContractsType;
