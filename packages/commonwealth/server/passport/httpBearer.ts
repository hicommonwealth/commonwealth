import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

// bearer return 401 if token is invalid
export function initBearerAuth(
  secretName: string,
  secretValue: string | undefined
): void {
  if (!secretName) {
    log.error(`No secret name provided, skipping bearer auth`);
    return;
  }

  if (!secretValue) {
    log.warn(`No secret value for ${secretName} provided`);
  }

  passport.use(
    secretName,
    new BearerStrategy(
      (token: string, done: (error: any, user?: any, info?: any) => void) => {
        if (!token) {
          return done(null, false);
        }

        if (token === secretValue) {
          return done(null, {});
        }

        return done(null, false);
      }
    )
  );
}
