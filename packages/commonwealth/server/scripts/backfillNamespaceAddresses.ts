import { PinoLogger } from '@hicommonwealth/adapters';
import { commonProtocol, logger } from '@hicommonwealth/core';
import { commonProtocol as cmnProtocol } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import Web3 from 'web3';

const log = logger(PinoLogger()).getLogger(__filename);
const ethChainIds = Object.values(commonProtocol.ValidChains).filter(
  (value) => typeof value === 'number',
) as number[];

async function main() {
  const { models } = await import('@hicommonwealth/model');

  const communities = await models.Community.findAll({
    where: {
      namespace: {
        [Op.ne]: null,
      },
    },
    include: [
      {
        model: models.ChainNode,
        required: true,
        where: {
          eth_chain_id: ethChainIds,
        },
      },
    ],
  });

  log.info(
    `${communities.length} have an associated namespace: ${JSON.stringify(
      communities.map((c) => c.id),
    )}`,
  );

  const web3Providers = {} as Record<number, Web3 | undefined>;

  for (const community of communities) {
    if (!web3Providers[community.ChainNode.eth_chain_id]) {
      web3Providers[community.ChainNode.eth_chain_id] = new Web3(
        community.ChainNode.private_url || community.ChainNode.url,
      );
    }
    const web3 = web3Providers[community.ChainNode.eth_chain_id];

    const namespaceAddress = await cmnProtocol.contractHelpers.getNamespace(
      web3,
      community.namespace,
      commonProtocol.factoryContracts[community.ChainNode.eth_chain_id].factory,
    );

    if (!namespaceAddress) {
      log.error('Namespace address not found', undefined, {
        namespace: community.namespace,
        eth_chain_id: community.ChainNode.eth_chain_id,
        community_id: community.id,
      });
    }

    log.info(`Namespace address for ${community.id}: ${namespaceAddress}`);
    community.namespace_address = namespaceAddress;
  }

  log.info('Namespace retrieval finished. Commencing database update...');

  return await models.sequelize.transaction(async (transaction) => {
    // not the most optimal but this is a one-time script so convenience is preferred
    await Promise.all(communities.map((c) => c.save({ transaction })));
  });
}

if (require.main === module) {
  main()
    .then(() => {
      log.info('Success!');
      process.exit(0);
    })
    .catch((err) => {
      log.fatal('A fatal error occurred', err);
      process.exit(1);
    });
}
