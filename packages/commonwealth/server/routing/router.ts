import express from 'express';
import passport from 'passport';
import type { Express } from 'express';

import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { StatsDController } from 'common-common/src/statsd';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import { defaultUserKeyGenerator } from 'common-common/src/cacheKeyUtils';

import domain from '../routes/domain';
import { status, statusBroken } from '../routes/status';
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
import bulkAddresses from '../routes/bulkAddresses';
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
import updateThreadLinkedChainEntities from '../routes/updateThreadLinkedChainEntities';
import updateThreadLinkedSnapshotProposal from '../routes/updateThreadLinkedSnapshotProposal';
import updateVote from '../routes/updateVote';
import viewVotes from '../routes/viewVotes';
import fetchEntityTitle from '../routes/fetchEntityTitle';
import fetchThreadForSnapshot from '../routes/fetchThreadForSnapshot';
import updateChainEntityTitle from '../routes/updateChainEntityTitle';
import updateLinkedThreads from '../routes/updateLinkedThreads';
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
import setProjectChain from '../routes/setProjectChain';
import type RuleCache from '../util/rules/ruleCache';
import banAddress from '../routes/banAddress';
import getBannedAddresses from '../routes/getBannedAddresses';
import type BanCache from '../util/banCheckCache';
import authCallback from '../routes/authCallback';
import viewChainIcons from '../routes/viewChainIcons';

import { addExternalRoutes } from './external';
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
import { createTemplate, getTemplates } from '../routes/templates';

import { addSwagger } from './addSwagger';
import * as controllers from '../controller';

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

  router.post(
    '/updateAddress',
    passport.authenticate('jwt', { session: false }),
    updateAddress.bind(this, models)
  );
  router.get('/domain', domain.bind(this, models));
  router.get(
    '/statusBroken',
    cacheDecorator.cacheMiddleware(100),
    statusBroken.bind(this, models)
  );
  router.post(
    '/ipfsPin',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    ipfsPin.bind(this, models)
  );
  router.post(
    '/editSubstrateSpec',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    editSubstrateSpec.bind(this, models)
  );

  router.post('/createAddress', createAddress.bind(this, models));
  router.post('/verifyAddress', verifyAddress.bind(this, models));
  router.post(
    '/deleteAddress',
    passport.authenticate('jwt', { session: false }),
    deleteAddress.bind(this, models)
  );
  router.post(
    '/linkExistingAddressToChain',
    passport.authenticate('jwt', { session: false }),
    linkExistingAddressToChain.bind(this, models)
  );
  router.post('/getAddressStatus', getAddressStatus.bind(this, models));
  router.post('/getAddressProfile', getAddressProfile.bind(this, models));
  router.post(
    '/selectChain',
    passport.authenticate('jwt', { session: false }),
    selectChain.bind(this, models)
  );

  // chains
  router.post(
    '/createChain',
    passport.authenticate('jwt', { session: false }),
    createChain.bind(this, models)
  );
  router.post('/deleteChain', deleteChain.bind(this, models));
  router.post(
    '/updateChain',
    passport.authenticate('jwt', { session: false }),
    updateChain.bind(this, models)
  );

  router.post(
    '/contract',
    passport.authenticate('jwt', { session: false }),
    createContract.bind(this, models)
  );

  router.post(
    '/etherscanAPI/fetchEtherscanContract',
    passport.authenticate('jwt', { session: false }),
    fetchEtherscanContract.bind(this, models)
  );

  router.post(
    '/etherscanAPI/fetchEtherscanContractAbi',
    passport.authenticate('jwt', { session: false }),
    fetchEtherscanContractAbi.bind(this, models)
  );

  router.post(
    '/starCommunity',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    starCommunity.bind(this, models)
  );

  router.post(
    '/tokenBalance',
    databaseValidationService.validateChain,
    tokenBalance.bind(this, models, tokenBalanceCache)
  );
  router.post(
    '/bulkBalances',
    bulkBalances.bind(this, models, tokenBalanceCache)
  );
  router.get('/getTokensFromLists', getTokensFromLists.bind(this, models));
  router.get('/getTokenForum', getTokenForum.bind(this, models));
  router.get(
    '/getSupportedEthChains',
    getSupportedEthChains.bind(this, models)
  );

  // threads
  router.post(
    '/createThread',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChainWithTopics,
    createThread.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  router.put(
    '/editThread',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    editThread.bind(this, models, banCache)
  );
  router.post(
    '/createPoll',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createPoll.bind(this, models)
  );
  router.get(
    '/getPolls',
    databaseValidationService.validateChain,
    getPolls.bind(this, models)
  );
  router.delete(
    '/deletePoll',
    passport.authenticate('jwt', { session: false }),
    deletePoll.bind(this, models)
  );
  router.post(
    '/updateThreadStage',
    passport.authenticate('jwt', { session: false }),
    updateThreadStage.bind(this, models)
  );
  router.post(
    '/updateThreadPrivacy',
    passport.authenticate('jwt', { session: false }),
    updateThreadPrivacy.bind(this, models)
  );
  router.post(
    '/updateThreadPinned',
    passport.authenticate('jwt', { session: false }),
    updateThreadPinned.bind(this, models)
  );
  router.post(
    '/updateThreadLinkedChainEntities',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateThreadLinkedChainEntities.bind(this, models)
  );
  router.post(
    '/updateThreadLinkedSnapshotProposal',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateThreadLinkedSnapshotProposal.bind(this, models)
  );

  router.post(
    '/updateVote',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    updateVote.bind(this, models, tokenBalanceCache, ruleCache)
  );
  router.get(
    '/viewVotes',
    databaseValidationService.validateChain,
    viewVotes.bind(this, models)
  );

  router.get('/fetchEntityTitle', fetchEntityTitle.bind(this, models));
  router.get(
    '/fetchThreadForSnapshot',
    fetchThreadForSnapshot.bind(this, models)
  );

  router.post(
    '/contractAbi',
    passport.authenticate('jwt', { session: false }),
    createContractAbi.bind(this, models)
  );

  // Templates
  router.post(
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    createTemplate.bind(this, models)
  );

  router.get(
    '/contract/template',
    passport.authenticate('jwt', { session: false }),
    getTemplates.bind(this, models)
  );

  // community contract
  router.post(
    '/contract/community_template_and_metadata',
    passport.authenticate('jwt', { session: false }),
    createCommunityContractTemplateAndMetadata.bind(this, models)
  );
  router.get(
    '/contract/community_template',
    getCommunityContractTemplate.bind(this, models)
  );

  router.put(
    '/contract/community_template',
    passport.authenticate('jwt', { session: false }),
    updateCommunityContractTemplate.bind(this, models)
  );

  router.delete(
    '/contract/community_template',
    passport.authenticate('jwt', { session: false }),
    deleteCommunityContractTemplate.bind(this, models)
  );

  // community contract metadata
  router.get(
    '/contract/community_template/metadata',
    getCommunityContractTemplateMetadata.bind(this, models)
  );

  router.put(
    '/contract/community_template/metadata',
    passport.authenticate('jwt', { session: false }),
    updateCommunityContractTemplateMetadata.bind(this, models)
  );

  router.delete(
    '/contract/community_template/metadata',
    passport.authenticate('jwt', { session: false }),
    deleteCommunityContractTemplateMetadata.bind(this, models)
  );

  router.post(
    '/updateChainEntityTitle',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateChainEntityTitle.bind(this, models)
  );
  router.post(
    '/updateLinkedThreads',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    updateLinkedThreads.bind(this, models)
  );
  router.post(
    '/addEditors',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    addEditors.bind(this, models)
  );
  router.post(
    '/deleteEditors',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    deleteEditors.bind(this, models)
  );
  router.post(
    '/deleteThread',
    passport.authenticate('jwt', { session: false }),
    deleteThread.bind(this, models, banCache)
  );
  router.get(
    '/bulkThreads',
    databaseValidationService.validateChain,
    bulkThreads.bind(this, models)
  );
  router.get(
    '/activeThreads',
    databaseValidationService.validateChain,
    activeThreads.bind(this, models)
  );
  router.get(
    '/getThreads',
    databaseValidationService.validateChain,
    getThreadsOld.bind(this, models)
  );
  router.get(
    '/searchDiscussions',
    databaseValidationService.validateChain,
    searchDiscussions.bind(this, models)
  );
  router.get(
    '/searchComments',
    databaseValidationService.validateChain,
    searchComments.bind(this, models)
  );

  router.get('/profile/v2', getProfileNew.bind(this, models));

  // discussion drafts
  router.post(
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createDraft.bind(this, models)
  );
  router.get('/drafts', getDrafts.bind(this, models));
  router.delete(
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    deleteDraft.bind(this, models)
  );
  router.patch(
    '/drafts',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    editDraft.bind(this, models)
  );

  router.get(
    '/bulkOffchain',
    databaseValidationService.validateChain,
    bulkOffchain.bind(this, models)
  );

  // comments
  router.post(
    '/createComment',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createComment.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  router.post(
    '/editComment',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    editComment.bind(this, models, banCache)
  );
  router.post(
    '/deleteComment',
    passport.authenticate('jwt', { session: false }),
    deleteComment.bind(this, models, banCache)
  );
  router.get(
    '/viewComments',
    databaseValidationService.validateChain,
    viewComments.bind(this, models)
  );
  router.get(
    '/bulkComments',
    databaseValidationService.validateChain,
    bulkComments.bind(this, models)
  );

  // topics
  router.post(
    '/createTopic',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createTopic.bind(this, models)
  );
  router.post(
    '/updateTopic',
    passport.authenticate('jwt', { session: false }),
    updateTopic.bind(this, models)
  );
  router.post(
    '/orderTopics',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    orderTopics.bind(this, models)
  );
  router.post(
    '/editTopic',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    editTopic.bind(this, models)
  );
  router.post(
    '/deleteTopic',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    deleteTopic.bind(this, models)
  );
  router.get(
    '/bulkTopics',
    databaseValidationService.validateChain,
    bulkTopics.bind(this, models)
  );
  router.post(
    '/setTopicThreshold',
    passport.authenticate('jwt', { session: false }),
    setTopicThreshold.bind(this, models)
  );

  // reactions
  router.post(
    '/createReaction',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    databaseValidationService.validateChain,
    createReaction.bind(this, models, tokenBalanceCache, ruleCache, banCache)
  );
  router.post(
    '/deleteReaction',
    passport.authenticate('jwt', { session: false }),
    deleteReaction.bind(this, models, banCache)
  );
  router.get(
    '/viewReactions',
    databaseValidationService.validateChain,
    viewReactions.bind(this, models)
  );
  router.get('/bulkReactions', bulkReactions.bind(this, models));
  router.post('/reactionsCounts', reactionsCounts.bind(this, models));
  router.post(
    '/threadsUsersCountAndAvatars',
    threadsUsersCountAndAvatars.bind(this, models)
  );

  // roles
  router.get('/roles', controllers.getRoles.bind(this, models));
  router.post('/roles', controllers.createRole.bind(this, models));
  router.patch('/roles', controllers.updateRole.bind(this, models));
  // permissions
  router.get('/permissions', controllers.getPermissions.bind(this, models));
  router.post('/permissions', controllers.createPermission.bind(this, models));
  router.patch('/permissions', controllers.updatePermission.bind(this, models));

  router.get(
    '/bulkMembers',
    databaseValidationService.validateChain,
    bulkMembers.bind(this, models)
  );
  router.post(
    '/upgradeMember',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    upgradeMember.bind(this, models)
  );

  // user model update
  router.post(
    '/updateEmail',
    passport.authenticate('jwt', { session: false }),
    updateEmail.bind(this, models)
  );

  // community banners (update or create)
  router.post(
    '/updateBanner',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateBanner.bind(this, models)
  );

  // fetch addresses (e.g. for mentions)
  router.get(
    '/bulkAddresses',
    databaseValidationService.validateChain,
    bulkAddresses.bind(this, models)
  );

  // projects related routes
  router.get(
    '/setProjectChain',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    setProjectChain.bind(this, models)
  );

  // third-party webhooks
  router.post(
    '/createWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createWebhook.bind(this, models)
  );
  router.post(
    '/updateWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    updateWebhook.bind(this, models)
  );
  router.post(
    '/deleteWebhook',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    deleteWebhook.bind(this, models)
  );
  router.get(
    '/getWebhooks',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    getWebhooks.bind(this, models)
  );

  // roles
  router.post(
    '/createRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createRole.bind(this, models)
  );
  router.post(
    '/deleteRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    deleteRole.bind(this, models)
  );
  router.post(
    '/setDefaultRole',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    setDefaultRole.bind(this, models)
  );

  // new profile
  router.post(
    '/updateProfile/v2',
    passport.authenticate('jwt', { session: false }),
    updateProfileNew.bind(this, models)
  );

  // social accounts
  router.delete(
    '/githubAccount',
    passport.authenticate('jwt', { session: false }),
    deleteSocialAccount.bind(this, models, 'github')
  );

  router.delete(
    '/discordAccount',
    passport.authenticate('jwt', { session: false }),
    deleteSocialAccount.bind(this, models, 'discord')
  );

  // viewCount
  router.post('/viewCount', viewCount.bind(this, models, viewCountCache));

  // attachments
  router.post(
    '/getUploadSignature',
    passport.authenticate('jwt', { session: false }),
    getUploadSignature.bind(this, models)
  );

  // notifications
  router.get(
    '/viewSubscriptions',
    passport.authenticate('jwt', { session: false }),
    viewSubscriptions.bind(this, models)
  );
  router.post(
    '/createSubscription',
    passport.authenticate('jwt', { session: false }),
    createSubscription.bind(this, models)
  );
  router.post(
    '/deleteSubscription',
    passport.authenticate('jwt', { session: false }),
    deleteSubscription.bind(this, models)
  );
  router.post(
    '/enableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    enableSubscriptions.bind(this, models)
  );
  router.post(
    '/disableSubscriptions',
    passport.authenticate('jwt', { session: false }),
    disableSubscriptions.bind(this, models)
  );

  router.post(
    '/viewDiscussionNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models, NotificationCategories.Discussion)
  );

  router.post(
    '/viewChainEventNotifications',
    passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models, NotificationCategories.ChainEvents)
  );

  router.post(
    '/viewUserActivity',
    passport.authenticate('jwt', { session: false }),
    viewUserActivity.bind(this, models)
  );
  router.post('/viewChainIcons', viewChainIcons.bind(this, models));
  router.post(
    '/viewGlobalActivity'
    ,viewGlobalActivity.bind(this, models, globalActivityCache)
  );
  router.post(
    '/markNotificationsRead',
    passport.authenticate('jwt', { session: false }),
    markNotificationsRead.bind(this, models)
  );
  router.post(
    '/clearReadNotifications',
    passport.authenticate('jwt', { session: false }),
    clearReadNotifications.bind(this, models)
  );
  router.post(
    '/clearNotifications',
    passport.authenticate('jwt', { session: false }),
    clearNotifications.bind(this, models)
  );
  router.post(
    '/enableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    enableImmediateEmails.bind(this, models)
  );
  router.post(
    '/disableImmediateEmails',
    passport.authenticate('jwt', { session: false }),
    disableImmediateEmails.bind(this, models)
  );
  router.post(
    '/setAddressWallet',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateAuthor,
    setAddressWallet.bind(this, models)
  );

  // chain categories
  router.post(
    '/updateChainCategory',
    passport.authenticate('jwt', { session: false }),
    updateChainCategory.bind(this, models)
  );

  // chat
  router.get(
    '/getChatMessages',
    passport.authenticate('jwt', { session: false }),
    getChatMessages.bind(this, models)
  );

  router.get(
    '/getChatChannel',
    passport.authenticate('jwt', { session: false }),
    getChatChannel.bind(this, models)
  );

  router.post(
    '/createChatChannel',
    passport.authenticate('jwt', { session: false }),
    createChatChannel.bind(this, models)
  );

  router.delete(
    '/deleteChatChannel',
    passport.authenticate('jwt', { session: false }),
    deleteChatChannel.bind(this, models)
  );

  router.delete(
    '/deleteChatCategory',
    passport.authenticate('jwt', { session: false }),
    deleteChatCategory.bind(this, models)
  );

  router.put(
    '/editChatChannel',
    passport.authenticate('jwt', { session: false }),
    editChatChannel.bind(this, models)
  );

  router.put(
    '/editChatCategory',
    passport.authenticate('jwt', { session: false }),
    editChatCategory.bind(this, models)
  );

  // rules
  router.post(
    '/createRule',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    createRule.bind(this, models)
  );
  router.post(
    '/deleteRule',
    passport.authenticate('jwt', { session: false }),
    deleteRule.bind(this, models)
  );
  router.get('/getRuleTypes', getRuleTypes.bind(this, models));

  // settings
  router.post(
    '/writeUserSetting',
    passport.authenticate('jwt', { session: false }),
    writeUserSetting.bind(this, models)
  );

  // send feedback button
  router.post('/sendFeedback', sendFeedback.bind(this, models));

  // bans
  router.post(
    '/banAddress',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    banAddress.bind(this, models)
  );

  router.get(
    '/getBannedAddresses',
    passport.authenticate('jwt', { session: false }),
    databaseValidationService.validateChain,
    getBannedAddresses.bind(this, models)
  );

  // Custom domain update route
  router.post(
    '/updateChainCustomDomain',
    updateChainCustomDomain.bind(this, models)
  );

  // Discord Bot
  router.post(
    '/createDiscordBotConfig',
    passport.authenticate('jwt', { session: false }),
    createDiscordBotConfig.bind(this, models)
  );
  router.post('/setDiscordBotConfig', setDiscordBotConfig.bind(this, models));
  router.post(
    '/getDiscordChannels',
    passport.authenticate('jwt', { session: false }),
    getDiscordChannels.bind(this, models)
  );

  router.post('/updateChainPriority', updateChainPriority.bind(this, models));

  router.post(
    '/generateImage',
    passport.authenticate('jwt', { session: false }),
    generateImage.bind(this, models)
  );

  // login
  router.post('/login', startEmailLogin.bind(this, models));
  router.get('/finishLogin', finishEmailLogin.bind(this, models));
  router.get('/finishOAuthLogin', finishOAuthLogin.bind(this, models));

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

  router.get('/auth/github', (req, res, next) => {
    passport.authenticate('github', <any>{ state: { hostname: req.hostname } })(
      req,
      res,
      next
    );
  });
  router.get(
    '/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/',
    }),
    startOAuthLogin.bind(this, models, 'github')
  );

  router.get('/auth/discord', (req, res, next) => {
    passport.authenticate('discord', <any>{
      state: { hostname: req.hostname },
    })(req, res, next);
  });

  router.get(
    '/auth/discord/callback',
    passport.authenticate('discord', {
      failureRedirect: '/',
    }),
    startOAuthLogin.bind(this, models, 'discord')
  );

  router.post('/auth/magic', passport.authenticate('magic'), (req, res) => {
    return res.json({ status: 'Success', result: req.user.toJSON() });
  });

  router.post('/auth/sso', startSsoLogin.bind(this, models));
  router.post(
    '/auth/sso/callback',
    // passport.authenticate('jwt', { session: false }),
    finishSsoLogin.bind(this, models)
  );

  router.get(
    '/auth/callback',
    passport.authenticate('jwt', { session: false }),
    authCallback.bind(this, models)
  );

  // logout
  router.get('/logout', logout.bind(this, models));

  router.get('/getEntityMeta', getEntityMeta.bind(this, models));

  // snapshotAPI
  router.post('/snapshotAPI/sendMessage', sendMessage.bind(this));
  router.get(
    '/communityStats',
    databaseValidationService.validateChain,
    communityStats.bind(this, models)
  );

  // snapshot-commonwealth
  router.get('/snapshot', getSnapshotProposal.bind(this, models));

  // These routes behave like get (fetch data) but use POST because a secret
  // is passed in the request body -> passing the secret via query parameters is not safe
  router.post(
    '/getChainEventServiceData',
    getChainEventServiceData.bind(this, models)
  );
  router.post('/getChain', getChain.bind(this, models));
  router.post('/getChainNode', getChainNode.bind(this, models));
  router.post('/getChainContracts', getChainContracts.bind(this, models));
  router.post('/getSubscribedChains', getSubscribedChains.bind(this, models));

  app.use(endpoint, router);
}

export default setupRouter;
