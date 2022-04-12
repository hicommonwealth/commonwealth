import { Request, Response, NextFunction } from 'express';
import validateRoles from 'server/util/validateRoles';
import validateChain from '../../util/validateChain';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const deleteWebhook = async (
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
  const isAdmin = validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) return next(new Error(Errors.NotAdmin));
  // delete webhook
  if (!req.body.webhookUrl) return next(new Error(Errors.MissingWebhook));
  const webhook = await models.Webhook.findOne({
    where: {
      chain_id: chain.id,
      url: req.body.webhookUrl,
    },
  });
  if (!webhook) return next(new Error(Errors.NoWebhookFound));
  await webhook.destroy();
  return res.json({ status: 'Success' });
};

export default deleteWebhook;
