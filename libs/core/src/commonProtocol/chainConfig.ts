// Chains with deployed namespace factories. As new chains are enabled, add here.
export enum ValidChains {
  Sepolia = 11155111,
  Base = 8453,
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
    factory: '0xA6f747b38B50B2519dDb7a12e1523d518B6D0FD3',
    communityStake: '0x377004f12eEE739204D44073F160798235160711',
    chainId: 11155111,
  },
  [ValidChains.Base]: {
    factory: '0xD656267Af2E41580d47451Df2e6E21f5367CC04D',
    communityStake: '0xfef0dEE36609C0B223EEbbC6089356A9D8f5490f',
    chainId: 8453,
  },
};
