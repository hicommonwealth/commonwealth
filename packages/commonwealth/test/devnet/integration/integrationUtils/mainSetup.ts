import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { setupCommonwealthConsumer } from '../../../../server/workers/commonwealthConsumer/commonwealthConsumer';
import { startMessageRelayer } from '../../../../server/workers/messageRelayer/messageRelayer';
import { mineBlocks, setupAnvil } from './process-setup/setupAnvil';
import { setupEvmCe } from './process-setup/setupEvmCe';
import { setupRabbitMq } from './process-setup/setupRabbitMq';
import { anvilAccounts, setupWeb3 } from './process-setup/setupWeb3';

export async function setupCommonwealthE2E() {
  // setup outbox notifications
  await models.sequelize.query(`
  CREATE OR REPLACE FUNCTION notify_insert_outbox_function()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.relayed = false THEN
        PERFORM pg_notify('outbox_channel', NEW.event_name);
      END IF;
      RETURN NEW;
    END;
  $$ LANGUAGE plpgsql;
  DROP TRIGGER IF EXISTS notify_outbox_insert ON "Outbox";
  CREATE TRIGGER notify_outbox_insert
    AFTER INSERT ON "Outbox"
    FOR EACH ROW
    EXECUTE FUNCTION notify_insert_outbox_function();
`);

  // need to set up anvil before we can run evmCE.
  // need to set up rmq before running consumer
  const [anvilContainer, rabbitMQContainer] = await Promise.all([
    setupAnvil(),
    setupRabbitMq(),
  ]);

  // note need to run this in between so we can set up the rmq adapter
  await startMessageRelayer();

  await Promise.all([setupEvmCe(), setupCommonwealthConsumer(true)]);

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
