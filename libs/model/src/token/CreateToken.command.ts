import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { TokenView } from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import Web3 from 'web3';
import z from 'zod';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';
import { tokenCommunityManagerAbi } from '../services/commonProtocol/abi/TokenCommunityManager';
import { erc20Abi } from '../services/commonProtocol/abi/erc20';

export async function createTokenHandler(
  chainNodeId: number,
  tokenAddress: string,
  description?: string | null,
  iconUrl?: string | null,
) {
  const chainNode = await models.ChainNode.findOne({
    where: { id: chainNodeId },
    attributes: ['eth_chain_id', 'url', 'private_url'],
  });

  mustExist('Chain Node', chainNode);

  const web3 = new Web3(chainNode.private_url || chainNode.url);

  const contracts =
    commonProtocol.factoryContracts[
      chainNode!.eth_chain_id as commonProtocol.ValidChains
    ];
  const tokenManagerAddress = contracts.tokenCommunityManager;
  const tokenManagerContract = new web3.eth.Contract(
    tokenCommunityManagerAbi,
    tokenManagerAddress,
  );

  let namespace: string;
  try {
    namespace = await tokenManagerContract.methods
      .namespaceForToken(tokenAddress)
      .call();
  } catch (error) {
    throw Error(`Failed to get namespace for token ${tokenAddress}`);
  }

  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);

  let name: string;
  let symbol: string;
  let totalSupply: bigint;

  try {
    [name, symbol, totalSupply] = await Promise.all([
      erc20Contract.methods.name().call() as unknown as string,
      erc20Contract.methods.symbol().call() as unknown as string,
      erc20Contract.methods.totalSupply().call() as unknown as bigint,
    ]);
  } catch (e) {
    throw Error(
      `Failed to get erc20 token properties for token ${tokenAddress}`,
    );
  }

  const token = await models.Token.create({
    token_address: tokenAddress.toLowerCase(),
    namespace,
    name,
    symbol,
    initial_supply: totalSupply,
    is_locked: false,
    description: description ?? null,
    icon_url: iconUrl ?? null,
  });

  return token!.toJSON() as unknown as z.infer<typeof TokenView>;
}

export function CreateToken(): Command<typeof schemas.CreateToken> {
  return {
    ...schemas.CreateToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { chain_node_id, transaction_hash, description, icon_url } =
        payload;

      const chainNode = await models.ChainNode.findOne({
        where: { id: chain_node_id },
        attributes: ['eth_chain_id', 'url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      const web3 = new Web3(chainNode.private_url || chainNode.url);

      const txReceipt = await web3.eth.getTransactionReceipt(transaction_hash);
      const tokenAddress = txReceipt.logs[0].address!;
      if (!tokenAddress) {
        throw Error(
          'Failed to find tokenAddress in token creation command. Review tokenAddress logic',
        );
      }

      return await createTokenHandler(
        chain_node_id,
        tokenAddress,
        description,
        icon_url,
      );
    },
  };
}
