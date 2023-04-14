import type { DB } from '../models';
/* eslint-disable no-restricted-syntax */
import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import { QueryTypes } from 'sequelize';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTopicId: 'Must provide topic ID',
  NotAdmin: 'Only admins can delete topics',
  TopicNotFound: 'Topic not found',
  DeleteFail: 'Could not delete topic',
};

const deleteTopic = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.id) {
    return next(new AppError(Errors.NoTopicId));
  }
  if (req.body.featured_order && !req.user.isAdmin) {
    return next(new AppError(Errors.NotAdmin));
  }

  const { id } = req.body;
  const topic = await models.Topic.findOne({ where: { id } });
  if (!topic) return next(new AppError(Errors.TopicNotFound));

  const chainOrCommunity = 'chain = $chain';
  const bind = { chain: chain.id };
  bind['id'] = id;
  const query = `UPDATE "Threads" SET topic_id=null WHERE topic_id = $id AND ${chainOrCommunity};`;
  await models.sequelize.query(query, {
    bind,
    type: QueryTypes.UPDATE,
  });

  topic
    .destroy()
    .then(() => {
      res.json({ status: 'Success' });
    })
    .catch(() => {
      next(new ServerError(Errors.DeleteFail));
    });
};

export default deleteTopic;
