import {
  ALL_COMMUNITIES,
  COMMUNITY_NAME_ERROR,
  COMMUNITY_NAME_REGEX,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { Community } from '../entities';
import { checkIconSize } from '../utils';

export const CreateBotContest = {
  input: z.object({
    prompt: z
      .string()
      .describe('The cast/post containing the prompt for contest creation'),
    chain_id: z.number().describe('The chain id to create contest for'),
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
