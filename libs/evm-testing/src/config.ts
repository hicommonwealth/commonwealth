import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const { ETH_ALCHEMY_API_KEY, PROVIDER_URL, ETH_RPC, COSMOS_REGISTRY_API } =
  process.env;

export const config = configure(
  target,
  {
    EVM: {
      ETH_RPC: ETH_RPC || 'prod',
      // URL of the local Ganache, Anvil, or Hardhat chain
      PROVIDER_URL: PROVIDER_URL ?? 'http://127.0.0.1:8545',
      ETH_ALCHEMY_API_KEY,
    },
    COSMOS: {
      COSMOS_REGISTRY_API:
        COSMOS_REGISTRY_API || 'https://cosmoschains.thesilverfox.pro',
    },
  },
  z.object({
    EVM: z.object({
      ETH_RPC: z.string(),
      PROVIDER_URL: z.string(),
      ETH_ALCHEMY_API_KEY: z.string().optional(),
      BASESEP_ALCHEMY_API_KEY: z.string().optional(),
    }),
    COSMOS: z.object({
      COSMOS_REGISTRY_API: z.string(),
    }),
  }),
);
