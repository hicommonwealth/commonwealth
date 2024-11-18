import { describe, test } from 'vitest';
import { startEvmPolling } from '../../../server/workers/evmChainEvents/startEvmPolling';
import { setupCommonwealthAnvilContainer } from './utils';

describe('End to end event tests', () => {
  test(
    'should run',
    async () => {
      const container = await setupCommonwealthAnvilContainer();

      await startEvmPolling(1);
    },
    { timeout: 100000000 },
  );
});
