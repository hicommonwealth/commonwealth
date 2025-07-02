import { models } from '@hicommonwealth/model';
import { GenericContainer } from 'testcontainers';
import Web3 from 'web3';

export const imageUrl = 'ghcr.io/foundry-rs/foundry:v1.2.3';

let port;

export async function setupAnvil() {
  if (!process.env.FORK_URL) {
    throw new Error('Fork URL is missing for anvil tests');
  }
  const mnemonic =
    'quantum manual lottery rocket sing shed rigid nose walnut mercy warrior bullet nuclear bargain hunt';

  try {
    const container = await new GenericContainer(imageUrl)
      .withExposedPorts(8546)
      .withEntrypoint([
        'anvil',
        '--block-time',
        '1',
        '--chain-id',
        '31337',
        '--host',
        '0.0.0.0',
        '--port',
        '8546',
        '--fork-url',
        process.env.FORK_URL,
        '--steps-tracing',
        '-m',
        mnemonic,
      ])
      .start();

    port = container.getMappedPort(8546);

    await models.sequelize.query(`
      INSERT INTO "ChainNodes" (
          id,
          url,
          private_url,
          eth_chain_id,
          alt_wallet_url,
          private_url,
          balance_type,
          name,
          created_at,
          updated_at
      ) VALUES (
        1,
        'http://localhost:${port}',
        'http://localhost:${port}',
        31337,
        'http://localhost:${port}',
        'http://localhost:${port}',
        'ethereum',
        'Anvil Local Testnet',
        NOW(),
        NOW()
      )
    `);

    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `http://127.0.0.1:${container!.getMappedPort(8546)}`,
      ),
    );

    const lastBlock = await web3.eth.getBlockNumber();
    await models.sequelize.query(`
        INSERT INTO "LastProcessedEvmBlocks" (chain_node_id, block_number)
        VALUES (1, ${lastBlock});
    `);

    return container;
  } catch (err) {
    console.error('Failed to start container:', err);
  }
}
