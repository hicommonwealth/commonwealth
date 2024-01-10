// eslint-disable-next-line
import '@nomiclabs/hardhat-ethers';
import 'hardhat-typechain';
import type { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      loggingEnabled: true,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.7',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.8.0',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.7.5',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.6.8',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.7.5',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.5.5',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'petersburg',
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
    ],
  },
  paths: {
    sources: './src/eth/contracts',
    artifacts: './src/eth/artifacts',
    cache: './src/eth/cache',
  },
  typechain: {
    outDir: './src/eth/types',
    target: 'ethers-v5',
  },
};

export default config;
