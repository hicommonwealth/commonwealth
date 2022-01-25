import passport from 'passport';
import passportGithub from 'passport-github';
import passportDiscord from 'passport-discord';
import passportJWT from 'passport-jwt';
import { Request } from 'express';
import request from 'superagent';

import { encodeAddress } from '@polkadot/util-crypto';

import { Magic, MagicUserMetadata } from '@magic-sdk/admin';
import { Strategy as MagicStrategy } from 'passport-magic';

import { sequelize, DB } from './database';
import { ChainBase } from '../shared/types';
import { factory, formatFilename } from '../shared/logging';
import { getStatsDInstance } from './util/metrics';
const log = factory.getLogger(formatFilename(__filename));

import {
  JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_CALLBACK, MAGIC_API_KEY, MAGIC_SUPPORTED_BASES,
  MAGIC_DEFAULT_CHAIN, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_OAUTH_CALLBACK, DISCORD_OAUTH_SCOPES
} from './config';
import { NotificationCategories } from '../shared/types';
import lookupCommunityIsVisibleToUser from './util/lookupCommunityIsVisibleToUser';

enum Providers {
  GITHUB = 'github',
  DISCORD = 'discord',
}
const GithubStrategy = passportGithub.Strategy;
const DiscordStrategy = passportDiscord.Strategy;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

async function authenticateSocialAccount(provider: Providers, req: Request, accessToken, refreshToken, profile, cb, models: DB) {
  const str = '&state='
  const splitState = req.url.substring(req.url.indexOf(str) + str.length)
  const state = splitState.substring(splitState.indexOf('='));
  if (state !== String(req.sessionID)) return cb(null, false)

  const account = await models.SocialAccount.findOne({
    where: {provider: provider, provider_userid: profile.id}
  });

  // Existing Github account. If there is already a user logged-in,
  // transfer the Github link to the current user.
  if (account !== null) {
    // Handle OAuth for custom domains.
    //
    // If req.query.from is a valid custom domain for a community,
    // associate our LoginToken with this Github account. We will
    // redirect to [customdomain] afterwards and consume this
    // LoginToken to get a new login session.
    if ((req as any).loginTokenForRedirect) {
      const tokenObj = await models.LoginToken.findOne({
        where: {id: (req as any).loginTokenForRedirect}
      });
      tokenObj.social_account = account.id;
      await tokenObj.save();
    }

    // Update profile data on the SocialAccount.
    if (accessToken !== account.access_token
        || refreshToken !== account.refresh_token
        || profile.username !== account.provider_username) {
      account.access_token = accessToken;
      account.refresh_token = refreshToken;
      account.provider_username = profile.username;
      await account.save();
    }

    // Check associations and log in the correct user.
    const user = await account.getUser();
    if (req.user === null && user === null) {
      const newUser = await models.User.create({email: null});
      await account.setUser(newUser);
      return cb(null, newUser);
    } else if (req.user && req.user !== user) {
      // Github user has a user attached, and we're logged in to
      // a different user. Log out the previous user.
      req.logout();
      return cb(null, user);
    } else {
      // Github account has a user attached, and we either aren't
      // logged in, or we're already logged in to that account.
      return cb(null, user);
    }
  }

  // New Github account. Either link it to the existing user, or
  // create a new user. As a result it's possible that we end up
  // with a user with multiple Github accounts linked.
  const newAccount = await models.SocialAccount.create({
    provider: provider,
    provider_userid: profile.id,
    provider_username: profile.username,
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle OAuth for custom domains.
  //
  // If req.query.from is a valid custom domain for a community,
  // associate our LoginToken with this Github account. We will
  // redirect to [customdomain] afterwards and consume this
  // LoginToken to get a new login session.
  if ((req as any).loginTokenForRedirect) {
    const tokenObj = await models.LoginToken.findOne({
      where: {id: (req as any).loginTokenForRedirect}
    });
    tokenObj.social_account = newAccount.id;
    await tokenObj.save();
  }

  if (req.user) {
    await newAccount.setUser(req.user);
    return cb(null, req.user);
  } else {
    const newUser = await models.User.create({email: null});
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
    await newAccount.setUser(newUser);
    return cb(null, newUser);
  }
}

function setupPassport(models: DB) {
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

  // allow magic login if configured with key
  if (MAGIC_API_KEY) {
    // TODO: verify we are in a community that supports magic login
    const magic = new Magic(MAGIC_API_KEY);
    passport.use(new MagicStrategy({ passReqToCallback: true }, async (req, user, cb) => {
      // determine login location
      let chain, error;
      if (req.body.chain || req.body.community) {
        [ chain, error ] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
        if (error) return cb(error);
      }
      const registrationChain = chain;

      // fetch user data from magic backend
      let userMetadata: MagicUserMetadata;
      try {
        userMetadata = await magic.users.getMetadataByIssuer(user.issuer);
      } catch (e) {
        return cb(new Error('Magic fetch failed.'));
      }

      // check if this is a new signup or a login
      const existingUser = await models.User.scope('withPrivateData').findOne({
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
        const ethAddress = userMetadata.publicAddress;
        let polkadotAddress;

        // always retrieve the polkadot address for the user regardless of chain
        try {
          const polkadotResp = await request
            // eslint-disable-next-line max-len
            .get(`https://api.magic.link/v1/admin/auth/user/public/address/get?issuer=did:ethr:${userMetadata.publicAddress}`)
            .set('X-Magic-Secret-key', MAGIC_API_KEY)
            .accept('json');
          if (polkadotResp.body?.status !== 'ok') {
            throw new Error(polkadotResp.body?.message || 'Failed to fetch polkadot address');
          }
          const polkadotRespAddress = polkadotResp.body?.data?.public_address;

          // convert to chain-specific address based on ss58 prefix, if we are on a specific
          // polkadot chain. otherwise, encode to edgeware.
          if (registrationChain.ss58_prefix) {
            polkadotAddress = encodeAddress(polkadotRespAddress, registrationChain.ss58_prefix);
          } else {
            polkadotAddress = encodeAddress(polkadotRespAddress, 7); // edgeware SS58 prefix
          }
        } catch (err) {
          return cb(new Error(err.message));
        }

        const result = await sequelize.transaction(async (t) => {
          // create new user and unverified address if doesn't exist
          const newUser = await models.User.create({
            email: userMetadata.email,
            emailVerified: true,
            magicIssuer: userMetadata.issuer,
            lastMagicLoginAt: user.claim.iat,
          }, { transaction: t });

          // create an address on their selected chain
          let newAddress;
          if (registrationChain.base === ChainBase.Substrate) {
            newAddress = await models.Address.create({
              address: polkadotAddress,
              chain: registrationChain.id,
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              is_magic: true,
            }, { transaction: t });

            // if they selected a substrate chain, create an additional address on ethereum
            // and auto-add them to the eth forum
            const ethAddressInstance = await models.Address.create({
              address: ethAddress,
              chain: 'ethereum',
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              is_magic: true,
            }, { transaction: t });

            await models.Role.create({
              address_id: ethAddressInstance.id,
              chain_id: 'ethereum',
              permission: 'member',
            });
          } else {
            newAddress = await models.Address.create({
              address: ethAddress,
              chain: registrationChain.id,
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              is_magic: true,
            }, { transaction: t });

            // if they selected an eth chain, create an additional address on edgeware
            // and auto-add them to the forum
            const edgewareAddressInstance = await models.Address.create({
              address: polkadotAddress,
              chain: 'edgeware',
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              is_magic: true,
            }, { transaction: t });

            await models.Role.create({
              address_id: edgewareAddressInstance.id,
              chain_id: 'edgeware',
              permission: 'member',
            }, { transaction: t });
          }

          if (req.body.chain) await models.Role.create({
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
    await authenticateSocialAccount(Providers.GITHUB, req, accessToken, refreshToken, profile, cb, models)
  }));

  if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_OAUTH_CALLBACK) passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: DISCORD_OAUTH_CALLBACK,
    scope: DISCORD_OAUTH_SCOPES,
    passReqToCallback: true,
    authorizationURL: 'https://discord.com/api/oauth2/authorize?prompt=none'
  }, async (req: Request, accessToken, refreshToken, profile, cb) => {
    await authenticateSocialAccount(Providers.DISCORD,  req, accessToken, refreshToken, profile, cb, models)
  }))

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
