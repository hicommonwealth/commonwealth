import { Request, Response } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));
import { getStatsDInstance } from '../util/metrics';

const logout = async (models: DB, req: Request, res: Response) => {
  getStatsDInstance().decrement('cw.users.logged_in');
  req.logout();
};

export default logout;
