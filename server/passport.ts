import passport from 'passport';
import passportGithub from 'passport-github';
import passportJWT from 'passport-jwt';
import { Request } from 'express';
import request from 'superagent';

import { encodeAddress } from '@polkadot/util-crypto';

import { Magic, MagicUserMetadata } from '@magic-sdk/admin';
import { Strategy as MagicStrategy } from 'passport-magic';

import { sequelize } from './database';
import { factory, formatFilename } from '../shared/logging';
const log = factory.getLogger(formatFilename(__filename));


import {
  JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_CALLBACK, MAGIC_API_KEY, MAGIC_SUPPORTED_BASES,
  MAGIC_DEFAULT_CHAIN
} from './config';
import { NotificationCategories } from '../shared/types';
import lookupCommunityIsVisibleToUser from './util/lookupCommunityIsVisibleToUser';

const GithubStrategy = passportGithub.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

function setupPassport(models) {
  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([
      ExtractJWT.fromBodyField('jwt'),
      ExtractJWT.fromUrlQueryParameter('jwt'),
      ExtractJWT.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: JWT_SECRET,
  }, async (jwtPayload, done) => {
    try {
      models.User.findOne({ where: { id: jwtPayload.id } }).then((user) => {
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

  // allow magic login if configured with key
  if (MAGIC_API_KEY) {
    // TODO: verify we are in a community that supports magic login
    const magic = new Magic(MAGIC_API_KEY);
    passport.use(new MagicStrategy({ passReqToCallback: true }, async (req, user, cb) => {
      // determine login location
      let chain, community, error;
      if (req.body.chain || req.body.community) {
        [ chain, community, error ] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
        if (error) return cb(error);
      }
      let registrationChain;
      if (chain?.id) {
        registrationChain = chain;
      } else {
        const chainId = community?.default_chain || MAGIC_DEFAULT_CHAIN;
        registrationChain = await models.Chain.findOne({ where: { id: chainId } });
      }

      // fetch user data from magic backend
      let userMetadata: MagicUserMetadata;
      try {
        userMetadata = await magic.users.getMetadataByIssuer(user.issuer);
      } catch (e) {
        return cb(new Error('Magic fetch failed.'));
      }

      // check if this is a new signup or a login
      const existingUser = await models.User.findOne({
        where: {
          email: userMetadata.email,
        },
        include: [{
          model: models.Address,
          where: { is_magic: true },
          required: false,
        }],
      });

      // unsupported chain -- client should send through old email flow
      if (!existingUser && (!registrationChain?.base || !MAGIC_SUPPORTED_BASES.includes(registrationChain.base))) {
        return cb(new Error('Unsupported magic chain.'));
      }

      if (!existingUser) {
        // ensure all eth addresses are lowercase
        let address = userMetadata.publicAddress.toLowerCase();

        // if on polkadot chain, retrieve the address for the user
        if (registrationChain.base === 'substrate') {
          try {
            const polkadotResp = await request
              // eslint-disable-next-line max-len
              .get(`https://api.magic.link/v1/admin/auth/user/public/address/get?issuer=did:ethr:${userMetadata.publicAddress}`)
              .set('X-Magic-Secret-key', MAGIC_API_KEY)
              .accept('json');
            if (polkadotResp.body?.status !== 'ok') {
              throw new Error(polkadotResp.body?.message || 'Failed to fetch polkadot address');
            }
            const polkadotAddress = polkadotResp.body?.data?.public_address;

            // convert to chain-specific address based on ss58 prefix
            if (registrationChain.ss58_prefix) {
              address = encodeAddress(polkadotAddress, registrationChain.ss58_prefix);
            } else {
              address = polkadotAddress;
            }
          } catch (err) {
            return cb(new Error(err.message));
          }
        }

        const result = await sequelize.transaction(async (t) => {
          // create new user and unverified address if doesn't exist
          const newUser = await models.User.create({
            email: userMetadata.email,
            emailVerified: true,
            magicIssuer: userMetadata.issuer,
            lastMagicLoginAt: user.claim.iat,
          }, { transaction: t });

          // TODO: use non-default chain in certain cases?
          const newAddress = await models.Address.create({
            address,
            chain: registrationChain.id,
            verification_token: 'MAGIC',
            verification_token_expires: null,
            verified: new Date(), // trust addresses from magic
            last_active: new Date(),
            user_id: newUser.id,
            is_magic: true,
          }, { transaction: t });

          if (req.body.chain || req.body.community) await models.Role.create(req.body.community ? {
            address_id: newAddress.id,
            offchain_community_id: req.body.community,
            permission: 'member',
          } : {
            address_id: newAddress.id,
            chain_id: req.body.chain,
            permission: 'member',
          }, { transaction: t });

          // Automatically create subscription to their own mentions
          await models.Subscription.create({
            subscriber_id: newUser.id,
            category_id: NotificationCategories.NewMention,
            object_id: `user-${newUser.id}`,
            is_active: true,
          }, { transaction: t });

          // Automatically create a subscription to collaborations
          await models.Subscription.create({
            subscriber_id: newUser.id,
            category_id: NotificationCategories.NewCollaboration,
            object_id: `user-${newUser.id}`,
            is_active: true,
          }, { transaction: t });

          return newUser;
        });

        // re-fetch user to include address object
        // TODO: simplify this without doing a refetch
        const newUser = await models.User.findOne({
          where: {
            id: result.id,
          },
          include: [ models.Address ],
        });
        return cb(null, newUser);
      } else if (existingUser.Addresses) {
        // login user if they registered via magic
        if (user.claim.iat <= existingUser.lastMagicLoginAt) {
          console.log('Replay attack detected.');
          return cb(null, null, {
            message: `Replay attack detected for user ${user.issuer}}.`,
          });
        }
        existingUser.lastMagicLoginAt = user.claim.iat;
        await existingUser.save();
        console.log(`Found existing user: ${JSON.stringify(existingUser)}`);
        return cb(null, existingUser);
      } else {
        // error if email exists but not registered with magic
        console.log('User already registered with old method.');
        return cb(null, null, {
          message: `Email for user ${user.issuer} already registered`
        });
      }
    }));
  }

  // allow user to authenticate with Github
  // create stub user without email
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && GITHUB_OAUTH_CALLBACK) passport.use(new GithubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_OAUTH_CALLBACK,
    passReqToCallback: true,
  }, async (req: Request, accessToken, refreshToken, profile, cb) => {
    const githubAccount = await models.SocialAccount.findOne({
      where: { provider: 'github', provider_userid: profile.id }
    });

    // Existing Github account. If there is already a user logged-in,
    // transfer the Github link to the current user.
    if (githubAccount !== null) {
      // update profile data
      if (accessToken !== githubAccount.access_token
        || refreshToken !== githubAccount.refresh_token
        || profile.username !== githubAccount.provider_username) {
        githubAccount.access_token = accessToken;
        githubAccount.refresh_token = refreshToken;
        githubAccount.provider_username = profile.username;
        await githubAccount.save();
      }
      // check associations and log in the correct user
      const user = await githubAccount.getUser();
      if (req.user === null && user === null) {
        const newUser = await models.User.create({ email: null });
        await githubAccount.setUser(newUser);
        return cb(null, newUser);
      } else if (req.user && req.user !== user) {
        // Github user has a user attached, and we're logged in to
        // a different user. Move the Github link to the new user.
        // await githubAccount.setUser(req.user);
        // return cb(null, req.user);
        // TODO: We should probably just block the login, rather than moving the Github account
        log.error('Github already linked to ');
        return cb(null, null);
      } else {
        // Github account has a user attached, and we either aren't
        // logged in, or we're already logged in to that account.
        return cb(null, user);
      }
    }

    // New Github account. Either link it to the existing user, or
    // create a new user. As a result it's possible that we end up
    // with a user with multiple Github accounts linked.
    const newGithubAccount = await models.SocialAccount.create({
      provider: 'github',
      provider_userid: profile.id,
      provider_username: profile.username,
      access_token: accessToken,
      refresh_token: refreshToken,
      metadata: {
        display_name: profile.displayName,
        profile_url: profile.profileURL,
        avatar_url: profile.photos.length > 0 && profile.photos[0].value,
        bio: profile._json.bio,
        updated_at: profile._json.updated_at,
        created_at: profile._json.created_at,
        company: profile._json.company,
        blog: profile._json.blog,
        location: profile._json.location,
      }
    });
    if (req.user) {
      await newGithubAccount.setUser(req.user);
      return cb(null, req.user);
    } else {
      const newUser = await models.User.create({ email: null });
      await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewMention,
        object_id: `user-${newUser.id}`,
        is_active: true,
      });
      await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewCollaboration,
        object_id: `user-${newUser.id}`,
        is_active: true,
      });
      await newGithubAccount.setUser(newUser);
      return cb(null, newUser);
    }
  }));

  passport.serializeUser<any>((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((userId, done) => {
    models.User
      .findOne({ where: { id: userId } })
      .then((user) => { done(null, user); })
      .catch((err) => { done(err, null); });
  });
}

export default setupPassport;
