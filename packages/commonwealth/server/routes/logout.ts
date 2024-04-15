import { stats } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { Request, Response } from 'express';

const logout = async (models: DB, req: Request, res: Response) => {
  // Passport has a race condition where req.logout resolves too
  // early, so we also call req.session.destroy() and clear the
  // session cookie before returning
  stats().decrement('cw.users.logged_in');
  req.logout({}, () => {});
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

export default logout;
