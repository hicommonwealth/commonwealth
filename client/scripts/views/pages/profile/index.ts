import 'pages/profile.scss';
import 'pages/validatorprofile.scss';
import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import Chart from 'chart.js';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';
import { OffchainThread, OffchainComment, OffchainAttachment, Profile } from 'models';
import { Card, Icons, Icon, Select, TextArea } from 'construct-ui';
import Sublayout from 'views/sublayout';
import PageNotFound from 'views/pages/404';
import PageLoading from 'views/pages/loading';
import Tabs from 'views/components/widgets/tabs';
import { ValidatorStats } from './validator_profile_stats';
import graphs from './graphs';

import ProfileHeader from './profile_header';
import ProfileContent from './profile_content';
import ProfileBio from './profile_bio';

const commentModelFromServer = (comment) => {
  const attachments = comment.OffchainAttachments
    ? comment.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  let proposal;
  try {
    const proposalSplit = decodeURIComponent(comment.root_id).split(/-|_/);
    proposal = new OffchainThread(
      '',
      '',
      null,
      Number(proposalSplit[1]),
      comment.created_at,
      null,
      null,
      null,
      comment.community,
      comment.chain,
      null,
      null
    );
  } catch (e) {
    proposal = null;
  }
  return new OffchainComment(
    comment.chain,
    comment?.Address?.address || comment.author,
    decodeURIComponent(comment.text),
    comment.version_history,
    attachments,
    proposal,
    comment.id,
    moment(comment.created_at),
    comment.child_comments,
    comment.root_id,
    comment.parent_id,
    comment.community,
    comment?.Address?.chain || comment.authorChain,
  );
};

const threadModelFromServer = (thread) => {
  const attachments = thread.OffchainAttachments
    ? thread.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  return new OffchainThread(
    thread.Address.address,
    decodeURIComponent(thread.title),
    attachments,
    thread.id,
    moment(thread.created_at),
    thread.topic,
    thread.kind,
    thread.version_history,
    thread.community,
    thread.chain,
    thread.private,
    thread.read_only,
    decodeURIComponent(thread.body),
    thread.url,
    thread.Address.chain,
    thread.pinned,
  );
};

export enum UserContent {
  All = 'all',
  Threads = 'threads',
  Comments = 'comments',
  Graphs = 'graphs'
}

interface IProfilePageState {
  account;
  threads: OffchainThread[];
  comments: OffchainComment<any>[];
  loaded: boolean;
  loading: boolean;
}

const ProfilePage: m.Component<{ address: string }, IProfilePageState> = {
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.loaded = false;
    vnode.state.loading = true;
    vnode.state.threads = [];
    vnode.state.comments = [];
  },
  oncreate: async (vnode) => {
    const loadProfile = async () => {
      const chain = (m.route.param('base'))
        ? m.route.param('base')
        : m.route.param('scope');
      const { address } = vnode.attrs;
      await $.ajax({
        url: `${app.serverUrl()}/profile`,
        type: 'GET',
        data: {
          address,
          chain,
          jwt: app.user.jwt,
        },
        success: (response) => {
          const { result } = response;
          vnode.state.loaded = true;
          vnode.state.loading = false;
          const a = result.account;
          const profile = new Profile(a.chain, a.address);
          if (a.OffchainProfile) {
            const profileData = JSON.parse(a.OffchainProfile.data);
            profile.initialize(profileData.name, profileData.headline, profileData.bio, profileData.avatarUrl);
          } else {
            profile.initializeEmpty();
          }
          const account = {
            profile,
            chain: a.chain,
            address: a.address,
            id: a.id,
            name: a.name,
            user_id: a.user_id,
          };
          vnode.state.account = account;
          vnode.state.threads = result.threads.map((t) => threadModelFromServer(t));
          vnode.state.comments = result.comments.map((c) => commentModelFromServer(c));
          m.redraw();
        },
        error: (err) => {
          console.log('Failed to find profile');
          console.error(err);
          vnode.state.loaded = true;
          vnode.state.loading = false;
          m.redraw();
          throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
            : 'Failed to find profile');
        }
      });
    };
    mixpanel.track('PageVisit', { 'Page Name': 'LoginPage' });
    loadProfile();
  },
  view: (vnode) => {
    const { account, loaded, loading } = vnode.state;
    if (loading) return m(PageLoading);
    if (!account) {
      return m(PageNotFound, { message: 'Make sure the profile address is valid.' });
    }
    // TODO: search for cosmos proposals, if ChainClass is Cosmos
    // TODO: search for signaling proposals ->
    // Commented-out lines from previous version which included signaling proposals in proposals var:
    // const discussions = app.threads.store.getAll()
    // .filter((p) => p instanceof OffchainThread && p.author === account.address);
    // const signaling = (app.chain as Edgeware).signaling.store.getAll()
    //   .filter((p) => p instanceof EdgewareSignalingProposal && p.data.author === account.address);
    // return [].concat(signaling, discussions);

    const comments = vnode.state.comments;
    const proposals = vnode.state.threads;
    const allContent = [].concat(proposals || []).concat(comments || [])
      .sort((a, b) => +b.createdAt - +a.createdAt);


    // const allTabTitle = (proposals && comments) ? `All (${proposals.length + comments.length})` : 'All';
    // const threadsTabTitle = (proposals) ? `Threads (${proposals.length})` : 'Threads';
    // const commentsTabTitle = (comments) ? `Comments (${comments.length})` : 'Comments';
    const graphsTabTitle = 'Statistics';

    const xValues = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
    const yValues = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400];
    const titles = ['REWARDS OVER TIME', 'SLASHES OVER TIME', 'NOMINATIONS OVER TIME',
      'ELECTED STAKE', 'OFFENCES OVER TIME', 'IM ONLINE EVENTS OVER TIME', 'NOMINATORS OVER TIME'];

    return m(Sublayout, {
      class: 'ProfilePage',
    }, [
      m('.forum-container-alt', [
        m(ProfileHeader, { account }),
        // Quick stats for a validator section
        m(ValidatorStats, { address: account.address, account }),
        // m('.row.row-narrow.forum-row', [
        // m('.col-xs-12', [
        m('.row', [
          m(graphs, {
            xValues, yValues, title: 'REWARDS OVER TIME'
          }),
          m(graphs, {
            xValues, yValues, title: 'SLASHES OVER TIME'
          }),
          m(graphs, {
            xValues, yValues, title: 'ELECTED STAKE'
          }),
          m(graphs, {
            xValues, yValues, title: 'NUMBER OF NOMINATORS'
          }),
          m(graphs, {
            xValues, yValues, title: 'IMONLINE EVENTS OVER TIME'
          }),
          m(graphs, {
            xValues, yValues, title: 'OFFENCES OVER TIME'
          }),
          m(graphs, {
            xValues, yValues, title: 'NOMINATORS OVER TIME'
          }),
        ])
        // ]),
        // ]),
      ]),
    ],);
  },
};

export default ProfilePage;
