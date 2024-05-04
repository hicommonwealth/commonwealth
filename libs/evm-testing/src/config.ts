import dotenv from 'dotenv';

dotenv.config();

// URL of the local Ganache, Anvil, or Hardhat chain
export const PROVIDER_URL = process.env.PROVIDER_URL ?? 'http://chain:8545';
