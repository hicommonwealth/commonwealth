import express from 'express';
import webpack from 'webpack';
import passport from 'passport';

import status from './routes/status';
import createGist from './routes/createGist';

import edgewareLockdropEvents from './routes/edgeware_lockdrop_events';
import edgewareLockdropBalances from './routes/edgeware_lockdrop_balances';
import supernovaLockdropATOMLocks from './routes/supernova_lockdrop_atom_locks';
import supernovaLockdropBTCLocks from './routes/supernova_lockdrop_btc_locks';
import supernovaLockdropETHLocks from './routes/supernova_lockdrop_eth_locks';

import createHedgehogAuthentication from './routes/createHedgehogAuthentication';
import getHedgehogAuthentication from './routes/getHedgehogAuthentication';
import createHedgehogUser from './routes/createHedgehogUser';

import createAddress from './routes/createAddress';
import verifyAddress from './routes/verifyAddress';
import deleteAddress from './routes/deleteAddress';
import selectNode from './routes/selectNode';
import startEmailLogin from './routes/startEmailLogin';
import finishEmailLogin from './routes/finishEmailLogin';
import createComment from './routes/createComment';
import editComment from './routes/editComment';
import deleteComment from './routes/deleteComment';
import viewComments from './routes/viewComments';
import bulkComments from './routes/bulkComments';
import createReaction from './routes/createReaction';
import deleteReaction from './routes/deleteReaction';
import viewReactions from './routes/viewReactions';
import bulkReactions from './routes/bulkReactions';
import starCommunity from './routes/starCommunity';
import createCommunity from './routes/createCommunity';
import deleteCommunity from './routes/deleteCommunity';
import updateCommunity from './routes/updateCommunity';
import viewCount from './routes/viewCount';
import updateUserEmailInterval from './routes/updateUserEmailInterval';
import updateEmail from './routes/updateEmail';

import viewSubscriptions from './routes/subscription/viewSubscriptions';
import createSubscription from './routes/subscription/createSubscription';
import deleteSubscription from './routes/subscription/deleteSubscription';
import enableSubscriptions from './routes/subscription/enableSubscriptions';
import disableSubscriptions from './routes/subscription/disableSubscriptions';
import enableImmediateEmails from './routes/subscription/enableImmediateEmails';
import disableImmediateEmails from './routes/subscription/disableImmediateEmails';
import viewNotifications from './routes/viewNotifications';
import markNotificationsRead from './routes/markNotificationsRead';
import clearReadNotifications from './routes/clearReadNotifications';
import bulkMembers from './routes/bulkMembers';
import bulkAddresses from './routes/bulkAddresses';
import createInvite from './routes/createInvite';
import getInvites from './routes/getInvites';
import acceptInvite from './routes/acceptInvite';
import addMember from './routes/addMember';
import upgradeMember from './routes/upgradeMember';
import createInviteLink from './routes/createInviteLink';
import acceptInviteLink from './routes/acceptInviteLink';
import getInviteLinks from './routes/getInviteLinks';
import deleteGithubAccount from './routes/deleteGithubAccount';

import createRole from './routes/createRole';
import deleteRole from './routes/deleteRole';
import setDefaultRole from './routes/setDefaultRole';

import getUploadSignature from './routes/getUploadSignature';
import registerWaitingList from './routes/registerWaitingList';
import createThread from './routes/createThread';
import editThread from './routes/editThread';
import deleteThread from './routes/deleteThread';
import bulkThreads from './routes/bulkThreads';
import createDraft from './routes/drafts/createDraft';
import deleteDraft from './routes/drafts/deleteDraft';
import editDraft from './routes/drafts/editDraft';
import getDrafts from './routes/drafts/getDrafts';
import addChainNode from './routes/addChainNode';
import deleteChain from './routes/deleteChain';
import deleteChainNode from './routes/deleteChainNode';
import updateChain from './routes/updateChain';
import bulkProfiles from './routes/bulkProfiles';
import updateProfile from './routes/updateProfile';
import writeUserSetting from './routes/writeUserSetting';
import sendFeedback from './routes/sendFeedback';
import logout from './routes/logout';
import createTag from './routes/createTag';
import updateTags from './routes/updateTags';
import editTag from './routes/editTag';
import deleteTag from './routes/deleteTag';
import bulkTags from './routes/bulkTags';

import addChainObjectQuery from './routes/addChainObjectQuery';
import deleteChainObjectQuery from './routes/deleteChainObjectQuery';
import viewChainObjectQueries from './routes/viewChainObjectQueries';
import viewChainObjects from './routes/viewChainObjects';
import refreshChainObjects from './routes/refreshChainObjects';
import edgewareLockdropLookup from './routes/getEdgewareLockdropLookup';
import edgewareLockdropStats from './routes/getEdgewareLockdropStats';
import createWebhook from './routes/webhooks/createWebhook';
import deleteWebhook from './routes/webhooks/deleteWebhook';
import getWebhooks from './routes/webhooks/getWebhooks';
import ViewCountCache from './util/viewCountCache';

import bulkEntities from './routes/bulkEntities';

function setupRouter(app, models, fetcher, viewCountCache: ViewCountCache) {
  const router = express.Router();
  router.get('/status', status.bind(this, models));

  // TODO: Change to POST /gist
  router.post('/createGist', passport.authenticate('jwt', { session: false }), createGist.bind(this, models));
  // TODO: Change to POST /address
  router.post('/createAddress', createAddress.bind(this, models));
  // TODO: Change to PUT /address
  router.post('/verifyAddress', verifyAddress.bind(this, models));
  // TODO: Change to DELETE /address
  router.post('/deleteAddress', passport.authenticate('jwt', { session: false }), deleteAddress.bind(this, models));
  // TODO: Change to PUT /node
  router.post('/selectNode', passport.authenticate('jwt', { session: false }), selectNode.bind(this, models));

  // chains
  // TODO: Change to POST /chainNode
  router.post('/addChainNode', passport.authenticate('jwt', { session: false }), addChainNode.bind(this, models));
  // TODO: Change to DELETE /chain
  router.post('/deleteChain', passport.authenticate('jwt', { session: false }), deleteChain.bind(this, models));
  // TODO: Change to DELETE /chainNode
  router.post('/deleteChainNode', passport.authenticate('jwt', { session: false }), deleteChainNode.bind(this, models));
  // TODO: Change to PUT /chain
  router.post('/updateChain', passport.authenticate('jwt', { session: false }), updateChain.bind(this, models));

  // offchain communities
  router.post('/starCommunity', passport.authenticate('jwt', { session: false }), starCommunity.bind(this, models));

  // offchain community admin routes
  // TODO: Change to POST /community
  router.post('/createCommunity', passport.authenticate('jwt', { session: false }), createCommunity.bind(this, models));
  // TODO: Change to DELETE /community
  router.post('/deleteCommunity', passport.authenticate('jwt', { session: false }), deleteCommunity.bind(this, models));
  // TODO: Change to PUT /community
  router.post('/updateCommunity', passport.authenticate('jwt', { session: false }), updateCommunity.bind(this, models));

  // offchain threads
  // TODO: Change to POST /thread
  router.post('/createThread', passport.authenticate('jwt', { session: false }), createThread.bind(this, models));
  // TODO: Change to PUT /thread
  router.put('/editThread', passport.authenticate('jwt', { session: false }), editThread.bind(this, models));
  // TODO: Change to DELETE /thread
  router.post('/deleteThread', passport.authenticate('jwt', { session: false }), deleteThread.bind(this, models));
  // TODO: Change to GET /threads
  router.get('/bulkThreads', bulkThreads.bind(this, models));

  // offchain discussion drafts
  router.post('/drafts', passport.authenticate('jwt', { session: false }), createDraft.bind(this, models));
  router.get('/drafts', getDrafts.bind(this, models));
  router.delete('/drafts', passport.authenticate('jwt', { session: false }), deleteDraft.bind(this, models));
  router.patch('/drafts', passport.authenticate('jwt', { session: false }), editDraft.bind(this, models));

  // offchain comments
  // TODO: Change to POST /comment
  router.post('/createComment', passport.authenticate('jwt', { session: false }), createComment.bind(this, models));
  // TODO: Change to PUT /comment
  router.post('/editComment', passport.authenticate('jwt', { session: false }), editComment.bind(this, models));
  // TODO: Change to DELETE /comment
  router.post('/deleteComment', passport.authenticate('jwt', { session: false }), deleteComment.bind(this, models));
  // TODO: Change to GET /comments
  router.get('/viewComments', viewComments.bind(this, models));
  // TODO: Change to GET /comments
  router.get('/bulkComments', bulkComments.bind(this, models));

  // offchain tags
  // TODO: Change to POST /tag
  router.post('/createTag', passport.authenticate('jwt', { session: false }), createTag.bind(this, models));
  // TODO: Change to PUT /tags
  router.post('/updateTags', passport.authenticate('jwt', { session: false }), updateTags.bind(this, models));
  // TODO: Change to PUT /tag
  router.post('/editTag', passport.authenticate('jwt', { session: false }), editTag.bind(this, models));
  // TODO: Change to DELETE /tag
  router.post('/deleteTag', passport.authenticate('jwt', { session: false }), deleteTag.bind(this, models));
  // TODO: Change to GET /tags
  router.get('/bulkTags', bulkTags.bind(this, models));

  // offchain reactions
  // TODO: Change to POST /reaction
  router.post('/createReaction', passport.authenticate('jwt', { session: false }), createReaction.bind(this, models));
  // TODO: Change to DELETE /reaction
  router.post('/deleteReaction', passport.authenticate('jwt', { session: false }), deleteReaction.bind(this, models));
  // TODO: Change to GET /reactions
  router.get('/viewReactions', viewReactions.bind(this, models));
  // TODO: Change to GET /reactions
  router.get('/bulkReactions', bulkReactions.bind(this, models));

  // generic invite link
  // TODO: Change to POST /inviteLink
  router.post('/createInviteLink', passport.authenticate('jwt', { session: false }), createInviteLink.bind(this, models));
  // TODO: Change to PUT /inviteLink
  router.get('/acceptInviteLink', acceptInviteLink.bind(this, models));
  // TODO: Change to GET /inviteLinks
  router.get('/getInviteLinks', passport.authenticate('jwt', { session: false }), getInviteLinks.bind(this, models));

  // roles + permissions
  // TODO: Change to GET /members
  router.get('/bulkMembers', bulkMembers.bind(this, models));
  // TODO: Change to POST /invite
  router.post('/createInvite', passport.authenticate('jwt', { session: false }), createInvite.bind(this, models));
  // TODO: Change to GET /invites
  router.get('/getInvites', passport.authenticate('jwt', { session: false }), getInvites.bind(this, models));
  // TODO: Change to PUT /invite
  router.post('/acceptInvite', passport.authenticate('jwt', { session: false }), acceptInvite.bind(this, models));
  // TODO: Change to POST /member
  router.post('/addMember', passport.authenticate('jwt', { session: false }), addMember.bind(this, models));
  // TODO: Change to PUT /member
  router.post('/upgradeMember', passport.authenticate('jwt', { session: false }), upgradeMember.bind(this, models));

  // user model update
  // TODO: Change to PUT /userEmailInterval
  router.post('/updateUserEmailInterval', passport.authenticate('jwt', { session: false }), updateUserEmailInterval.bind(this, models));
  // TODO: Change to PUT /email
  router.post('/updateEmail', passport.authenticate('jwt', { session: false }), updateEmail.bind(this, models));

  // fetch addresses (e.g. for mentions)
  // TODO: Change to GET /addresses
  router.get('/bulkAddresses', bulkAddresses.bind(this, models));

  // third-party webhooks
  // TODO: Change to POST /webhook
  router.post('/createWebhook', passport.authenticate('jwt', { session: false }), createWebhook.bind(this, models));
  // TODO: Change to DELETE /webhook
  router.post('/deleteWebhook', passport.authenticate('jwt', { session: false }), deleteWebhook.bind(this, models));
  // TODO: Change to GET /webhooks
  router.get('/getWebhooks', passport.authenticate('jwt', { session: false }), getWebhooks.bind(this, models));

  // roles
  // TODO: Change to POST /role
  router.post('/createRole', passport.authenticate('jwt', { session: false }), createRole.bind(this, models));
  // TODO: Change to DELETE /role
  router.post('/deleteRole', passport.authenticate('jwt', { session: false }), deleteRole.bind(this, models));
  // TODO: Change to PUT /role
  router.post('/setDefaultRole', passport.authenticate('jwt', { session: false }), setDefaultRole.bind(this, models));

  // offchain profiles
  // TODO: Change to PUT /profile
  router.post('/updateProfile', passport.authenticate('jwt', { session: false }), updateProfile.bind(this, models));
  // TODO: Change to GET /profiles
  router.post('/bulkProfiles', bulkProfiles.bind(this, models));

  // social accounts
  router.delete('/githubAccount', passport.authenticate('jwt', { session: false }), deleteGithubAccount.bind(this, models));


  // offchain viewCount
  router.post('/viewCount', viewCount.bind(this, models, viewCountCache));

  // attachments
  // TODO: Change to POST /uploadSignature
  router.post('/getUploadSignature', passport.authenticate('jwt', { session: false }), getUploadSignature.bind(this, models));

  // homepage and waiting lists
  // TODO: Change to POST /waitingList
  router.post('/registerWaitingList', registerWaitingList.bind(this, models));

  // notifications
  // TODO: Change to GET /subscriptions
  router.get('/viewSubscriptions', passport.authenticate('jwt', { session: false }),
    viewSubscriptions.bind(this, models));
  // TODO: Change to POST /subscription
  router.post('/createSubscription', passport.authenticate('jwt', { session: false }),
    createSubscription.bind(this, models));
  // TODO: Change to DELETE /subscription
  router.post('/deleteSubscription', passport.authenticate('jwt', { session: false }),
    deleteSubscription.bind(this, models));
  // TODO: Change to PUT /subscriptions
  router.post('/enableSubscriptions', passport.authenticate('jwt', { session: false }),
    enableSubscriptions.bind(this, models));
  // TODO: Change to PUT /subscriptions
  router.post('/disableSubscriptions', passport.authenticate('jwt', { session: false }),
    disableSubscriptions.bind(this, models));
  // TODO: Change to GET /notifications
  router.post('/viewNotifications', passport.authenticate('jwt', { session: false }),
    viewNotifications.bind(this, models));
  // TODO: Change to PUT /notificationsRead
  router.post('/markNotificationsRead', passport.authenticate('jwt', { session: false }),
    markNotificationsRead.bind(this, models));
  // TODO: Change to DELETE /notificationsRead
  router.post('/clearReadNotifications', passport.authenticate('jwt', { session: false }),
    clearReadNotifications.bind(this, models));
  // TODO: Change to PUT /immediateEmails
  router.post('/enableImmediateEmails', passport.authenticate('jwt', { session: false }),
    enableImmediateEmails.bind(this, models));
  // TODO: Change to PUT /immediateEmails
  router.post('/disableImmediateEmails', passport.authenticate('jwt', { session: false }),
    disableImmediateEmails.bind(this, models));

  // settings
  // TODO: Change to POST /userSetting
  router.post('/writeUserSetting', passport.authenticate('jwt', { session: false }),
              writeUserSetting.bind(this, models));

  // send feedback button
  // TODO: Change to POST /feedback
  router.post('/sendFeedback', sendFeedback.bind(this, models));

  // stats
  // edgeware
  router.get('/stats/edgeware/lockdrop/events', edgewareLockdropEvents.bind(this, models));
  router.get('/stats/edgeware/lockdrop/balances', edgewareLockdropBalances.bind(this, models));
  // supernova
  router.get('/stats/supernova/lockdrop/atom', supernovaLockdropATOMLocks.bind(this, models));
  router.get('/stats/supernova/lockdrop/btc', supernovaLockdropBTCLocks.bind(this, models));
  router.get('/stats/supernova/lockdrop/eth', supernovaLockdropETHLocks.bind(this, models));
  // login
  router.post('/login', startEmailLogin.bind(this, models));
  router.get('/finishLogin', finishEmailLogin.bind(this, models));
  router.get('/auth/github', passport.authenticate('github'));
  router.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/', failureRedirect: '/#!/login' }));
  // logout
  router.get('/logout', logout.bind(this, models));

  // TODO: Delete these routes if we don't use them anymore
  router.post('/addChainObjectQuery', passport.authenticate('jwt', { session: false }),
    addChainObjectQuery.bind(this, models));
  router.post('/deleteChainObjectQuery', passport.authenticate('jwt', { session: false }),
    deleteChainObjectQuery.bind(this, models));
  router.post('/viewChainObjectQueries', passport.authenticate('jwt', { session: false }),
    viewChainObjectQueries.bind(this, models));
  router.get('/viewChainObjects', viewChainObjects.bind(this, models));
  router.get('/refreshChainObjects', refreshChainObjects.bind(this, models, fetcher));

  router.get('/edgewareLockdropLookup', edgewareLockdropLookup.bind(this, models));
  router.get('/edgewareLockdropStats', edgewareLockdropStats.bind(this, models));

  // TODO: Change to GET /entities
  router.get('/bulkEntities', bulkEntities.bind(this, models));

  app.use('/api', router);
}
export default setupRouter;
