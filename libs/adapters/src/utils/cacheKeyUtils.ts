import { Request } from 'express';

export type CacheKeyDuration = {
  cacheKey?: string;
  cacheDuration?: number;
};

// Extend the Request type with your custom properties
export interface CustomRequest extends Request, CacheKeyDuration {}

export function isCacheKeyDuration(obj: any): obj is CacheKeyDuration {
  return (
    typeof obj === 'object' &&
    typeof obj.cacheKey === 'string' &&
    typeof obj.cacheDuration === 'number'
  );
}

export const defaultKeyGenerator = (req: Request) => {
  return req.originalUrl;
};

export const defaultUserKeyGenerator = (
  req: Request & { user: { id: string } },
) => {
  const user = req.user;
  if (user && user.id) {
    return `user:${user.id}_${req.originalUrl}`;
  }
  return req.originalUrl;
};

export function lookupKeyDurationInReq(
  req: CustomRequest,
): CacheKeyDuration | string | null {
  let cacheKey = null;
  let cacheDuration = null;

  if (req.cacheKey && typeof req.cacheKey === 'string') {
    cacheKey = req.cacheKey;
  }

  if (typeof req.cacheDuration === 'number') {
    cacheDuration = req.cacheDuration;
  }

  if (cacheKey === null || cacheDuration === null) {
    return null;
  }

  return { cacheKey, cacheDuration };
}
