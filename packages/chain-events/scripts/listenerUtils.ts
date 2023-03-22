import type { RegisteredTypes } from '@polkadot/types/types';

import { HydraDXSpec } from './specs/hydraDX';
import { KulupuSpec } from './specs/kulupu';
import { StafiSpec } from './specs/stafi';
import { CloverSpec } from './specs/clover';
import { EdgewareSpec } from './specs/edgeware';

export const networkUrls = {
  clover: 'wss://api.clover.finance',
  hydradx: 'wss://rpc-01.snakenet.hydradx.io',
  edgeware: 'wss://edgeware-rpc.dwellir.com',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  kusama: 'wss://kusama-rpc.polkadot.io',
  polkadot: 'wss://rpc.polkadot.io',
  kulupu: 'ws://rpc.kulupu.corepaper.org/ws',
  stafi: 'wss://scan-rpc.stafi.io/ws',

  marlin: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
  'marlin-local': 'ws://127.0.0.1:9545',
  uniswap:
    'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
  tribe: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',

  aave: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
  'aave-local': 'ws://127.0.0.1:9545',
  'dydx-ropsten':
    'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
  dydx: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
  frax: 'ws://localhost:8545',

  erc20: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
  'eth-local': 'ws://127.0.0.1:8545',
  osmosis: 'https://rpc-osmosis.blockapsis.com',
} as const;

export const networkSpecs: { [chain: string]: RegisteredTypes } = {
  clover: CloverSpec,
  hydradx: HydraDXSpec,
  kulupu: KulupuSpec,
  edgeware: EdgewareSpec,
  'edgeware-local': EdgewareSpec,
  'edgeware-testnet': EdgewareSpec,
  stafi: StafiSpec,
  kusama: {},
  polkadot: {},
};

export const contracts = {
  marlin: '0x777992c2E4EDF704e49680468a9299C6679e37F6',
  aave: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
  'aave-local': '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9',
  'dydx-ropsten': '0x6938240Ba19cB8a614444156244b658f650c8D5c',
  dydx: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
  uniswap: '0xc4e172459f1e7939d522503b81afaac1014ce6f6',
  frax: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  'commonwealth-local': '0x7914a8b73E11432953d9cCda060018EA1d9DCde9',
};
