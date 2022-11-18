import { Request, Response } from 'express';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));
import StatsDController from '../util/statsd';

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
