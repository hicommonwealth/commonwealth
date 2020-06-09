import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../../util/lookupCommunityIsVisibleToUser';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getWebhooks = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);
  // if chain is present we know we are dealing with a chain first community
  const chainOrCommObj = (chain) ? { chain_id: chain.id } : { offchain_community_id: community.id };

  // only admins should be able to get webhooks
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();
  const adminRoles = await models.Role.findAll({
    where: {
      ...chainOrCommObj,
      address_id: addresses.map((addr) => addr.id),
      permission: ['admin']
    },
  });
  if (adminRoles.length === 0) return next(new Error(Errors.NotAdmin));
  // fetch webhooks
  const webhooks = await models.Webhook.findAll({ where: chainOrCommObj });
  return res.json({ status: 'Success', result: webhooks });
};

export default getWebhooks;
