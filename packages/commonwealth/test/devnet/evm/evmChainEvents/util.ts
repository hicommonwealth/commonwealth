import { ChainTesting } from '@hicommonwealth/evm-testing';

export const localRpc = 'http://localhost:8545';
export const sdk = new ChainTesting('http://127.0.0.1:3000');

// aave utils
export const aavePropCreatedSignature =
  '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec';
export const aavePropQueuedSignature =
  '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe';

export const compoundPropCreatedSignature =
  '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0';
export const compoundPropQueuedSignature =
  '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892';

export function getEvmSecondsAndBlocks(days: number) {
  const secs = Math.round(days * 86400);
  const blocks = Math.round(secs / 12 + 500);
  return { secs, blocks };
}
