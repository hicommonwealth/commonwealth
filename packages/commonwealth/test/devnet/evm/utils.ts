import { models } from '@hicommonwealth/model';
import { GenericContainer } from 'testcontainers';
import { contractAbiSql } from './contractAbis';

export const imageUrl = 'public.ecr.aws/f8g0x5p7/commonwealth-anvil:386bdb7';

export async function setupCommonwealthAnvilContainer() {
  try {
    const container = await new GenericContainer(imageUrl)
      .withExposedPorts(8545)
      .start();

    const port = container.getMappedPort(8545);

    await models.sequelize.query(`
    INSERT INTO "ChainNodes" (
        url,
        eth_chain_id,
        alt_wallet_url,
        balance_type,
        name,
        created_at,
        updated_at
    ) VALUES (
      'http://localhost:${port}',
      1,
      'http://localhost:${port}',
      'ethereum',
      'Anvil Local Testnet',
      NOW(),
      NOW()
    );
  `);

    // populate with ABIs
    await models.sequelize.query(contractAbiSql);

    return container;
  } catch (err) {
    console.error('Failed to start container:', err);
  }
}

setupCommonwealthAnvilContainer();
