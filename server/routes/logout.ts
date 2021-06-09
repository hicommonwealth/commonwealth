import { Magic } from '@magic-sdk/admin';
import { Request, Response } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const logout = async (models, magic: Magic, req: Request, res: Response) => {
  // Passport has a race condition where req.logout resolves too
  // early, so we also call req.session.destroy() and clear the
  // session cookie before returning
  req.logout();
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });

  // support magic logout
  if (magic && req.query.didToken) {
    await magic.users.logoutByToken(req.query.didToken);
  }
};

export default logout;
