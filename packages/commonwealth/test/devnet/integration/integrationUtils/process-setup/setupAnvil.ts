import { models } from '@hicommonwealth/model';
import { GenericContainer } from 'testcontainers';
import Web3 from 'web3';

export const imageUrl = 'public.ecr.aws/f8g0x5p7/commonwealth-anvil:af964a9';

let port;

export async function setupAnvil() {
  try {
    const container = await new GenericContainer(imageUrl)
      .withExposedPorts(8545)
      .withEnvironment({
        FORK_URL: process.env.FORK_URL as string,
        PORT: '8545',
      })
      .start();

    port = container.getMappedPort(8545);

    await models.sequelize.query(`
      INSERT INTO "ChainNodes" (
          id,
          url,
          eth_chain_id,
          alt_wallet_url,
          balance_type,
          name,
          created_at,
          updated_at
      ) VALUES (
        1,
        'http://localhost:${port}',
        31337,
        'http://localhost:${port}',
        'ethereum',
        'Anvil Local Testnet',
        NOW(),
        NOW()
      )
    `);

    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `http://127.0.0.1:${container!.getMappedPort(8545)}`,
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
