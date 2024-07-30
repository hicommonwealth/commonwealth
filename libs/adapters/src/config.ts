import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const DEFAULTS = {
  LOAD_TESTING_AUTH_TOKEN: 'testing',
  RABBITMQ_URI: 'amqp://127.0.0.1',
};

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
  KNOCK_APNS_CHANNEL_ID,
  KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY,
  KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG,
  LOAD_TESTING_AUTH_TOKEN,
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
      RABBITMQ_URI: CLOUDAMQP_URL ?? DEFAULTS.RABBITMQ_URI,
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
      KNOCK_APNS_CHANNEL_ID,
      KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY,
      KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG,
    },
    LOAD_TESTING: {
      AUTH_TOKEN: LOAD_TESTING_AUTH_TOKEN || DEFAULTS.LOAD_TESTING_AUTH_TOKEN,
    },
  },
  z.object({
    CACHE: z.object({
      REDIS_URL: z
        .string()
        .optional()
        .refine((data) => {
          return !(
            ['production', 'beta', 'demo', 'frick'].includes(target.APP_ENV) &&
            !data
          );
        }, 'REDIS_URL is required in production, beta (QA), demo, and frick Heroku apps'),
      DISABLE_CACHE: z.boolean(),
    }),
    BROKER: z.object({
      RABBITMQ_URI: z.string().refine((data) => {
        return !(
          ['production', 'beta', 'demo', 'frick'].includes(target.APP_ENV) &&
          data === DEFAULTS.RABBITMQ_URI
        );
      }, 'RABBITMQ_URI is require in production, beta (QA), demo, and frick Heroku apps'),
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
        KNOCK_APNS_CHANNEL_ID: z
          .string()
          .optional()
          .describe('The Apple channel identifier for Safari/iOS users.'),
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
              data.KNOCK_APNS_CHANNEL_ID &&
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
            'KNOCK_APNS_CHANNEL_ID',
            'KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY',
            'KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG',
          ],
        },
      ),
    ANALYTICS: z.object({
      MIXPANEL_PROD_TOKEN: z
        .string()
        .optional()
        .refine((data) => !(target.APP_ENV === 'production' && !data)),
      MIXPANEL_DEV_TOKEN: z.string().optional(),
    }),
    LOAD_TESTING: z
      .object({
        AUTH_TOKEN: z.string().optional(),
      })
      .refine(
        (data) => {
          if (
            !['local', 'CI', 'discobot', 'snapshot'].includes(target.APP_ENV)
          ) {
            return (
              !!LOAD_TESTING_AUTH_TOKEN &&
              data.AUTH_TOKEN !== DEFAULTS.LOAD_TESTING_AUTH_TOKEN
            );
          }
          return true;
        },
        {
          message:
            'LOAD_TESTING_AUTH_TOKEN must be set in all publicly accessible Common API instances.',
          path: ['AUTH_TOKEN'],
        },
      ),
  }),
);
