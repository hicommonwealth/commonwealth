import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import { Op } from 'sequelize';
import { findAllRoles } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  TopicRequired: 'Topic name required',
  MustBeAdmin: 'Must be an admin',
  InvalidTokenThreshold: 'Invalid token threshold',
  DefaultTemplateRequired: 'Default Template required',
  InvalidTopicName: 'Topic uses disallowed special characters',
};

const createTopic = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));

  const name = req.body.name.trim();
  if (!name) return next(new AppError(Errors.TopicRequired));
  if (req.body.name.match(/["<>%{}|\\/^`]/g)) {
    return next(new AppError(Errors.InvalidTopicName));
  }

  const featured_in_sidebar = req.body.featured_in_sidebar === 'true';
  const featured_in_new_post = req.body.featured_in_new_post === 'true';
  const default_offchain_template = req.body.default_offchain_template?.trim();
  if (featured_in_new_post && !default_offchain_template) {
    return next(new AppError(Errors.DefaultTemplateRequired));
  }

  const userAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const adminRoles = await findAllRoles(
    models,
    { where: { address_id: { [Op.in]: userAddressIds } } },
    chain.id,
    ['admin', 'moderator']
  );
  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new AppError(Errors.MustBeAdmin));
  }

  const isNumber = /^\d+$/.test(req.body.token_threshold);
  if (!isNumber) {
    return next(new AppError(Errors.InvalidTokenThreshold));
  }

  const options = {
    name,
    description: req.body.description || '',
    token_threshold: req.body.token_threshold,
    featured_in_sidebar,
    featured_in_new_post,
    default_offchain_template: default_offchain_template || '',
    chain_id: chain.id,
  };

  const newTopic = await models.Topic.findOrCreate({
    where: {
      name,
      chain_id: chain.id,
    },
    defaults: options,
  });

  return res.json({ status: 'Success', result: newTopic[0].toJSON() });
};

export default createTopic;
