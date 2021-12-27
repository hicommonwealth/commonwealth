import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB, sequelize } from '../database';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

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

  // locate active subscriptions, filter by category if specified
  let searchParams: string;
  if (req.body.active_only) {
    searchParams = ` AND is_active = true `
  }
  if (req.body.categories && req.body.categories.length) {
    searchParams += `AND category_id IN (?)`
  }

  const subscriptions = await sequelize.query(
    `
        SELECT notification_id as id,
               subscription_id,
               is_read,
               notification_data,
               chain_event_id,
               chain_event_type_id,
               block_number,
               event_data,
               entity_id,
               chain,
               event_name,
               event_network
        FROM "Notifications_Read",
             "Notifications" N
                 LEFT OUTER JOIN "ChainEvents" CE ON chain_event_id = CE.id
                 LEFT OUTER JOIN "ChainEventTypes" CET ON CE.chain_event_type_id = CET.id
        WHERE subscription_id IN (SELECT id FROM "Subscriptions" WHERE subscriber_id = ?${searchParams})
          AND notification_id = N.id;
		`,
    {
      replacements: [req.user.id, req.body.categories],
      raw: true,
      type: 'SELECT',
    }
  );

  // return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
  return res.json({
    status: 'Success',
    result: subscriptions,
  });
};
