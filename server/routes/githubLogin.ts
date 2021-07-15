import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

import { GITHUB_OAUTH_CALLBACK } from '../config';

const githubLogin = async (models, req: Request, res: Response, next: NextFunction) => {
  // Look up req.query.from, and only pass on the query param if the domain is valid
  let successRedirect = '/';
  let failureRedirect = '#!/login';
  if (req.query.from) {
    try {
      const [chain, community] = await Promise.all([
        models.Chain.findOne({ where: { customDomain: req.query.from } }),
        models.OffchainCommunity.findOne({ where: { customDomain: req.query.from } }),
      ]);
      if (chain || community) successRedirect = `/?from=${req.query.from}`;
    } catch (e) {}
  }

  passport.authenticate('github', {
    callbackURL: `${GITHUB_OAUTH_CALLBACK}?from=${encodeURIComponent(req.hostname)}`,
    successRedirect: successRedirect,
    failureRedirect: failureRedirect,
  } as any)(req, res, next); // TODO: extend AuthenticateOptions typing used here
};


export default githubLogin;
