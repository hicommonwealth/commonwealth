import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import type { Express } from 'express';
import express from 'express';
import useragent from 'express-useragent';
import passport from 'passport';

import { TokenBalanceCache } from '../util/tokenBalanceCache/tokenBalanceCache';

import {
  methodNotAllowedMiddleware,
  registerRoute,
} from '../middleware/methodNotAllowed';
import { getRelatedCommunitiesHandler } from '../routes/communities/get_related_communities_handler';

import communityStats from '../routes/communityStats';
import createContract from '../routes/contracts/createContract';
import createAddress from '../routes/createAddress';
import deleteAddress from '../routes/deleteAddress';
import domain from '../routes/domain';
import {
  fetchEtherscanContract,
  fetchEtherscanContractAbi,
} from '../routes/etherscanAPI';
import finishEmailLogin from '../routes/finishEmailLogin';
import getAddressProfile, {
  getAddressProfileValidation,
} from '../routes/getAddressProfile';
import getAddressStatus from '../routes/getAddressStatus';
import linkExistingAddressToChain from '../routes/linkExistingAddressToChain';
import reactionsCounts from '../routes/reactionsCounts';
import selectChain from '../routes/selectChain';
import starCommunity from '../routes/starCommunity';
import startEmailLogin from '../routes/startEmailLogin';
import { status } from '../routes/status';
import threadsUsersCountAndAvatars from '../routes/threadsUsersCountAndAvatars';
import updateBanner from '../routes/updateBanner';
import updateEmail from '../routes/updateEmail';
import updateSiteAdmin from '../routes/updateSiteAdmin';
import verifyAddress from '../routes/verifyAddress';
import viewComments from '../routes/viewComments';
import viewCount from '../routes/viewCount';

import clearNotifications from '../routes/clearNotifications';
import clearReadNotifications from '../routes/clearReadNotifications';
import getProfileNew from '../routes/getNewProfile';
import markNotificationsRead from '../routes/markNotificationsRead';
import setDefaultRole from '../routes/setDefaultRole';
import createSubscription from '../routes/subscription/createSubscription';
import deleteSubscription from '../routes/subscription/deleteSubscription';
import disableImmediateEmails from '../routes/subscription/disableImmediateEmails';
import disableSubscriptions from '../routes/subscription/disableSubscriptions';
import enableImmediateEmails from '../routes/subscription/enableImmediateEmails';
import enableSubscriptions from '../routes/subscription/enableSubscriptions';
import viewSubscriptions from '../routes/subscription/viewSubscriptions';
import upgradeMember, {
  upgradeMemberValidation,
} from '../routes/upgradeMember';
import viewGlobalActivity from '../routes/viewGlobalActivity';
import viewNotifications, {
  RouteNotificationCategories,
} from '../routes/viewNotifications';
import viewUserActivity from '../routes/viewUserActivity';

import getUploadSignature from '../routes/getUploadSignature';

import bulkOffchain from '../routes/bulkOffchain';
import logout from '../routes/logout';
import sendFeedback from '../routes/sendFeedback';
import updateProfileNew from '../routes/updateNewProfile';
import writeUserSetting from '../routes/writeUserSetting';

import { getCanvasData, postCanvasData } from '../routes/canvas';

import updateChainCategory from '../routes/updateChainCategory';
import updateChainCustomDomain from '../routes/updateChainCustomDomain';
import updateChainPriority from '../routes/updateChainPriority';
import createWebhook from '../routes/webhooks/createWebhook';
import deleteWebhook from '../routes/webhooks/deleteWebhook';
import getWebhooks from '../routes/webhooks/getWebhooks';
import updateWebhook from '../routes/webhooks/updateWebhook';
import type ViewCountCache from '../util/viewCountCache';

import type { DB } from '../models';
import authCallback from '../routes/authCallback';
import banAddress from '../routes/banAddress';
import editSubstrateSpec from '../routes/editSubstrateSpec';
import finishSsoLogin from '../routes/finishSsoLogin';
import getBannedAddresses from '../routes/getBannedAddresses';
import setAddressWallet from '../routes/setAddressWallet';
import { sendMessage } from '../routes/snapshotAPI';
import startSsoLogin from '../routes/startSsoLogin';
import updateAddress from '../routes/updateAddress';
import viewChainIcons from '../routes/viewChainIcons';
import type BanCache from '../util/banCheckCache';

import { RedisCache } from '@hicommonwealth/adapters';
import type DatabaseValidationService from '../middleware/databaseValidationService';
import createDiscordBotConfig from '../routes/createDiscordBotConfig';
import generateImage from '../routes/generateImage';
import getDiscordChannels from '../routes/getDiscordChannels';
import getSnapshotProposal from '../routes/getSnapshotProposal';
import { getSubscribedChains } from '../routes/getSubscribedChains';
import setDiscordBotConfig from '../routes/setDiscordBotConfig';
import type GlobalActivityCache from '../util/globalActivityCache';

import {
  createCommunityContractTemplateAndMetadata,
  deleteCommunityContractTemplate,
  deleteCommunityContractTemplateMetadata,
  getCommunityContractTemplate,
  getCommunityContractTemplateMetadata,
  updateCommunityContractTemplate,
  updateCommunityContractTemplateMetadata,
} from '../routes/proposalTemplate';
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
} from '../routes/templates';

import * as controllers from '../controller';
import addThreadLink from '../routes/linking/addThreadLinks';
import deleteThreadLinks from '../routes/linking/deleteThreadLinks';
import getLinks from '../routes/linking/getLinks';
import markCommentAsSpam from '../routes/spam/markCommentAsSpam';
import unmarkCommentAsSpam from '../routes/spam/unmarkCommentAsSpam';
import viewChainActivity from '../routes/viewChainActivity';

import { ServerAdminController } from '../controllers/server_admin_controller';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import { ServerCommentsController } from '../controllers/server_comments_controller';
import { ServerCommunitiesController } from '../controllers/server_communities_controller';
import { ServerGroupsController } from '../controllers/server_groups_controller';
import { ServerNotificationsController } from '../controllers/server_notifications_controller';
import { ServerPollsController } from '../controllers/server_polls_controller';
import { ServerProfilesController } from '../controllers/server_profiles_controller';
import { ServerProposalsController } from '../controllers/server_proposals_controller';
import { ServerReactionsController } from '../controllers/server_reactions_controller';
import { ServerThreadsController } from '../controllers/server_threads_controller';
import { ServerTopicsController } from '../controllers/server_topics_controller';

import { getStatsHandler } from '../routes/admin/get_stats_handler';
import { createCommentReactionHandler } from '../routes/comments/create_comment_reaction_handler';
import { deleteBotCommentHandler } from '../routes/comments/delete_comment_bot_handler';
import { deleteCommentHandler } from '../routes/comments/delete_comment_handler';
import { searchCommentsHandler } from '../routes/comments/search_comments_handler';
import { updateCommentHandler } from '../routes/comments/update_comment_handler';
import { createChainNodeHandler } from '../routes/communities/create_chain_node_handler';
import { createCommunityHandler } from '../routes/communities/create_community_handler';
import { deleteCommunityHandler } from '../routes/communities/delete_community_handler';
import { getChainNodesHandler } from '../routes/communities/get_chain_nodes_handler';
import { getCommunitiesHandler } from '../routes/communities/get_communities_handler';
import { updateCommunityHandler } from '../routes/communities/update_community_handler';
import exportMembersList from '../routes/exportMembersList';
import { createGroupHandler } from '../routes/groups/create_group_handler';
import { deleteGroupHandler } from '../routes/groups/delete_group_handler';
import { getGroupsHandler } from '../routes/groups/get_groups_handler';
import { refreshMembershipHandler } from '../routes/groups/refresh_membership_handler';
import { updateGroupHandler } from '../routes/groups/update_group_handler';
import { deletePollHandler } from '../routes/polls/delete_poll_handler';
import { getPollVotesHandler } from '../routes/polls/get_poll_votes_handler';
import { updatePollVoteHandler } from '../routes/polls/update_poll_vote_handler';
import { searchProfilesHandler } from '../routes/profiles/search_profiles_handler';
import { getProposalVotesHandler } from '../routes/proposals/getProposalVotesHandler';
import { getProposalsHandler } from '../routes/proposals/getProposalsHandler';
import { deleteReactionHandler } from '../routes/reactions/delete_reaction_handler';
import { createThreadCommentHandler } from '../routes/threads/create_thread_comment_handler';
import { createThreadHandler } from '../routes/threads/create_thread_handler';
import { createThreadPollHandler } from '../routes/threads/create_thread_poll_handler';
import { createThreadReactionHandler } from '../routes/threads/create_thread_reaction_handler';
import { deleteBotThreadHandler } from '../routes/threads/delete_thread_bot_handler';
import { deleteThreadHandler } from '../routes/threads/delete_thread_handler';
import { getThreadPollsHandler } from '../routes/threads/get_thread_polls_handler';
import { getThreadsHandler } from '../routes/threads/get_threads_handler';
import { updateThreadHandler } from '../routes/threads/update_thread_handler';
import { createTopicHandler } from '../routes/topics/create_topic_handler';
import { deleteTopicHandler } from '../routes/topics/delete_topic_handler';
import { getTopicsHandler } from '../routes/topics/get_topics_handler';
import { updateTopicChannelHandler } from '../routes/topics/update_topic_channel_handler';
import { updateTopicHandler } from '../routes/topics/update_topic_handler';
import { updateTopicsOrderHandler } from '../routes/topics/update_topics_order_handler';

export type ServerControllers = {
  threads: ServerThreadsController;
  comments: ServerCommentsController;
  reactions: ServerReactionsController;
  notifications: ServerNotificationsController;
  analytics: ServerAnalyticsController;
  profiles: ServerProfilesController;
  communities: ServerCommunitiesController;
  proposals: ServerProposalsController;
  polls: ServerPollsController;
  groups: ServerGroupsController;
  topics: ServerTopicsController;
  admin: ServerAdminController;
};

const log = loggerFactory.getLogger(formatFilename(__filename));

function setupRouter(
  endpoint: string,
  app: Express,
  models: DB,
  viewCountCache: ViewCountCache,
  tokenBalanceCache: TokenBalanceCache,
  banCache: BanCache,
  globalActivityCache: GlobalActivityCache,
  databaseValidationService: DatabaseValidationService,
  redisCache: RedisCache,
) {
  // controllers
  const serverControllers: ServerControllers = {
    threads: new ServerThreadsController(
      models,
      tokenBalanceCache,
      banCache,
      globalActivityCache,
    ),
    comments: new ServerCommentsController(
      models,
      tokenBalanceCache,
      banCache,
      globalActivityCache,
    ),
    reactions: new ServerReactionsController(models, banCache),
    notifications: new ServerNotificationsController(models),
    analytics: new ServerAnalyticsController(),
    profiles: new ServerProfilesController(models),
    communities: new ServerCommunitiesController(models, banCache),
    polls: new ServerPollsController(models, tokenBalanceCache),
    proposals: new ServerProposalsController(models, redisCache),
    groups: new ServerGroupsController(models, tokenBalanceCache, banCache),
    topics: new ServerTopicsController(models, banCache),
    admin: new ServerAdminController(models),
  };

  // ---

  const router = express.Router();

  router.use(useragent.express());

  // Updating the address
  registerRoute(
    router,
    'post',
    '/updateAddress',
    passport.authenticate('jwt', { session: false }),
    updateAddress.bind(this, models),
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
  registerRoute(
    router,
    'post',
    '/editSubstrateSpec',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    editSubstrateSpec.bind(this, models),
  );

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
    deleteAddress.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/linkExistingAddressToChain',
    passport.authenticate('jwt', { session: false }),
    linkExistingAddressToChain.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/getAddressStatus',
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
    '/selectChain',
    passport.authenticate('jwt', { session: false }),
    selectChain.bind(this, models),
  );

  // communities
  registerRoute(
    router,
    'post',
    '/communities' /* prev: POST /createChain */,
    passport.authenticate('jwt', { session: false }),
    createCommunityHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'delete',
    '/communities/:communityId' /* prev: POST /deleteChain */,
    passport.authenticate('jwt', { session: false }),
    deleteCommunityHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'patch',
    '/communities/:communityId' /* prev: POST /updateChain */,
    passport.authenticate('jwt', { session: false }),
    updateCommunityHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/communities' /* prev: GET /chains */,
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
    '/nodes' /* prev: POST /createChainNode */,
    passport.authenticate('jwt', { session: false }),
    createChainNodeHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/relatedCommunities',
    getRelatedCommunitiesHandler.bind(this, serverControllers),
  );

  // ----
  registerRoute(
    router,
    'post',
    '/contract',
    passport.authenticate('jwt', { session: false }),
    createContract.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/etherscanAPI/fetchEtherscanContract',
    passport.authenticate('jwt', { session: false }),
    fetchEtherscanContract.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/etherscanAPI/fetchEtherscanContractAbi',
    passport.authenticate('jwt', { session: false }),
    fetchEtherscanContractAbi.bind(this, models),
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

  // threads
  registerRoute(
    router,
    'post',
    '/threads',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunityWithTopics,
    createThreadHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'post',
    '/bot/threads',
    databaseValidationService.validateBotUser,
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunityWithTopics,
    createThreadHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'patch',
    '/bot/threads',
    databaseValidationService.validateBotUser,
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunityWithTopics,
    updateThreadHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'delete',
    '/bot/threads/:message_id',
    databaseValidationService.validateBotUser,
    deleteBotThreadHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'patch',
    '/threads/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    updateThreadHandler.bind(this, serverControllers),
  );

  // polls
  registerRoute(
    router,
    'post',
    '/threads/:id/polls',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    createThreadPollHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/threads/:id/polls',
    databaseValidationService.validateCommunity,
    getThreadPollsHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'delete',
    '/polls/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    deletePollHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'put',
    '/polls/:id/votes',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    updatePollVoteHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'get',
    '/polls/:id/votes',
    databaseValidationService.validateCommunity,
    getPollVotesHandler.bind(this, serverControllers),
  );

  // Templates
  registerRoute(
    router,
    'post',
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    createTemplate.bind(this, models),
  );
  registerRoute(
    router,
    'get',
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    getTemplates.bind(this, models),
  );
  registerRoute(
    router,
    'delete',
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    deleteTemplate.bind(this, models),
  );

  // community contract
  registerRoute(
    router,
    'post',
    '/contract/community_template_and_metadata',
    passport.authenticate('jwt', { session: false }),
    createCommunityContractTemplateAndMetadata.bind(this, models),
  );
  registerRoute(
    router,
    'get',
    '/contract/community_template',
    getCommunityContractTemplate.bind(this, models),
  );
  registerRoute(
    router,
    'put',
    '/contract/community_template',
    passport.authenticate('jwt', { session: false }),
    updateCommunityContractTemplate.bind(this, models),
  );
  registerRoute(
    router,
    'delete',
    '/contract/community_template',
    passport.authenticate('jwt', { session: false }),
    deleteCommunityContractTemplate.bind(this, models),
  );

  // community contract metadata
  registerRoute(
    router,
    'get',
    '/contract/community_template/metadata',
    getCommunityContractTemplateMetadata.bind(this, models),
  );
  registerRoute(
    router,
    'put',
    '/contract/community_template/metadata',
    passport.authenticate('jwt', { session: false }),
    updateCommunityContractTemplateMetadata.bind(this, models),
  );
  registerRoute(
    router,
    'delete',
    '/contract/community_template/metadata',
    passport.authenticate('jwt', { session: false }),
    deleteCommunityContractTemplateMetadata.bind(this, models),
  );

  registerRoute(
    router,
    'delete',
    '/threads/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    deleteThreadHandler.bind(this, serverControllers),
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
    '/profiles',
    databaseValidationService.validateCommunity,
    searchProfilesHandler.bind(this, serverControllers),
  );
  registerRoute(router, 'get', '/profile/v2', getProfileNew.bind(this, models));

  registerRoute(
    router,
    'get',
    '/bulkOffchain',
    databaseValidationService.validateCommunity,
    bulkOffchain.bind(this, models),
  );

  // comments
  registerRoute(
    router,
    'post',
    '/threads/:id/comments',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    createThreadCommentHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'post',
    '/bot/threads/:id/comments',
    databaseValidationService.validateBotUser,
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    createThreadCommentHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'patch',
    '/bot/threads/:id/comments',
    databaseValidationService.validateBotUser,
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    updateCommentHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'delete',
    '/bot/comments/:message_id',
    databaseValidationService.validateBotUser,
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    deleteBotCommentHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'patch',
    '/comments/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    updateCommentHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'delete',
    '/comments/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    deleteCommentHandler.bind(this, serverControllers),
  );
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
    'post',
    '/topics' /* OLD: /createTopic */,
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    createTopicHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'patch',
    '/topics/:topicId/channels/:channelId' /* OLD: /updateTopic */,
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
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
    'patch',
    '/topics/:topicId' /* OLD: /editTopic */,
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    updateTopicHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'delete',
    '/topics/:topicId' /* OLD: /deleteTopic */,
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    deleteTopicHandler.bind(this, serverControllers),
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
    '/threads/:id/reactions',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    createThreadReactionHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'post',
    '/comments/:id/reactions',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateCommunity,
    createCommentReactionHandler.bind(this, serverControllers),
  );
  registerRoute(
    router,
    'delete',
    '/reactions/:id',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    deleteReactionHandler.bind(this, serverControllers),
  );
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

  // community banners (update or create)
  registerRoute(
    router,
    'post',
    '/updateBanner',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    updateBanner.bind(this, models),
  );

  // third-party webhooks
  registerRoute(
    router,
    'post',
    '/createWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    createWebhook.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/updateWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    updateWebhook.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/deleteWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    deleteWebhook.bind(this, models),
  );
  registerRoute(
    router,
    'get',
    '/getWebhooks',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    getWebhooks.bind(this, models),
  );

  // roles
  registerRoute(
    router,
    'post',
    '/setDefaultRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    setDefaultRole.bind(this, models),
  );

  // new profile
  registerRoute(
    router,
    'post',
    '/updateProfile/v2',
    passport.authenticate('jwt', { session: false }),
    updateProfileNew.bind(this, models),
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

  // notifications
  registerRoute(
    router,
    'get',
    '/viewSubscriptions',
    passport.authenticate('jwt', { session: false }),
    viewSubscriptions.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/createSubscription',
    passport.authenticate('jwt', { session: false }),
    createSubscription.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/deleteSubscription',
    passport.authenticate('jwt', { session: false }),
    deleteSubscription.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/enableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    enableSubscriptions.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/disableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    disableSubscriptions.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/viewDiscussionNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(
      this,
      models,
      RouteNotificationCategories.Discussion,
    ),
  );
  registerRoute(
    router,
    'post',
    '/viewChainEventNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(
      this,
      models,
      RouteNotificationCategories.ChainEvents,
    ),
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
    '/viewChainIcons',
    viewChainIcons.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/viewGlobalActivity',
    viewGlobalActivity.bind(this, models, globalActivityCache),
  );
  registerRoute(
    router,
    'get',
    '/viewChainActivity',
    viewChainActivity.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/markNotificationsRead',
    passport.authenticate('jwt', { session: false }),
    markNotificationsRead.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/clearReadNotifications',
    passport.authenticate('jwt', { session: false }),
    clearReadNotifications.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/clearNotifications',
    passport.authenticate('jwt', { session: false }),
    clearNotifications.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/enableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    enableImmediateEmails.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/disableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    disableImmediateEmails.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/setAddressWallet',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    setAddressWallet.bind(this, models),
  );

  // chain categories
  registerRoute(
    router,
    'post',
    '/updateChainCategory',
    passport.authenticate('jwt', { session: false }),
    updateChainCategory.bind(this, models),
  );

  // signed data
  router.get('/oplog', getCanvasData.bind(this, models));
  router.post('/oplog', postCanvasData.bind(this, models));

  // settings
  registerRoute(
    router,
    'post',
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models),
  );

  // send feedback button
  registerRoute(
    router,
    'post',
    '/sendFeedback',
    sendFeedback.bind(this, models),
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
  registerRoute(
    router,
    'get',
    '/getBannedAddresses',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    getBannedAddresses.bind(this, models),
  );

  // Custom domain update route
  registerRoute(
    router,
    'post',
    '/updateChainCustomDomain',
    updateChainCustomDomain.bind(this, models),
  );

  // Discord Bot
  registerRoute(
    router,
    'post',
    '/createDiscordBotConfig',
    passport.authenticate('jwt', { session: false }),
    createDiscordBotConfig.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/setDiscordBotConfig',
    setDiscordBotConfig.bind(this, models),
  );
  registerRoute(
    router,
    'post',
    '/getDiscordChannels',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateCommunity,
    getDiscordChannels.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/updateChainPriority',
    updateChainPriority.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/generateImage',
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
    passport.authenticate('jwt', { session: false }),
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
  registerRoute(router, 'post', '/login', startEmailLogin.bind(this, models));
  registerRoute(
    router,
    'get',
    '/finishLogin',
    finishEmailLogin.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/auth/magic',
    passport.authenticate('magic'),
    (req, res) => {
      return res.json({ status: 'Success', result: req.user.toJSON() });
    },
  );

  registerRoute(router, 'post', '/auth/sso', startSsoLogin.bind(this, models));
  registerRoute(
    router,
    'post',
    '/auth/sso/callback',
    // passport.authenticate('jwt', { session: false }),
    finishSsoLogin.bind(this, models),
  );

  registerRoute(
    router,
    'get',
    '/auth/callback',
    passport.authenticate('jwt', { session: false }),
    authCallback.bind(this, models),
  );

  // logout
  registerRoute(router, 'get', '/logout', logout.bind(this, models));

  // snapshotAPI
  registerRoute(
    router,
    'post',
    '/snapshotAPI/sendMessage',
    sendMessage.bind(this),
  );

  registerRoute(
    router,
    'get',
    '/communityStats',
    databaseValidationService.validateCommunity,
    communityStats.bind(this, models),
  );

  // snapshot-commonwealth
  registerRoute(
    router,
    'get',
    '/snapshot',
    getSnapshotProposal.bind(this, models),
  );

  registerRoute(
    router,
    'post',
    '/getSubscribedChains',
    getSubscribedChains.bind(this, models),
  );

  // Proposal routes
  registerRoute(
    router,
    'get',
    '/proposals',
    getProposalsHandler.bind(this, serverControllers),
  );

  registerRoute(
    router,
    'get',
    '/proposalVotes',
    getProposalVotesHandler.bind(this, serverControllers),
  );

  // Group routes

  if (process.env.GATING_API_ENABLED) {
    log.debug('GATING API ENABLED');

    registerRoute(
      router,
      'put',
      '/refresh-membership',
      passport.authenticate('jwt', { session: false }),
      databaseValidationService.validateAuthor,
      databaseValidationService.validateCommunity,
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
      'post',
      '/groups',
      passport.authenticate('jwt', { session: false }),
      databaseValidationService.validateAuthor,
      databaseValidationService.validateCommunity,
      createGroupHandler.bind(this, serverControllers),
    );

    registerRoute(
      router,
      'put',
      '/groups/:id',
      passport.authenticate('jwt', { session: false }),
      databaseValidationService.validateAuthor,
      databaseValidationService.validateCommunity,
      updateGroupHandler.bind(this, serverControllers),
    );

    registerRoute(
      router,
      'delete',
      '/groups/:id',
      passport.authenticate('jwt', { session: false }),
      databaseValidationService.validateAuthor,
      databaseValidationService.validateCommunity,
      deleteGroupHandler.bind(this, serverControllers),
    );
  } else {
    log.warn('GATING API DISABLED');
  }

  app.use(endpoint, router);
  app.use(methodNotAllowedMiddleware());
}

export default setupRouter;
