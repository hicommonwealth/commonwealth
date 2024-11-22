import { models } from '@hicommonwealth/model';
import { GenericContainer, Wait } from 'testcontainers';
import { StartedTestContainer } from 'testcontainers/build/test-container';
import Web3 from 'web3';
import { config } from '../../../server/config';
import { setupCommonwealthConsumer } from '../../../server/workers/commonwealthConsumer/commonwealthConsumer';
import { startEvmPolling } from '../../../server/workers/evmChainEvents/startEvmPolling';
import { evmEventSources } from './evmEventSources';

export const imageUrl = 'public.ecr.aws/f8g0x5p7/commonwealth-anvil:386bdb7';

const anvilAccounts: { address: string; privateKey: string }[] = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey:
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey:
      '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey:
      '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey:
      '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  },
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey:
      '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  },
  {
    address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    privateKey:
      '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  },
  {
    address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    privateKey:
      '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  },
  {
    address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    privateKey:
      '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
  },
  {
    address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    privateKey:
      '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
  },
];

function setupWeb3(anvilPort: number) {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(`http://127.0.0.1:${anvilPort}`),
  );

  anvilAccounts.forEach((a) => {
    web3.eth.accounts.wallet.add(a.privateKey);
  });

  return web3;
}

async function getDeploymentInfo(
  deploymentName: string,
  container: StartedTestContainer,
) {
  const filePath = `/app/broadcast/${deploymentName}/31337/run-latest.json`;

  const execResult = await container.exec(['cat', filePath]);
  const fileContent = execResult.output.trim();
  return JSON.parse(fileContent);
}

export async function setupRabbitMq() {
  const rabbitMQContainer = await new GenericContainer(
    'rabbitmq:3.11-management',
  )
    .withExposedPorts(5672, 15672)
    .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
    .start();

  console.log(
    `rabbitMQ management port`,
    rabbitMQContainer.getMappedPort(15672),
  );

  config.BROKER.RABBITMQ_URI = `amqp://127.0.0.1:${rabbitMQContainer.getMappedPort(5672)}`;

  return rabbitMQContainer;
}

export async function setupEvmCe() {
  return await startEvmPolling(100);
}

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
    // await models.sequelize.query(contractAbiSql);
    await models.sequelize.query(evmEventSources);

    return container;
  } catch (err) {
    console.error('Failed to start container:', err);
  }
}

export async function setupCommonwealthE2E() {
  // need to set up anvil before we can run evmCE.
  // need to set up rmq before running consumer
  const [anvilContainer, rabbitmqContainer] = await Promise.all([
    setupAnvil(),
    setupRabbitMq(),
  ]);

  await Promise.all([setupEvmCe(), setupCommonwealthConsumer()]);

  const web3 = setupWeb3(anvilContainer!.getMappedPort(8545));

  return { web3, anvilAccounts, anvilContainer, rabbitmqContainer };
}
