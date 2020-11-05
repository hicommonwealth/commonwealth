import 'pages/profile.scss';

import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';
import { OffchainThread, OffchainComment, OffchainAttachment, Profile } from 'models';

import Sublayout from 'views/sublayout';
import PageNotFound from 'views/pages/404';
import PageLoading from 'views/pages/loading';
import Tabs from 'views/components/widgets/tabs';

import { decodeAddress } from '@polkadot/keyring';
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
    if (proposalSplit[0] === 'discussion') {
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
    } else {
      proposal = {
        chain: comment.chain,
        community: comment.community,
        slug: proposalSplit[0],
        identifier: proposalSplit[1],
      };
    }
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
  Comments = 'comments'
}

interface IProfilePageState {
  account;
  threads: OffchainThread[];
  comments: OffchainComment<any>[];
  loaded: boolean;
  loading: boolean;
  refreshProfile: boolean;
}

const ProfilePage: m.Component<{ address: string, setIdentity?: boolean }, IProfilePageState> = {
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.threads = [];
    vnode.state.comments = [];
    vnode.state.refreshProfile = false;
  },
  oncreate: async (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'LoginPage' });
  },
  view: (vnode) => {
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
            // ignore off-chain name if substrate id exists
            if (a.OffchainProfile.identity) {
              profile.initializeWithChain(
                a.OffchainProfile.identity,
                profileData.headline,
                profileData.bio,
                profileData.avatarUrl,
                a.OffchainProfile.judgements
              );
            } else {
              profile.initialize(profileData.name, profileData.headline, profileData.bio, profileData.avatarUrl);
            }
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
          console.error(err);
          // decode address properly
          if (['kulupu', 'edgeware', 'polkadot', 'kusama'].includes(chain)) {
            try {
              decodeAddress(address);
              vnode.state.account = {
                profile: null,
                chain,
                address,
                id: null,
                name: null,
                user_id: null,
              };
            } catch (e) {
              // do nothing if can't decode
            }
          }
          vnode.state.loaded = true;
          vnode.state.loading = false;
          m.redraw();
          if (!vnode.state.account) throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
            : 'Failed to find profile');
        }
      });
    };

    const { setIdentity } = vnode.attrs;
    const { account, loaded, loading, refreshProfile } = vnode.state;
    if (!loading && !loaded) {
      vnode.state.loading = true;
      loadProfile();
    }
    if (account && account.address !== vnode.attrs.address) {
      vnode.state.loading = true;
      vnode.state.loaded = false;
      loadProfile();
    }
    if (loading || !loaded) return m(PageLoading, { showNewProposalButton: true });
    if (!account) {
      return m(PageNotFound, { message: 'Invalid address provided' });
    }
    if (refreshProfile) {
      loadProfile();
      vnode.state.refreshProfile = false;
      m.redraw();
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

    const allTabTitle = (proposals && comments) ? `All (${proposals.length + comments.length})` : 'All';
    const threadsTabTitle = (proposals) ? `Threads (${proposals.length})` : 'Threads';
    const commentsTabTitle = (comments) ? `Comments (${comments.length})` : 'Comments';
    return m(Sublayout, {
      class: 'ProfilePage',
      showNewProposalButton: true,
    }, [
      m('.forum-container-alt', [
        m(ProfileHeader, {
          account,
          setIdentity,
          refreshCallback: () => { vnode.state.refreshProfile = true; },
        }),
        m('.row.row-narrow.forum-row', [
          m('.col-xs-8', [
            m(Tabs, [{
              name: allTabTitle,
              content: m(ProfileContent, {
                account,
                type: UserContent.All,
                content: { allContent }
              })
            }, {
              name: threadsTabTitle,
              content: m(ProfileContent, {
                account,
                type: UserContent.Threads,
                content: { proposals }
              }),
            }, {
              name: commentsTabTitle,
              content: m(ProfileContent, {
                account,
                type: UserContent.Comments,
                content: { comments }
              }),
            }]),
          ]),
          m('.col-xs-4', [
            m(ProfileBio, { account }),
          ]),
        ]),
      ]),
    ]);
  },
};

export default ProfilePage;
