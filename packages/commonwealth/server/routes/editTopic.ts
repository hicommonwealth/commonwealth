/* eslint-disable no-restricted-syntax */
import { AppError } from '@hicommonwealth/core';
import type { DB, TopicAttributes } from '@hicommonwealth/model';
import type { NextFunction } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

// TODO Graham 8-12-22: This route has high redundancy with createTopic, and has fallen out of sync.
// We should consider merging or consolidating somehow, to prevent checks diverging again.

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoTopicId: 'Must supply topic ID',
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  TopicNotFound: 'Topic not found',
  TopicRequired: 'Topic name required',
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
  featured_in_sidebar: boolean;
};

type EditTopicResp = TopicAttributes;

const editTopic = async (
  models: DB,
  req: TypedRequestBody<EditTopicReq>,
  res: TypedResponse<EditTopicResp>,
  next: NextFunction,
) => {
  const chain = req.chain;
  if (!req.body.id) {
    return next(new AppError(Errors.NoTopicId));
  }

  const name = req.body.name.trim();
  if (!name) return next(new AppError(Errors.TopicRequired));
  if (req.body.name.match(/["<>%{}|\\/^`]/g)) {
    return next(new AppError(Errors.InvalidTopicName));
  }

  const featured_in_sidebar = req.body.featured_in_sidebar;

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: chain.id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    return next(new AppError(Errors.NotAdmin));
  }

  const { id, description, telegram } = req.body;
  try {
    const topic = await models.Topic.findOne({ where: { id } });
    if (!topic) return next(new AppError(Errors.TopicNotFound));
    if (name) topic.name = name;
    if (name || description) topic.description = description || '';
    if (name || telegram) topic.telegram = telegram || '';
    topic.featured_in_sidebar = featured_in_sidebar;
    await topic.save();

    return success(res, topic.toJSON());
  } catch (e) {
    return next(e);
  }
};

export default editTopic;
