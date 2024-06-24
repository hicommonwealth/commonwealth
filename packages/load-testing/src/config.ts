import { configure } from '@hicommonwealth/core';
import z from 'zod';

const { SERVER_URL } = __ENV;

export const config = configure(
  {},
  {
    SERVER_URL,
  },
  z.object({
    SERVER_URL: z.string(),
  }),
);
