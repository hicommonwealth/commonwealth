import { Op } from 'sequelize';
import { Response, NextFunction } from 'express';
import validateRoles from '../util/validateRoles';
import validateChain from '../util/validateChain';
import { DB } from '../database';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  TopicRequired: 'Topic name required',
  MustBeAdmin: 'Must be an admin',
  InvalidTokenThreshold: 'Invalid token threshold',
  DefaultTemplateRequired: 'Default Template required',
  InvalidTopicName: 'Only alphanumeric chars allowed',
};

const createTopic = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.name) return next(new Error(Errors.TopicRequired));
  if (req.body.name.match(/["<>%{}|\\/^`]/g))
    return next(new Error(Errors.InvalidTopicName));
  if (
    req.body.featured_in_new_post === 'true' &&
    (!req.body.default_offchain_template ||
      !req.body.default_offchain_template.trim())
  ) {
    return next(new Error(Errors.DefaultTemplateRequired));
  }

  const isAdminOrMod = validateRoles(models, req.user, 'moderator', chain.id);
  if (!isAdminOrMod) {
    return next(new Error(Errors.MustBeAdmin));
  }

  const token_threshold_test = parseInt(req.body.token_threshold, 10);
  if (Number.isNaN(token_threshold_test)) {
    return next(new Error(Errors.InvalidTokenThreshold));
  }
  const options = {
    name: req.body.name,
    description: req.body.description || '',
    token_threshold: req.body.token_threshold,
    featured_in_sidebar: !!(req.body.featured_in_sidebar === 'true'),
    featured_in_new_post: !!(req.body.featured_in_new_post === 'true'),
    default_offchain_template: req.body.default_offchain_template || '',
    chain_id: chain.id,
  };

  const newTopic = await models.OffchainTopic.findOrCreate({
    where: {
      chain_id: chain.id,
      name: req.body.name,
    },
    defaults: options,
  });

  return res.json({ status: 'Success', result: newTopic[0].toJSON() });
};

export default createTopic;
