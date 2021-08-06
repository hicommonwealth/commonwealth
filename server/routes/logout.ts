import { Request, Response } from 'express';
import log from '../../shared/logging';

import { getStatsDInstance } from '../util/metrics';

const logout = async (models, req: Request, res: Response) => {
  // Passport has a race condition where req.logout resolves too
  // early, so we also call req.session.destroy() and clear the
  // session cookie before returning
  getStatsDInstance().decrement('cw.users.logged_in');
  req.logout();
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

export default logout;
