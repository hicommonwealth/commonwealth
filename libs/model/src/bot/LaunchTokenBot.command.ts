import {
  AppError,
  InvalidState,
  ServerError,
  command,
  type Command,
} from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  getErc20TokenInfo,
  getLaunchpadTokenCreatedTransaction,
  launchpadFactoryAbi,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import _ from 'lodash';
import { z } from 'zod';
import { CreateCommunity } from '../community';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export function LaunchTokenBot(): Command<typeof schemas.LaunchToken> {
  return {
    ...schemas.LaunchToken,
    auth: [],
    body: async ({ payload, actor }) => {
      const { name, symbol, totalSupply, eth_chain_id, icon_url, description } =
        payload;

      if (!cp.isValidChain(eth_chain_id)) {
        throw new AppError('eth_chain_id is not supported');
      }

      if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
        throw new ServerError('Contest bot private key not set!');

      const communityId = _.kebabCase(name.toLowerCase());
      const existingCommunity = await models.Community.findOne({
        where: { id: communityId },
      });

      if (existingCommunity) {
        throw new AppError('Token already exists, choose another name');
      }

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
        attributes: ['id', 'eth_chain_id', 'url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      const web3 = cp.createPrivateEvmClient({
        rpc: chainNode.private_url!,
        privateKey: config.WEB3.CONTEST_BOT_PRIVATE_KEY,
      });
      const launchpadContract = new web3.eth.Contract(
        launchpadFactoryAbi,
        cp.factoryContracts[
          eth_chain_id as cp.ValidChains.SepoliaBase
        ].launchpad,
      );
      const receipt = await cp.launchToken(
        launchpadContract,
        name,
        symbol,
        [],
        [],
        web3.utils.toWei(totalSupply.toString(), 'ether') as string,
        web3.eth.defaultAccount as string,
        830000,
        cp.factoryContracts[eth_chain_id as cp.ValidChains.SepoliaBase]
          .tokenCommunityManager,
      );

      const tokenData = await getLaunchpadTokenCreatedTransaction({
        rpc: chainNode.private_url! || chainNode.url!,
        transactionHash: receipt.transactionHash,
      });

      if (!tokenData) {
        throw new InvalidState('Transaction not found');
      }

      let tokenInfo: { name: string; symbol: string; totalSupply: bigint };
      try {
        tokenInfo = await getErc20TokenInfo({
          rpc: chainNode.private_url || chainNode.url,
          tokenAddress: tokenData.parsedArgs.tokenAddress,
        });
      } catch (e) {
        throw new Error(
          `Failed to get erc20 token properties for token ${tokenData.parsedArgs.tokenAddress}`,
        );
      }

      const [token] = await models.LaunchpadToken.findOrCreate({
        where: {
          token_address: tokenData.parsedArgs.tokenAddress.toLowerCase(),
          namespace: tokenData.parsedArgs.namespace,
        },
        defaults: {
          token_address: tokenData.parsedArgs.tokenAddress.toLowerCase(),
          namespace: tokenData.parsedArgs.namespace,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          initial_supply: Number(tokenInfo.totalSupply / BigInt(1e18)),
          liquidity_transferred: false,
          launchpad_liquidity: tokenData.parsedArgs.launchpadLiquidity,
          eth_market_cap_target: cp.getTargetMarketCap(),
          description: description ?? null,
          icon_url: icon_url ?? null,
        },
      });

      // Create corresponding community for token
      await command(CreateCommunity(), {
        actor,
        payload: {
          id: communityId,
          name,
          default_symbol: symbol,
          icon_url,
          description,
          base: ChainBase.Ethereum,
          token_name: name,
          chain_node_id: chainNode!.id!,
          type: ChainType.Offchain,
          social_links: [],
          directory_page_enabled: false,
          tags: [],
        },
      });

      await models.Community.update(
        { namespace: name },
        { where: { id: communityId } },
      );

      const response = {
        community_url: `${config.SERVER_URL}/${communityId}`,
        ...token!.toJSON(),
      };
      return response as unknown as z.infer<typeof TokenView> & {
        community_url: string;
      };
    },
  };
}
