import { factoryContracts, ValidChains } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model/db';
import { bootstrapBindings } from '../../../../server/bindings/bootstrap';
// eslint-disable-next-line max-len
import { startMessageRelayer } from '../../../../server/workers/messageRelayer/messageRelayer';
import { setupAnvil } from './process-setup/setupAnvil';
import { setupEvmCe } from './process-setup/setupEvmCe';
import { setupRabbitMq } from './process-setup/setupRabbitMq';
import { anvilAccounts, setupWeb3 } from './process-setup/setupWeb3';

export async function setupCommonwealthE2E() {
  // need to set up anvil before we can run evmCE.
  // need to set up rmq before running consumer
  const [anvilContainer, rabbitMQContainer] = await Promise.all([
    setupAnvil(),
    setupRabbitMq(),
  ]);

  // note need to run this in between so we can set up the rmq adapter
  await startMessageRelayer();

  await Promise.all([
    setupEvmCe(),
    bootstrapBindings({ skipRmqAdapter: true }),
  ]);

  const web3 = setupWeb3(anvilContainer!.getMappedPort(8546));

  const chain = await models.ChainNode.scope('withPrivateData').findOne({
    where: { eth_chain_id: ValidChains.Anvil },
  });

  return {
    web3,
    chain,
    anvilAccounts,
    anvilContainer,
    rabbitMQContainer,
    contractAddresses: factoryContracts[31337],
  };
}
