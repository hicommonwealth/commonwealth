import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const {
  MIXPANEL_PROD_TOKEN,
  MIXPANEL_DEV_TOKEN,
  DISABLE_CACHE,
  CLOUDAMQP_URL,
  REDIS_URL, // local + staging
  REDIS_TLS_URL, // staging + production
  KNOCK_AUTH_TOKEN,
  KNOCK_SECRET_KEY,
  KNOCK_SIGNING_KEY,
  KNOCK_IN_APP_FEED_ID,
  KNOCK_PUBLIC_API_KEY,
  FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED,
  KNOCK_FCM_CHANNEL_ID,
  KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY,
  KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG,
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
      FLAG_KNOCK_INTEGRATION_ENABLED:
        process.env.FLAG_KNOCK_INTEGRATION_ENABLED === 'true',
      KNOCK_AUTH_TOKEN,
      KNOCK_SECRET_KEY,
      KNOCK_SIGNING_KEY,
      KNOCK_IN_APP_FEED_ID,
      KNOCK_PUBLIC_API_KEY,
    },
    ANALYTICS: {
      MIXPANEL_PROD_TOKEN,
      MIXPANEL_DEV_TOKEN,
    },
    PUSH_NOTIFICATIONS: {
      FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED:
        FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED === 'true',
      KNOCK_FCM_CHANNEL_ID,
      KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY,
      KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG,
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
    NOTIFICATIONS: z
      .object({
        KNOCK_AUTH_TOKEN: z
          .string()
          .optional()
          .describe(
            'A secret token used by the Knock fetch step to interact with private routes on Common',
          ),
        KNOCK_SECRET_KEY: z
          .string()
          .optional()
          .describe(
            'The secret API key used to interact with the Knock API from the platform side',
          ),
        KNOCK_SIGNING_KEY: z
          .string()
          .optional()
          .describe(
            'The key used by the platform to generate Knock JWTs. Required when Knock is in Enhanced Security mode',
          ),
        KNOCK_PUBLIC_API_KEY: z
          .string()
          .optional()
          .describe(
            'The public API key used on the client to interact with public Knock API',
          ),
        KNOCK_IN_APP_FEED_ID: z
          .string()
          .optional()
          .describe('The channel ID of the in-app integration on Knock'),
        FLAG_KNOCK_INTEGRATION_ENABLED: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'A flag indicating whether the Knock integration is enabled or disabled',
          ),
      })
      .refine(
        (data) => {
          if (data.FLAG_KNOCK_INTEGRATION_ENABLED) {
            return (
              data.KNOCK_AUTH_TOKEN &&
              data.KNOCK_SECRET_KEY &&
              data.KNOCK_SIGNING_KEY &&
              data.KNOCK_IN_APP_FEED_ID &&
              data.KNOCK_PUBLIC_API_KEY
            );
          }
          return true;
        },
        {
          message:
            'KNOCK_AUTH_TOKEN, KNOCK_SECRET_KEY, KNOCK_PUBLIC_API_KEY, KNOCK_IN_APP_FEED_ID, and KNOCK_SIGNING_KEY ' +
            'are required when FLAG_KNOCK_INTEGRATION_ENABLED is true',
          path: [
            'KNOCK_AUTH_TOKEN',
            'KNOCK_SECRET_KEY',
            'KNOCK_SIGNING_KEY',
            'KNOCK_PUBLIC_API_KEY',
            'KNOCK_IN_APP_FEED_ID',
          ],
        },
      ),
    PUSH_NOTIFICATIONS: z
      .object({
        FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'A flag indicating whether the Knock push notifications is enabled or disabled',
          ),
        KNOCK_FCM_CHANNEL_ID: z
          .string()
          .optional()
          .describe(
            'The Firebase Cloud Messaging (FCM) channel identifier for sending to Android users.',
          ),
        KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY: z
          .string()
          .optional()
          .describe('The Firebase VAPID key.'),
        KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG: z
          .string()
          .refine(
            (data) => {
              try {
                JSON.parse(data);
                return true;
              } catch {
                return false;
              }
            },
            {
              message: 'Invalid JSON string',
            },
          )
          .optional()
          .describe('The public firebase config for FCM'),
      })
      .refine(
        (data) => {
          if (data.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED) {
            return (
              data.KNOCK_FCM_CHANNEL_ID &&
              data.KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY &&
              data.KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG
            );
          }
          return true;
        },
        {
          message:
            'FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED requires additional properties.  See paths.',
          path: [
            'KNOCK_FCM_CHANNEL_ID',
            'KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY',
            'KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG',
          ],
        },
      ),
    ANALYTICS: z.object({
      MIXPANEL_PROD_TOKEN: z.string().optional(),
      MIXPANEL_DEV_TOKEN: z.string().optional(),
    }),
  }),
);
