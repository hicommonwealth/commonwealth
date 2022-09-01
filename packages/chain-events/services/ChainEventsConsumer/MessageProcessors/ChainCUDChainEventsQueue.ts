import { ChainAttributes } from '../../database/models/chain';
import { DB } from '../../database/database';
import { Logger } from "typescript-logging";
import {
  isRmqMsgCreateChainCUD,
  isRmqMsgDeleteChainCUD,
  isRmqMsgUpdateChainCUD,
  TRmqMsgChainCUD
} from 'common-common/src/rabbitmq'

export type Ithis = {
  models: DB;
  log: Logger;
};

export async function processChainCUD(
  this: Ithis,
  data: TRmqMsgChainCUD
) {
  if (isRmqMsgCreateChainCUD(data)) {
    const [chainNode, created] = await this.models.ChainNode.findOrCreate({
      where: { url: data.chain_node_url },
    });

    await this.models.Chain.create({
      id: data.chain_id,
      base: data.base,
      network: data.network,
      chain_node_id: chainNode.id,
      contract_address: data.contract_address,
      substrate_spec: data.substrate_spec,
      verbose_logging: data.verbose_logging,
      active: data.active,
    });
  } else if (isRmqMsgUpdateChainCUD(data)) {
    // get the existing chain data
    const chain = await this.models.Chain.findOne({
      where: {
        id: data.chain_id,
      },
      include: this.models.ChainNode,
    });

    if (!chain) {
      this.log.error(
        `Cannot update a non-existent chain! ${JSON.stringify(data.chain_id)}`
      );
      return;
    }

    // if the chainNode url has changed then findOrCreate the new chainNode
    let chainNode, created;
    if (chain.ChainNode.url != data.chain_node_url) {
      [chainNode, created] = await this.models.ChainNode.findOrCreate({
        where: { url: data.chain_node_url },
      });
      chain.chain_node_id = chainNode.id;
    }

    chain.base = data.base;
    chain.network = data.network;
    chain.contract_address = data.contract_address;
    chain.substrate_spec = data.substrate_spec;
    chain.verbose_logging = data.verbose_logging;
    chain.active = data.active;

    await chain.save();
  } else if (isRmqMsgDeleteChainCUD(data)) {
    await this.models.Chain.destroy({
      where: { id: data.chain_id },
    });
    // TODO: delete dependencies
  }
}
