import { configure, logger, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

const log = logger(import.meta);

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
  SEND_WEBHOOKS,
  SEND_WEBHOOKS_CONFIRMATION_TIMESTAMP,
  SEND_EMAILS,
  DISABLE_LOCAL_QUEUE_PURGE,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ACCOUNT_ID,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
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
      DISABLE_LOCAL_QUEUE_PURGE: DISABLE_LOCAL_QUEUE_PURGE === 'true',
    },
    NOTIFICATIONS: {
      FLAG_KNOCK_INTEGRATION_ENABLED:
        process.env.FLAG_KNOCK_INTEGRATION_ENABLED === 'true',
      KNOCK_AUTH_TOKEN,
      KNOCK_SECRET_KEY,
      KNOCK_SIGNING_KEY,
      KNOCK_IN_APP_FEED_ID,
      KNOCK_PUBLIC_API_KEY,
      WEBHOOKS: {
        SEND: SEND_WEBHOOKS === 'true',
        CONFIRMATION_TIMESTAMP: parseInt(
          SEND_WEBHOOKS_CONFIRMATION_TIMESTAMP ?? '0',
        ),
      },
      SEND_EMAILS: SEND_EMAILS === 'true',
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
    CLOUDFLARE: {
      R2: {
        ACCOUNT_ID: R2_ACCOUNT_ID,
        ACCESS_KEY_ID: R2_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: R2_SECRET_ACCESS_KEY,
      },
    },
    STORAGE: {
      USE_S3: true,
      AWS_REGION: AWS_REGION,
      AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY,
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
      DISABLE_LOCAL_QUEUE_PURGE: z
        .boolean()
        .describe(
          'Disable purging all messages in queues when a consumer starts up',
        ),
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
        SEND_EMAILS: z.boolean(),
        WEBHOOKS: z
          .object({
            SEND: z
              .boolean()
              .describe(
                'Boolean indicating whether webhook workflows should be triggered',
              ),
            CONFIRMATION_TIMESTAMP: z.number().optional(),
          })
          .refine((data) => {
            if (target.APP_ENV === 'production') return data.SEND;
            if (!data.SEND) return true;

            // This logic ensures that SEND_WEBHOOKS is always reverted to false in non-production environments.
            // SEND_WEBHOOKS may be temporarily required for testing locally but it should always be reverted to
            // ensure webhooks are not accidentally sent to real/non-test endpoints.
            if (!data.CONFIRMATION_TIMESTAMP) {
              log.error(
                'If SEND_WEBHOOKS=true in non-production environment, ' +
                  'it must be accompanied by SEND_WEBHOOKS_CONFIRMATION_TIMESTAMP.',
              );
              return false;
            }
            const now = new Date();
            const timestamp = new Date(data.CONFIRMATION_TIMESTAMP);
            if (now.getTime() < timestamp.getTime()) {
              log.error(
                'SEND_WEBHOOK_CONFIRMATION_TIMESTAMP is incorrectly set to some time in the future',
              );
              return false;
            }
            // if confirmation is more than 3 hours old reject
            if (now.getTime() > timestamp.getTime() + 1_000 * 60 * 60 * 3) {
              log.error('SEND_WEBHOOK_CONFIRMATION_TIMESTAMP has expired');
              return false;
            }

            return true;
          }),
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
          if (!['local', 'CI'].includes(target.APP_ENV)) {
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
    CLOUDFLARE: z.object({
      R2: z
        .object({
          ACCOUNT_ID: z.string().optional(),
          ACCESS_KEY_ID: z.string().optional(),
          SECRET_ACCESS_KEY: z.string().optional(),
        })
        .refine((data) => {
          if (target.APP_ENV === 'CI' || target.NODE_ENV === 'test')
            return true;
          else
            return (
              data.ACCOUNT_ID && data.ACCESS_KEY_ID && data.SECRET_ACCESS_KEY
            );
        }),
    }),
    STORAGE: z.object({
      USE_S3: z.boolean(),
      AWS_REGION: z.string().refine((data) => {
        if (target.APP_ENV === 'CI' || target.NODE_ENV === 'test') return true;
        return !!data;
      }, 'AWS_REGION is required in non-test environments'),
      AWS_ACCESS_KEY_ID: z.string().refine((data) => {
        if (target.APP_ENV === 'CI' || target.NODE_ENV === 'test') return true;
        return !!data;
      }, 'AWS_ACCESS_KEY_ID is required in non-test environments'),
      AWS_SECRET_ACCESS_KEY: z.string().refine((data) => {
        if (target.APP_ENV === 'CI' || target.NODE_ENV === 'test') return true;
        return !!data;
      }, 'AWS_SECRET_ACCESS_KEY is required in non-test environments'),
    }),
  }),
);
