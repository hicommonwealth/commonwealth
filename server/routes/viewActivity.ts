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

  const query = `SELECT * FROM "Notifications" n 
                WHERE n.chain_id IN(SELECT r.chain_id from "Roles" r 
                    inner join "Addresses" a ON r.address_id = a.id
                    WHERE a.user_id = $id)
                ORDER BY n.created_at DESC
                LIMIT 50`;

  const notifications = await sequelize.query(query);
  console.log(notifications);

  return res.json({ status: 'Success', result: notifications });
};
