import dotenv from 'dotenv';

dotenv.config();

// Port that the chain-testing app should bind to
export const CHAIN_TEST_APP_PORT = process.env.CHAIN_TEST_APP_PORT ?? 3000;

// URL of the local Ganache, Anvil, or Hardhat chain
export const PROVIDER_URL = process.env.PROVIDER_URL ?? 'http://chain:8545';
