import { analytics, logger } from '@hicommonwealth/core';
import type { Request } from 'express';
import { ZodSchema, z } from 'zod';
import { config } from '../config';
import type { Context, OutputMiddleware, Track } from './types';

const log = logger(import.meta);

/**
 * Fire and forget wrapper for output middleware
 */
export function fireAndForget<
  Input extends ZodSchema,
  Output extends ZodSchema,
>(
  fn: (
    input: z.infer<Input>,
    output: z.infer<Output>,
    ctx: Context,
  ) => Promise<void>,
): OutputMiddleware<Input, Output> {
  return (input: z.infer<Input>, output: z.infer<Output>, ctx: Context) => {
    void fn(input, output, ctx).catch(log.error);
    return Promise.resolve();
  };
}

/**
 * Returns a record containing condensed browser info.
 * Expects the 'express-useragent' middleware to be applied to the route.
 * Includes 'is...' boolean entries if the value is true, and all string values
 */
function getRequestBrowserInfo(
  req: Request & { useragent?: Record<string, unknown> },
) {
  const info: Record<string, unknown> = req.useragent
    ? Object.entries(req.useragent)
        .filter(([k, v]) => typeof v === 'string' || (k.startsWith('is') && v))
        .reduce((p, [k, v]) => Object.assign(p, { [k]: v }), {})
    : {};
  const brand = req.headers['sec-ch-ua'];
  if (typeof brand === 'string' && brand.includes('Brave')) {
    delete info['isChrome'];
    info['isBrave'] = true;
    info['browser'] = 'Brave';
  }
  return info;
}

export function getAnalyticsPayload(
  ctx: Context,
  data: Record<string, unknown>,
) {
  const host = ctx.req.headers.host;
  return {
    ...data,
    ...getRequestBrowserInfo(ctx.req),
    ...(host && { isCustomDomain: config.SERVER_URL.includes(host) }),
    userId: ctx.actor.user.id,
    isPWA: ctx.req.headers?.['isPWA'] === 'true',
  };
}

async function resolveTrack<Input extends ZodSchema, Output extends ZodSchema>(
  track: Track<Input, Output>,
  input: z.infer<Input>,
  output: z.infer<Output>,
): Promise<[string | undefined, Record<string, unknown>]> {
  if (typeof track === 'function')
    return (await track(input, output)) ?? [undefined, {}];
  return [track[0], track[1] ? track[1](output) : {}];
}

/**
 * Output middleware that tracks analytics in fire-and-forget mode
 */
export function trackAnalytics<
  Input extends ZodSchema,
  Output extends ZodSchema,
>(track: Track<Input, Output>): OutputMiddleware<Input, Output> {
  return (input, output, ctx) => {
    void resolveTrack(track, input, output)
      .then(([event, data]) => {
        event && analytics().track(event, getAnalyticsPayload(ctx, data));
      })
      .catch(log.error);
    return Promise.resolve();
  };
}
