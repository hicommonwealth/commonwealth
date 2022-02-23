import passport from 'passport';
import passportJWT from 'passport-jwt';
import { Request } from 'express';
import '../types';

import { AXIE_SHARED_SECRET } from '../config';
import { sequelize, DB } from '../database';
import { SsoTokenInstance } from '../models/sso_token';
import { UserInstance } from '../models/user';
import { ProfileAttributes } from '../models/profile';
import { NotificationCategories } from '../../shared/types';

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

enum Issuers {
  AxieInfinity = 'AxieInfinity',
}

type AxieInfinityJwt = {
  iat: number; // issued at time
  Iss: string; // should be "AxieInfinity"
  jti: string; // random UUID
  roninAddress: string; // eth address
};

const AXIE_INFINITY_CHAIN_ID = 'axie-infinity';

// TODO: generalize this
export function useSsoAuth(models: DB) {
  if (AXIE_SHARED_SECRET) {
    passport.use('AxieInfinity', new JWTStrategy({
      passReqToCallback: true,
      jwtFromRequest: ExtractJWT.fromExtractors([
        ExtractJWT.fromBodyField('token'),
        // ExtractJWT.fromUrlQueryParameter('token'),
      ]),
      secretOrKey: AXIE_SHARED_SECRET,
    }, async (req: Request, jwtPayload: AxieInfinityJwt, done) => {
      // verify issuer
      if (jwtPayload.Iss !== Issuers.AxieInfinity) {
        return done(null, null, {
          message: `Invalid issuer`,
        });
      }

      // check if this is a new signup or a login
      const reqUser = req.user;
      let existingToken: SsoTokenInstance;
      let existingUser: UserInstance;
      if (reqUser) {
        // user is already logged in
        const addresses = await reqUser.getAddresses({ where: { address: jwtPayload.roninAddress } });
        if (addresses && addresses.length > 1) {
          return done(null, null, {
            message: 'More than 1 address found for provided token'
          });
        }
        if (addresses) {
          existingToken = await addresses[0].getSsoToken();
          existingUser = reqUser;
        }
      } else {
        // check if user is not logged in, but has logged in before
        const existingAddress = await models.Address.scope('withPrivateData').findOne({
          where: { address: jwtPayload.roninAddress },
          include: [{
            model: models.SsoToken,
            where: { issuer: jwtPayload.Iss },
            required: true,
          }],
        });
        if (existingAddress) {
          existingToken = await existingAddress.getSsoToken();
          existingUser = await existingAddress.getUser();
        }
      }

      if (existingToken) {
        // perform login on existing account
        if (jwtPayload.iat <= existingToken.issued_at) {
          console.log('Replay attack detected.');
          return done(null, null, {
            message: `Replay attack detected for ${existingToken.id}}.`,
          });
        }
        existingToken.issued_at = jwtPayload.iat;
        await existingToken.save();
        return done(null, existingUser);
      } else {
        // create new address and user if needed
        const result = await sequelize.transaction(async (t) => {
          let user = reqUser;
          // TODO: this profile fetching will eventually need to assume more than one profile
          let profile: ProfileAttributes;
          if (!reqUser) {
            // create new user
            user = await models.User.createWithProfile(models, { email: '' }, { transaction: t });
            profile = user.Profiles[0];
          } else {
            profile = await user.getProfiles()[0];
          }

          // create new address
          const newAddress = await models.Address.create({
            address: jwtPayload.roninAddress,
            chain: AXIE_INFINITY_CHAIN_ID,
            verification_token: 'SSO',
            verification_token_expires: null,
            verified: new Date(), // trust addresses from magic
            last_active: new Date(),
            user_id: user.id,
            profile_id: profile.id,
          }, { transaction: t });

          await models.Role.create({
            address_id: newAddress.id,
            chain_id: AXIE_INFINITY_CHAIN_ID,
            permission: 'member',
          }, { transaction: t });

          // Automatically create subscription to their own mentions
          await models.Subscription.create({
            subscriber_id: user.id,
            category_id: NotificationCategories.NewMention,
            object_id: `user-${user.id}`,
            is_active: true,
          }, { transaction: t });

          // Automatically create a subscription to collaborations
          await models.Subscription.create({
            subscriber_id: user.id,
            category_id: NotificationCategories.NewCollaboration,
            object_id: `user-${user.id}`,
            is_active: true,
          }, { transaction: t });

          // create token
          const newToken = await models.SsoToken.create({
            user_id: user.id,
            issuer: jwtPayload.Iss,
            issued_at: jwtPayload.iat,
            address_id: newAddress.id,
          }, { transaction: t });

          return user;
        });

        if (reqUser) {
          // re-fetch address if existing user
          const newAddress = await models.Address.findOne({ where: { address: jwtPayload.roninAddress }});
          return done(null, newAddress);
        } else {
          // re-fetch user to include address object, if freshly created
          const newUser = await models.User.findOne({
            where: {
              id: result.id,
            },
            include: [ models.Address ],
          });
          return done(null, newUser);
        }
      }
    }));
  }
}
