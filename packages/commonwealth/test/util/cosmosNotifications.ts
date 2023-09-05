import models from '../../server/database';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';

/**
 * Creates a Cosmos ChainNode and Chain that uses v1 governance and another one that uses v1beta1 governance.
 */
export async function createCosmosChains() {
  await models.sequelize.transaction(async (transaction) => {
    const kyveNode = await models.ChainNode.create({
      url: 'https://rpc-eu-1.kyve.network/',
      alt_wallet_url: 'https://api-eu-1.kyve.network/',
      name: 'KYVE Network',
      balance_type: BalanceType.Cosmos,
    });

    const osmosisNode = await models.ChainNode.create({
      url: 'https://rpc.osmosis.zone',
      alt_wallet_url: 'https://rest.cosmos.directory/osmosis',
      name: 'Osmosis',
      balance_type: BalanceType.Cosmos,
    });

    await models.Chain.create(
      {
        id: 'kyve',
        name: 'KYVE',
        network: ChainNetwork.Kyve,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: kyveNode.id,
        default_symbol: 'KYVE',
      },
      { transaction }
    );

    await models.Chain.create(
      {
        id: 'osmosis',
        name: 'Osmosis',
        network: ChainNetwork.Osmosis,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: osmosisNode.id,
        default_symbol: 'OSMO',
      },
      { transaction }
    );
  });
}
