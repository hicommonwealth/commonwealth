import { Request, Response, NextFunction } from 'express';
import validateChain from '../../util/validateChain';
import Errors from './errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { AppError, ServerError } from '../../util/errors';

const log = factory.getLogger(formatFilename(__filename));

const getWebhooks = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  // only admins should be able to get webhooks
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const addresses = await req.user.getAddresses();
  const adminRoles = await models.Role.findAll({
    where: {
      chain_id: chain.id,
      address_id: addresses.filter((addr) => !!addr.verified).map((addr) => addr.id),
      permission: ['admin']
    },
  });
  if (!req.user.isAdmin && adminRoles.length === 0) return next(new AppError(Errors.NotAdmin));
  // fetch webhooks
  const webhooks = await models.Webhook.findAll({ where: {chain_id: chain.id} });
  return res.json({ status: 'Success', result: webhooks.map((w) => w.toJSON()) });
};

export default getWebhooks;
