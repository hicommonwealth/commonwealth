import { InvalidState, type Command } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { buildFarcasterContestFrameUrl } from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { TokenAttributes } from '../services';
import { contractHelpers } from '../services/commonProtocol';
import { deployERC20Contest } from '../services/commonProtocol/contestHelper';
import { parseBotCommand } from '../services/openai/parseBotCommand';

export function CreateBotContest(): Command<typeof schemas.CreateBotContest> {
  return {
    ...schemas.CreateBotContest,
    auth: [],
    body: async ({ payload }) => {
      const { prompt } = payload;
      const contestMetadata = await parseBotCommand(prompt);

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
        tokenMetadata = await contractHelpers.getTokenAttributes(
          contestMetadata.tokenAddress,
          community!.ChainNode!.private_url!,
          false,
        );
      } catch {
        new InvalidState('invalid token address');
      }

      // use short duration for testnet contests
      const contestDurationSecs =
        community.ChainNode!.eth_chain_id === cp.ValidChains.SepoliaBase
          ? 60 * 60
          : 60 * 60 * 24 * 7;

      const namespaceFactory =
        cp.factoryContracts[
          community!.ChainNode!.eth_chain_id as cp.ValidChains
        ].factory;

      const contestAddress = await deployERC20Contest(
        botNamespace as string,
        contestDurationSecs,
        contestMetadata.payoutStructure,
        contestMetadata.tokenAddress,
        contestMetadata.voterShare,
        contestMetadata.tokenAddress,
        namespaceFactory,
        community!.ChainNode!.private_url!,
      );

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
            interval: contestDurationSecs,
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
