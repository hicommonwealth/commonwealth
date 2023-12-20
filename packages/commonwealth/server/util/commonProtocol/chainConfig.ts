// Chains with deployed namespace factories. As new chains are enabled, add here.
export enum validChains {
  Goerli,
}

// Requires a live contract for each enum chain. Add address of factory here on new deploy.
export const factoryContracts: {
  [key in validChains]: { factory: string; chainId: number };
} = {
  [validChains.Goerli]: {
    factory: '0xf877acdb66586ace7381b6e0b83697540f4c3871',
    chainId: 5,
  },
};
