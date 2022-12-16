import { Request, Response, NextFunction } from 'express';
import validateChain from '../../middleware/validateChain';
import Errors from './errors';
import { AppError, ServerError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { findAllRoles } from '../../util/roles';

const log = factory.getLogger(formatFilename(__filename));

const updateWebhook = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  // only admins should be able to update webhooks
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
    ['admin']
  );
  if (!req.user.isAdmin && adminRoles.length === 0)
    return next(new AppError(Errors.NotAdmin));
  // check if webhook url exists already in the community
  if (!req.body.webhookId) return next(new AppError(Errors.MissingWebhook));
  const existingWebhook = await models.Webhook.findOne({
    where: {
      id: req.body.webhookId,
    },
  });
  if (!existingWebhook) return next(new AppError(Errors.NoWebhookFound));
  existingWebhook.categories =
    typeof req.body['categories[]'] === 'string'
      ? [req.body['categories[]']]
      : req.body['categories[]'] || [];
  await existingWebhook.save();
  return res.json({ status: 'Success', result: existingWebhook.toJSON() });
};

export default updateWebhook;
