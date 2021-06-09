import { Response, NextFunction } from 'express';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  MissingTopicIdOrThreshold: 'Missing topic ID or threshold',
  InvalidTopicId: 'Invalid topic ID'
};

const setTopicThreshold = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.topic_id || req.body.token_threshold === undefined) return next(new Error(Errors.MissingTopicIdOrThreshold));

  const topic = await models.OffchainTopic.findOne({
    where: {
      id: req.body.topic_id,
    }
  });
  if (!topic) return next(new Error(Errors.InvalidTopicId));

  await models.OffchainTopic.update({
    token_threshold: parseInt(req.body.token_threshold, 10)
  },
  {
    where: {
      id: req.body.topic_id
    }
  });

  return res.json({ status: 'Success' });
};

export default setTopicThreshold;
