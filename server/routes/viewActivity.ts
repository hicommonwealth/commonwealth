import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB, sequelize} from '../database';

const Op = Sequelize.Op;

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  const { id } = req.user;

  const query = ``;

  const notifications = await sequelize.query(query);

  return res.json({ status: 'Success', result: notifications.map((n) => n.toJSON()) });
};
