import { InvalidInput, InvalidState, type Command } from '@hicommonwealth/core';

import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';
import { TopicAttributes } from '../models';
import { sanitizeQuillText } from '../utils';

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
      const { name, description, featured_in_sidebar, featured_in_new_post } =
        payload;

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
        group_ids: [],
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

      // new path: stake or ERC20
      if (payload.weighted_voting) {
        options = {
          ...options,
          weighted_voting: payload.weighted_voting,
          token_address: payload.token_address || undefined,
          token_symbol: payload.token_symbol || undefined,
          vote_weight_multiplier: payload.vote_weight_multiplier || undefined,
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
