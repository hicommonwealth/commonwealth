import { models } from '@hicommonwealth/model';
import { GenericContainer } from 'testcontainers';
import Web3 from 'web3';

export const imageUrl = 'public.ecr.aws/f8g0x5p7/commonwealth-anvil:72bdcb7';

let port;

export async function mineBlocks(blocks: number) {
  const provider = new Web3.providers.HttpProvider(`http://localhost:${port}`);

  // mine blocks
  const res = await provider.request({
    jsonrpc: '2.0',
    id: 1,
    method: 'anvil_mine',
    params: [blocks],
  });

  if (res.error) {
    throw new Error((res.error as { code: number; message: string }).message);
  }

  return true;
}

export async function setupAnvil() {
  try {
    const container = await new GenericContainer(imageUrl)
      .withExposedPorts(8545)
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

    await models.sequelize.query(`
        INSERT INTO "LastProcessedEvmBlocks" (chain_node_id, block_number)
        VALUES (1, 18);
    `);

    return container;
  } catch (err) {
    console.error('Failed to start container:', err);
  }
}
