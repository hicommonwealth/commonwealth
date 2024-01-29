// Chains with deployed namespace factories. As new chains are enabled, add here.
export enum ValidChains {
  Goerli = 5,
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
  [ValidChains.Goerli]: {
    factory: '0xf877acdb66586ace7381b6e0b83697540f4c3871',
    communityStake: '0x8C85024bcD73B07C5F6fa0534964Bc67633F308C',
    chainId: 5,
  },
};
