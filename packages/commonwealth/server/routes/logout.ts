import { StatsDController } from '@hicommonwealth/adapters';
import type { Request, Response } from 'express';
import type { DB } from '../models';

const logout = async (models: DB, req: Request, res: Response) => {
  // Passport has a race condition where req.logout resolves too
  // early, so we also call req.session.destroy() and clear the
  // session cookie before returning
  StatsDController.get().decrement('cw.users.logged_in');
  req.logout();
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

export default logout;
