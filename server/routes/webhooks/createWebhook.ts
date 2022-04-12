import { Request, Response, NextFunction } from 'express';
import validateRoles from '../../util/validateRoles';
import validateChain from '../../util/validateChain';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const createWebhook = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  // if chain is present we know we are dealing with a chain first community

  // only admins should be able to get webhooks
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const isAdmin = await validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) return next(new Error(Errors.NotAdmin));
  // check if webhook url exists already in the community
  if (!req.body.webhookUrl) return next(new Error(Errors.MissingWebhook));
  const existingWebhook = await models.Webhook.findOne({
    where: {
      chain_id: chain.id,
      url: req.body.webhookUrl,
    },
  });
  if (existingWebhook) return next(new Error(Errors.NoDuplicates));
  // create webhook
  const webhook = await models.Webhook.create({
    chain_id: chain.id,
    url: req.body.webhookUrl,
  });
  return res.json({ status: 'Success', result: webhook.toJSON() });
};

export default createWebhook;
