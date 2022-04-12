import { Request, Response, NextFunction } from 'express';
import validateRoles from 'server/util/validateRoles';
import validateChain from '../../util/validateChain';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getWebhooks = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  // only admins should be able to get webhooks
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const isAdmin = validateRoles(models, req.user, 'admin', chain.id);
  if (!isAdmin) return next(new Error(Errors.NotAdmin));
  // fetch webhooks
  const webhooks = await models.Webhook.findAll({
    where: { chain_id: chain.id },
  });
  return res.json({
    status: 'Success',
    result: webhooks.map((w) => w.toJSON()),
  });
};

export default getWebhooks;
