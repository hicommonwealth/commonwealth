import type { DB } from '@hicommonwealth/model';
import type { Express } from 'express';
import express from 'express';
import type Router from 'express/lib/router/index';
import passport from 'passport';
import type {
  PostReactionsReq,
  PostTopicsReq,
  PutCommentsReq,
} from '../api/extApiTypes';
import { addEntities } from '../routes/addEntities';
import {
  getComments,
  getCommentsValidation,
} from '../routes/comments/getComments';
import getCommunities, {
  getCommunitiesValidation,
} from '../routes/communities/getCommunities';
import { deleteEntities } from '../routes/deleteEntities';
import getProfiles, {
  getProfilesValidation,
} from '../routes/profiles/getProfiles';
import getReactions, {
  getReactionsValidation,
} from '../routes/reactions/getReactions';
import { getThreads, getThreadsValidation } from '../routes/threads/getThreads';
import { getTopics, getTopicsValidation } from '../routes/topics/getTopics';
import type { TypedRequest } from '../types';
import {
  onlyIds,
  postReactionsValidation,
  postTopicsValidation,
  putCommentsValidation,
} from '../util/helperValidations';

// contains external routes
export function addExternalRoutes(
  endpoint: string,
  app: Express,
  models: DB,
): Router {
  const router = express.Router();

  router.get('/threads', getThreadsValidation, getThreads.bind(this, models));

  router.get(
    '/comments',
    getCommentsValidation,
    getComments.bind(this, models),
  );
  router.put(
    '/comments',
    passport.authenticate('jwt', { session: false }),
    putCommentsValidation,
    addEntities.bind(
      this,
      'community_id',
      models,
      (a) => models.Comment.bulkCreate(a),
      (req: TypedRequest<PutCommentsReq>) => req.body.comments,
    ),
  );
  router.delete(
    '/comments',
    passport.authenticate('jwt', { session: false }),
    onlyIds,
    deleteEntities.bind(this, 'community_id', models, models.Comment),
  );

  router.get(
    '/reactions',
    getReactionsValidation,
    getReactions.bind(this, models),
  );
  router.post(
    '/reactions',
    passport.authenticate('jwt', { session: false }),
    postReactionsValidation,
    addEntities.bind(
      this,
      'community_id',
      models,
      (a) => models.Reaction.bulkCreate(a),
      (req: TypedRequest<PostReactionsReq>) => req.body.reactions,
    ),
  );
  router.delete(
    '/reactions',
    passport.authenticate('jwt', { session: false }),
    onlyIds,
    deleteEntities.bind(this, 'community_id', models, models.Reaction),
  );

  router.get(
    '/communities',
    getCommunitiesValidation,
    getCommunities.bind(this, models),
  );

  router.get(
    '/profiles',
    getProfilesValidation,
    getProfiles.bind(this, models),
  );

  router.get('/topics', getTopicsValidation, getTopics.bind(this, models));
  router.post(
    '/topics',
    postTopicsValidation,
    addEntities.bind(
      this,
      'community_id',
      models,
      (a) => models.Topic.bulkCreate(a),
      (req: TypedRequest<PostTopicsReq>) => req.body.topics,
    ),
  );
  router.delete(
    '/topics',
    onlyIds,
    deleteEntities.bind(this, 'community_id', models, models.Topic),
  );
  app.use(endpoint, router);

  return router;
}
