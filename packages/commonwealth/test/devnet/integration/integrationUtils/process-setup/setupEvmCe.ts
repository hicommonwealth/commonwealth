import { startEvmPolling } from '../../../../../server/workers/evmChainEvents/startEvmPolling';

export async function setupEvmCe() {
  return await startEvmPolling(100);
}
