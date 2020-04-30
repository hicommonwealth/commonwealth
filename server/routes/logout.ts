import { Response } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const logout = async (models, req: UserRequest, res: Response) => {
  // Passport has a race condition where req.logout resolves too
  // early, so we also call req.session.destroy() and clear the
  // session cookie before returning
  req.logout();
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

export default logout;
