import { InvalidInput, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { TopicAttributes } from '../../models';
import { sanitizeQuillText } from '../../utils';

/**
 * Extracts token symbol from a Sui contract address
 * Contract addresses are in format: package_id::module_name::SYMBOL
 * This function returns the 3rd segment (SYMBOL)
 */
function extractTokenSymbolFromAddress(
  tokenAddress: string,
): string | undefined {
  if (!tokenAddress) return undefined;

  const segments = tokenAddress.split('::');
  if (segments.length >= 3) {
    return segments[2];
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

        // For Sui-based voting (SuiNative and SuiToken), extract token symbol from contract address
        if (
          (payload.weighted_voting === schemas.TopicWeightedVoting.SuiNative ||
            payload.weighted_voting === schemas.TopicWeightedVoting.SuiToken) &&
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
