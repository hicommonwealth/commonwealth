import { Op } from 'sequelize';
import type { DB } from '../models';
import { ChainNodeAttributes } from '../models/chain_node';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import { attributesOf } from '../util/sequelizeHelpers';

type GetSupportedEthChainsResp = {
  [id: number]: { url: string; alt_wallet_url: string };
};

const getSupportedEthChains = async (
  models: DB,
  req: TypedRequestQuery<Record<string, never>>,
  res: TypedResponse<GetSupportedEthChainsResp>,
) => {
  try {
    const supportedChainIds = await models.ChainNode.findAll({
      attributes: attributesOf<ChainNodeAttributes>(
        'url',
        'eth_chain_id',
        'alt_wallet_url',
      ),
      group: attributesOf<ChainNodeAttributes>(
        'url',
        'eth_chain_id',
        'alt_wallet_url',
      ),
      where: {
        // get all nodes that have a valid chain id
        eth_chain_id: {
          [Op.and]: {
            [Op.ne]: null,
            [Op.ne]: 0,
          },
        },
      },
    });

    const results: { [id: number]: { url: string; alt_wallet_url: string } } =
      {};
    for (const { eth_chain_id, url, alt_wallet_url } of supportedChainIds) {
      results[eth_chain_id] = { url, alt_wallet_url };
    }
    return success(res, results);
  } catch (e) {
    return res.json({ status: 'Failure', result: e.message });
  }
};

export default getSupportedEthChains;
