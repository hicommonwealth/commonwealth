import { stats } from '@hicommonwealth/core';
import { magicLogin, models } from '@hicommonwealth/model';
import { MagicLogin } from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { Magic } from '@magic-sdk/admin';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import { Strategy as MagicStrategy } from 'passport-magic';
import { Op } from 'sequelize';
import { config } from '../config';
import '../types';
// import { initTokenAuth } from './tokenAuth';

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

function initDefaultUserAuth() {
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

function initMagicAuth() {
  // allow magic login if configured with key
  if (config.MAGIC_API_KEY) {
    // TODO: verify we are in a community that supports magic login
    const magic = new Magic(config.MAGIC_API_KEY);
    passport.use(
      new MagicStrategy({ passReqToCallback: true }, async (req, user, cb) => {
        try {
          const body = MagicLogin.parse(req.body);
          await magicLogin(magic, body, user, cb);
        } catch (e) {
          return cb(e, user);
        }
      }),
    );
  }
}

export function setupPassport() {
  initDefaultUserAuth();
  initMagicAuth();
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
