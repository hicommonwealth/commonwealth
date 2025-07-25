import {
  InvalidState,
  logger,
  ServerError,
  type Command,
} from '@hicommonwealth/core';
import {
  deployERC20Contest,
  getTokenAttributes,
  mustBeProtocolChainId,
  ValidChains,
} from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { buildFarcasterContestFrameUrl } from '@hicommonwealth/shared';
import { config } from '../../config';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import {
  ContestMetadataResponse,
  parseBotCommand,
  ParseBotCommandError,
} from '../../services/openai/parseBotCommand';
import type { TokenAttributes } from '../../services/tokenBalanceCache/types';
import { publishCast } from '../../utils/utils';

const log = logger(import.meta);

export function CreateBotContest(): Command<typeof schemas.CreateBotContest> {
  return {
    ...schemas.CreateBotContest,
    auth: [],
    body: async ({ payload }) => {
      const { prompt } = payload;
      let contestMetadata: ContestMetadataResponse | null = null;
      try {
        contestMetadata = await parseBotCommand(prompt);
      } catch (err) {
        log.warn(`failed to parse bot command: ${(err as Error).message}`);
        if (payload.castHash) {
          const prettyError =
            err instanceof ParseBotCommandError
              ? err.getPrettyError()
              : 'Failed to create contest. Please check your prompt and try again.';
          await publishCast(
            payload.castHash,
            ({ username }) => `Hey @${username}. ${prettyError}`,
          );
        }
        return '';
      }
      mustExist('Parsed Contest Metadata', contestMetadata);

      const botNamespace = config.BOT.CONTEST_BOT_NAMESPACE;

      if (!botNamespace || botNamespace === '') {
        throw new InvalidState('bot not enabled on given chain');
      }

      const community = await models.Community.findOne({
        where: {
          namespace: botNamespace as string,
        },
        include: [
          {
            model: models.ChainNode.scope('withPrivateData'),
            required: true,
          },
        ],
      });

      mustExist('Community', community);

      let tokenMetadata: TokenAttributes;
      try {
        tokenMetadata = await getTokenAttributes(
          contestMetadata.tokenAddress,
          community!.ChainNode!.private_url!,
          false,
        );
      } catch (err) {
        if (payload.castHash) {
          await publishCast(
            payload.castHash,
            ({ username }) =>
              // eslint-disable-next-line max-len
              `Hey @${username}. Failed to create contest. Unable to fetch the correct token. Check the address of the token and try again.`,
          );
        }
        log.warn(`token validation failed: ${(err as Error).message}`);
        return '';
      }

      mustBeProtocolChainId(community.ChainNode!.eth_chain_id!);

      // use short duration for testnet contests
      const contestDurationSecs =
        community.ChainNode!.eth_chain_id === ValidChains.SepoliaBase
          ? 60 * 60
          : 60 * 60 * 24 * 7;

      if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
        throw new ServerError('Contest bot private key not set!');

      let contestAddress: string;
      try {
        contestAddress = await deployERC20Contest({
          chain: {
            rpc: community!.ChainNode!.private_url!,
            eth_chain_id: community.ChainNode!.eth_chain_id,
          },
          privateKey: config.WEB3.CONTEST_BOT_PRIVATE_KEY,
          namespaceName: botNamespace!,
          contestInterval: contestDurationSecs,
          winnerShares: contestMetadata.payoutStructure,
          voteToken: contestMetadata.tokenAddress,
          voterShare: contestMetadata.voterShare,
          exchangeToken: contestMetadata.tokenAddress,
        });
      } catch (e) {
        e instanceof Error
          ? log.error('Failed to deploy ERC20 contest', e)
          : log.error(`Failed to deploy ERC20 contest: ${e}`);

        throw new InvalidState('Failed to deploy ERC20 Contest');
      }

      mustExist('Deployed Contest', contestAddress);

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
            environment: config.APP_ENV,
            farcaster_author_cast_hash: payload.castHash,
          },
          { transaction },
        );
        return manager;
      });
      return contestAddress;
    },
  };
}
