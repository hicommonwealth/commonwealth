import { ChainTesting } from '../../../util/evm-chain-testing/sdk/chainTesting';

export const localRpc = 'http://localhost:8545';
export const sdk = new ChainTesting('http://127.0.0.1:3000');

// aave utils
export const aavePropCreatedSignature =
  '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec';
export const aavePropQueuedSignature =
  '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe';

export function getEvmSecondsAndBlocks(days: number) {
  const secs = Math.round(days * 86400);
  const blocks = Math.round(secs / 12 + 500);
  return { secs, blocks };
}
