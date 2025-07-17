import {
  configure,
  DeployedEnvironments,
  LogLevel,
  LogLevels,
  ProdLikeEnvironments,
  ProductionEnvironments,
  requiredInEnvironmentServices,
  config as target,
  WebServices,
} from '@hicommonwealth/core';
import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';
import { z } from 'zod';

const {
  SENDGRID_API_KEY,
  DATABASE_URL,
  DATABASE_LOG_TRACE,
  DEFAULT_COMMONWEALTH_LOGO,
  DISCORD_CLIENT_ID,
  DISCORD_TOKEN,
  NO_SSL,
  PRIVATE_KEY,
  LAUNCHPAD_PRIVATE_KEY,
  LAUNCHPAD_CHAIN_ID,
  LAUNCHPAD_CONNECTOR_WEIGHT,
  LAUNCHPAD_INITIAL_PRICE,
  TBC_BALANCE_TTL_SECONDS,
  BLACKLISTED_EVENTS,
  MAX_USER_POSTS_PER_CONTEST,
  JWT_SECRET,
  ADDRESS_TOKEN_EXPIRES_IN,
  ALCHEMY_BASE_WEBHOOK_SIGNING_KEY,
  ALCHEMY_BASE_SEPOLIA_WEBHOOK_SIGNING_KEY,
  ALCHEMY_ETH_SEPOLIA_WEBHOOK_SIGNING_KEY,
  ALCHEMY_AA_PRIVATE_KEY,
  ALCHEMY_AA_KEY,
  ALCHEMY_AA_GAS_POLICY,
  FLAG_COMMON_WALLET,
  SITEMAP_THREAD_PRIORITY,
  SITEMAP_PROFILE_PRIORITY,
  PROVIDER_URL,
  ETH_RPC,
  COSMOS_REGISTRY_API,
  ALCHEMY_PRIVATE_APP_KEY,
  ALCHEMY_PUBLIC_APP_KEY,
  MEMBERSHIP_REFRESH_BATCH_SIZE,
  MEMBERSHIP_REFRESH_TTL_SECONDS,
  NEYNAR_BOT_UUID,
  NEYNAR_API_KEY,
  NEYNAR_CAST_CREATED_WEBHOOK_SECRET,
  NEYNAR_CAST_WEBHOOK_ID,
  FARCASTER_ACTION_URL,
  FARCASTER_MANIFEST_HEADER,
  FARCASTER_MANIFEST_PAYLOAD,
  FARCASTER_MANIFEST_SIGNATURE,
  FARCASTER_MANIFEST_DOMAIN,
  FARCASTER_NGROK_DOMAIN,
  DISABLE_CONTEST_ENDING_VOTE,
  OPENAI_API_KEY,
  OPENAI_ORGANIZATION,
  CONTEST_BOT_PRIVATE_KEY,
  CONTEST_BOT_NAMESPACE,
  TWITTER_LOG_LEVEL,
  TWITTER_APP_BEARER_TOKEN,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
  SKALE_PRIVATE_KEY,
  PRIVY_FLAG,
  PRIVY_APP_ID,
  PRIVY_APP_SECRET,
  FLAG_USE_RUNWARE,
  RUNWARE_API_KEY,
  CF_TURNSTILE_CREATE_COMMUNITY_SITE_KEY,
  CF_TURNSTILE_CREATE_COMMUNITY_SECRET_KEY,
  CF_TURNSTILE_CREATE_THREAD_SITE_KEY,
  CF_TURNSTILE_CREATE_THREAD_SECRET_KEY,
  CF_TURNSTILE_CREATE_COMMENT_SITE_KEY,
  CF_TURNSTILE_CREATE_COMMENT_SECRET_KEY,
  VIEW_COUNT_WEIGHT,
  COMMENT_WEIGHT,
  LIKE_WEIGHT,
  CREATED_DATE_WEIGHT,
  CREATOR_USER_TIER_WEIGHT,
  COMMUNITY_TIER_WEIGHT,
  DISABLE_TIER_RATE_LIMITS,
  TIER_SOCIAL_VERIFIED_MIN_ETH,
  MCP_DEMO_CLIENT_SERVER_URL,
  EVM_CHAINS_WHITELIST,
  MCP_KEY_BYPASS,
  LOG_XP_LAUNCHPAD,
  KNOCK_PUBLIC_API_KEY,
  KNOCK_IN_APP_FEED_ID,
  UNLEASH_FRONTEND_API_TOKEN,
  CONTEST_DURATION_IN_SEC,
} = process.env;

const NAME = target.NODE_ENV === 'test' ? 'common_test' : 'commonwealth';

const DEFAULTS = {
  JWT_SECRET: 'my secret',
  ADDRESS_TOKEN_EXPIRES_IN: '10',
  PRIVATE_KEY: '',
  DATABASE_URL: `postgresql://commonwealth:edgeware@localhost/${NAME}`,
  DEFAULT_COMMONWEALTH_LOGO: `https://s3.amazonaws.com/${S3_ASSET_BUCKET_CDN}/common-white.png`,
  MEMBERSHIP_REFRESH_BATCH_SIZE: '1000',
  MEMBERSHIP_REFRESH_TTL_SECONDS: '120',
  TWITTER_LOG_LEVEL: 'info' as const,
  TIER_SOCIAL_VERIFIED_MIN_ETH: '0.006',
  KNOCK_PUBLIC_API_KEY: 'pk_test_Hd4ZpzlVcz9bqepJQoo9BvZHokgEqvj4T79fPdKqpYM',
  KNOCK_IN_APP_FEED_ID: 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb',
};

export const config = configure(
  [target],
  {
    SENDGRID: {
      API_KEY: SENDGRID_API_KEY,
    },
    DB: {
      URI: DATABASE_URL ?? DEFAULTS.DATABASE_URL,
      NAME,
      NO_SSL: NO_SSL === 'true',
      TRACE: DATABASE_LOG_TRACE === 'true',
    },
    WEB3: {
      PRIVATE_KEY: PRIVATE_KEY || '',
      LAUNCHPAD_PRIVATE_KEY: LAUNCHPAD_PRIVATE_KEY || '',
      CONTEST_BOT_PRIVATE_KEY: CONTEST_BOT_PRIVATE_KEY || '',
      EVM_CHAINS_WHITELIST: EVM_CHAINS_WHITELIST || '',
      LAUNCHPAD_CHAIN_ID: LAUNCHPAD_CHAIN_ID
        ? parseInt(LAUNCHPAD_CHAIN_ID)
        : 8543,
      LAUNCHPAD_CONNECTOR_WEIGHT: LAUNCHPAD_CONNECTOR_WEIGHT
        ? parseInt(LAUNCHPAD_CONNECTOR_WEIGHT)
        : 830000,
      LAUNCHPAD_INITIAL_PRICE: LAUNCHPAD_INITIAL_PRICE
        ? parseInt(LAUNCHPAD_INITIAL_PRICE)
        : 416700000,
    },
    TBC: {
      TTL_SECS: TBC_BALANCE_TTL_SECONDS
        ? parseInt(TBC_BALANCE_TTL_SECONDS, 10)
        : 300,
    },
    OUTBOX: {
      BLACKLISTED_EVENTS: BLACKLISTED_EVENTS
        ? BLACKLISTED_EVENTS.split(',')
        : [],
    },
    CONTESTS: {
      MIN_USER_ETH: 0,
      MAX_USER_POSTS_PER_CONTEST: MAX_USER_POSTS_PER_CONTEST
        ? parseInt(MAX_USER_POSTS_PER_CONTEST, 10)
        : 5,
      FARCASTER_NGROK_DOMAIN,
      NEYNAR_API_KEY: NEYNAR_API_KEY,
      NEYNAR_BOT_UUID: NEYNAR_BOT_UUID,
      NEYNAR_CAST_CREATED_WEBHOOK_SECRET: NEYNAR_CAST_CREATED_WEBHOOK_SECRET,
      NEYNAR_CAST_WEBHOOK_ID: NEYNAR_CAST_WEBHOOK_ID,
      FARCASTER_ACTION_URL: FARCASTER_ACTION_URL,
      FARCASTER_MANIFEST_HEADER: FARCASTER_MANIFEST_HEADER,
      FARCASTER_MANIFEST_PAYLOAD: FARCASTER_MANIFEST_PAYLOAD,
      FARCASTER_MANIFEST_SIGNATURE: FARCASTER_MANIFEST_SIGNATURE,
      FARCASTER_MANIFEST_DOMAIN: FARCASTER_MANIFEST_DOMAIN,
      DISABLE_CONTEST_ENDING_VOTE: DISABLE_CONTEST_ENDING_VOTE === 'true',
      CONTEST_DURATION_IN_SEC: CONTEST_DURATION_IN_SEC
        ? parseInt(CONTEST_DURATION_IN_SEC, 10)
        : undefined,
    },
    AUTH: {
      JWT_SECRET: JWT_SECRET || DEFAULTS.JWT_SECRET,
      SESSION_EXPIRY_MILLIS: 30 * 24 * 60 * 60 * 1000,
      ADDRESS_TOKEN_EXPIRES_IN: parseInt(
        ADDRESS_TOKEN_EXPIRES_IN ?? DEFAULTS.ADDRESS_TOKEN_EXPIRES_IN,
        10,
      ),
    },
    ALCHEMY: {
      BASE_WEBHOOK_SIGNING_KEY: ALCHEMY_BASE_WEBHOOK_SIGNING_KEY,
      BASE_SEPOLIA_WEBHOOK_SIGNING_KEY:
        ALCHEMY_BASE_SEPOLIA_WEBHOOK_SIGNING_KEY,
      ETH_SEPOLIA_WEBHOOOK_SIGNING_KEY: ALCHEMY_ETH_SEPOLIA_WEBHOOK_SIGNING_KEY,
      AA: {
        FLAG_COMMON_WALLET: FLAG_COMMON_WALLET === 'true',
        ALCHEMY_KEY: ALCHEMY_AA_KEY,
        PRIVATE_KEY: ALCHEMY_AA_PRIVATE_KEY,
        GAS_POLICY: ALCHEMY_AA_GAS_POLICY,
      },
      APP_KEYS: {
        PRIVATE: ALCHEMY_PRIVATE_APP_KEY!,
        PUBLIC: ALCHEMY_PUBLIC_APP_KEY!,
      },
    },
    SITEMAP: {
      THREAD_PRIORITY: SITEMAP_THREAD_PRIORITY
        ? parseInt(SITEMAP_THREAD_PRIORITY)
        : 0.8,
      PROFILE_PRIORITY: SITEMAP_PROFILE_PRIORITY
        ? parseInt(SITEMAP_PROFILE_PRIORITY)
        : -1,
    },
    DEFAULT_COMMONWEALTH_LOGO:
      DEFAULT_COMMONWEALTH_LOGO ?? DEFAULTS.DEFAULT_COMMONWEALTH_LOGO,
    TEST_EVM: {
      ETH_RPC: ETH_RPC || 'prod',
      // URL of the local Ganache, Anvil, or Hardhat chain
      PROVIDER_URL: PROVIDER_URL ?? 'http://127.0.0.1:8545',
    },
    COSMOS: {
      COSMOS_REGISTRY_API:
        COSMOS_REGISTRY_API || 'https://cosmoschains.thesilverfox.pro',
    },
    MEMBERSHIP_REFRESH_BATCH_SIZE: parseInt(
      MEMBERSHIP_REFRESH_BATCH_SIZE ?? DEFAULTS.MEMBERSHIP_REFRESH_BATCH_SIZE,
      10,
    ),
    MEMBERSHIP_REFRESH_TTL_SECONDS: parseInt(
      MEMBERSHIP_REFRESH_TTL_SECONDS ?? DEFAULTS.MEMBERSHIP_REFRESH_TTL_SECONDS,
      10,
    ),
    DISCORD: {
      CLIENT_ID: DISCORD_CLIENT_ID || '1027997517964644453',
      BOT_TOKEN: DISCORD_TOKEN,
    },
    OPENAI: {
      API_KEY: OPENAI_API_KEY,
      ORGANIZATION: OPENAI_ORGANIZATION || 'org-D0ty00TJDApqHYlrn1gge2Ql',
      USE_OPENROUTER: process.env.USE_OPENROUTER || 'false',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    },
    BOT: {
      CONTEST_BOT_NAMESPACE: CONTEST_BOT_NAMESPACE || '',
    },
    TWITTER: {
      LOG_LEVEL: (TWITTER_LOG_LEVEL as LogLevel) || target.LOGGING.LOG_LEVEL,
      APP_BEARER_TOKEN: TWITTER_APP_BEARER_TOKEN,
      CONSUMER_KEY: TWITTER_CONSUMER_KEY,
      CONSUMER_SECRET: TWITTER_CONSUMER_SECRET,
      ACCESS_TOKEN: TWITTER_ACCESS_TOKEN,
      ACCESS_TOKEN_SECRET: TWITTER_ACCESS_TOKEN_SECRET,
    },
    SKALE: {
      PRIVATE_KEY: SKALE_PRIVATE_KEY || '',
    },
    PRIVY: {
      FLAG_ENABLED: PRIVY_FLAG === 'true',
      APP_ID: PRIVY_APP_ID,
      APP_SECRET: PRIVY_APP_SECRET,
    },
    IMAGE_GENERATION: {
      FLAG_USE_RUNWARE: FLAG_USE_RUNWARE === 'true' || false,
      RUNWARE_API_KEY: RUNWARE_API_KEY,
    },
    CLOUDFLARE: {
      TURNSTILE: {
        ...(CF_TURNSTILE_CREATE_COMMUNITY_SITE_KEY &&
          CF_TURNSTILE_CREATE_COMMUNITY_SECRET_KEY && {
            CREATE_COMMUNITY: {
              SITE_KEY: CF_TURNSTILE_CREATE_COMMUNITY_SITE_KEY,
              SECRET_KEY: CF_TURNSTILE_CREATE_COMMUNITY_SECRET_KEY,
            },
          }),
        ...(CF_TURNSTILE_CREATE_THREAD_SITE_KEY &&
          CF_TURNSTILE_CREATE_THREAD_SECRET_KEY && {
            CREATE_THREAD: {
              SITE_KEY: CF_TURNSTILE_CREATE_THREAD_SITE_KEY,
              SECRET_KEY: CF_TURNSTILE_CREATE_THREAD_SECRET_KEY,
            },
          }),
        ...(CF_TURNSTILE_CREATE_COMMENT_SITE_KEY &&
          CF_TURNSTILE_CREATE_COMMENT_SECRET_KEY && {
            CREATE_COMMENT: {
              SITE_KEY: CF_TURNSTILE_CREATE_COMMENT_SITE_KEY,
              SECRET_KEY: CF_TURNSTILE_CREATE_COMMENT_SECRET_KEY,
            },
          }),
      },
    },
    HEURISTIC_WEIGHTS: {
      VIEW_COUNT_WEIGHT: VIEW_COUNT_WEIGHT ? parseFloat(VIEW_COUNT_WEIGHT) : 1,
      COMMENT_WEIGHT: COMMENT_WEIGHT ? parseFloat(COMMENT_WEIGHT) : 1,
      LIKE_WEIGHT: LIKE_WEIGHT ? parseFloat(LIKE_WEIGHT) : 1,
      CREATED_DATE_WEIGHT: CREATED_DATE_WEIGHT
        ? parseFloat(CREATED_DATE_WEIGHT)
        : 1,
      CREATOR_USER_TIER_WEIGHT: CREATOR_USER_TIER_WEIGHT
        ? parseFloat(CREATOR_USER_TIER_WEIGHT)
        : 1,
      COMMUNITY_TIER_WEIGHT: COMMUNITY_TIER_WEIGHT
        ? parseFloat(COMMUNITY_TIER_WEIGHT)
        : 1,
    },
    DISABLE_TIER_RATE_LIMITS:
      !DISABLE_TIER_RATE_LIMITS && target.APP_ENV === 'local'
        ? true
        : DISABLE_TIER_RATE_LIMITS === 'true',
    TIER: {
      SOCIAL_VERIFIED_MIN_ETH: parseFloat(
        TIER_SOCIAL_VERIFIED_MIN_ETH || DEFAULTS.TIER_SOCIAL_VERIFIED_MIN_ETH,
      ),
    },
    MCP: {
      MCP_DEMO_CLIENT_SERVER_URL: MCP_DEMO_CLIENT_SERVER_URL,
      MCP_KEY_BYPASS: MCP_KEY_BYPASS,
    },
    LOG_XP_LAUNCHPAD: LOG_XP_LAUNCHPAD === 'true',
    NOTIFICATIONS: {
      KNOCK_PUBLIC_API_KEY:
        KNOCK_PUBLIC_API_KEY || DEFAULTS.KNOCK_PUBLIC_API_KEY,
      KNOCK_IN_APP_FEED_ID:
        KNOCK_IN_APP_FEED_ID || DEFAULTS.KNOCK_IN_APP_FEED_ID,
    },
    UNLEASH: {
      FRONTEND_API_TOKEN: UNLEASH_FRONTEND_API_TOKEN,
    },
  },
  z.object({
    SENDGRID: z.object({
      API_KEY: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ['production'],
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
    }),
    DB: z.object({
      URI: z.string().refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: DeployedEnvironments,
          requiredServices: 'all',
          defaultCheck: DEFAULTS.DATABASE_URL,
        }),
      ),
      NAME: z.string(),
      NO_SSL: z.boolean(),
      TRACE: z.boolean(),
    }),
    WEB3: z.object({
      PRIVATE_KEY: z.string().refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: ProductionEnvironments,
          requiredServices: [...WebServices, 'consumer', 'graphile'],
          defaultCheck: DEFAULTS.PRIVATE_KEY,
        }),
      ),
      LAUNCHPAD_PRIVATE_KEY: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      CONTEST_BOT_PRIVATE_KEY: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      EVM_CHAINS_WHITELIST: z
        .string()
        .optional()
        .refine(
          (data) => !(target.APP_ENV === 'production' && data),
          'EVM_CHAINS_WHITELIST cannot be set in production.',
        ),
      LAUNCHPAD_CHAIN_ID: z.number(),
      LAUNCHPAD_CONNECTOR_WEIGHT: z.number(),
      LAUNCHPAD_INITIAL_PRICE: z.number(),
    }),
    TBC: z.object({
      TTL_SECS: z.number().int(),
    }),
    OUTBOX: z.object({
      BLACKLISTED_EVENTS: z.array(z.string()),
    }),
    CONTESTS: z.object({
      MIN_USER_ETH: z.number(),
      MAX_USER_POSTS_PER_CONTEST: z.number().int(),
      FARCASTER_NGROK_DOMAIN: z.string().nullish(),
      NEYNAR_BOT_UUID: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      NEYNAR_API_KEY: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      NEYNAR_CAST_CREATED_WEBHOOK_SECRET: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      NEYNAR_CAST_WEBHOOK_ID: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      FARCASTER_ACTION_URL: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      FARCASTER_MANIFEST_HEADER: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      FARCASTER_MANIFEST_PAYLOAD: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      FARCASTER_MANIFEST_SIGNATURE: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      FARCASTER_MANIFEST_DOMAIN: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
      DISABLE_CONTEST_ENDING_VOTE: z.boolean().optional(),
      CONTEST_DURATION_IN_SEC: z.number().optional(),
    }),
    AUTH: z.object({
      JWT_SECRET: z.string().refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: DeployedEnvironments,
          requiredServices: [...WebServices],
          defaultCheck: DEFAULTS.JWT_SECRET,
        }),
      ),
      SESSION_EXPIRY_MILLIS: z.number().int(),
      ADDRESS_TOKEN_EXPIRES_IN: z.number().int(),
    }),
    ALCHEMY: z.object({
      BASE_WEBHOOK_SIGNING_KEY: z.string().optional(),
      BASE_SEPOLIA_WEBHOOK_SIGNING_KEY: z.string().optional(),
      ETH_SEPOLIA_WEBHOOOK_SIGNING_KEY: z.string().optional(),
      AA: z
        .object({
          FLAG_COMMON_WALLET: z.boolean().optional(),
          PRIVATE_KEY: z.string().optional(),
          ALCHEMY_KEY: z.string().optional(),
          GAS_POLICY: z.string().optional(),
        })
        .refine((data) => {
          if (data.FLAG_COMMON_WALLET && target.APP_ENV === 'production')
            return data.PRIVATE_KEY && data.ALCHEMY_KEY && data.GAS_POLICY;
          return true;
        }),
      APP_KEYS: z.object({
        PRIVATE: z.string(),
        PUBLIC: z.string(),
      }),
    }),
    SITEMAP: z.object({
      THREAD_PRIORITY: z.coerce.number(),
      PROFILE_PRIORITY: z.coerce.number(),
    }),
    DEFAULT_COMMONWEALTH_LOGO: z.string().url(),
    TEST_EVM: z.object({
      ETH_RPC: z.string(),
      PROVIDER_URL: z.string(),
    }),
    COSMOS: z.object({
      COSMOS_REGISTRY_API: z.string(),
    }),
    MEMBERSHIP_REFRESH_BATCH_SIZE: z.number().int().positive(),
    MEMBERSHIP_REFRESH_TTL_SECONDS: z.number().int().positive(),
    DISCORD: z.object({
      CLIENT_ID: z.string(),
      BOT_TOKEN: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: DeployedEnvironments,
            requiredServices: [...WebServices, 'discord-listener'],
          }),
        ),
    }),
    OPENAI: z.object({
      API_KEY: z.string().optional(),
      ORGANIZATION: z.string().optional(),
      USE_OPENROUTER: z.string().optional(),
      OPENROUTER_API_KEY: z.string().optional(),
    }),
    BOT: z.object({
      CONTEST_BOT_NAMESPACE: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
    }),
    TWITTER: z.object({
      LOG_LEVEL: z.enum(LogLevels),
      APP_BEARER_TOKEN: z.string().optional(),
      CONSUMER_KEY: z.string().optional(),
      CONSUMER_SECRET: z.string().optional(),
      ACCESS_TOKEN: z.string().optional(),
      ACCESS_TOKEN_SECRET: z.string().optional(),
    }),
    SKALE: z.object({
      PRIVATE_KEY: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: ProductionEnvironments,
            requiredServices: [...WebServices, 'consumer'],
          }),
        ),
    }),
    PRIVY: z
      .object({
        FLAG_ENABLED: z.boolean(),
        APP_ID: z.string().optional(),
        APP_SECRET: z.string().optional(),
      })
      .refine(
        (data) => !(data.FLAG_ENABLED && (!data.APP_ID || !data.APP_SECRET)),
      ),
    IMAGE_GENERATION: z
      .object({
        FLAG_USE_RUNWARE: z.boolean().optional(),
        RUNWARE_API_KEY: z.string().optional(),
      })
      .refine((data) => !(data.FLAG_USE_RUNWARE && !data.RUNWARE_API_KEY)),
    CLOUDFLARE: z.object({
      TURNSTILE: z.object({
        CREATE_COMMUNITY: z
          .object({
            SITE_KEY: z.string(),
            SECRET_KEY: z.string(),
          })
          .optional()
          .refine(
            requiredInEnvironmentServices({
              config: target,
              requiredAppEnvs: ['production'], // can't enable in QA because we can only whitelist 10 domains
              requiredServices: [...WebServices],
            }),
          ),
        CREATE_THREAD: z
          .object({
            SITE_KEY: z.string(),
            SECRET_KEY: z.string(),
          })
          .optional()
          .refine(
            requiredInEnvironmentServices({
              config: target,
              requiredAppEnvs: ['production'], // can't enable in QA because we can only whitelist 10 domains
              requiredServices: [...WebServices],
            }),
          ),
        CREATE_COMMENT: z
          .object({
            SITE_KEY: z.string(),
            SECRET_KEY: z.string(),
          })
          .optional()
          .refine(
            requiredInEnvironmentServices({
              config: target,
              requiredAppEnvs: ['production'], // can't enable in QA because we can only whitelist 10 domains
              requiredServices: [...WebServices],
            }),
          ),
      }),
    }),
    HEURISTIC_WEIGHTS: z.object({
      VIEW_COUNT_WEIGHT: z.number(),
      COMMENT_WEIGHT: z.number(),
      LIKE_WEIGHT: z.number(),
      CREATED_DATE_WEIGHT: z.number(),
      CREATOR_USER_TIER_WEIGHT: z.number(),
      COMMUNITY_TIER_WEIGHT: z.number(),
    }),
    DISABLE_TIER_RATE_LIMITS: z
      .boolean()
      .refine(
        (data) => !(target.APP_ENV === 'production' && data),
        'Tier rate limits cannot be disabled in production',
      )
      .refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: ProductionEnvironments,
          requiredServices: [...WebServices],
          defaultCheck: true,
        }),
      ),
    TIER: z.object({
      SOCIAL_VERIFIED_MIN_ETH: z.number(),
    }),
    MCP: z.object({
      MCP_DEMO_CLIENT_SERVER_URL: z.string().optional(),
      MCP_KEY_BYPASS: z
        .string()
        .optional()
        .refine(
          (data) => !(target.APP_ENV === 'production' && data),
          'MCP_KEY_BYPASS cannot be set in production',
        ),
    }),
    LOG_XP_LAUNCHPAD: z.boolean().default(false),
    NOTIFICATIONS: z.object({
      KNOCK_PUBLIC_API_KEY: z.string().refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: ProdLikeEnvironments,
          requiredServices: [...WebServices, 'knock', 'consumer'],
          defaultCheck: DEFAULTS.KNOCK_PUBLIC_API_KEY,
        }),
      ),
      KNOCK_IN_APP_FEED_ID: z.string().refine(
        requiredInEnvironmentServices({
          config: target,
          requiredAppEnvs: ['production'],
          requiredServices: [...WebServices, 'knock', 'consumer'],
          defaultCheck: DEFAULTS.KNOCK_IN_APP_FEED_ID,
        }),
      ),
    }),
    UNLEASH: z.object({
      FRONTEND_API_TOKEN: z
        .string()
        .optional()
        .refine(
          requiredInEnvironmentServices({
            config: target,
            requiredAppEnvs: DeployedEnvironments,
            requiredServices: [...WebServices],
          }),
        ),
    }),
  }),
);
