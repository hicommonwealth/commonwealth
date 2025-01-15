import { ServerError, type Command } from '@hicommonwealth/core';
import {
  MomBotLaunchpadAbi,
  commonProtocol as cp,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  CREATE_TOKEN_TOPIC,
  decodeParameters,
} from 'evm-protocols/src/common-protocol';
import { models } from '../database';

export function LaunchMomToken(): Command<typeof schemas.LaunchMomToken> {
  return {
    ...schemas.LaunchMomToken,
    auth: [],
    body: async ({ payload }) => {
      const { name, symbol, chain_id, icon_url, description } = payload;

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id: chain_id },
        attributes: ['eth_chain_id', 'url', 'private_url'],
      });

      if (!chainNode) {
        throw new ServerError('Chain Node not found');
      }

      if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
        throw new ServerError('Contest bot private key not set!');

      const web3 = cp.createPrivateEvmClient({
        rpc: chainNode.private_url!,
        privateKey: config.WEB3.CONTEST_BOT_PRIVATE_KEY,
      });
      const launchpadContract = new web3.eth.Contract(
        MomBotLaunchpadAbi,
        cp.factoryContracts[
          chain_id as cp.ValidChains.SepoliaBase
        ].momBotLaunchpad,
      );
      const receipt = await launchpadContract.methods
        .launchToken(name, symbol)
        .send({ from: web3.eth.defaultAccount });

      const eventLog = receipt.logs.find(
        (log) => log.topics![0] == CREATE_TOKEN_TOPIC,
      );
      if (!eventLog || !eventLog.data) throw new Error('No event data');

      const { 0: address } = decodeParameters({
        abiInput: ['address', 'uint256', 'uint256'],
        data: eventLog.data.toString(),
      });

      return address;
    },
  };
}
