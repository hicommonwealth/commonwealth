import type { Express } from 'express';
import express from 'express';
import useragent from 'express-useragent';
import passport from 'passport';
import * as api from '../api';
import { createCommunityStakeHandler } from '../routes/communities/create_community_stakes_handler';
import { getCommunityStakeHandler } from '../routes/communities/get_community_stakes_handler';

import {
  methodNotAllowedMiddleware,
  registerRoute,
} from '../middleware/methodNotAllowed';
import { getRelatedCommunitiesHandler } from '../routes/communities/get_related_communities_handler';

import communityStats from '../routes/communityStats';
import createAddress from '../routes/createAddress';
import deleteAddress from '../routes/deleteAddress';
import domain from '../routes/domain';
import finishUpdateEmail from '../routes/finishUpdateEmail';
import getAddressProfile, {
  getAddressProfileValidation,
} from '../routes/getAddressProfile';
import getAddressStatus from '../routes/getAddressStatus';
import { healthHandler } from '../routes/health';
import reactionsCounts from '../routes/reactionsCounts';
import selectCommunity from '../routes/selectCommunity';
import starCommunity from '../routes/starCommunity';
import { status } from '../routes/status';
import threadsUsersCountAndAvatars from '../routes/threadsUsersCountAndAvatars';
import updateBanner from '../routes/updateBanner';
import updateEmail from '../routes/updateEmail';
import updateSiteAdmin from '../routes/updateSiteAdmin';
import verifyAddress from '../routes/verifyAddress';
import viewComments from '../routes/viewComments';
import viewCount from '../routes/viewCount';

import getProfileNew from '../routes/getNewProfile';
import setDefaultRole from '../routes/setDefaultRole';
import upgradeMember, {
  upgradeMemberValidation,
} from '../routes/upgradeMember';
import viewGlobalActivity from '../routes/viewGlobalActivity';
import viewUserActivity from '../routes/viewUserActivity';

import getUploadSignature from '../routes/getUploadSignature';

import logout from '../routes/logout';
import writeUserSetting from '../routes/writeUserSetting';

import updateCommunityCategory from '../routes/updateCommunityCategory';
import updateCommunityCustomDomain from '../routes/updateCommunityCustomDomain';
import updateCommunityPriority from '../routes/updateCommunityPriority';
import type ViewCountCache from '../util/viewCountCache';

import { type DB, type GlobalActivityCache } from '@hicommonwealth/model';
import banAddress from '../routes/banAddress';
import setAddressWallet from '../routes/setAddressWallet';

import type DatabaseValidationService from '../middleware/databaseValidationService';
import generateImage from '../routes/generateImage';

import * as controllers from '../controller';
import addThreadLink from '../routes/linking/addThreadLinks';
import deleteThreadLinks from '../routes/linking/deleteThreadLinks';
import getLinks from '../routes/linking/getLinks';
import markCommentAsSpam from '../routes/spam/markCommentAsSpam';
import unmarkCommentAsSpam from '../routes/spam/unmarkCommentAsSpam';

import { ServerAdminController } from '../controllers/server_admin_controller';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import { ServerCommentsController } from '../controllers/server_comments_controller';
import { ServerCommunitiesController } from '../controllers/server_communities_controller';
import { ServerGroupsController } from '../controllers/server_groups_controller';
import { ServerPollsController } from '../controllers/server_polls_controller';
import { ServerProfilesController } from '../controllers/server_profiles_controller';
import { ServerThreadsController } from '../controllers/server_threads_controller';
import { ServerTopicsController } from '../controllers/server_topics_controller';

import { CacheDecorator } from '@hicommonwealth/adapters';
import { ServerTagsController } from 'server/controllers/server_tags_controller';
import { rateLimiterMiddleware } from 'server/middleware/rateLimiter';
import { getTopUsersHandler } from 'server/routes/admin/get_top_users_handler';
import { getNamespaceMetadata } from 'server/routes/communities/get_namespace_metadata';
import { config } from '../config';
import { getStatsHandler } from '../routes/admin/get_stats_handler';
import { getCanvasClockHandler } from '../routes/canvas/get_canvas_clock_handler';
import { searchCommentsHandler } from '../routes/comments/search_comments_handler';
import { createChainNodeHandler } from '../routes/communities/create_chain_node_handler';
import { getChainNodesHandler } from '../routes/communities/get_chain_nodes_handler';
import { getCommunitiesHandler } from '../routes/communities/get_communities_handler';
import { updateCommunityIdHandler } from '../routes/communities/update_community_id_handler';
import exportMembersList from '../routes/exportMembersList';
import { getFeedHandler } from '../routes/feed';
import { getGroupsHandler } from '../routes/groups/get_groups_handler';
import { refreshMembershipHandler } from '../routes/groups/refresh_membership_handler';
import { deletePollHandler } from '../routes/polls/delete_poll_handler';
import { getPollVotesHandler } from '../routes/polls/get_poll_votes_handler';
import { updatePollVoteHandler } from '../routes/polls/update_poll_vote_handler';
import { searchProfilesHandler } from '../routes/profiles/search_profiles_handler';
import { getTagsHandler } from '../routes/tags/get_tags_handler';
import { createThreadPollHandler } from '../routes/threads/create_thread_poll_handler';
import { getThreadPollsHandler } from '../routes/threads/get_thread_polls_handler';
import { getThreadsHandler } from '../routes/threads/get_threads_handler';
import { getTopicsHandler } from '../routes/topics/get_topics_handler';
import { updateTopicChannelHandler } from '../routes/topics/update_topic_channel_handler';
import { updateTopicsOrderHandler } from '../routes/topics/update_topics_order_handler';
import { failure } from '../types';
import { setupCosmosProxy } from '../util/comsosProxy/setupCosmosProxy';
import setupIpfsProxy from '../util/ipfsProxy';

export type ServerControllers = {
  threads: ServerThreadsController;
  comments: ServerCommentsController;
  analytics: ServerAnalyticsController;
  profiles: ServerProfilesController;
  communities: ServerCommunitiesController;
  polls: ServerPollsController;
  groups: ServerGroupsController;
  topics: ServerTopicsController;
  admin: ServerAdminController;
  tags: ServerTagsController;
};

function setupRouter(
  endpoint: string,
  app: Express,
  models: DB,
  viewCountCache: ViewCountCache,
  globalActivityCache: GlobalActivityCache,
  databaseValidationService: DatabaseValidationService,
  cacheDecorator: CacheDecorator,
) {
  // controllers
  const serverControllers: ServerControllers = {
    threads: new ServerThreadsController(models, globalActivityCache),
    comments: new ServerCommentsController(models, globalActivityCache),
    analytics: new ServerAnalyticsController(),
    profiles: new ServerProfilesController(models),
    communities: new ServerCommunitiesController(models),
    polls: new ServerPollsController(models),
    groups: new ServerGroupsController(models),
    topics: new ServerTopicsController(models),
    admin: new ServerAdminController(models),
    tags: new ServerTagsController(models),
  };

  // ---

  const router = express.Router();
  router.use(useragent.express());

  // API routes
  app.use(api.internal.PATH, useragent.express(), api.internal.router);
  app.use(api.external.PATH, useragent.express(), api.external.router);
  app.use(
    api.integration.PATH,
    api.integration.build(databaseValidationService),
  );

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
    '/createAddress',
    createAddress.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/verifyAddress',
    verifyAddress.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/deleteAddress',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    deleteAddress.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/getAddressStatus',
    passport.authenticate('jwt', { session: false }),
    getAddressStatus.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/getAddressProfile',
    getAddressProfileValidation,
    getAddressProfile.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/selectCommunity',
    passport.authenticate('jwt', { session: false }),
    selectCommunity.bind(this, models),
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
    '/admin/analytics',
    passport.authenticate('jwt', { session: false }),
    getStatsHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/admin/top-users',
    passport.authenticate('jwt', { session: false }),
    getTopUsersHandler.bind(this, serverControllers),
  );

  // polls
  registerRoute(
    router,
    'post',
    '/threads/:id/polls',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    createThreadPollHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/threads/:id/polls',
    getThreadPollsHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'delete',
    '/polls/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    deletePollHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'put',
    '/polls/:id/votes',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    updatePollVoteHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/polls/:id/votes',
    getPollVotesHandler.bind(this, serverControllers),
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

  registerRoute(
    router,
    'get',
    '/profiles',
    databaseValidationService.validateCommunity,
    searchProfilesHandler.bind(this, serverControllers),
  );
  registerRoute(router, 'get', '/profile/v2', getProfileNew.bind(this, models));

  // comments
  registerRoute(
    router,
    'get',
    '/viewComments',
    databaseValidationService.validateCommunity,
    viewComments.bind(this, models),
  );
  registerRoute(
    router,
    'get',
    '/comments',
    databaseValidationService.validateCommunity,
    searchCommentsHandler.bind(this, serverControllers),
  );

  // topics
  registerRoute(
    router,
    'patch',
    '/topics/:topicId/channels/:channelId' /* OLD: /updateTopic */,
    passport.authenticate('jwt', { session: false }),
    updateTopicChannelHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'put',
    '/topics-order' /* OLD: /orderTopics */,
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    updateTopicsOrderHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/topics' /* OLD: /bulkTopics */,
    databaseValidationService.validateCommunity,
    getTopicsHandler.bind(this, serverControllers),
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

  // tags
  registerRoute(
    router,
    'get',
    '/tags',
    getTagsHandler.bind(this, serverControllers),
  );

  // roles
  registerRoute(
    router,
    'get',
    '/roles',
    databaseValidationService.validateCommunity,
    controllers.listRoles.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/upgradeMember',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    upgradeMemberValidation,
    upgradeMember.bind(this, models),
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

  // viewCount
  registerRoute(
    router,
    'post',
    '/viewCount',
    viewCount.bind(this, models, viewCountCache),
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
    '/viewUserActivity',
    passport.authenticate('jwt', { session: false }),
    viewUserActivity.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/viewGlobalActivity',
    viewGlobalActivity.bind(this, models, globalActivityCache),
  );

  registerRoute(
    router,
    'post',
    '/setAddressWallet',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    setAddressWallet.bind(this, models),
  );

  // community categories
  registerRoute(
    router,
    'post',
    '/updateCommunityCategory',
    passport.authenticate('jwt', { session: false }),
    updateCommunityCategory.bind(this, models),
  );

  // settings
  registerRoute(
    router,
    'post',
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models),
  );

  // bans
  registerRoute(
    router,
    'post',
    '/banAddress',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    banAddress.bind(this, models),
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
    generateImage.bind(this, models),
  );

  // linking
  registerRoute(
    router,
    'post',
    '/linking/addThreadLinks',
    passport.authenticate('jwt', { session: false }),
    addThreadLink.bind(this, models),
  );
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

  // thread spam
  registerRoute(
    router,
    'put',
    '/comments/:id/spam',
    passport.authenticate('jwt', { session: false }),
    markCommentAsSpam.bind(this, models),
  );
  registerRoute(
    router,
    'delete',
    '/comments/:id/spam',
    passport.authenticate('jwt', { session: false }),
    unmarkCommentAsSpam.bind(this, models),
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

  // Group routes
  registerRoute(
    router,
    'put',
    '/refresh-membership',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    refreshMembershipHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/groups',
    databaseValidationService.validateCommunity,
    getGroupsHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/getCanvasClock',
    getCanvasClockHandler.bind(this, serverControllers),
  );

  registerRoute(router, 'get', '/health', healthHandler.bind(this));

  // proxies
  setupCosmosProxy(router, cacheDecorator);
  setupIpfsProxy(router, cacheDecorator);

  app.use(endpoint, router);

  app.use(methodNotAllowedMiddleware());

  app.use('/api/*', function (_req, res) {
    res.status(404);
    return failure(res, 'Not Found');
  });
}

export default setupRouter;
