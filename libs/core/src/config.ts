import * as dotenv from 'dotenv';
import { ZodType, z } from 'zod';
import { Environments } from './ports';

dotenv.config({ path: '../../.env' });

/**
 * Extends target config with payload after validating schema
 *
 * @param target target payload
 * @param extend extended payload
 * @param schema extended schema
 * @returns extended config
 */
export const configure = <T, E extends Record<string, unknown>>(
  target: Readonly<T>,
  extend: Readonly<E>,
  schema: ZodType<E>,
): Readonly<T & E> =>
  Object.assign(target || {}, schema.parse(extend)) as Readonly<T & E>;

const {
  NODE_ENV,
  SERVER_URL,
  PORT: _PORT,
  SEND_EMAILS: _SEND_EMAILS,
  NO_CLIENT: _NO_CLIENT,
  NO_PRERENDER: _NO_PRERENDER,
  NO_GLOBAL_ACTIVITY_CACHE,
  LOGIN_RATE_LIMIT_TRIES,
  LOGIN_RATE_LIMIT_MINS,
} = process.env;

const PORT = _PORT ? parseInt(_PORT, 10) : 8080;
const SEND_EMAILS = _SEND_EMAILS === 'true';
const NO_CLIENT = _NO_CLIENT === 'true' || SEND_EMAILS;
const NO_PRERENDER = _NO_PRERENDER || NO_CLIENT;

export const config = z
  .object({
    NODE_ENV: z.enum(Environments),
    SERVER_URL: z.string(),
    PORT: z.coerce.number().int().min(1000).max(9999),
    SEND_EMAILS: z.boolean(),
    NO_CLIENT: z.boolean(),
    NO_PRERENDER: z.boolean(),
    NO_GLOBAL_ACTIVITY_CACHE: z.boolean(),
    LOGIN_RATE_LIMIT_TRIES: z.coerce.number().int(),
    LOGIN_RATE_LIMIT_MINS: z.coerce.number().int(),
  })
  .parse({
    NODE_ENV: NODE_ENV || 'development',
    SERVER_URL:
      SERVER_URL ?? NODE_ENV === 'production'
        ? 'https://commonwealth.im'
        : `http://localhost:${PORT}`,
    PORT,
    SEND_EMAILS,
    NO_CLIENT,
    NO_PRERENDER,
    NO_GLOBAL_ACTIVITY_CACHE: NO_GLOBAL_ACTIVITY_CACHE === 'true',
    // limit logins in the last 5 minutes
    // increased because of chain waitlist registrations
    LOGIN_RATE_LIMIT_TRIES: LOGIN_RATE_LIMIT_TRIES ?? 15,
    LOGIN_RATE_LIMIT_MINS: LOGIN_RATE_LIMIT_MINS ?? 5,
  });
