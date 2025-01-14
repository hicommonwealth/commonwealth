import { InvalidState, ServerError, type Command } from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  getErc20TokenInfo,
  getLaunchpadTokenCreatedTransaction,
  launchpadFactoryAbi,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { TokenView } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export function LaunchBotToken(): Command<typeof schemas.LaunchToken> {
  return {
    ...schemas.LaunchToken,
    auth: [],
    body: async ({ payload }) => {
      const { name, symbol, totalSupply, chain_id, icon_url, description } =
        payload;

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id: chain_id },
        attributes: ['eth_chain_id', 'url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
        throw new ServerError('Contest bot private key not set!');

      const web3 = cp.createPrivateEvmClient({
        rpc: chainNode.private_url!,
        privateKey: config.WEB3.CONTEST_BOT_PRIVATE_KEY,
      });
      const launchpadContract = new web3.eth.Contract(
        launchpadFactoryAbi,
        cp.factoryContracts[chain_id as cp.ValidChains.SepoliaBase].launchpad,
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
        cp.factoryContracts[chain_id as cp.ValidChains.SepoliaBase]
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

      return token!.toJSON() as unknown as z.infer<typeof TokenView>;
    },
  };
}
