import { AuthStrategies, User } from '@hicommonwealth/core';
import { TRPCError } from '@trpc/server';
import { Request } from 'express';
import passport from 'passport';
import { config } from '../config';

export const authenticate = async (
  req: Request,
  authStrategy: AuthStrategies = { name: 'jwt' },
) => {
  try {
    if (authStrategy.name === 'authtoken') {
      switch (req.headers['authorization']) {
        case config.NOTIFICATIONS.KNOCK_AUTH_TOKEN:
          req.user = {
            id: authStrategy.userId,
            email: 'hello@knock.app',
          };
          break;
        case config.LOAD_TESTING.AUTH_TOKEN:
          req.user = {
            id: authStrategy.userId,
            email: 'info@grafana.com',
          };
          break;
        default:
          throw new Error('Not authenticated');
      }
    } else if (authStrategy.name === 'custom') {
      authStrategy.customStrategyFn(req);
      req.user = {
        id: authStrategy.userId,
      };
    } else {
      await passport.authenticate(authStrategy.name, { session: false });
    }

    if (!req.user) throw new Error('Not authenticated');
    if (authStrategy.userId && (req.user as User).id !== authStrategy.userId) {
      throw new Error('Not authenticated');
    }
  } catch (error) {
    throw new TRPCError({
      message: error instanceof Error ? error.message : (error as string),
      code: 'UNAUTHORIZED',
    });
  }
};
