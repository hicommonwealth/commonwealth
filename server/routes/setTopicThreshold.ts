import { Response, NextFunction } from 'express';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  MissingTopicIdOrThreshold: 'Missing topic ID or threshold',
  InvalidTopicId: 'Invalid topic ID',
  InvalidThreshold: 'Invalid threshold'
};

const setTopicThreshold = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.topic_id || req.body.token_threshold === undefined) {
    return next(new Error(Errors.MissingTopicIdOrThreshold));
  }

  const topic = await models.OffchainTopic.findOne({
    where: {
      id: req.body.topic_id,
    }
  });
  if (!topic) return next(new Error(Errors.InvalidTopicId));

  const token_threshold = parseInt(req.body.token_threshold, 10);
  if (Number.isNaN(token_threshold) || token_threshold < 0) {
    return next(new Error(Errors.InvalidThreshold));
  }

  await models.OffchainTopic.update({
    token_threshold
  },
  {
    where: {
      id: req.body.topic_id
    }
  });

  return res.json({ status: 'Success' });
};

export default setTopicThreshold;
