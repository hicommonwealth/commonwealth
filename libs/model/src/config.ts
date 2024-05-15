import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const {
  TEST_DB_NAME,
  DATABASE_URL,
  NO_SSL,
  PRIVATE_KEY,
  TBC_BALANCE_TTL_SECONDS,
  ALLOWED_EVENTS,
} = process.env;

const name =
  target.env === 'test' ? TEST_DB_NAME || 'common_test' : 'commonwealth';

export const config = configure(
  target,
  {
    db: {
      uri:
        target.env === 'production'
          ? DATABASE_URL!
          : `postgresql://commonwealth:edgeware@localhost/${name}`,
      name,
      noSsl: NO_SSL === 'true',
    },
    web3: {
      privateKey: PRIVATE_KEY!,
    },
    tbc: {
      ttlSecs: TBC_BALANCE_TTL_SECONDS
        ? parseInt(TBC_BALANCE_TTL_SECONDS, 10)
        : 300,
    },
    outbox: {
      allowedEvents: ALLOWED_EVENTS ? ALLOWED_EVENTS.split(',') : [],
    },
  },
  z.object({
    db: z.object({
      uri: z.string(),
      name: z.string(),
      noSsl: z.boolean(),
    }),
    web3: z.object({
      privateKey: z.string(),
    }),
    tbc: z.object({
      ttlSecs: z.number().int(),
    }),
    outbox: z.object({
      allowedEvents: z.array(z.string()),
    }),
  }),
);
