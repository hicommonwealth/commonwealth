// eslint-disable-next-line import/no-extraneous-dependencies
import 'hardhat-typechain';
import '@nomiclabs/hardhat-waffle';

export default {
  solidity: {
    compilers: [
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
  typechain: {
    outDir: '../src/contractTypes',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 40000
  },
};
