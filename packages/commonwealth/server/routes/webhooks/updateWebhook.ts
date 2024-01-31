import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import { validateOwner } from 'server/util/validateOwner';
import { DB } from '../../../../../libs/model/src/models';
import Errors from './errors';

const updateWebhook = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user } = req;

  // check if webhook url exists already in the community
  if (!req.body.webhookId) {
    return next(new AppError(Errors.MissingWebhook));
  }
  if (!req.body.categories) {
    return next(new AppError(Errors.MissingCategories));
  }
  const webhook = await models.Webhook.findByPk(req.body.webhookId);
  if (!webhook) {
    return next(new AppError(Errors.NoWebhookFound));
  }

  const isAdmin = await validateOwner({
    models: models,
    user,
    communityId: webhook.community_id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    return next(new AppError(Errors.NotAdmin));
  }

  webhook.categories = req.body.categories || [];

  await webhook.save();

  return res.json({ status: 'Success', result: webhook.toJSON() });
};

export default updateWebhook;
