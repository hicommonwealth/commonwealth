import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const {
  TEST_DB_NAME,
  DATABASE_URL,
  DATABASE_CLEAN_HOUR,
  NO_SSL,
  PRIVATE_KEY,
  TBC_BALANCE_TTL_SECONDS,
  ALLOWED_EVENTS,
  SENDGRID_API_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_TOKEN_DEV,
} = process.env;

const NAME =
  target.NODE_ENV === 'test' ? TEST_DB_NAME || 'common_test' : 'commonwealth';

export const config = configure(
  target,
  {
    DB: {
      URI:
        target.NODE_ENV === 'production'
          ? DATABASE_URL!
          : `postgresql://commonwealth:edgeware@localhost/${NAME}`,
      NAME,
      NO_SSL: NO_SSL === 'true',
      CLEAN_HOUR: DATABASE_CLEAN_HOUR
        ? parseInt(DATABASE_CLEAN_HOUR, 10)
        : undefined,
    },
    WEB3: {
      PRIVATE_KEY: PRIVATE_KEY!,
    },
    TBC: {
      TTL_SECS: TBC_BALANCE_TTL_SECONDS
        ? parseInt(TBC_BALANCE_TTL_SECONDS, 10)
        : 300,
    },
    SENDGRID: {
      API_KEY: SENDGRID_API_KEY,
    },
    OUTBOX: {
      ALLOWED_EVENTS: ALLOWED_EVENTS ? ALLOWED_EVENTS.split(',') : [],
    },
    TELEGRAM: {
      BOT_TOKEN:
        target.NODE_ENV === 'production'
          ? TELEGRAM_BOT_TOKEN
          : TELEGRAM_BOT_TOKEN_DEV,
    },
  },
  z.object({
    DB: z.object({
      URI: z.string(),
      NAME: z.string(),
      NO_SSL: z.boolean(),
      CLEAN_HOUR: z.coerce.number().int().min(0).max(24).optional(),
    }),
    WEB3: z.object({
      PRIVATE_KEY: z.string(),
    }),
    TBC: z.object({
      TTL_SECS: z.number().int(),
    }),
    SENDGRID: z.object({
      API_KEY: z.string().optional(),
    }),
    OUTBOX: z.object({
      ALLOWED_EVENTS: z.array(z.string()),
    }),
    TELEGRAM: z.object({
      BOT_TOKEN: z.string().optional(),
    }),
  }),
);
