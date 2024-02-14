import { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { isCommunityAdmin } from '../middleware';
import { CommunityAttributes } from '../models';

const schema = z.object({});

export const CreateGroup: CommandMetadata<CommunityAttributes, typeof schema> =
  {
    schema,
    auth: [isCommunityAdmin],
    body: async ({ payload }) => {
      return payload;
    },
  };
