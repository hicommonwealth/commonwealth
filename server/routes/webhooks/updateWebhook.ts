import { Request, Response, NextFunction } from 'express';
import validateRoles from 'server/util/validateRoles';
import validateChain from '../../util/validateChain';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const updateWebhook = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  // only admins should be able to update webhooks
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const isAdmin = validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) return next(new Error(Errors.NotAdmin));
  // check if webhook url exists already in the community
  if (!req.body.webhookId) return next(new Error(Errors.MissingWebhook));
  const existingWebhook = await models.Webhook.findOne({
    where: {
      id: req.body.webhookId,
    },
  });
  if (!existingWebhook) return next(new Error(Errors.NoWebhookFound));
  existingWebhook.categories =
    typeof req.body['categories[]'] === 'string'
      ? [req.body['categories[]']]
      : req.body['categories[]'] || [];
  await existingWebhook.save();
  return res.json({ status: 'Success', result: existingWebhook.toJSON() });
};

export default updateWebhook;
