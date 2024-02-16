import { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { isCommunityAdminOrModerator } from '../middleware';
import { CommunityAttributes } from '../models';
import { Requirement } from './Requirements.schema';

const schema = z.object({
  metadata: z.object({
    name: z.string(),
    description: z.string(),
    required_requirements: z.number().optional(),
    membership_ttl: z.number().optional(),
  }),
  requirements: z.array(Requirement),
  topics: z.array(z.number()).optional(),
});

export const MAX_GROUPS_PER_COMMUNITY = 20;

export const CreateGroup: CommandMetadata<CommunityAttributes, typeof schema> =
  {
    schema,
    auth: [isCommunityAdminOrModerator],
    body: async ({ payload }) => {
      return payload;
    },
  };
