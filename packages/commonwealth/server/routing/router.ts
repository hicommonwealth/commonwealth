import type { Express } from 'express';
import express from 'express';
import useragent from 'express-useragent';
import passport from 'passport';
import * as api from '../api';
import { createCommunityStakeHandler } from '../routes/communities/create_community_stakes_handler';
import { getCommunityStakeHandler } from '../routes/communities/get_community_stakes_handler';

import {
  aiTieredMiddleware,
  methodNotAllowedMiddleware,
  registerRoute,
} from '../middleware/methodNotAllowed';
import { getRelatedCommunitiesHandler } from '../routes/communities/get_related_communities_handler';

import communityStats from '../routes/communityStats';
import domain from '../routes/domain';
import finishUpdateEmail from '../routes/finishUpdateEmail';
import getAddressStatus from '../routes/getAddressStatus';
import { healthHandler } from '../routes/health';
import reactionsCounts from '../routes/reactionsCounts';
import starCommunity from '../routes/starCommunity';
import { status } from '../routes/status';
import threadsUsersCountAndAvatars from '../routes/threadsUsersCountAndAvatars';
import updateBanner from '../routes/updateBanner';
import updateEmail from '../routes/updateEmail';
import updateSiteAdmin from '../routes/updateSiteAdmin';

import setDefaultRole from '../routes/setDefaultRole';

import getUploadSignature from '../routes/getUploadSignature';

import logout from '../routes/logout';
import writeUserSetting from '../routes/writeUserSetting';

import updateCommunityCustomDomain from '../routes/updateCommunityCustomDomain';
import updateCommunityPriority from '../routes/updateCommunityPriority';

import { type DB } from '@hicommonwealth/model';
import setAddressWallet from '../routes/setAddressWallet';

import { generateTokenIdea } from '@hicommonwealth/model';
import type DatabaseValidationService from '../middleware/databaseValidationService';
import generateImageHandler from '../routes/generateImage';

import * as controllers from '../controller';
import deleteThreadLinks from '../routes/linking/deleteThreadLinks';
import getLinks from '../routes/linking/getLinks';

import { ServerCommunitiesController } from '../controllers/server_communities_controller';

import { CacheDecorator } from '@hicommonwealth/adapters';
import { rateLimiterMiddleware } from 'server/middleware/rateLimiter';
import { getNamespaceMetadata } from 'server/routes/communities/get_namespace_metadata';
import { config } from '../config';
import { aiCompletionHandler } from '../routes/ai';
import { getCanvasClockHandler } from '../routes/canvas/get_canvas_clock_handler';
import { createChainNodeHandler } from '../routes/communities/create_chain_node_handler';
import { getChainNodesHandler } from '../routes/communities/get_chain_nodes_handler';
import { getCommunitiesHandler } from '../routes/communities/get_communities_handler';
import { updateCommunityIdHandler } from '../routes/communities/update_community_id_handler';
import exportMembersList from '../routes/exportMembersList';
import { getFeedHandler } from '../routes/feed';
import { getThreadsHandler } from '../routes/threads/get_threads_handler';
import { failure } from '../types';
import { setupCosmosProxy } from '../util/comsosProxy/setupCosmosProxy';
import setupIpfsProxy from '../util/ipfsProxy';
import setupUniswapProxy from '../util/uniswapProxy';

export type ServerControllers = {
  communities: ServerCommunitiesController;
};

function setupRouter(
  endpoint: string,
  app: Express,
  models: DB,
  databaseValidationService: DatabaseValidationService,
  cacheDecorator: CacheDecorator,
) {
  const serverControllers: ServerControllers = {
    communities: new ServerCommunitiesController(models),
  };

  const router = express.Router();
  router.use(useragent.express());

  // API routes
  app.use(api.internal.PATH, useragent.express(), api.internal.router);
  app.use(api.external.PATH, useragent.express(), api.external.router);
  app.use(api.integration.PATH, api.integration.build());

  registerRoute(
    router,
    'post',
    '/updateSiteAdmin',
    passport.authenticate('jwt', { session: false }),
    updateSiteAdmin.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/exportMembersList',
    passport.authenticate('jwt', { session: false }),
    exportMembersList.bind(this, models),
  );
  registerRoute(router, 'get', '/domain', domain.bind(this, models));
  registerRoute(router, 'get', '/status', status.bind(this, models));

  // Creating and Managing Addresses
  registerRoute(
    router,
    'post',
    '/getAddressStatus',
    passport.authenticate('jwt', { session: false }),
    getAddressStatus.bind(this, models),
  );

  // communities
  registerRoute(
    router,
    'patch',
    '/communities/update_id',
    passport.authenticate('jwt', { session: false }),
    updateCommunityIdHandler.bind(this, models, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/communities',
    getCommunitiesHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/nodes',
    getChainNodesHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'post',
    '/nodes',
    passport.authenticate('jwt', { session: false }),
    createChainNodeHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/relatedCommunities',
    getRelatedCommunitiesHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/communityStakes/:community_id/:stake_id?',
    getCommunityStakeHandler.bind(this, models, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/namespaceMetadata/:namespace/:stake_id',
    getNamespaceMetadata.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/communityStakes/:community_id/:stake_id',
    passport.authenticate('jwt', { session: false }),
    createCommunityStakeHandler.bind(this, models, serverControllers),
  );

  registerRoute(
    router,
    'post',
    '/starCommunity',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    starCommunity.bind(this, models),
  );

  registerRoute(
    router,
    'get',
    '/threads',
    databaseValidationService.validateCommunity,
    getThreadsHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/feed',
    databaseValidationService.validateCommunity,
    getFeedHandler.bind(this, models, serverControllers),
  );

  // reactions
  registerRoute(
    router,
    'post',
    '/reactionsCounts',
    reactionsCounts.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/threadsUsersCountAndAvatars',
    threadsUsersCountAndAvatars.bind(this, models),
  );

  // roles
  registerRoute(
    router,
    'get',
    '/roles',
    databaseValidationService.validateCommunity,
    controllers.listRoles.bind(this, models),
  );

  // user model update
  registerRoute(
    router,
    'post',
    '/updateEmail',
    passport.authenticate('jwt', { session: false }),
    updateEmail.bind(this, models),
  );
  registerRoute(
    router,
    'get',
    '/finishUpdateEmail',
    finishUpdateEmail.bind(this, models),
  );

  // community banners (update or create)
  registerRoute(
    router,
    'post',
    '/updateBanner',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    updateBanner.bind(this, models),
  );

  // roles
  registerRoute(
    router,
    'post',
    '/setDefaultRole',
    passport.authenticate('jwt', { session: false }),
    setDefaultRole.bind(this, models),
  );

  // uploads
  registerRoute(
    router,
    'post',
    '/getUploadSignature',
    passport.authenticate('jwt', { session: false }),
    getUploadSignature.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/setAddressWallet',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    setAddressWallet.bind(this, models),
  );

  // settings
  registerRoute(
    router,
    'post',
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models),
  );

  // Custom domain update route
  registerRoute(
    router,
    'post',
    '/updateCommunityCustomDomain',
    updateCommunityCustomDomain.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/updateCommunityPriority',
    updateCommunityPriority.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/generateImage',
    rateLimiterMiddleware({
      routerNamespace: 'generateImage',
      requestsPerMinute: config.GENERATE_IMAGE_RATE_LIMIT,
    }),
    passport.authenticate('jwt', { session: false }),
    aiTieredMiddleware({ images: true }),
    generateImageHandler.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/generateTokenIdea',
    rateLimiterMiddleware({
      routerNamespace: 'generateTokenIdea',
      requestsPerMinute: config.GENERATE_IMAGE_RATE_LIMIT,
    }),
    passport.authenticate('jwt', { session: false }),
    aiTieredMiddleware({ images: true, text: true }),
    async (req, res) => {
      // required for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');
      const ideaPrompt =
        typeof req.body?.ideaPrompt === 'string'
          ? req.body?.ideaPrompt
          : undefined;

      const ideaGenerator = generateTokenIdea({ ideaPrompt });

      for await (const chunk of ideaGenerator) {
        if ((chunk as { error?: string }).error) {
          return res.end(
            JSON.stringify({
              status: 'failure',
              message: (chunk as { error?: string }).error,
            }) + '\n',
          );
        }

        res.write(chunk);
        res.flush();
      }

      return res.end();
    },
  );

  // linking
  registerRoute(
    router,
    'delete',
    '/linking/deleteLinks',
    passport.authenticate('jwt', { session: false }),
    deleteThreadLinks.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/linking/getLinks',
    getLinks.bind(this, models),
  );

  // login
  registerRoute(
    router,
    'post',
    '/auth/magic',
    passport.authenticate('magic'),
    (req, res) => {
      // @ts-expect-error StrictNullChecks
      return res.json({ status: 'Success', result: req.user.toJSON() });
    },
  );

  // logout
  registerRoute(router, 'get', '/logout', logout.bind(this, models));

  registerRoute(
    router,
    'get',
    '/communityStats',
    databaseValidationService.validateCommunity,
    communityStats.bind(this, models),
  );

  registerRoute(
    router,
    'get',
    '/getCanvasClock',
    getCanvasClockHandler.bind(this, serverControllers),
  );

  registerRoute(router, 'get', '/health', healthHandler.bind(this));

  registerRoute(
    router,
    'post',
    '/aicompletion',
    passport.authenticate('jwt', { session: false }),
    aiTieredMiddleware({ text: true }),
    aiCompletionHandler,
  );

  // proxies
  setupCosmosProxy(router, cacheDecorator);
  setupIpfsProxy(router, cacheDecorator);
  setupUniswapProxy(router, cacheDecorator);

  app.use(endpoint, router);

  app.use(methodNotAllowedMiddleware());

  app.use('/api/*', function (_req, res) {
    res.status(404);
    return failure(res, 'Not Found');
  });
}

export default setupRouter;
