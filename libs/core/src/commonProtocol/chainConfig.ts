// Chains with deployed namespace factories. As new chains are enabled, add here.
export enum ValidChains {
  Base = 8453,
  SepoliaBase = 84532,
  Sepolia = 11155111,
}

export const STAKE_ID = 2;

// Requires a live contract for each enum chain. Add address of factory here on new deploy.
export const factoryContracts: {
  [key in ValidChains]: {
    factory: string;
    communityStake: string;
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
    chainId: 84532,
  },
  [ValidChains.Base]: {
    factory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
    communityStake: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
    chainId: 8453,
  },
};
