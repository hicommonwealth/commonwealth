import { ExternalServiceUserIds } from '@hicommonwealth/core';
import passport from 'passport';
import AuthTokenStrategy from 'passport-auth-token';
import { config } from '../config';

export function initTokenAuth() {
  passport.use(
    'authToken',
    new AuthTokenStrategy(
      {
        headerFields: ['knock_auth_token'],
        optional: false,
      },
      function (token, done) {
        switch (token) {
          case config.NOTIFICATIONS.KNOCK_AUTH_TOKEN:
            done(null, {
              id: ExternalServiceUserIds.Knock,
              email: 'hello@knock.app',
            });
            break;
          default:
            done(null, false);
            break;
        }
      },
    ),
  );
}
