import { setupCommonwealthConsumer } from '../../../../server/workers/commonwealthConsumer/commonwealthConsumer';
import { mineBlocks, setupAnvil } from './process-setup/setupAnvil';
import { setupEvmCe } from './process-setup/setupEvmCe';
import { setupRabbitMq } from './process-setup/setupRabbitMq';
import { anvilAccounts, setupWeb3 } from './process-setup/setupWeb3';

export async function setupCommonwealthE2E() {
  // need to set up anvil before we can run evmCE.
  // need to set up rmq before running consumer
  const [anvilContainer, rabbitmqContainer] = await Promise.all([
    setupAnvil(),
    setupRabbitMq(),
  ]);

  await Promise.all([setupEvmCe(), setupCommonwealthConsumer()]);

  const web3 = setupWeb3(anvilContainer!.getMappedPort(8545));

  return { web3, anvilAccounts, mineBlocks, anvilContainer, rabbitmqContainer };
}
