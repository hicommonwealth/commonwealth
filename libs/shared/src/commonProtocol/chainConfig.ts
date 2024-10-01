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
}

export const STAKE_ID = 2;
export const CONTEST_VOTER_SHARE = 20;
export const CONTEST_FEE_SHARE = 100;

// Requires a live contract for each enum chain. Add address of factory here on new deploy.
// WARNING: ADD THE CONTRACT IN EvmEventSources TABLE VIA MIGRATION IF ADDING HERE!
export const factoryContracts: {
  [key in ValidChains]: {
    factory: string;
    communityStake: string;
    launchpad?: string;
    lpBondingCurve?: string;
    chainId: number;
  };
} = {
  [ValidChains.Sepolia]: {
    factory: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
    communityStake: '0xf6C1B02257f0Ac4Af5a1FADd2dA8E37EC5f9E5fd',
    chainId: 11155111,
  },
  [ValidChains.SepoliaBase]: {
    factory: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
    communityStake: '0xd097926d8765A7717206559E7d19EECCbBa68c18',
    launchpad: '0x5045238a20f07acb34dd1265bb240eab8c8db7a9',
    lpBondingCurve: '0x8E506c3D1Ba9e0c00B1f0bC6C3457bbfB1Fe6464',
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
    chainId: 8453,
  },
  [ValidChains.Linea]: {
    factory: '0xe3ae9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15a7dd0d5301b6a626316e7211352cf62',
    chainId: 59144,
  },
  [ValidChains.Optimism]: {
    factory: '0xe3ae9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15a7dd0d5301b6a626316e7211352cf62',
    chainId: 10,
  },
  [ValidChains.Mainnet]: {
    factory: '0x90aa47bf6e754f69ee53f05b5187b320e3118b0f',
    communityStake: '0x9ed281e62db1b1d98af90106974891a4c1ca3a47',
    chainId: 1,
  },
  [ValidChains.Arbitrum]: {
    factory: '0xE3AE9569f4523161742414480f87967e991741bd',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 42161,
  },
};
