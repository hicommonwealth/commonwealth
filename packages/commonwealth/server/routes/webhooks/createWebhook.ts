import { Request, Response, NextFunction } from 'express';
import validateChain from '../../util/validateChain';
import Errors from './errors';
import { AppError, ServerError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

const createWebhook = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  // if chain is present we know we are dealing with a chain first community

  // only admins should be able to get webhooks
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();
  const adminRoles = await models.Role.findAll({
    where: {
      chain_id: chain.id,
      address_id: addresses.filter((addr) => !!addr.verified).map((addr) => addr.id),
      permission: ['admin']
    },
  });
  if (!req.user.isAdmin && adminRoles.length === 0) return next(new AppError(Errors.NotAdmin));
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
