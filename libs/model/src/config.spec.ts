import { describe, expect, test } from 'vitest';
import { z } from 'zod';

// What do you guys think of this for a new Config pattern.  The idea is that we
// define a DISABLED and ENABLED for each 'block' of config variables.  The
// benefits being we wouldn't need a 'refine' functions.  We could then use
// .default() for the zod schema for each field. We would still need refine()
// for one field but 70% of our config would go away and be more maintainable.
//
// For example, for sitemaps you could have either:
//
// This... (AKA an empty object)
//
// { }
//
// Just an explicit entry disabling it:
//
// {
//    SITEMAP_ENABLED: false
// }
//
// or enabling it:
//
// {
//    SITEMAP_ENABLED: true
// }
//
// or with a custom config:
//
// {
//    SITEMAP_ENABLED: true
//    SITEMAP_THREAD_PRIORITY: 0.2
// }
//
// I think it also requires a Zod upgrade but that's easy enough.

const SITEMAP_DISABLED_SCHEMA = z.object({
  SITEMAP_ENABLED: z.literal('false').optional(),
});

const SITEMAP_ENABLED_SCHEMA = z.object({
  SITEMAP_ENABLED: z.literal('true'),
  SITEMAP_THREAD_PRIORITY: z.coerce.number().default(0.8),
});

const SITEMAP_SCHEMA = z.union([
  SITEMAP_ENABLED_SCHEMA,
  SITEMAP_DISABLED_SCHEMA,
]);

const APP_ENV_LOCAL_SCHEMA = z.object({
  APP_ENV: z.union([z.literal('local'), z.literal('ci')]),
});

const APP_ENV_PROD_SCHEMA = z.object({
  APP_ENV: z.string().optional(),
  DATABASE_URL: z.string(),
});

const APP_ENV_SCHEMA = z.union([APP_ENV_LOCAL_SCHEMA, APP_ENV_PROD_SCHEMA]);

const CONFIG_SCHEMA = z.intersection(SITEMAP_SCHEMA, APP_ENV_SCHEMA);

describe('config', () => {
  describe('SITEMAP_SCHEMA', () => {
    test('everything disabled', () => {
      SITEMAP_SCHEMA.parse({});
    });

    test('sitemap disabled', () => {
      SITEMAP_SCHEMA.parse({
        SITEMAP_ENABLED: 'false',
      });
    });

    test('sitemap with custom value', () => {
      SITEMAP_SCHEMA.parse({
        SITEMAP_ENABLED: 'false',
        SITEMAP_THREAD_PRIORITY: 0.2,
      });
    });
  });

  describe('CONFIG_SCHEMA', () => {
    test('everything disabled', () => {
      CONFIG_SCHEMA.parse({
        SITEMAP_ENABLED: 'false',
        APP_ENV: 'local',
      });
    });

    test('sitemap enabled and with custom SITEMAP_THREAD_PRIORITY', () => {
      const parsed = CONFIG_SCHEMA.parse({
        SITEMAP_ENABLED: 'true',
        APP_ENV: 'local',
      });

      if (parsed.SITEMAP_ENABLED === 'true') {
        expect(parsed.SITEMAP_THREAD_PRIORITY).to.be.equal(0.8);
      }
    });

    test('sitemap enabled but FAILING due to no DATABASE_URL', () => {
      expect(() => {
        CONFIG_SCHEMA.parse({
          SITEMAP_ENABLED: 'true',
          APP_ENV: 'prod',
        });
      }).toThrow();
    });

    test('sitemap enabled and production app env', () => {
      CONFIG_SCHEMA.parse({
        SITEMAP_ENABLED: 'true',
        APP_ENV: 'prod',
        DATABASE_URL: 'fake_database_url',
      });
    });
  });
});
