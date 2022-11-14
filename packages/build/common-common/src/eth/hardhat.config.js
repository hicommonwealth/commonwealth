"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line import/no-extraneous-dependencies
require("hardhat-typechain");
require("@nomiclabs/hardhat-ethers");
const config = {
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            loggingEnabled: true,
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.4',
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
    typechain: {
        outDir: './types',
        target: 'ethers-v5',
    },
};
exports.default = config;
