import { events, Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/shared';
import Web3 from 'web3';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

const inputs = {
  TokenLaunched: events.TokenLaunched,
};

export function LaunchpadPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TokenLaunched: async ({ payload }) => {
        const chainNode = await models.ChainNode.findOne({
          where: { id: payload.eventSource?.chainNodeId },
          attributes: ['eth_chain_id', 'url', 'private_url'],
        });

        mustExist('Chain Node', chainNode);

        const web3 = new Web3(chainNode.private_url || chainNode.url);

        const contracts =
          commonProtocol.factoryContracts[
            chainNode.eth_chain_id as commonProtocol.ValidChains
          ];
        const tokenManagerAddress = contracts.tokenCommunityManager;
        const tokenManagerContract = new web3.eth.Contract(
          tokenCommunityManagerAbi,
          tokenManagerAddress,
        );

        let namespace: string;
        try {
          namespace = await tokenManagerContract.methods
            .namespaceForToken(payload.tokenAddress)
            .call();
        } catch (error) {
          throw Error(
            `Failed to get namespace for token ${payload.tokenAddress}`,
          );
        }

        const erc20Contract = new web3.eth.Contract(
          erc20Abi,
          payload.tokenAddress,
        );

        let name: string;
        let symbol: string;
        let totalSupply: number;

        try {
          name = await erc20Contract.methods.name().call();
          symbol = await erc20Contract.methods.symbol().call();
          totalSupply = await erc20Contract.methods.totalSupply().call();
        } catch (e) {
          throw Error(
            `Failed to get erc20 token properties for token ${payload.tokenAddress}`,
          );
        }

        await models.Token.create({
          token_address: payload.tokenAddress,
          namespace,
          name,
          symbol,
          initial_supply: totalSupply,
          chain_node_id: payload.eventSource.chainNodeId,
          is_locked: false,
        });
      },
    },
  };
}
