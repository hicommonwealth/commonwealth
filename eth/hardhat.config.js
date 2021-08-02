// eslint-disable-next-line import/no-extraneous-dependencies
require('hardhat-typechain');

module.exports = {
  solidity: {
    compilers: [
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
    ],
  },
  typechain: {
    outDir: '../src/contractTypes',
    target: 'ethers-v5',
  },
};
