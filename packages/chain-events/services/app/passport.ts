import passport from 'passport';
import passportJWT from 'passport-jwt';

import { JWT_SECRET } from '../config';

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
        secretOrKey: JWT_SECRET,
      },
      async (jwtPayload, done) => {
        // jwtPayload: { id: 12345, email: null, iat: 1234567891 }
        done(null, jwtPayload);
      }
    )
  );
}

function setupPassport(): void {
  initDefaultUserAuth();
}

export default setupPassport;
