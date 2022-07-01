/* eslint-disable no-restricted-syntax */
import { NextFunction } from 'express';
import validateChain from '../util/validateChain';
import validateRoles from '../util/validateRoles';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { OffchainTopicAttributes } from '../models/offchain_topic';
import { TypedRequestBody, TypedResponse, success } from '../types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTopicId: 'Must supply topic ID',
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  TopicNotFound: 'Topic not found',
  TopicRequired: 'Topic name required',
  DefaultTemplateRequired: 'Default Template required',
  RuleNotFound: 'Rule not found',
};

type EditTopicReq = {
  id: number,
  chain: string,
  address: string,
  name?: string,
  description?: string,
  telegram?: string,
  featured_order: number,
  featured_in_sidebar: string, // boolean
  featured_in_new_post: string, // boolean
  default_offchain_template: string,
  rule_id?: number,
};

type EditTopicResp = OffchainTopicAttributes;

const editTopic = async (
  models: DB,
  req: TypedRequestBody<EditTopicReq>,
  res: TypedResponse<EditTopicResp>,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!req.body.id) {
    return next(new Error(Errors.NoTopicId));
  }
  if (!req.body.name) return next(new Error(Errors.TopicRequired));
  if (req.body.featured_in_new_post === 'true'
    && (!req.body.default_offchain_template || !req.body.default_offchain_template.trim())) {
    return next(new Error(Errors.DefaultTemplateRequired));
  }

  const requesterIsAdmin = await validateRoles(models, req.user, 'admin', chain.id);
  if (requesterIsAdmin === null) {
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
    rule_id,
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
    if (rule_id) {
      const rule = await models.Rule.findOne({ where: { id: rule_id }});
      if (!rule) return next(new Error(Errors.RuleNotFound));
      topic.rule_id = rule_id;
    }
    await topic.save();

    return success(res, topic.toJSON());
  } catch (e) {
    return next(e);
  }
};

export default editTopic;
