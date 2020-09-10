import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../../util/lookupCommunityIsVisibleToUser';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const updateWebhook = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  // if chain is present we know we are dealing with a chain first community
  const chainOrCommObj = (chain) ? { chain_id: chain.id } : { offchain_community_id: community.id };

  // only admins should be able to update webhooks
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();
  const adminRoles = await models.Role.findAll({
    where: {
      ...chainOrCommObj,
      address_id: addresses.filter((addr) => !!addr.verified).map((addr) => addr.id),
      permission: ['admin']
    },
  });
  if (adminRoles.length === 0) return next(new Error(Errors.NotAdmin));
  // check if webhook url exists already in the community
  if (!req.body.webhookId) return next(new Error(Errors.MissingWebhook));
  const existingWebhook = await models.Webhook.findOne({
    where: {
      ...chainOrCommObj,
      id: req.body.webhookId,
    },
  });
  if (!existingWebhook) return next(new Error(Errors.NoWebhookFound));

  await existingWebhook.update({ categories: req.body.categories, });

  return res.json({ status: 'Success', result: existingWebhook.toJSON() });
};

export default updateWebhook;
