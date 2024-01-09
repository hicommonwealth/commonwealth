import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import { findAllRoles } from '../../util/roles';
import Errors from './errors';

const updateWebhook = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const chain = req.chain;
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
    ['admin'],
  );

  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new AppError(Errors.NotAdmin));
  }
  // check if webhook url exists already in the community
  if (!req.body.webhookId) {
    return next(new AppError(Errors.MissingWebhook));
  }

  const existingWebhook = await models.Webhook.findOne({
    where: {
      id: req.body.webhookId,
    },
  });

  if (!existingWebhook) {
    return next(new AppError(Errors.NoWebhookFound));
  }

  if (!req.body.categories) {
    return next(new AppError(Errors.MissingCategories));
  }

  existingWebhook.categories = req.body.categories || [];

  await existingWebhook.save();

  return res.json({ status: 'Success', result: existingWebhook.toJSON() });
};

export default updateWebhook;
