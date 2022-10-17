/* eslint-disable no-restricted-syntax */
import { NextFunction } from 'express';
import { factory, formatFilename } from 'common-common/src/logging';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';
import { DB } from '../models';
import { TopicAttributes } from '../models/topic';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { AppError, ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

// TODO Graham 8-12-22: This route has high redundancy with createTopic, and has fallen out of sync.
// We should consider merging or consolidating somehow, to prevent checks diverging again.

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTopicId: 'Must supply topic ID',
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  TopicNotFound: 'Topic not found',
  TopicRequired: 'Topic name required',
  DefaultTemplateRequired: 'Default Template required',
  RuleNotFound: 'Rule not found',
  InvalidTopicName: 'Topic uses disallowed special characters',
};

type EditTopicReq = {
  id: number;
  chain: string;
  address: string;
  name?: string;
  description?: string;
  telegram?: string;
  featured_order: number;
  featured_in_sidebar: string; // boolean
  featured_in_new_post: string; // boolean
  default_offchain_template: string;
  rule_id?: number;
};

type EditTopicResp = TopicAttributes;

const editTopic = async (
  models: DB,
  req: TypedRequestBody<EditTopicReq>,
  res: TypedResponse<EditTopicResp>,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  if (!req.body.id) {
    return next(new AppError(Errors.NoTopicId));
  }

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

  const requesterIsAdmin = await validateRoles(
    models,
    req.user,
    'admin',
    chain.id
  );
  if (requesterIsAdmin === null) {
    return next(new AppError(Errors.NotAdmin));
  }

  const { id, description, telegram, rule_id } = req.body;
  try {
    const topic = await models.Topic.findOne({ where: { id } });
    if (!topic) return next(new AppError(Errors.TopicNotFound));
    if (name) topic.name = name;
    if (name || description) topic.description = description || '';
    if (name || telegram) topic.telegram = telegram || '';
    topic.featured_in_sidebar = featured_in_sidebar;
    topic.featured_in_new_post = featured_in_new_post;
    topic.default_offchain_template = default_offchain_template || '';
    if (rule_id) {
      const rule = await models.Rule.findOne({ where: { id: rule_id } });
      if (!rule) return next(new AppError(Errors.RuleNotFound));
      topic.rule_id = rule_id;
    }
    await topic.save();

    return success(res, topic.toJSON());
  } catch (e) {
    return next(e);
  }
};

export default editTopic;
