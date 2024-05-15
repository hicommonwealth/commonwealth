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

const { NODE_ENV, PORT } = process.env;
const port = parseInt(PORT || '8080', 10);

export const config = z
  .object({
    env: z.enum(Environments),
    host: z.string(),
    port: z.number().int().min(1000).max(9999),
  })
  .parse({
    env: NODE_ENV || 'development',
    host:
      NODE_ENV === 'production'
        ? 'https://commonwealth.im'
        : `http://localhost:${port}`,
    port,
  });
