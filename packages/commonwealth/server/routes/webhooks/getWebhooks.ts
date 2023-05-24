import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import Errors from './errors';

const getWebhooks = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  // only admins should be able to get webhooks
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();
  const adminRole = await models.Address.findOne({
    where: {
      chain: chain,
      id: {
        [Op.in]: addresses
          .filter((addr) => !!addr.verified)
          .map((addr) => addr.id),
      },
    },
    attributes: ['role'],
  });

  if (!req.user.isAdmin && adminRole?.role !== 'admin')
    return next(new AppError(Errors.NotAdmin));
  // fetch webhooks
  const webhooks = await models.Webhook.findAll({
    where: { chain_id: chain.id },
  });
  return res.json({
    status: 'Success',
    result: webhooks.map((w) => w.toJSON()),
  });
};

export default getWebhooks;
