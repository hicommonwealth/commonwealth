/* eslint-disable no-restricted-syntax */
import { Request, Response, NextFunction } from 'express';
import validateRoles from '../util/validateRoles';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTopicId: 'Must supply topic ID',
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  TopicNotFound: 'Topic not found',
  TopicRequired: 'Topic name required',
  DefaultTemplateRequired: 'Default Template required',
};

const editTopic = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!req.body.id) {
    return next(new Error(Errors.NoTopicId));
  }
  if (!req.body.name) return next(new Error(Errors.TopicRequired));
  if (
    req.body.featured_in_new_post === 'true' &&
    (!req.body.default_offchain_template ||
      !req.body.default_offchain_template.trim())
  ) {
    return next(new Error(Errors.DefaultTemplateRequired));
  }

  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  if (!adminAddress.verified) {
    return next(new Error(Errors.NotVerified));
  }

  const isAdmin = validateRoles(models, req.user, 'admin', chain.id);
  if (isAdmin === null) {
    return next(new Error(Errors.NotAdmin));
  }

  const {
    id,
    name,
    description,
    telegram,
    featured_order,
    featured_in_sidebar,
    featured_in_new_post,
    default_offchain_template,
  } = req.body;
  try {
    const topic = await models.OffchainTopic.findOne({ where: { id } });
    if (!topic) return next(new Error(Errors.TopicNotFound));
    if (name) topic.name = name;
    if (name || description) topic.description = description || '';
    if (name || telegram) topic.telegram = telegram || '';
    topic.featured_in_sidebar = !!(featured_in_sidebar === 'true');
    topic.featured_in_new_post = !!(featured_in_new_post === 'true');
    topic.default_offchain_template = default_offchain_template || '';
    await topic.save();

    return res.json({ status: 'Success', result: topic.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editTopic;
