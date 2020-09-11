import 'pages/profile.scss';
import 'pages/validatorprofile.scss';
import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';
import app from 'state';
import { OffchainThread, OffchainComment, OffchainAttachment, Profile } from 'models';
import { Card, Icons, Icon, Select, TextArea, Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';
import PageNotFound from 'views/pages/404';
import { ValidatorStats } from './validator_profile_stats';
import chartComponent from '../../components/chart';
import lineModel from './graph_models/linemodel';

import ProfileHeader from './profile_header';

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
  totalStakeGraph: IGraphData;
  ownStakeGraph: IGraphData;
  otherStakeGraph: IGraphData;
  nominatorGraph: IGraphData;
  slashesGraph: IGraphData;
  imOnlineGraph: IGraphData;
  rewardsGraph: IGraphData;
  offenceGraph: IGraphData;
}

const dataGetter = async (vnode) => {
  // request for total stake OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getTotalStakeOverTime',
    params: { chain: app.chain.class, stash: vnode.state.account.address }
  })
    .then((response: any) => {
      vnode.state.totalStakeGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.totalStakeGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.totalStakeGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.totalStakeGraph = { blocks: [], values: [] };
    });

  // request for own stake OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getOwnStakeOverTime',
    params: { chain: app.chain.class, stash: vnode.state.account.address }
  })
    .then((response: any) => {
      vnode.state.ownStakeGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.ownStakeGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.ownStakeGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.ownStakeGraph = { blocks: [], values: [] };
    });

  // request for other stake OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getOtherStakeOverTime',
    params: { chain: app.chain.class, stash: vnode.state.account.address, onlyValue: true }
  })
    .then((response: any) => {
      vnode.state.otherStakeGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.otherStakeGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.otherStakeGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.otherStakeGraph = { blocks: [], values: [] };
    });

  // request for nominators OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getNominatorsOverTime',
    params: { chain: app.chain.class, stash: vnode.state.account.address, onlyValue: true }
  })
    .then((response: any) => {
      vnode.state.nominatorGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.nominatorGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.nominatorGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.nominatorGraph = { blocks: [], values: [] };
    });

  // request for slashes OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getSlashes',
    params: { chain: app.chain.class, stash: vnode.state.account.address }
  })
    .then((response: any) => {
      vnode.state.slashesGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.slashesGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.slashesGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.slashesGraph = { blocks: [], values: [] };
    });

  // request for ImOnline OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getImOnline',
    params: { chain: app.chain.class, stash: vnode.state.account.address }
  })
    .then((response: any) => {
      vnode.state.imOnlineGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.imOnlineGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.imOnlineGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.imOnlineGraph = { blocks: [], values: [] };
    });

  // request for REWARDS OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getRewards',
    params: { chain: app.chain.class, stash: vnode.state.account.address }
  })
    .then((response: any) => {
      vnode.state.rewardsGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.rewardsGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.rewardsGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.rewardsGraph = { blocks: [], values: [] };
    });

  // request for OFFENCES OVER BLOCKS
  m.request({
    method: 'GET',
    url: '/api/getOffences',
    params: { chain: app.chain.class, stash: vnode.state.account.address }
  })
    .then((response: any) => {
      vnode.state.offenceGraph = { blocks: [], values: [] };
      if (response) {
        vnode.state.offenceGraph.blocks = (Object.keys(response.result.validators[vnode.state.account.address]));
        vnode.state.offenceGraph.values = (Object.values(response.result.validators[vnode.state.account.address]));
      }
    }).catch((e: any) => {
      vnode.state.offenceGraph = { blocks: [], values: [] };
    });
};

const ProfilePage: m.Component<{ address: string }, IProfilePageState> = {
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.threads = [];
    vnode.state.comments = [];
    vnode.state.totalStakeGraph = undefined;
    vnode.state.nominatorGraph = undefined;
    vnode.state.ownStakeGraph = undefined;
    vnode.state.otherStakeGraph = undefined;
    vnode.state.imOnlineGraph = undefined;
    vnode.state.rewardsGraph = undefined;
    vnode.state.slashesGraph = undefined;
    vnode.state.offenceGraph = undefined;
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
    const { account, totalStakeGraph, ownStakeGraph, otherStakeGraph, nominatorGraph, slashesGraph, imOnlineGraph, rewardsGraph } = vnode.state;
    if (!account) {
      return m(PageNotFound, { message: 'Make sure the profile address is valid.' });
    }
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
          // TOTAL STAKE OVER BLOCKS
          totalStakeGraph ? (totalStakeGraph.blocks.length ? m(chartComponent, {
            title: 'TOTAL STAKE OVER BLOCKS', // Title
            model: lineModel,
            xvalues: totalStakeGraph.blocks,
            yvalues: totalStakeGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'TOTAL STAKE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'TOTAL STAKE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          // OWN STAKE OVER BLOCKS
          ownStakeGraph ? (ownStakeGraph.blocks.length ? m(chartComponent, {
            title: 'OWN STAKE OVER BLOCKS', // Title
            model: lineModel,
            xvalues: ownStakeGraph.blocks,
            yvalues: ownStakeGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OWN STAKE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OWN STAKE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          // OTHER STAKE OVER BLOCKS
          otherStakeGraph ? (otherStakeGraph.blocks.length ? m(chartComponent, {
            title: 'OTHER STAKE OVER BLOCKS', // Title
            model: lineModel,
            xvalues: otherStakeGraph.blocks,
            yvalues: otherStakeGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OTHER STAKE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OTHER STAKE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          // NOMINATORS OVER BLOCKS
          nominatorGraph ? (nominatorGraph.blocks.length ? m(chartComponent, {
            title: 'NOMINATORS OVER BLOCKS', // Title
            model: lineModel,
            xvalues: nominatorGraph.blocks,
            yvalues: nominatorGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'NOMINATORS OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'NOMINATORS OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          // SLASHES OVER BLOCKS
          slashesGraph ? (slashesGraph.blocks.length ? m(chartComponent, {
            title: 'SLASHES OVER BLOCKS', // Title
            model: lineModel,
            xvalues: slashesGraph.blocks,
            yvalues: slashesGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'SLASHES OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'SLASHES OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          imOnlineGraph ? (imOnlineGraph.blocks.length ? m(chartComponent, {
            title: 'IMONLINE OVER BLOCKS', // Title
            model: lineModel,
            xvalues: imOnlineGraph.blocks,
            yvalues: imOnlineGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'IMONLINE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'IMONLINE OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
          rewardsGraph ? (rewardsGraph.blocks.length ? m(chartComponent, {
            title: 'REWARDS OVER BLOCKS', // Title
            model: lineModel,
            xvalues: rewardsGraph.blocks,
            yvalues: rewardsGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'black'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'REWARDS OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'REWARDS OVER BLOCKS')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
              fill: false,
              message: ' Loading',
              size: 'xl',
              style: 'visibility: visible; opacity: 1;'
            })))]),
        ])
        // ]),
        // ]),
      ]),
    ]);
  },
};

export default ProfilePage;
