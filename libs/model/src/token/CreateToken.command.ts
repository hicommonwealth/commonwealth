import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustExist } from '../middleware/guards';

export const CreateTokenErrors = {
  TokenNameExists:
    'The name for this token already exists, please choose another name',
  InvalidEthereumChainId: 'Ethereum chain ID not provided or unsupported',
  InvalidAddress: 'Address is invalid',
  InvalidBase: 'Must provide valid chain base',
  MissingNodeUrl: 'Missing node url',
  InvalidNode: 'RPC url returned invalid response. Check your node url',
};

export function CreateToken(): Command<
  typeof schemas.CreateToken,
  AuthContext
> {
  return {
    ...schemas.CreateToken,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ actor, payload }) => {
      const {
        base,
        chain_node_id,
        name,
        symbol,
        description,
        icon_url,
        community_id,
        launchpad_contract_address,
      } = payload;

      const token = await models.Token.findOne({
        where: { name },
      });
      if (token) throw new InvalidInput(CreateTokenErrors.TokenNameExists);

      const baseCommunity = await models.Community.findOne({
        where: { base, id: community_id },
      });
      mustExist('Community Chain Base', baseCommunity);

      const node = await models.ChainNode.findOne({
        where: { id: chain_node_id },
      });
      mustExist(`Chain Node`, node);

      if (base === ChainBase.Ethereum && !node.eth_chain_id)
        throw new InvalidInput(CreateTokenErrors.InvalidEthereumChainId);

      const createdToken = await models.Token.create({
        base,
        chain_node_id,
        name,
        symbol,
        description,
        icon_url,
        author_address: actor.address || '',
        community_id,
        launchpad_contract_address,
        // uniswap_pool_address, - TODO: add when uniswap integration is done
      });

      return createdToken!.toJSON();
    },
  };
}
