import 'pages/profile.scss';
import 'pages/validatorprofile.scss';
import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';
import app from 'state';
import { OffchainThread, OffchainComment, OffchainAttachment, Profile, ChainBase } from 'models';
import { Card, Icons, Icon, Select, TextArea, Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';
import PageNotFound from 'views/pages/404';
import { makeDynamicComponent } from 'models/mithril';
import Substrate from 'controllers/chain/substrate/main';
import { ApiRx } from '@polkadot/api';
import { ValidatorStats } from './validator_profile_stats';
import chartComponent from '../../components/chart';
import lineModel from './graph_models/linemodel';


import ProfileHeader from './profile_header';

// Global bucket const
const numBuckets = 16;
const bucketSize = 27000 ; // blocks shown over a single bucket
const ySteps = 4;

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
  values: any[] // y axis,
  minValue: number,
  maxValue: number,
  yStepSize: number
}

function getEmptyGraphData() {
  return { blocks: [], values: [], minValue: undefined, maxValue: undefined, yStepSize: undefined }
}

export interface IProfileAttrs {
  address: string;
}

interface IProfilePageState {
  dynamic: {
    validators: any,
    lastHeader: any,
    apiApi: ApiRx,
    finalizedHead: any
  };
  account;
  address;
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
  latestBlock: number
  fetchedBlock: boolean;
}

interface IGraphApi {
  route: string,
  data: any
}

function buildBucketKeys(bk, bucket, recentBlockNum, jumpIdx) {
  for (let i = 0; i < bucket.length; i++) {
    bk[i] = `${
      (recentBlockNum - ((bucket.length - i) * jumpIdx))}-${
      (recentBlockNum - ((bucket.length - (i)) * jumpIdx) + jumpIdx) / jumpIdx}`;

    bk[i] = ((recentBlockNum - ((bucket.length - i) * jumpIdx)));
    bk[i] = Number(bk[i]);
  }
}

function addInDesiredBucket(bucketCount, recentBlockNum, bucket, jumpIdx, v, vk) {
  let k = 0;
  while (k < bucketCount) {
    if (Number(vk) <= recentBlockNum && (recentBlockNum - Number(vk)) <= ((k + 1) * jumpIdx)) {

      let numToAdd = typeof(v[vk]) === ('object') ? 0 : Number(v[vk]) ; 

      bucket[(bucketCount - 1) - (k)] = (bucket[(bucketCount - 1) - (k)] + Number(v[vk])) / 2
      k = bucketCount;
    }
    k++;
  }
}

function generateBuckets(v, bucketCount, jumpIdx, recentBlockNum) {
  const bucket = new Array(bucketCount).fill(0);
  const bk = [];
  buildBucketKeys(bk, bucket, recentBlockNum, jumpIdx);

  Object.keys(v).forEach((vk) => {
    addInDesiredBucket(bucketCount, recentBlockNum, bucket, jumpIdx, v, vk);
  });
  return {
    'key': bk,
    'value': bucket
  };
}

async function assignApiValues(route, obj: IGraphData, addr, latestBlock) {
  try {
    const apiRes = await $.get(`${app.serverUrl()}/${route}`, { chain: app.chain.class, stash: addr });
    console.log(route, apiRes)
    const bucket = generateBuckets(apiRes.result.validators[addr],
      numBuckets,
      bucketSize,
      latestBlock);
      // /if (route === 'getOtherStakeOverTime')
        debugger;
    obj.blocks = bucket.key;
    obj.values = bucket.value.map((x) => {
      return ((Number(x) / 1_000_000_000_000_000_000) / 1000000).toFixed(0); // 1EDG = 10^18
    });
    obj.maxValue = Math.max.apply(Math, obj.values);
    obj.minValue = Math.min.apply(Math, obj.values);
    obj.yStepSize = obj.maxValue / ySteps;
  } catch (e) {
    // /console.error(e);
  }
}


const dataGetter = async (vnode) => {
  const address = vnode.state.account.address;
  const latestBlock = vnode.state.latestBlock;

  const apiCalls: IGraphApi[] = [
    { route: 'getTotalStakeOverTime', data: vnode.state.totalStakeGraph },
    { route: 'getOwnStakeOverTime', data: vnode.state.ownStakeGraph },
    { route: 'getOtherStakeOverTime', data: vnode.state.otherStakeGraph },
    { route: 'getNominatorsOverTime', data: vnode.state.nominatorGraph },
    { route: 'getSlashes', data: vnode.state.slashesGraph },
    { route: 'getImOnline', data: vnode.state.imOnlineGraph },
    { route: 'getRewards', data: vnode.state.rewardsGraph },
    { route: 'getOffences', data: vnode.state.offenceGraph },
  ]
  apiCalls.forEach(api => assignApiValues(api.route, api.data, address, latestBlock));
}

const ProfilePage = makeDynamicComponent<IProfileAttrs, IProfilePageState>({
  getObservables: (attrs) => ({
    groupKey: app.chain.class.toString(),
    validators: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null,
    apiApi: (app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).chain.api : null,
    // finalizedHead: (app.chain.base === ChainBase.Substrate) ? apiApi.rpc.chain.getFinalizedHead() : null
    // lastBlock: api.rpc.chain.getFinalizedHead
  }),
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.threads = [];
    vnode.state.comments = [];
    // vnode.state.totalStakeGraph = undefined;
    // vnode.state.nominatorGraph = undefined;
    // vnode.state.ownStakeGraph = undefined;
    // vnode.state.otherStakeGraph = undefined;
    // vnode.state.imOnlineGraph = undefined;
    // vnode.state.rewardsGraph = undefined;
    // vnode.state.slashesGraph = undefined;
    // vnode.state.offenceGraph = undefined;
    // vnode.state.latestBlock = undefined;
    vnode.state.fetchedBlock = false;
  },
  oncreate: async (vnode) => {
    vnode.state.totalStakeGraph = getEmptyGraphData();
    vnode.state.slashesGraph = getEmptyGraphData();
    vnode.state.rewardsGraph = getEmptyGraphData();
    vnode.state.ownStakeGraph = getEmptyGraphData();
    vnode.state.otherStakeGraph = getEmptyGraphData();
    vnode.state.offenceGraph = getEmptyGraphData();
    vnode.state.nominatorGraph = getEmptyGraphData();
    vnode.state.imOnlineGraph = getEmptyGraphData();

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
          // dataGetter(vnode);
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
    if (!vnode.state.fetchedBlock && vnode.state.dynamic.validators && app.chain) {
      const a: Substrate = app.chain as Substrate;
      const apiCheck = a.chain.api;
      if (apiCheck) {
        const aa: ApiRx = vnode.state.dynamic.apiApi;
        vnode.state.fetchedBlock = true;
        aa.rpc.chain.getFinalizedHead().subscribe({
          next: (q) => {
            const gotHash = q.toJSON();
            aa.rpc.chain.getBlock(gotHash).subscribe({
              next: (ww) => {
                const w1: any = ww.toJSON();
                vnode.state.latestBlock = w1.block.header['number'];
                dataGetter(vnode);
              },
              complete: () => {
              }
            });
          },
          complete: () => {
          }
        });
      }
    }

    const { account, totalStakeGraph, offenceGraph, ownStakeGraph, otherStakeGraph, nominatorGraph, slashesGraph, imOnlineGraph, rewardsGraph } = vnode.state;
    if (!account) {
      return m(PageNotFound, { message: 'Make sure the profile address is valid.' });
    }
    //debugger;
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
          // TOTAL STAKE OVER TIME
          totalStakeGraph ? (totalStakeGraph.blocks.length ? m(chartComponent, {
            title: 'TOTAL STAKE OVER TIME (Thousands)', // Title
            model: lineModel(totalStakeGraph.maxValue, totalStakeGraph.minValue, totalStakeGraph.yStepSize),
            xvalues: totalStakeGraph.blocks,
            yvalues: totalStakeGraph.values,
            addColorStop0: 'rgba(99, 113, 209, 0.23)',
            addColorStop1: 'rgba(99, 113, 209, 0)',
            color: 'rgb(99, 113, 209)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'TOTAL STAKE OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'TOTAL STAKE OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // OWN STAKE OVER TIME
          ownStakeGraph ? (ownStakeGraph.blocks.length ? m(chartComponent, {
            title: 'OWN STAKE OVER TIME - in millions', // Title
            model: lineModel(ownStakeGraph.maxValue, ownStakeGraph.minValue, ownStakeGraph.yStepSize),
            xvalues: ownStakeGraph.blocks,
            yvalues: ownStakeGraph.values,
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color: 'rgb(53, 212, 19)',
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OWN STAKE OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'OWN STAKE OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // OTHER STAKE OVER TIME
          otherStakeGraph ? (otherStakeGraph.blocks.length ? m(chartComponent, {
            title: 'OTHER STAKE OVER TIME - in millions', // Title
            model: lineModel(otherStakeGraph.maxValue, otherStakeGraph.minValue, otherStakeGraph.yStepSize),
            xvalues: otherStakeGraph.blocks,
            yvalues: otherStakeGraph.values,
            addColorStop0: 'rgba(83, 110, 124, 0.23)',
            addColorStop1: 'rgba(83, 110, 124, 0)',
            color: 'rgb(83, 110, 124)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OTHER STAKE OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'OTHER STAKE OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // NOMINATORS OVER TIME
          nominatorGraph ? (nominatorGraph.blocks.length ? m(chartComponent, {
            title: 'NOMINATORS OVER TIME', // Title
            model: lineModel(nominatorGraph.maxValue, nominatorGraph.minValue, nominatorGraph.yStepSize),
            xvalues: nominatorGraph.blocks,
            yvalues: nominatorGraph.values,
            addColorStop0: 'rgba(237, 146, 61, 0.23)',
            addColorStop1: 'rgba(237, 146, 61, 0)',
            color: 'rgb(237, 146, 61)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'NOMINATORS OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'NOMINATORS OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // SLASHES OVER TIME
          slashesGraph ? (slashesGraph.blocks.length ? m(chartComponent, {
            title: 'SLASHES OVER TIME', // Title
            model: lineModel(slashesGraph.maxValue, slashesGraph.minValue, slashesGraph.yStepSize),
            xvalues: slashesGraph.blocks,
            yvalues: slashesGraph.values,
            addColorStop0: 'rgba(53, 212, 19, 0.23)',
            addColorStop1: 'rgba(53, 212, 19, 0)',
            color: 'rgb(53, 212, 19)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'SLASHES OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'SLASHES OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // IMONLINE OVER TIME
          imOnlineGraph ? (imOnlineGraph.blocks.length ? m(chartComponent, {
            title: 'IMONLINE OVER TIME', // Title
            model: lineModel(imOnlineGraph.maxValue, imOnlineGraph.minValue, imOnlineGraph.yStepSize),
            xvalues: imOnlineGraph.blocks,
            yvalues: imOnlineGraph.values,
            addColorStop0: 'rgba(99, 113, 209, 0.23)',
            addColorStop1: 'rgba(99, 113, 209, 0)',
            color: 'rgb(99, 113, 209)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'IMONLINE OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'IMONLINE OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // REWARDS OVER TIME
          rewardsGraph ? (rewardsGraph.blocks.length ? m(chartComponent, {
            title: 'REWARDS OVER TIME', // Title
            model: lineModel(rewardsGraph.maxValue, rewardsGraph.minValue, rewardsGraph.yStepSize),
            xvalues: rewardsGraph.blocks,
            yvalues: rewardsGraph.values,
            addColorStop0: 'rgba(0, 0, 0, 0.23)',
            addColorStop1: 'rgba(0, 0, 0, 0)',
            color: 'rgb(0, 0, 0)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'REWARDS OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'REWARDS OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
          // OFFENCES OVER TIME
          offenceGraph ? (offenceGraph.blocks.length ? m(chartComponent, {
            title: 'OFFENCES OVER TIME', // Title
            model: lineModel(offenceGraph.maxValue, offenceGraph.minValue, offenceGraph.yStepSize),
            xvalues: offenceGraph.blocks,
            yvalues: offenceGraph.values,
            addColorStop0: 'rgba(99, 113, 209 0.23)',
            addColorStop1: 'rgba(99, 113, 209 0)',
            color: 'rgb(99, 113, 209)'
          }) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
            m('div.row.graph-title', m('p', 'OFFENCES OVER TIME')), // Give same Title here
            m('#canvas-holder', m('div.row.graph-spinner', 'NO DATA AVAILABLE'))])) : m('.col-xs-5 .col-xs-offset-1 .graph-container', [
              m('div.row.graph-title', m('p', 'OFFENCES OVER TIME')), // Give same Title here
              m('#canvas-holder', m('div.row.graph-spinner', m(Spinner, {
                fill: false,
                message: ' Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;'
              })))]),
        ])
        // ]),
        // ]),
      ]),
    ]);
  },
});

export default ProfilePage;
