import { z } from 'zod';
import { Topic } from '../entities/topic.schemas';

export const CreateTopic = {
  input: Topic.pick({
    name: true,
    description: true,
    featured_in_sidebar: true,
    featured_in_new_post: true,
    default_offchain_template: true,
    weighted_voting: true,
    chain_node_id: true,
    token_address: true,
    token_symbol: true,
    vote_weight_multiplier: true,
  }),
  output: z.object({
    topic: Topic.partial(),
    user_id: z.number(),
  }),
};

export const UpdateTopic = {
  input: Topic.pick({
    name: true,
    description: true,
    group_ids: true,
    telegram: true,
    featured_in_sidebar: true,
    featured_in_new_post: true,
    default_offchain_template: true,
  }),
  output: z.object({
    topic: Topic.partial(),
    user_id: z.number(),
  }),
};
