import passport from 'passport';
import passportLocal from 'passport-local';
import passportGithub from 'passport-github';
import passportJWT from 'passport-jwt';
import { Request } from 'express';

import { factory, formatFilename } from '../shared/logging';
const log = factory.getLogger(formatFilename(__filename));


import { JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_CALLBACK } from './config';
import { NotificationCategories } from '../shared/types';

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

  // allow user to authenticate with Github
  // create stub user without email
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && GITHUB_OAUTH_CALLBACK) passport.use(new GithubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_OAUTH_CALLBACK,
    scope: 'gist',
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
      await newGithubAccount.setUser(newUser);
      return cb(null, newUser);
    }
  }));

  passport.serializeUser<any, any>((user, done) => {
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
