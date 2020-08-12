/* eslint-disable no-restricted-syntax */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTopicId: 'Must provide topic ID',
  NotAdmin: 'Only admins can delete topics',
  TopicNotFound: 'Topic not found',
  DeleteFail: 'Could not delete topic',
};

const deleteTopic = async (models, req, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NoTopicId));
  }
  if (req.body.featured_order && !req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }

  const { id } = req.body;
  const topic = await models.OffchainTopic.findOne({ where: { id } });
  if (!topic) return next(new Error(Errors.TopicNotFound));

  topic.destroy().then(() => {
    res.json({ status: 'Success' });
  }).catch((e) => {
    next(new Error(Errors.DeleteFail));
  });
};

export default deleteTopic;
