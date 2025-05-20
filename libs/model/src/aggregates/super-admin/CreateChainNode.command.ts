import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { isSuperAdmin, mustNotExist } from '../../middleware';

export function CreateChainNode(): Command<typeof schemas.CreateChainNode> {
  return {
    ...schemas.CreateChainNode,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { url, name, balance_type, eth_chain_id } = payload;

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
      });
      mustNotExist('ChainNode', chainNode);

      const node = await models.ChainNode.create({
        url,
        name,
        balance_type,
        alt_wallet_url: url,
        eth_chain_id,
      });
      return { node_id: node.id! };
    },
  };
}
