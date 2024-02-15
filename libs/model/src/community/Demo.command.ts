import { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';

const schema = z.object({
  numItems: z.coerce.number().int(),
});

export type Demo = z.infer<typeof schema>;

export const Demo: CommandMetadata<{ numItems: number }, typeof schema> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    return {
      numItems: payload.numItems,
    };
  },
};
