import passport from 'passport';
import passportJWT from 'passport-jwt';

import { DB } from '../models';
import { factory, formatFilename } from 'common-common/src/logging';
import { JWT_SECRET } from '../config';
import { useSocialAccountAuth } from './socialAccount';
import { useMagicAuth } from './magic';
import '../types';

import { getStatsDInstance } from '../util/metrics';
const log = factory.getLogger(formatFilename(__filename));

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

function useDefaultUserAuth(models: DB) {
  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([
      ExtractJWT.fromBodyField('jwt'),
      ExtractJWT.fromUrlQueryParameter('jwt'),
      ExtractJWT.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: JWT_SECRET,
  }, async (jwtPayload, done) => {
    try {
      models.User.scope('withPrivateData').findOne({ where: { id: jwtPayload.id } }).then((user) => {
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
  }));
}

function setupPassport(models: DB) {
  useDefaultUserAuth(models);
  useSocialAccountAuth(models);
  useMagicAuth(models);

  passport.serializeUser<any>((user, done) => {
    getStatsDInstance().increment('cw.users.logged_in');
    if (user?.id) {
      getStatsDInstance().set('cw.users.unique', user.id);
    }
    done(null, user.id);
  });

  passport.deserializeUser((userId, done) => {
    models.User
      .scope('withPrivateData')
      .findOne({ where: { id: userId } })
      .then((user) => { done(null, user); })
      .catch((err) => { done(err, null); });
  });
}

export default setupPassport;
