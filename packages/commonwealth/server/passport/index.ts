import { stats } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { UserTierMap } from '@hicommonwealth/shared';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import { Op } from 'sequelize';
import { config } from '../config';
import '../types';
import { initMagicAuth } from './magic';
// import { initTokenAuth } from './tokenAuth';

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

function initDefaultUserAuth(models: DB) {
  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([
          ExtractJWT.fromBodyField('jwt'),
          ExtractJWT.fromUrlQueryParameter('jwt'),
          ExtractJWT.fromAuthHeaderAsBearerToken(),
        ]),
        secretOrKey: config.AUTH.JWT_SECRET,
      },
      async (jwtPayload, done) => {
        try {
          models.User.scope('withPrivateData')
            .findOne({
              where: {
                id: jwtPayload.id,
                tier: { [Op.ne]: UserTierMap.BannedUser },
              },
            })
            .then((user) => {
              if (user) {
                // note the return removed with passport JWT - add this return for passport local
                done(null, user);
              } else {
                done(null, false);
              }
            });
        } catch (err) {
          done(err);
        }
      },
    ),
  );
}

export function setupPassport(models: DB) {
  initDefaultUserAuth(models);
  initMagicAuth(models);
  // initTokenAuth();

  passport.serializeUser<any>((user, done) => {
    stats().increment('cw.users.logged_in');
    if (user?.id) {
      stats().set('cw.users.unique', user.id);
    }
    done(null, user.id);
  });

  passport.deserializeUser((userId, done) => {
    if (!userId || (typeof userId !== 'string' && typeof userId !== 'number')) {
      done(new Error('Invalid user'), false);
    } else {
      models.User.scope('withPrivateData')
        .findOne({
          where: { id: userId, tier: { [Op.ne]: UserTierMap.BannedUser } },
        })
        .then((user) => {
          if (!user) {
            done(new Error('Invalid user'), false);
          } else {
            done(null, user);
          }
        })
        .catch((err) => {
          done(err, null);
        });
    }
  });
}

export default setupPassport;
