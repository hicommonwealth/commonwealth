import { configure, config as target } from '@hicommonwealth/core';

// TODO: bump version
import { z } from 'zod';

const { RAILWAY_TOKEN, RAILWAY_PROJECT_ID } = process.env;

export const config = configure(
  [target],
  {
    RAILWAY_TOKEN,
    RAILWAY_PROJECT_ID,
  },
  z.object({}),
);
