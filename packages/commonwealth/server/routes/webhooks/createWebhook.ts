import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import Errors from './errors';

const createWebhook = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  // if chain is present we know we are dealing with a chain first community

  // only admins should be able to get webhooks
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();

  const adminRole = await models.Address.findOne({
    where: {
      chain: chain.id,
      id: {
        [Op.in]: addresses
          .filter((addr) => !!addr.verified)
          .map((addr) => addr.id),
      },
      role: { [Op.in]: ['admin', 'moderator'] },
    },
    attributes: ['role'],
  });

  if (!req.user.isAdmin && adminRole)
    return next(new AppError(Errors.NotAdmin));
  // check if webhook url exists already in the community
  if (!req.body.webhookUrl) return next(new AppError(Errors.MissingWebhook));
  const existingWebhook = await models.Webhook.findOne({
    where: {
      chain_id: chain.id,
      url: req.body.webhookUrl,
    },
  });
  if (existingWebhook) return next(new AppError(Errors.NoDuplicates));
  // create webhook
  const webhook = await models.Webhook.create({
    chain_id: chain.id,
    url: req.body.webhookUrl,
  });
  return res.json({ status: 'Success', result: webhook.toJSON() });
};

export default createWebhook;
