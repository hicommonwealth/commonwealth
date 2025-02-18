import {
  ALL_COMMUNITIES,
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { Community } from '../entities';
import { TokenView } from '../queries';
import { checkIconSize } from '../utils';

export const CreateBotContest = {
  input: z.object({
    castHash: z.string().optional(),
    prompt: z
      .string()
      .describe('The cast text containing the prompt for contest creation'),
  }),
  output: z.string().describe('New contest address'),
};

export const CreateBotNamespace = {
  input: z.object({
    name: z
      .string()
      .max(255)
      .regex(COMMUNITY_NAME_REGEX, {
        message: COMMUNITY_NAME_ERROR,
      })
      .refine((data) => !data.includes(ALL_COMMUNITIES), {
        message: `String must not contain '${ALL_COMMUNITIES}'`,
      }),
    description: z.string().optional(),
    icon_url: z
      .string()
      .url()
      .superRefine(async (val, ctx) => await checkIconSize(val, ctx))
      .optional(),
    admin_address: z.string(),
    chain_id: z.number().describe('The chain id to create contest for'),
  }),
  output: z.object({
    community: Community,
    namespaceAddress: z.string().optional(),
  }),
};

export const LaunchToken = {
  input: z.object({
    name: z.string().describe('The name of the token'),
    symbol: z.string().describe('The symbol of the token'),
    totalSupply: z.number().describe('The total supply of the token'),
    eth_chain_id: z.number().describe('The chain id to create token for'),
    icon_url: z.string().optional().describe('The icon url of the token'),
    description: z.string().optional().describe('The description of the token'),
  }),
  output: TokenView.extend({
    community_url: z.string(),
  }),
};
