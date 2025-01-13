import { InvalidState, ServerError, type Command } from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  deployERC20Contest,
  getTokenAttributes,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { buildFarcasterContestFrameUrl } from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { TokenAttributes } from '../services';
import { parseBotCommand } from '../services/openai/parseBotCommand';

export function CreateContest(): Command<typeof schemas.CreateBotContest> {
  return {
    ...schemas.CreateBotContest,
    auth: [],
    body: async ({ payload }) => {
      const { prompt, chain_id } = payload;
      const contestMetadata = await parseBotCommand(prompt);

      const namespaceFactory =
        cp.factoryContracts[chain_id as cp.ValidChains].factory;
      const botNamespace = config.BOT.CONTEST_BOT_NAMESPACE;

      if (!botNamespace || botNamespace === '') {
        new InvalidState('bot not enabled on given chain');
      }

      const community = await models.Community.scope('withPrivateData').findOne(
        {
          where: {
            namespace: botNamespace as string,
          },
        },
      );

      mustExist('Community', community);

      let tokenMetadata: TokenAttributes;
      try {
        tokenMetadata = await getTokenAttributes(
          contestMetadata.tokenAddress,
          community!.ChainNode!.private_url!,
          false,
        );
      } catch {
        new InvalidState('invalid token address');
      }

      if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
        throw new ServerError('Contest bot private key not set!');

      const contestAddress = await deployERC20Contest({
        privateKey: config.WEB3.CONTEST_BOT_PRIVATE_KEY,
        namespaceName: botNamespace,
        contestInterval: 604800,
        winnerShares: contestMetadata.payoutStructure,
        voteToken: contestMetadata.tokenAddress,
        voterShare: contestMetadata.voterShare,
        exchangeToken: contestMetadata.tokenAddress,
        namespaceFactory,
        rpc: community!.ChainNode!.private_url!,
      });

      await models.sequelize.transaction(async (transaction) => {
        const manager = await models.ContestManager.create(
          {
            name: contestMetadata.contestName,
            community_id: community!.id,
            created_at: new Date(),
            cancelled: false,
            farcaster_frame_url: buildFarcasterContestFrameUrl(contestAddress),
            is_farcaster_contest: true,
            image_url: contestMetadata.image_url,
            interval: 604800,
            funding_token_address: contestMetadata.tokenAddress,
            payout_structure: contestMetadata.payoutStructure,
            ticker: tokenMetadata.ticker,
            decimals: tokenMetadata.decimals,
            contest_address: contestAddress,
          },
          { transaction },
        );
        return manager;
      });
      return contestAddress;
    },
  };
}
