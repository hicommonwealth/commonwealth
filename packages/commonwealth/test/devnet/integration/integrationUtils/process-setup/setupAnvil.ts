import { models } from '@hicommonwealth/model';
import { GenericContainer } from 'testcontainers';
import { contractAbiSql } from '../chain-info/contractAbis';
import { evmEventSources } from '../chain-info/evmEventSources';

export const imageUrl = 'public.ecr.aws/f8g0x5p7/commonwealth-anvil:72bdcb7';

export async function setupAnvil() {
  try {
    const container = await new GenericContainer(imageUrl)
      .withExposedPorts(8545)
      .start();

    const port = container.getMappedPort(8545);

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
        ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt_wallet_url = EXCLUDED.alt_wallet_url;
    `);

    // populate with ABIs
    await models.sequelize.query(contractAbiSql);
    await models.sequelize.query(evmEventSources);

    await models.sequelize.query(`DELETE FROM "LastProcessedEvmBlocks";`);

    return container;
  } catch (err) {
    console.error('Failed to start container:', err);
  }
}
