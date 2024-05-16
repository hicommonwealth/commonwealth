import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

export const config = configure(target, {}, z.object({}));

// URL of the local Ganache, Anvil, or Hardhat chain
export const PROVIDER_URL = process.env.PROVIDER_URL ?? 'http://127.0.0.1:8545';

export const ETH_ALCHEMY_API_KEY = process.env.ETH_ALCHEMY_API_KEY;
