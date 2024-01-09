import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import { findAllRoles } from '../../util/roles';
import Errors from './errors';

const getWebhooks = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const chain = req.chain;

  // only admins should be able to get webhooks
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();
  const adminRoles = await findAllRoles(
    models,
    {
      where: {
        address_id: addresses
          .filter((addr) => !!addr.verified)
          .map((addr) => addr.id),
      },
    },
    chain.id,
    ['admin'],
  );
  if (!req.user.isAdmin && adminRoles.length === 0)
    return next(new AppError(Errors.NotAdmin));
  // fetch webhooks
  const webhooks = await models.Webhook.findAll({
    where: { community_id: chain.id },
  });
  return res.json({
    status: 'Success',
    result: webhooks.map((w) => w.toJSON()),
  });
};

export default getWebhooks;
