import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const {
  KNOCK_AUTH_TOKEN,
  KNOCK_SECRET_KEY,
  KNOCK_SIGNING_KEY,
  MIXPANEL_PROD_TOKEN,
  MIXPANEL_DEV_TOKEN,
  DISABLE_CACHE,
  CLOUDAMQP_URL,
  REDIS_URL, // local + staging
  REDIS_TLS_URL, // staging + production
  KNOCK_INTEGRATION_ENABLED,
} = process.env;

export const config = configure(
  target,
  {
    CACHE: {
      // if a tls redis url is provided then that takes priority over everything else
      // then if a normal non-tls url is provided that is the second best option (local/staging)
      REDIS_URL: REDIS_TLS_URL ?? REDIS_URL,
      DISABLE_CACHE: DISABLE_CACHE === 'true',
    },
    BROKER: {
      RABBITMQ_URI:
        target.NODE_ENV === 'development' || !CLOUDAMQP_URL
          ? 'amqp://127.0.0.1'
          : CLOUDAMQP_URL,
    },
    NOTIFICATIONS: {
      KNOCK_AUTH_TOKEN: KNOCK_AUTH_TOKEN,
      KNOCK_SECRET_KEY: KNOCK_SECRET_KEY,
      KNOCK_SIGNING_KEY: KNOCK_SIGNING_KEY,
      KNOCK_INTEGRATION_ENABLED: KNOCK_INTEGRATION_ENABLED === 'true',
    },
    ANALYTICS: {
      MIXPANEL_PROD_TOKEN,
      MIXPANEL_DEV_TOKEN,
    },
  },
  z.object({
    CACHE: z.object({
      REDIS_URL: z.string().optional(),
      DISABLE_CACHE: z.boolean(),
    }),
    BROKER: z.object({
      RABBITMQ_URI: z.string(),
    }),
    NOTIFICATIONS: z.object({
      KNOCK_AUTH_TOKEN: z.string().optional(),
      KNOCK_SECRET_KEY: z.string().optional(),
      KNOCK_SIGNING_KEY: z.string().optional(),
      KNOCK_INTEGRATION_ENABLED: z.boolean().optional().default(false),
    }),
    ANALYTICS: z.object({
      MIXPANEL_PROD_TOKEN: z.string().optional(),
      MIXPANEL_DEV_TOKEN: z.string().optional(),
    }),
  }),
);
