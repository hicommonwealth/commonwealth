import { AppError } from '@hicommonwealth/core';
import type { NextFunction, Request, Response } from 'express';
import { findAllRoles } from '../../util/roles';
import Errors from './errors';

const createWebhook = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community } = req;
  // if community is present we know we are dealing with a chain first community

  // only admins should be able to get webhooks
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
    community.id,
    ['admin'],
  );
  if (!req.user.isAdmin && adminRoles.length === 0)
    return next(new AppError(Errors.NotAdmin));
  // check if webhook url exists already in the community
  if (!req.body.webhookUrl) return next(new AppError(Errors.MissingWebhook));
  const existingWebhook = await models.Webhook.findOne({
    where: {
      community_id: community.id,
      url: req.body.webhookUrl,
    },
  });
  if (existingWebhook) return next(new AppError(Errors.NoDuplicates));
  // create webhook
  const webhook = await models.Webhook.create({
    community_id: community.id,
    url: req.body.webhookUrl,
  });
  return res.json({ status: 'Success', result: webhook.toJSON() });
};

export default createWebhook;
