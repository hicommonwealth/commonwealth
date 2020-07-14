import 'pages/profile.scss';

import m from 'mithril';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';

import app from 'state';
import { OffchainThread, OffchainComment, OffchainAttachment } from 'models';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Tabs from 'views/components/widgets/tabs';
import { uniqueIdToProposal } from 'identifiers';
import moment from 'moment';
import ProfileHeader from './profile_header';
import ProfileContent from './profile_content';
import ProfileBio from './profile_bio';
import PageNotFound from '../404';

// const SetProxyButton = {
//   view: (vnode) => {
//     const account = vnode.attrs.account;
//     return m('button.SetProxyButton', {
//       onclick: async (e) => {
//         const address = await inputModalWithText('Address of proxy?')();
//         if (!address) return;
//         const proxy = app.chain.accounts.get(address);
//         if (!proxy) return notifyError('Could not find address');
//         if (proxy.proxyFor) return notifyError('This address is already a proxy');
//         createTXModal(account.setProxyTx(proxy));
//       }
//     }, 'Set Proxy');
//   }
// };

// const RemoveProxyButton = {
//   view: (vnode) => {
//     const account = vnode.attrs.account;
//     return m('button.RemoveProxyButton', {
//       onclick: async (e) => {
//         const address = await inputModalWithText('Address of proxy to remove?')();
//         if (!address) return;
//         const proxy = app.chain.accounts.get(address);
//         if (!proxy) return notifyError('Could not find address');
//         if (!proxy.proxyFor) return notifyError('This address is not a proxy');
//         if (!proxy.proxyFor.address !== account.address)
//           return notifyError('This address is a proxy for another account');
//         createTXModal(account.removeProxyTx(proxy));
//       }
//     }, 'Remove Proxy');
//   }
// };

// const ResignProxyButton = {
//   view: (vnode) => {
//     const account = vnode.attrs.account;
//     return m('button.ResignProxyButton', {
//       onclick: async (e) => {
//         createTXModal(account.resignProxyTx());
//       }
//     }, 'Resign Proxy');
//   }
// };

// const DelegateButton = {
//   view: (vnode) => {
//     const account = vnode.attrs.account;
//     return m('button.DelegateButton', {
//       onclick: async (e) => {
//         const address = await inputModalWithText('Address to delegate to?')();
//         if (!address) return;
//         const delegate = app.chain.accounts.get(address);
//         if (!delegate) return notifyError('Could not find address');
//         // XXX: This should be a dropdown with various conviction amounts rather than a free text input
//         const conviction = await inputModalWithText('Conviction?')();
//         if (!conviction) return;
//         createTXModal(account.delegateTx(delegate, conviction));
//       }
//     }, 'Set Delegate');
//   }
// };

// const UndelegateButton = {
//   view: (vnode) => {
//     const account = vnode.attrs.account;
//     return m('button.SetDelegateButton', {
//       onclick: async (e) => {
//         createTXModal(account.undelegateTx());
//       }
//     }, 'Undelegate');
//   }
// };

// interface IProfileSummaryAttrs {
//   account: Account<any>;
// }

// interface IProfileSummaryState {
//   dynamic: {
//     balance: Coin;
//     stakedBalance?: SubstrateCoin;
//     lockedBalance?: SubstrateCoin;
//     proxyFor?: SubstrateAccount;
//     delegation?: [SubstrateAccount, number];
//   };
// }

// const ProfileSummary = makeDynamicComponent<IProfileSummaryAttrs, IProfileSummaryState>({
//   getObservables: (attrs) => ({
//     balance: attrs.account.balance,
//     stakedBalance: attrs.account instanceof SubstrateAccount ? attrs.account.getStakedBalance() : null,
//     lockedBalance: attrs.account instanceof SubstrateAccount ? attrs.account.getLockedBalance() : null,
//     proxyFor: attrs.account instanceof SubstrateAccount ? attrs.account.proxyFor : null,
//     delegation: attrs.account instanceof SubstrateAccount ? attrs.account.delegation : null,
//   }),
//   view: (vnode) => {
//     const account: Account<any> = vnode.attrs.account;
//     const isSubstrate = (account.chainBase === ChainBase.Substrate);

//     return m('.ProfileSummary', [
//       m('.summary-row', [
//         m('.summary-row-item', [
//           m('.summary-row-item-header', 'Balance'),
//           m('.summary-row-item-text',
//             vnode.state.dynamic.balance !== undefined ? formatCoin(vnode.state.dynamic.balance) : '--'),
//         ]),
//         isSubstrate && m('.summary-row-item', [
//           m('.summary-row-item-header', 'Staked'),
//           m('.summary-row-item-text',
//             vnode.state.dynamic.stakedBalance !== undefined ? formatCoin(vnode.state.dynamic.stakedBalance) : '--'),
//         ]),
//         isSubstrate && m('.summary-row-item', [
//           m('.summary-row-item-header', 'Locked'),
//           m('.summary-row-item-text',
//             vnode.state.dynamic.lockedBalance !== undefined ? formatCoin(vnode.state.dynamic.lockedBalance) : '--'),
//         ]),
//       ]),
//       m('.summary-row', [
//         (app.user.activeAccount && account.address === app.user.activeAccount.address) ? [
//           // for your account
//           isSubstrate && vnode.state.dynamic.proxyFor && m(ResignProxyButton, { account }),
//           isSubstrate && m(SetProxyButton, { account }),
//           isSubstrate && m(RemoveProxyButton, { account }),
//           isSubstrate && (
//             vnode.state.dynamic.delegation ?
//               m(UndelegateButton, { account }) : m(DelegateButton, { account })
//           ),
//         ] : [
//           // for other accounts
//           m('button.SendEDGButton', {
//             disabled: !account
//               || !app.user.activeAccount
//               || account.address === app.user.activeAccount.address,
//             onclick: async (e) => {
//               const sender: Account<Coin> = app.user.activeAccount;
//               const amount = await inputModalWithText(`How much ${app.chain.currency}?`)();
//               if (!amount || isNaN(parseInt(amount, 10))) return;
//               const recipient = account;
//               const coinAmount = app.chain.chain.coins(parseInt(amount, 10), true);
//               // TODO: figure out a better solution for handling denoms
//               createTXModal(sender.sendBalanceTx(recipient, coinAmount)).then(() => {
//                 m.redraw();
//               });
//             }
//           }, `Send ${app.chain.chain.denom}`),
//         ]
//       ]),
//       isSubstrate && vnode.state.dynamic.proxyFor && m('.summary-row',  [
//         m('p', [
//           m('span', 'This account is a proxy for: '),
//           m(User, { user: [vnode.state.dynamic.proxyFor, app.chain.meta.chain.id],
//                     showSecondaryName: true, linkify: true }),
//           // TODO: resign proxy button
//         ]),
//       ]),
//       isSubstrate && vnode.state.dynamic.delegation && m('.summary-row',  [
//         m('p', [
//           m('span', 'This account has assigned a delegate: '),
//           m(User, { user: [vnode.state.dynamic.delegation[0], app.chain.meta.chain.id]
//                     showSecondaryName: true, linkify: true }),
//         ]),
//       ]),
//     ]);
//   }
// });

const commentModelFromServer = (comment) => {
  const attachments = comment.OffchainAttachments
    ? comment.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  let proposal;
  try {
    proposal = uniqueIdToProposal(decodeURIComponent(comment.root_id));
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
    thread.tag,
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
  Comments = 'comments'
}

interface IProfilePageState {
  account: any;
  threads: OffchainThread[];
  comments: OffchainComment<any>[];
  loaded: boolean;
  loading: boolean;
}

const ProfilePage: m.Component<{ address: string }, IProfilePageState> = {
  oninit: (vnode) => {
    vnode.state.account = null;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.threads = [];
    vnode.state.comments = [];
  },
  oncreate: async (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'LoginPage' });
  },
  view: (vnode) => {
    const loadProfile = async () => {
      const chain = m.route.param('base');
      const { address } = vnode.attrs;
      await $.ajax({
        url: `${app.serverUrl()}/getProfile`,
        type: 'GET',
        data: {
          address,
          chain,
          jwt: app.user.jwt,
        },
        success: (response) => {
          const { result } = response;
          console.dir(result);
          vnode.state.loaded = true;
          vnode.state.loading = false;
          // vnode.state.account = result.account;
          vnode.state.account = (app.chain)
            ? app.chain.accounts.get(vnode.attrs.address)
            : app.community.accounts.get(vnode.attrs.address);
          vnode.state.threads = result.threads.map((t) => threadModelFromServer(t));
          // vnode.state.comments = result.comments.map((c) => commentModelFromServer(c));
          m.redraw();
        },
        error: (err) => {
          console.log('Failed to find profile');
          console.error(err);
          vnode.state.loaded = true;
          m.redraw();
          throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
            : 'Failed to find profile');
        }
      });
    };

    const { account, loaded, loading } = vnode.state;
    if (!account && !loaded && !loading) {
      vnode.state.loading = true;
      loadProfile();
      m.redraw();
    }
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
    // const proposals = app.threads.store.getAll()
    //   .filter((p) => p instanceof OffchainThread && p.author === vnode.attrs.address)
    //   .sort((a, b) => +b.createdAt - +a.createdAt);
    // const comments = app.comments.getByAuthor(vnode.attrs.address, account.chain)
    //   .sort((a, b) => +b.createdAt - +a.createdAt);
    // const allContent = [].concat(proposals || []).concat(comments || [])
    //   .sort((a, b) => +b.createdAt - +a.createdAt);
    const proposals = vnode.state.threads;
    const comments = vnode.state.comments;
    const allContent = [].concat(proposals || []).concat(comments || [])
      .sort((a, b) => +b.createdAt - +a.createdAt);

    const allTabTitle = (proposals && comments) ? `All (${proposals.length + comments.length})` : 'All';
    const threadsTabTitle = (proposals) ? `Threads (${proposals.length})` : 'Threads';
    // const commentsTabTitle = (comments) ? `Comments (${comments.length})` : 'Comments';

    return m(Sublayout, {
      class: 'ProfilePage',
    }, [
      m('.forum-container-alt', [
        m(ProfileHeader, { account }),
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
            },
            // {
            //   name: commentsTabTitle,
            //   content: m(ProfileContent, {
            //     account,
            //     type: UserContent.Comments,
            //     content: { comments }
            //   }),
            // }
            ]),
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
