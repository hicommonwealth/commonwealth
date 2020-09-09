import 'pages/profile.scss';
import 'pages/validatorprofile.scss';
import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import Chart from 'chart.js';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';
import { get } from 'lib/util';


import app from 'state';
import { uniqueIdToProposal } from 'identifiers';
import { OffchainThread, OffchainComment, OffchainAttachment, Profile } from 'models';
import { Card, Icons, Icon, Select, TextArea, Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';
import PageNotFound from 'views/pages/404';
import PageLoading from 'views/pages/loading';
import Tabs from 'views/components/widgets/tabs';
import { async } from 'rxjs';
import { ValidatorStats } from './validator_profile_stats';
import graphs from './graphs';
import chartComponent from '../../components/chart';
import lineModel from './graph_models/linemodel';

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

interface IGraphData {
  blocks: any[], // x axis
  values: any[] // y axis
}

interface IProfilePageState {
  account;
  threads: OffchainThread[];
  comments: OffchainComment<any>[];
  loaded: boolean;
  loading: boolean;
  rewardsGraph: IGraphData;
  slashesGraph: IGraphData;
  totalStakeGraph: IGraphData;
  imOnlineGraph: IGraphData;
  offenceGraph: IGraphData;
  nominatorGraph: IGraphData;
}

const dataGetter = async (vnode) => {
  // request for total stake over time
  m.request({
    method: 'GET',
    url: '/api/getTotalStakeOverTime',
    params: { chain:'edgeware', stash_id: vnode.state.account.address }
  })
    .then((response:any) => {
      vnode.state.totalStakeGraph = { blocks:[], values:[] };
      vnode.state.totalStakeGraph.blocks  = (Object.keys(response.result.validators[vnode.state.account.address]));
      vnode.state.totalStakeGraph.values  = (Object.values(response.result.validators[vnode.state.account.address]));
    });
  // request for own stake over time
  m.request({
    method: 'GET',
    url: '/api/getTotalStakeOverTime',
    params: { chain:'edgeware', stash_id: vnode.state.account.address }
  })
    .then((response:any) => {
      vnode.state.totalStakeGraph = { blocks:[], values:[] };
      vnode.state.totalStakeGraph.blocks  = (Object.keys(response.result.validators[vnode.state.account.address]));
      vnode.state.totalStakeGraph.values  = (Object.values(response.result.validators[vnode.state.account.address]));
    });
};

const ProfilePage: m.Component<{ address: string }, IProfilePageState> = {
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.threads = [];
    vnode.state.comments = [];
    vnode.state.totalStakeGraph = undefined;
    vnode.state.rewardsGraph = undefined;
    vnode.state.slashesGraph = undefined;
    vnode.state.imOnlineGraph = undefined;
    vnode.state.offenceGraph = undefined;
    vnode.state.nominatorGraph = undefined;
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
          dataGetter(vnode);
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
    const { account, totalStakeGraph } = vnode.state;
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
    // get('/getTotalStakeOverTime', { chain:app.chain.class, stash_id: account.address }, (result) => {
    //   vnode.state.graph1_x  = (Object.keys(result.validators[account.address]));
    //   vnode.state.graph1_y  = (Object.values(result.validators[account.address]));
    //   m.redraw();
    // });
    // m.redraw();
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
          m(chartComponent, {
            title: 'REWARDS OVER TIME',
            model: lineModel,
            xvalues:[403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471],
            yvalues:[500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400],
            xLabelString:'SESSION',
            yLabelString:'REWARD',
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color:'green'
          }),
          m(chartComponent, {
            title: 'SLASHES OVER TIME',
            model: lineModel,
            xvalues:[500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400],
            yvalues:[403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471],
            xLabelString:'SESSION',
            yLabelString:'SLASH',
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color:'green'
          }),
          totalStakeGraph ? m(chartComponent, {
            title: 'TOTAL STAKE OVER TIME', // Title
            model: lineModel,
            xvalues:totalStakeGraph.blocks,
            yvalues:totalStakeGraph.values,
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color:'green'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'TOTAL STAKE OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message:' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          m(chartComponent, {
            title: 'IMONLINE EVENTS OVER TIME',
            model: lineModel,
            xvalues:[1800, 403, 406, 409, 412, 415, 418, 430, 800, 403, 406, 409, 412, 415, 418, 430],
            yvalues:[600, 350, 400, 380, 690, 800, 600, 350, 400, 380, 690, 800, 600, 350, 400, 380, 690, 800],
            xLabelString:'BLOCK',
            yLabelString:'HEARTBEAT',
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color:'green'
          }),
          m(chartComponent, {
            title: 'OFFENCES OVER TIME',
            model: lineModel,
            xvalues:[1, 89, 120, 850, 971],
            yvalues:[23, 861, 71, 152, 956],
            xLabelString:'SESSION',
            yLabelString:'OFFENCE',
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color:'green'
          }),
          m(chartComponent, {
            title: 'NOMINATORS OVER TIME',
            model: lineModel,
            xvalues:[12, 89, 12, 850, 97],
            yvalues:[213, 861, 712, 152, 956],
            xLabelString:'BLOCK',
            yLabelString:'yaixs',
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color:'green'
          }),
        ])
        // ]),
        // ]),
      ]),
    ],);
  },
};

export default ProfilePage;
