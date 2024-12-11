import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { bootstrapBindings } from '../../../../server/bindings/bootstrap';
import { up as up1 } from '../../../../server/migrations/20240319234133-create-outbox-channel-trigger.js';
import { up as up2 } from '../../../../server/migrations/20240620213513-fix-pg-notify-trigger.js';
import { startMessageRelayer } from '../../../../server/workers/messageRelayer/messageRelayer';
import { mineBlocks, setupAnvil } from './process-setup/setupAnvil';
import { setupEvmCe } from './process-setup/setupEvmCe';
import { setupRabbitMq } from './process-setup/setupRabbitMq';
import { anvilAccounts, setupWeb3 } from './process-setup/setupWeb3';

export async function setupCommonwealthE2E() {
  // setup outbox notifications

  await up1(models.sequelize.getQueryInterface(), models.sequelize);
  await up2(models.sequelize.getQueryInterface(), models.sequelize);

  // need to set up anvil before we can run evmCE.
  // need to set up rmq before running consumer
  const [anvilContainer, rabbitMQContainer] = await Promise.all([
    setupAnvil(),
    setupRabbitMq(),
  ]);

  // note need to run this in between so we can set up the rmq adapter
  await startMessageRelayer();

  await Promise.all([setupEvmCe(), bootstrapBindings(true)]);

  const web3 = setupWeb3(anvilContainer!.getMappedPort(8545));

  return {
    web3,
    anvilAccounts,
    mineBlocks,
    anvilContainer,
    rabbitMQContainer,
    contractAddresses: cp.factoryContracts[31337],
  };
}
