import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist, mustNotExist } from '../middleware/guards';
import { GetBalancesOptions, tokenBalanceCache } from '../services';
import { buildFarcasterContentUrl, emitEvent } from '../utils';

const log = logger(import.meta);

// This webhook processes the cast action event
export function FarcasterUpvoteAction(): Command<
  typeof schemas.FarcasterUpvoteAction
> {
  return {
    ...schemas.FarcasterUpvoteAction,
    auth: [],
    body: async ({ payload }) => {
      const verified_address =
        payload.interactor.verified_addresses?.eth_addresses.at(0);

      if (!verified_address) {
        log.warn(
          'Farcaster verified address not found for upvote action- upvote will be ignored.',
        );
        return;
      }
      const { parent_hash, hash } = payload.cast;
      const content_url = buildFarcasterContentUrl(parent_hash!, hash);

      // find content from farcaster hash
      const addAction = await models.ContestAction.findOne({
        where: {
          action: 'added',
          content_url,
        },
        include: [
          {
            model: models.ContestManager,
            required: true,
            include: [
              {
                model: models.Community,
                required: true,
                include: [
                  {
                    model: models.ChainNode,
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      });
      mustExist(`Contest Action (${content_url})`, addAction);

      // ensure that the fid did not vote on this content before
      const voteAction = await models.ContestAction.findOne({
        where: {
          action: 'upvoted',
          content_url,
          fid: payload.interactor.fid,
        },
      });
      mustNotExist(
        `Contest Action fid=(${payload.interactor.fid})`,
        voteAction,
      );

      const evmChainId =
        addAction.ContestManager?.Community?.ChainNode?.eth_chain_id;
      mustExist('EVM Chain ID', evmChainId);

      const tokenAddress = addAction.ContestManager?.funding_token_address;
      mustExist('Funding Token Address', tokenAddress);

      const balanceOptions: GetBalancesOptions =
        tokenAddress == ZERO_ADDRESS
          ? {
              balanceSourceType: BalanceSourceType.ETHNative,
              addresses: [verified_address],
              sourceOptions: {
                evmChainId,
              },
              cacheRefresh: true,
            }
          : {
              balanceSourceType: BalanceSourceType.ERC20,
              addresses: [verified_address],
              sourceOptions: {
                evmChainId,
                contractAddress: tokenAddress,
              },
              cacheRefresh: true,
            };

      const balances = await tokenBalanceCache.getBalances(balanceOptions);
      const tokenBalance = balances[verified_address];

      if (BigInt(tokenBalance || 0) <= BigInt(0)) {
        return {
          type: 'message',
          message: `Insufficient balance of ${addAction.ContestManager!.ticker} token.`,
        };
      }

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: 'FarcasterVoteCreated',
            event_payload: {
              ...payload,
              contest_address: addAction.contest_address,
              verified_address,
            },
          },
        ],
        null,
      );

      return {
        type: 'message',
        message: 'Vote Added',
      };
    },
  };
}
