import express from 'express';
import passport from 'passport';
import type { Express } from 'express';

import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { StatsDController } from 'common-common/src/statsd';

import domain from '../routes/domain';
import { status } from '../routes/status';
import createAddress from '../routes/createAddress';
import linkExistingAddressToChain from '../routes/linkExistingAddressToChain';
import verifyAddress from '../routes/verifyAddress';
import deleteAddress from '../routes/deleteAddress';
import getAddressStatus from '../routes/getAddressStatus';
import getAddressProfile from '../routes/getAddressProfile';
import selectChain from '../routes/selectChain';
import startEmailLogin from '../routes/startEmailLogin';
import finishEmailLogin from '../routes/finishEmailLogin';
import finishOAuthLogin from '../routes/finishOAuthLogin';
import startOAuthLogin from '../routes/startOAuthLogin';
import createComment from '../routes/createComment';
import editComment from '../routes/editComment';
import deleteComment from '../routes/deleteComment';
import viewComments from '../routes/viewComments';
import bulkComments from '../routes/bulkComments';
import createReaction from '../routes/createReaction';
import deleteReaction from '../routes/deleteReaction';
import viewReactions from '../routes/viewReactions';
import bulkReactions from '../routes/bulkReactions';
import reactionsCounts from '../routes/reactionsCounts';
import threadsUsersCountAndAvatars from '../routes/threadsUsersCountAndAvatars';
import starCommunity from '../routes/starCommunity';
import createChain from '../routes/createChain';
import createContract from '../routes/contracts/createContract';
import viewCount from '../routes/viewCount';
import updateEmail from '../routes/updateEmail';
import updateBanner from '../routes/updateBanner';
import communityStats from '../routes/communityStats';
import {
  fetchEtherscanContract,
  fetchEtherscanContractAbi,
} from '../routes/etherscanAPI';
import createContractAbi from '../routes/contractAbis/createContractAbi';

import viewSubscriptions from '../routes/subscription/viewSubscriptions';
import createSubscription from '../routes/subscription/createSubscription';
import deleteSubscription from '../routes/subscription/deleteSubscription';
import enableSubscriptions from '../routes/subscription/enableSubscriptions';
import disableSubscriptions from '../routes/subscription/disableSubscriptions';
import enableImmediateEmails from '../routes/subscription/enableImmediateEmails';
import disableImmediateEmails from '../routes/subscription/disableImmediateEmails';
import viewNotifications, {
  NotificationCategories,
} from '../routes/viewNotifications';
import viewUserActivity from '../routes/viewUserActivity';
import viewGlobalActivity from '../routes/viewGlobalActivity';
import markNotificationsRead from '../routes/markNotificationsRead';
import clearReadNotifications from '../routes/clearReadNotifications';
import clearNotifications from '../routes/clearNotifications';
import bulkMembers from '../routes/bulkMembers';
import searchProfiles from '../routes/searchProfiles';
import upgradeMember from '../routes/upgradeMember';
import deleteSocialAccount from '../routes/deleteSocialAccount';
import getProfileNew from '../routes/getNewProfile';

import createRole from '../routes/createRole';
import deleteRole from '../routes/deleteRole';
import setDefaultRole from '../routes/setDefaultRole';

import getUploadSignature from '../routes/getUploadSignature';
import activeThreads from '../routes/activeThreads';
import createThread from '../routes/createThread';
import editThread from '../routes/editThread';
import createPoll from '../routes/createPoll';
import getPolls from '../routes/getPolls';
import deletePoll from '../routes/deletePoll';
import updateThreadStage from '../routes/updateThreadStage';
import updateThreadPrivacy from '../routes/updateThreadPrivacy';
import updateThreadPinned from '../routes/updateThreadPinned';
import updateVote from '../routes/updateVote';
import viewVotes from '../routes/viewVotes';
import fetchEntityTitle from '../routes/fetchEntityTitle';
import updateChainEntityTitle from '../routes/updateChainEntityTitle';
import deleteThread from '../routes/deleteThread';
import addEditors from '../routes/addEditors';
import deleteEditors from '../routes/deleteEditors';
import bulkThreads from '../routes/bulkThreads';
import getThreadsOld from '../routes/getThreads';
import searchDiscussions from '../routes/searchDiscussions';
import searchComments from '../routes/searchComments';
import createDraft from '../routes/drafts/createDraft';
import deleteDraft from '../routes/drafts/deleteDraft';
import editDraft from '../routes/drafts/editDraft';
import getDrafts from '../routes/drafts/getDrafts';
import deleteChain from '../routes/deleteChain';
import updateChain from '../routes/updateChain';
import updateProfileNew from '../routes/updateNewProfile';
import writeUserSetting from '../routes/writeUserSetting';
import sendFeedback from '../routes/sendFeedback';
import logout from '../routes/logout';
import createTopic from '../routes/createTopic';
import updateTopic from '../routes/updateTopic';
import orderTopics from '../routes/orderTopics';
import editTopic from '../routes/editTopic';
import deleteTopic from '../routes/deleteTopic';
import bulkTopics from '../routes/bulkTopics';
import bulkOffchain from '../routes/bulkOffchain';
import setTopicThreshold from '../routes/setTopicThreshold';
import getChatMessages from '../routes/chat/getChatMessages';
import getChatChannel from '../routes/chat/getChatChannel';
import createChatChannel from '../routes/chat/createChatChannel';
import deleteChatChannel from '../routes/chat/deleteChatChannel';
import deleteChatCategory from '../routes/chat/deleteChatCategory';
import editChatChannel from '../routes/chat/editChatChannel';
import editChatCategory from '../routes/chat/editChatCategory';

import createRule from '../routes/rules/createRule';
import deleteRule from '../routes/rules/deleteRule';
import getRuleTypes from '../routes/rules/getRuleTypes';

import createWebhook from '../routes/webhooks/createWebhook';
import updateWebhook from '../routes/webhooks/updateWebhook';
import deleteWebhook from '../routes/webhooks/deleteWebhook';
import getWebhooks from '../routes/webhooks/getWebhooks';
import type ViewCountCache from '../util/viewCountCache';
import updateChainCategory from '../routes/updateChainCategory';
import updateChainCustomDomain from '../routes/updateChainCustomDomain';
import updateChainPriority from '../routes/updateChainPriority';

import startSsoLogin from '../routes/startSsoLogin';
import finishSsoLogin from '../routes/finishSsoLogin';
import getEntityMeta from '../routes/getEntityMeta';
import { getTokensFromLists } from '../routes/getTokensFromLists';
import getTokenForum from '../routes/getTokenForum';
import tokenBalance from '../routes/tokenBalance';
import bulkBalances from '../routes/bulkBalances';
import getSupportedEthChains from '../routes/getSupportedEthChains';
import editSubstrateSpec from '../routes/editSubstrateSpec';
import updateAddress from '../routes/updateAddress';
import type { DB } from '../models';
import { sendMessage } from '../routes/snapshotAPI';
import ipfsPin from '../routes/ipfsPin';
import setAddressWallet from '../routes/setAddressWallet';
import type RuleCache from '../util/rules/ruleCache';
import banAddress from '../routes/banAddress';
import getBannedAddresses from '../routes/getBannedAddresses';
import type BanCache from '../util/banCheckCache';
import authCallback from '../routes/authCallback';
import viewChainIcons from '../routes/viewChainIcons';

import generateImage from '../routes/generateImage';
import { getChainEventServiceData } from '../routes/getChainEventServiceData';
import { getChain } from '../routes/getChain';
import { getChainNode } from '../routes/getChainNode';
import { getChainContracts } from '../routes/getChainContracts';
import { getSubscribedChains } from '../routes/getSubscribedChains';
import type GlobalActivityCache from '../util/globalActivityCache';
import type DatabaseValidationService from '../middleware/databaseValidationService';
import createDiscordBotConfig from '../routes/createDiscordBotConfig';
import setDiscordBotConfig from '../routes/setDiscordBotConfig';
import getDiscordChannels from '../routes/getDiscordChannels';
import getSnapshotProposal from '../routes/getSnapshotProposal';

import {
  createCommunityContractTemplateAndMetadata,
  getCommunityContractTemplate,
  updateCommunityContractTemplate,
  deleteCommunityContractTemplate,
  getCommunityContractTemplateMetadata,
  updateCommunityContractTemplateMetadata,
  deleteCommunityContractTemplateMetadata,
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
import {
  methodNotAllowedMiddleware,
  registerRoute,
} from '../middleware/methodNotAllowed';

function setupRouter(
  endpoint: string,
  app: Express,
  models: DB,
  viewCountCache: ViewCountCache,
  tokenBalanceCache: TokenBalanceCache,
  ruleCache: RuleCache,
  banCache: BanCache,
  globalActivityCache: GlobalActivityCache,
  databaseValidationService: DatabaseValidationService
) {
  const router = express.Router();

  router.use((req, res, next) => {
    StatsDController.get().increment('cw.path.called', {
      path: req.path.slice(1),
    });
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      StatsDController.get().histogram(`cw.path.latency`, latency, {
        path: req.path.slice(1),
      });
    });
    next();
  });

  // Updating the address
  registerRoute(
    router,
    'post',
    '/updateAddress',
    passport.authenticate('jwt', { session: false }),
    updateAddress.bind(this, models)
  );
  registerRoute(router, 'get', '/domain', domain.bind(this, models));
  registerRoute(router, 'get', '/status', status.bind(this, models));
  registerRoute(
    router,
    'post',
    '/ipfsPin',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    ipfsPin.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/editSubstrateSpec',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    editSubstrateSpec.bind(this, models)
  );

  // Creating and Managing Addresses
  registerRoute(
    router,
    'post',
    '/createAddress',
    createAddress.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/verifyAddress',
    verifyAddress.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteAddress',
    passport.authenticate('jwt', { session: false }),
    deleteAddress.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/linkExistingAddressToChain',
    passport.authenticate('jwt', { session: false }),
    linkExistingAddressToChain.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/getAddressStatus',
    getAddressStatus.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/getAddressProfile',
    getAddressProfile.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/selectChain',
    passport.authenticate('jwt', { session: false }),
    selectChain.bind(this, models)
  );

  // chains
  registerRoute(
    router,
    'post',
    '/createChain',
    passport.authenticate('jwt', { session: false }),
    createChain.bind(this, models)
  );
  registerRoute(router, 'post', '/deleteChain', deleteChain.bind(this, models));
  registerRoute(
    router,
    'post',
    '/updateChain',
    passport.authenticate('jwt', { session: false }),
    updateChain.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/contract',
    passport.authenticate('jwt', { session: false }),
    createContract.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/etherscanAPI/fetchEtherscanContract',
    passport.authenticate('jwt', { session: false }),
    fetchEtherscanContract.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/etherscanAPI/fetchEtherscanContractAbi',
    passport.authenticate('jwt', { session: false }),
    fetchEtherscanContractAbi.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/starCommunity',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    starCommunity.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/tokenBalance',
    databaseValidationService.validateChain,
    tokenBalance.bind(this, models, tokenBalanceCache)
  );
  registerRoute(
    router,
    'post',
    '/bulkBalances',
    bulkBalances.bind(this, models, tokenBalanceCache)
  );
  registerRoute(
    router,
    'get',
    '/getTokensFromLists',
    getTokensFromLists.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getTokenForum',
    getTokenForum.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getSupportedEthChains',
    getSupportedEthChains.bind(this, models)
  );

  // threads
  registerRoute(
    router,
    'post',
    '/createThread',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChainWithTopics,
    createThread.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  registerRoute(
    router,
    'put',
    '/editThread',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    editThread.bind(this, models, banCache)
  );
  registerRoute(
    router,
    'post',
    '/createPoll',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createPoll.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getPolls',
    databaseValidationService.validateChain,
    getPolls.bind(this, models)
  );
  registerRoute(
    router,
    'delete',
    '/deletePoll',
    passport.authenticate('jwt', { session: false }),
    deletePoll.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/updateThreadStage',
    passport.authenticate('jwt', { session: false }),
    updateThreadStage.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/updateThreadPrivacy',
    passport.authenticate('jwt', { session: false }),
    updateThreadPrivacy.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/updateThreadPinned',
    passport.authenticate('jwt', { session: false }),
    updateThreadPinned.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/updateVote',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    updateVote.bind(this, models, tokenBalanceCache, ruleCache)
  );
  registerRoute(
    router,
    'get',
    '/viewVotes',
    databaseValidationService.validateChain,
    viewVotes.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/fetchEntityTitle',
    fetchEntityTitle.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/contractAbi',
    passport.authenticate('jwt', { session: false }),
    createContractAbi.bind(this, models)
  );

  // Templates
  registerRoute(
    router,
    'post',
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    createTemplate.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    getTemplates.bind(this, models)
  );

  router.delete(
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    deleteTemplate.bind(this, models)
  );

  // community contract
  registerRoute(
    router,
    'post',
    '/contract/community_template_and_metadata',
    passport.authenticate('jwt', { session: false }),
    createCommunityContractTemplateAndMetadata.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/contract/community_template',
    getCommunityContractTemplate.bind(this, models)
  );
  registerRoute(
    router,
    'put',
    '/contract/community_template',
    passport.authenticate('jwt', { session: false }),
    updateCommunityContractTemplate.bind(this, models)
  );
  registerRoute(
    router,
    'delete',
    '/contract/community_template',
    passport.authenticate('jwt', { session: false }),
    deleteCommunityContractTemplate.bind(this, models)
  );

  // community contract metadata
  registerRoute(
    router,
    'get',
    '/contract/community_template/metadata',
    getCommunityContractTemplateMetadata.bind(this, models)
  );
  registerRoute(
    router,
    'put',
    '/contract/community_template/metadata',
    passport.authenticate('jwt', { session: false }),
    updateCommunityContractTemplateMetadata.bind(this, models)
  );
  registerRoute(
    router,
    'delete',
    '/contract/community_template/metadata',
    passport.authenticate('jwt', { session: false }),
    deleteCommunityContractTemplateMetadata.bind(this, models)
  );

  registerRoute(
    router,
    'post',
    '/updateChainEntityTitle',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateChainEntityTitle.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/addEditors',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    addEditors.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteEditors',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    deleteEditors.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteThread',
    passport.authenticate('jwt', { session: false }),
    deleteThread.bind(this, models, banCache)
  );
  registerRoute(
    router,
    'get',
    '/bulkThreads',
    databaseValidationService.validateChain,
    bulkThreads.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/activeThreads',
    databaseValidationService.validateChain,
    activeThreads.bind(this, models)
  );
  registerRoute(router, 'get', '/getThreads', getThreadsOld.bind(this, models));
  registerRoute(
    router,
    'get',
    '/searchDiscussions',
    databaseValidationService.validateChain,
    searchDiscussions.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/searchComments',
    databaseValidationService.validateChain,
    searchComments.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/searchProfiles',
    databaseValidationService.validateChain,
    searchProfiles.bind(this, models)
  );
  registerRoute(router, 'get', '/profile/v2', getProfileNew.bind(this, models));

  // discussion drafts
  registerRoute(
    router,
    'post',
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createDraft.bind(this, models)
  );
  registerRoute(router, 'get', '/drafts', getDrafts.bind(this, models));
  registerRoute(
    router,
    'delete',
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    deleteDraft.bind(this, models)
  );
  registerRoute(
    router,
    'patch',
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    editDraft.bind(this, models)
  );

  registerRoute(
    router,
    'get',
    '/bulkOffchain',
    databaseValidationService.validateChain,
    bulkOffchain.bind(this, models)
  );

  // comments
  registerRoute(
    router,
    'post',
    '/createComment',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createComment.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  registerRoute(
    router,
    'post',
    '/editComment',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    editComment.bind(this, models, banCache)
  );
  registerRoute(
    router,
    'post',
    '/deleteComment',
    passport.authenticate('jwt', { session: false }),
    deleteComment.bind(this, models, banCache)
  );
  registerRoute(
    router,
    'get',
    '/viewComments',
    databaseValidationService.validateChain,
    viewComments.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/bulkComments',
    databaseValidationService.validateChain,
    bulkComments.bind(this, models)
  );

  // topics
  registerRoute(
    router,
    'post',
    '/createTopic',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createTopic.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/updateTopic',
    passport.authenticate('jwt', { session: false }),
    updateTopic.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/orderTopics',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    orderTopics.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/editTopic',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    editTopic.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteTopic',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    deleteTopic.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/bulkTopics',
    databaseValidationService.validateChain,
    bulkTopics.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/setTopicThreshold',
    passport.authenticate('jwt', { session: false }),
    setTopicThreshold.bind(this, models)
  );

  // reactions
  registerRoute(
    router,
    'post',
    '/createReaction',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createReaction.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  registerRoute(
    router,
    'post',
    '/deleteReaction',
    passport.authenticate('jwt', { session: false }),
    deleteReaction.bind(this, models, banCache)
  );
  registerRoute(
    router,
    'get',
    '/viewReactions',
    databaseValidationService.validateChain,
    viewReactions.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/bulkReactions',
    bulkReactions.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/reactionsCounts',
    reactionsCounts.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/threadsUsersCountAndAvatars',
    threadsUsersCountAndAvatars.bind(this, models)
  );

  // roles
  registerRoute(
    router,
    'get',
    '/roles',
    controllers.getRoles.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/roles',
    controllers.createRole.bind(this, models)
  );
  registerRoute(
    router,
    'patch',
    '/roles',
    controllers.updateRole.bind(this, models)
  );

  // permissions
  registerRoute(
    router,
    'get',
    '/permissions',
    controllers.getPermissions.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/permissions',
    controllers.createPermission.bind(this, models)
  );
  registerRoute(
    router,
    'patch',
    '/permissions',
    controllers.updatePermission.bind(this, models)
  );

  registerRoute(
    router,
    'get',
    '/bulkMembers',
    databaseValidationService.validateChain,
    bulkMembers.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/upgradeMember',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    upgradeMember.bind(this, models)
  );

  // user model update
  registerRoute(
    router,
    'post',
    '/updateEmail',
    passport.authenticate('jwt', { session: false }),
    updateEmail.bind(this, models)
  );

  // community banners (update or create)
  registerRoute(
    router,
    'post',
    '/updateBanner',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateBanner.bind(this, models)
  );

  // third-party webhooks
  registerRoute(
    router,
    'post',
    '/createWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createWebhook.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/updateWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateWebhook.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    deleteWebhook.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getWebhooks',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    getWebhooks.bind(this, models)
  );

  // roles
  registerRoute(
    router,
    'post',
    '/createRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createRole.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    deleteRole.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/setDefaultRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    setDefaultRole.bind(this, models)
  );

  // new profile
  registerRoute(
    router,
    'post',
    '/updateProfile/v2',
    passport.authenticate('jwt', { session: false }),
    updateProfileNew.bind(this, models)
  );

  // social accounts
  registerRoute(
    router,
    'delete',
    '/githubAccount',
    passport.authenticate('jwt', { session: false }),
    deleteSocialAccount.bind(this, models, 'github')
  );
  registerRoute(
    router,
    'delete',
    '/discordAccount',
    passport.authenticate('jwt', { session: false }),
    deleteSocialAccount.bind(this, models, 'discord')
  );

  // viewCount
  registerRoute(
    router,
    'post',
    '/viewCount',
    viewCount.bind(this, models, viewCountCache)
  );

  // attachments
  registerRoute(
    router,
    'post',
    '/getUploadSignature',
    passport.authenticate('jwt', { session: false }),
    getUploadSignature.bind(this, models)
  );

  // notifications
  registerRoute(
    router,
    'get',
    '/viewSubscriptions',
    passport.authenticate('jwt', { session: false }),
    viewSubscriptions.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/createSubscription',
    passport.authenticate('jwt', { session: false }),
    createSubscription.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteSubscription',
    passport.authenticate('jwt', { session: false }),
    deleteSubscription.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/enableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    enableSubscriptions.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/disableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    disableSubscriptions.bind(this, models)
  );

  registerRoute(
    router,
    'post',
    '/viewDiscussionNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models, NotificationCategories.Discussion)
  );
  registerRoute(
    router,
    'post',
    '/viewChainEventNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models, NotificationCategories.ChainEvents)
  );

  registerRoute(
    router,
    'post',
    '/viewUserActivity',
    passport.authenticate('jwt', { session: false }),
    viewUserActivity.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/viewChainIcons',
    viewChainIcons.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/viewGlobalActivity',
    viewGlobalActivity.bind(this, models, globalActivityCache)
  );
  registerRoute(
    router,
    'post',
    '/markNotificationsRead',
    passport.authenticate('jwt', { session: false }),
    markNotificationsRead.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/clearReadNotifications',
    passport.authenticate('jwt', { session: false }),
    clearReadNotifications.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/clearNotifications',
    passport.authenticate('jwt', { session: false }),
    clearNotifications.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/enableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    enableImmediateEmails.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/disableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    disableImmediateEmails.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/setAddressWallet',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    setAddressWallet.bind(this, models)
  );

  // chain categories
  registerRoute(
    router,
    'post',
    '/updateChainCategory',
    passport.authenticate('jwt', { session: false }),
    updateChainCategory.bind(this, models)
  );

  // chat
  registerRoute(
    router,
    'get',
    '/getChatMessages',
    passport.authenticate('jwt', { session: false }),
    getChatMessages.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getChatChannel',
    passport.authenticate('jwt', { session: false }),
    getChatChannel.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/createChatChannel',
    passport.authenticate('jwt', { session: false }),
    createChatChannel.bind(this, models)
  );
  registerRoute(
    router,
    'delete',
    '/deleteChatChannel',
    passport.authenticate('jwt', { session: false }),
    deleteChatChannel.bind(this, models)
  );
  registerRoute(
    router,
    'delete',
    '/deleteChatCategory',
    passport.authenticate('jwt', { session: false }),
    deleteChatCategory.bind(this, models)
  );
  registerRoute(
    router,
    'put',
    '/editChatChannel',
    passport.authenticate('jwt', { session: false }),
    editChatChannel.bind(this, models)
  );
  registerRoute(
    router,
    'put',
    '/editChatCategory',
    passport.authenticate('jwt', { session: false }),
    editChatCategory.bind(this, models)
  );

  // rules
  registerRoute(
    router,
    'post',
    '/createRule',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createRule.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/deleteRule',
    passport.authenticate('jwt', { session: false }),
    deleteRule.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getRuleTypes',
    getRuleTypes.bind(this, models)
  );

  // settings
  registerRoute(
    router,
    'post',
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models)
  );

  // send feedback button
  registerRoute(
    router,
    'post',
    '/sendFeedback',
    sendFeedback.bind(this, models)
  );

  // bans
  registerRoute(
    router,
    'post',
    '/banAddress',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    banAddress.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/getBannedAddresses',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    getBannedAddresses.bind(this, models)
  );

  // Custom domain update route
  registerRoute(
    router,
    'post',
    '/updateChainCustomDomain',
    updateChainCustomDomain.bind(this, models)
  );

  // Discord Bot
  registerRoute(
    router,
    'post',
    '/createDiscordBotConfig',
    passport.authenticate('jwt', { session: false }),
    createDiscordBotConfig.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/setDiscordBotConfig',
    setDiscordBotConfig.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/getDiscordChannels',
    passport.authenticate('jwt', { session: false }),
    getDiscordChannels.bind(this, models)
  );

  registerRoute(
    router,
    'post',
    '/updateChainPriority',
    updateChainPriority.bind(this, models)
  );

  registerRoute(
    router,
    'post',
    '/generateImage',
    passport.authenticate('jwt', { session: false }),
    generateImage.bind(this, models)
  );

  // linking
  registerRoute(
    router,
    'post',
    '/linking/addThreadLinks',
    passport.authenticate('jwt', { session: false }),
    addThreadLink.bind(this, models)
  );
  registerRoute(
    router,
    'delete',
    '/linking/deleteLinks',
    passport.authenticate('jwt', { session: false }),
    deleteThreadLinks.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/linking/getLinks',
    passport.authenticate('jwt', { session: false }),
    getLinks.bind(this, models)
  );

  // login
  registerRoute(router, 'post', '/login', startEmailLogin.bind(this, models));
  registerRoute(
    router,
    'get',
    '/finishLogin',
    finishEmailLogin.bind(this, models)
  );
  registerRoute(
    router,
    'get',
    '/finishOAuthLogin',
    finishOAuthLogin.bind(this, models)
  );

  // OAuth2.0 for Discord and GitHub:
  // The way this works is first the /auth.discord route is hit and passport.authenticate triggers for the first time
  // to send a request for a code to the discord API passing along a state parameter and a callback. The Discord api
  // adds the same state parameter to the callback URL (and a new code param) before returning. Once Discord returns,
  // /auth/discord/callback is called which triggers passport.authenticate for a second time. On this second run the
  // authenticateSocialAccount function in socialAccount.ts is called. If a successRedirect url is specified, in the
  // passport.authenticate options then the passport.authenticate function will handle redirecting after the
  // authenticateSocialAccount function and WILL NOT trigger the route handler for the callback routes (startOAuthLogin)

  // You cac put any data you wish to persist post OAuth into the state object below. The data will be made available
  // ONLY in the req.authInfo.state object in the callback i.e. startOAuthLogin.ts.
  // NOTE: if a successfulRedirect url is used in the options then there is no way to access that data.

  registerRoute(router, 'get', '/auth/github', (req, res, next) => {
    passport.authenticate('github', <any>{ state: { hostname: req.hostname } })(
      req,
      res,
      next
    );
  });
  registerRoute(
    router,
    'get',
    '/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/',
    }),
    startOAuthLogin.bind(this, models, 'github')
  );

  registerRoute(router, 'get', '/auth/discord', (req, res, next) => {
    passport.authenticate('discord', <any>{
      state: { hostname: req.hostname },
    })(req, res, next);
  });

  registerRoute(
    router,
    'get',
    '/auth/discord/callback',
    passport.authenticate('discord', {
      failureRedirect: '/',
    }),
    startOAuthLogin.bind(this, models, 'discord')
  );

  registerRoute(
    router,
    'post',
    '/auth/magic',
    passport.authenticate('magic'),
    (req, res) => {
      return res.json({ status: 'Success', result: req.user.toJSON() });
    }
  );

  registerRoute(router, 'post', '/auth/sso', startSsoLogin.bind(this, models));
  registerRoute(
    router,
    'post',
    '/auth/sso/callback',
    // passport.authenticate('jwt', { session: false }),
    finishSsoLogin.bind(this, models)
  );

  registerRoute(
    router,
    'get',
    '/auth/callback',
    passport.authenticate('jwt', { session: false }),
    authCallback.bind(this, models)
  );

  // logout
  registerRoute(router, 'get', '/logout', logout.bind(this, models));

  registerRoute(
    router,
    'get',
    '/getEntityMeta',
    getEntityMeta.bind(this, models)
  );

  // snapshotAPI
  registerRoute(
    router,
    'post',
    '/snapshotAPI/sendMessage',
    sendMessage.bind(this)
  );

  registerRoute(
    router,
    'get',
    '/communityStats',
    databaseValidationService.validateChain,
    communityStats.bind(this, models)
  );

  // snapshot-commonwealth
  registerRoute(
    router,
    'get',
    '/snapshot',
    getSnapshotProposal.bind(this, models)
  );

  // These routes behave like get (fetch data) but use POST because a secret
  // is passed in the request body -> passing the secret via query parameters is not safe
  registerRoute(
    router,
    'post',
    '/getChainEventServiceData',
    getChainEventServiceData.bind(this, models)
  );
  registerRoute(router, 'post', '/getChain', getChain.bind(this, models));
  registerRoute(
    router,
    'post',
    '/getChainNode',
    getChainNode.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/getChainContracts',
    getChainContracts.bind(this, models)
  );
  registerRoute(
    router,
    'post',
    '/getSubscribedChains',
    getSubscribedChains.bind(this, models)
  );

  app.use(endpoint, router);
  app.use(methodNotAllowedMiddleware());
}

export default setupRouter;
