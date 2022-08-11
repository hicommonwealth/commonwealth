import { ChainAttributes } from '../../app/models/chain';
import { DB } from '../../app/database';
import { Logger } from "typescript-logging";

export type Ithis = {
  models: DB;
  log: Logger;
};

export async function processChainCUD(
  this: Ithis,
  chainData: {
    chain: ChainAttributes;
    cud: 'create' | 'update' | 'delete-chain' | 'delete-chainNode';
    chainNodeUrl?: string;
  }
) {
  if (chainData.cud === 'create') {
    const [chainNode, created] = await this.models.ChainNode.findOrCreate({
      where: { url: chainData.chain.ChainNode.url },
    });

    await this.models.Chain.create({
      id: chainData.chain.id,
      base: chainData.chain.base,
      network: chainData.chain.network,
      chain_node_id: chainNode.id,
      contract_address: chainData.chain.contract_address,
      substrate_spec: chainData.chain.substrate_spec,
      verbose_logging: chainData.chain.verbose_logging,
      active: chainData.chain.active,
    });
  } else if (chainData.cud === 'update') {
    // get the existing chain data
    const chain = await this.models.Chain.findOne({
      where: {
        id: chainData.chain.id,
      },
      include: this.models.ChainNode,
    });

    if (!chain) {
      this.log.error(
        `Cannot update a non-existent chain! ${JSON.stringify(chainData.chain)}`
      );
      return;
    }

    // if the chainNode url has changed then findOrCreate the new chainNode
    let chainNode, created;
    if (chain.ChainNode.url != chainData.chain.ChainNode.url) {
      [chainNode, created] = await this.models.ChainNode.findOrCreate({
        where: { url: chainData.chain.ChainNode.url },
      });
      chain.chain_node_id = chainNode.id;
    }

    chain.base = chainData.chain.base;
    chain.network = chainData.chain.network;
    chain.contract_address = chainData.chain.contract_address;
    chain.substrate_spec = chainData.chain.substrate_spec;
    chain.verbose_logging = chainData.chain.verbose_logging;
    chain.active = chainData.chain.active;

    await chain.save();
  } else if (chainData.cud === 'delete-chain') {
    await this.models.Chain.destroy({
      where: { id: chainData.chain.id },
    });
  } else if (chainData.cud === 'delete-chainNode') {
    await this.models.ChainNode.destroy({
      where: { url: chainData.chainNodeUrl },
    });

    await this.models.sequelize.query(
      `
        DELETE
        FROM "ChainNodes"
        WHERE (SELECT * FROM "Chains" WHERE chain_node_id = "ChainNodes".id) IS NULL;
    `,
      { raw: true }
    );
    // TODO: do we have any delete scenarios not handled here i.e. if updating a chain to a new ChainNode
  }
}
