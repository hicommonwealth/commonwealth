import { InvalidInput, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { TopicAttributes } from '../../models';
import { sanitizeQuillText } from '../../utils';

/**
 * Extracts token symbol from a Sui contract address
 * Handles both simple and complex formats:
 * Simple: "0x123::mock_navx_token::MOCK_NAVX_TOKEN"
 * Complex: "0x123::vault::VoteEscrowedToken<0x456::mock_navx_token::MOCK_NAVX_TOKEN>"
 */
export function extractTokenSymbolFromAddress(
  tokenAddress: string,
): string | undefined {
  if (!tokenAddress) return undefined;

  // Try complex format with angle brackets first
  const angleMatch = tokenAddress.match(/<[^>]*::([^:>]+)>/);
  if (angleMatch) {
    return angleMatch[1];
  }

  // Try simple format (last segment after final ::)
  // Only match if there are at least 2 :: separators (3 segments total)
  const simpleMatch = tokenAddress.match(/^[^:]+::[^:]+::([^:]+)$/);
  if (simpleMatch) {
    return simpleMatch[1];
  }

  return undefined;
}

const Errors = {
  DefaultTemplateRequired: 'Default Template required',
  StakeNotAllowed:
    'Cannot create a staked topic if community has not enabled stake',
};

export function CreateTopic(): Command<typeof schemas.CreateTopic> {
  return {
    ...schemas.CreateTopic,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const { community_id } = payload;
      const {
        name,
        description,
        featured_in_sidebar,
        featured_in_new_post,
        allow_tokenized_threads,
      } = payload;

      let default_offchain_template = payload.default_offchain_template?.trim();
      if (featured_in_new_post && !default_offchain_template) {
        throw new InvalidInput(Errors.DefaultTemplateRequired);
      }
      default_offchain_template = sanitizeQuillText(
        default_offchain_template!,
        true,
      );

      let options: TopicAttributes = {
        name,
        description,
        featured_in_sidebar,
        featured_in_new_post,
        default_offchain_template,
        community_id: community_id!,
        allow_tokenized_threads: allow_tokenized_threads ?? false,
      };

      const stake = await models.CommunityStake.findOne({
        where: {
          community_id: community_id!,
        },
      });
      if (
        !stake &&
        payload.weighted_voting === schemas.TopicWeightedVoting.Stake
      ) {
        throw new InvalidState(Errors.StakeNotAllowed);
      }

      if (payload.weighted_voting) {
        let tokenSymbol = payload.token_symbol;

        // For Sui coin type token or NFT, extract token symbol from contract address
        if (
          [
            schemas.TopicWeightedVoting.SuiToken,
            schemas.TopicWeightedVoting.SuiNFT,
          ].includes(payload.weighted_voting) &&
          payload.token_address
        ) {
          tokenSymbol = extractTokenSymbolFromAddress(payload.token_address);
        }

        // For Sui native, use 9 decimals
        const tokenDecimals =
          payload.weighted_voting === schemas.TopicWeightedVoting.SuiNative
            ? 9
            : payload.token_decimals;

        options = {
          ...options,
          weighted_voting: payload.weighted_voting,
          token_address: payload.token_address || undefined,
          token_symbol: tokenSymbol || undefined,
          token_decimals: tokenDecimals || undefined,
          vote_weight_multiplier: payload.vote_weight_multiplier || undefined,
          chain_node_id: payload.chain_node_id || undefined,
        };
      }

      const [newTopic] = await models.Topic.findOrCreate({
        where: {
          name: name!,
          community_id: community_id!,
        },
        defaults: options,
      });

      return {
        topic: newTopic.toJSON(),
        user_id: actor.user.id!,
      };
    },
  };
}
