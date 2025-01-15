import { ServerError, type Command } from '@hicommonwealth/core';
import {
  MomBotCandidateManager,
  commonProtocol as cp,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function AddMomBotCandidate(): Command<
  typeof schemas.AddMomBotCandidate
> {
  return {
    ...schemas.AddMomBotCandidate,
    auth: [],
    body: async ({ payload }) => {
      const { token_address, candidate_address, chain_id } = payload;

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

      const candidateManager = new web3.eth.Contract(
        MomBotCandidateManager,
        cp.factoryContracts[
          chain_id as cp.ValidChains.SepoliaBase
        ].momBotCandiateManager,
      );

      const receipt = await candidateManager.methods
        .addCandidate(token_address, candidate_address)
        .send({ from: web3.eth.defaultAccount });

      return receipt;
    },
  };
}
