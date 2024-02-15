import { AppError } from '@hicommonwealth/core';
import type { NextFunction, Request, Response } from 'express';
import { validateOwner } from 'server/util/validateOwner';
import { DB } from '../../../../../libs/model/src/models';
import Errors from './errors';

const deleteWebhook = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user, community } = req;

  if (!req.body.webhookUrl) {
    throw new AppError(Errors.MissingWebhook);
  }

  const webhook = await models.Webhook.findOne({
    where: {
      community_id: community.id,
      url: req.body.webhookUrl,
    },
  });
  if (!webhook) {
    throw new AppError(Errors.NoWebhookFound);
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

  // delete webhook
  await webhook.destroy();
  return res.json({ status: 'Success' });
};

export default deleteWebhook;
