import 'pages/profile.scss';

import m from 'mithril';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { OffchainThread } from 'models';

import PageLoading from 'views/pages/loading';
import Tabs from 'views/components/widgets/tabs';
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
//         (app.vm.activeAccount && account.address === app.vm.activeAccount.address) ? [
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
//               || !app.vm.activeAccount
//               || account.address === app.vm.activeAccount.address,
//             onclick: async (e) => {
//               const sender: Account<Coin> = app.vm.activeAccount;
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


export enum UserContent {
  All = 'all',
  Threads = 'threads',
  Comments = 'comments'
}


const ProfilePage: m.Component<{ address: string }, { loadCount: number }> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'LoginPage' });
  },
  view: (vnode) => {
    if (!vnode.state.loadCount) vnode.state.loadCount = 0;
    if (!app.chain) return m(PageLoading);
    const account = app.chain.accounts.get(vnode.attrs.address);
    if (!account) {
      if (vnode.state.loadCount < 3) {
        vnode.state.loadCount += 1;
        return m(PageLoading);
      } else {
        return m(PageNotFound, { message: 'Make sure the profile address is valid.' });
      }
    }

    // TODO: search for cosmos proposals, if ChainClass is Cosmos
    // TODO: search for signaling proposals ->
    // Commented-out lines from previous version which included signaling proposals in proposals var:
    // const discussions = app.threads.store.getAll()
    // .filter((p) => p instanceof OffchainThread && p.author === account.address);
    // const signaling = (app.chain as Edgeware).signaling.store.getAll()
    //   .filter((p) => p instanceof EdgewareSignalingProposal && p.data.author === account.address);
    // return [].concat(signaling, discussions);

    const proposals = app.threads.store.getAll()
      .filter((p) => p instanceof OffchainThread && p.author === vnode.attrs.address)
      .sort((a, b) => +b.createdAt - +a.createdAt);
    const comments = app.comments.getByAuthor(vnode.attrs.address, account.chain)
      .sort((a, b) => +b.createdAt - +a.createdAt);
    const allContent = [].concat(proposals || []).concat(comments || [])
      .sort((a, b) => +b.createdAt - +a.createdAt);

    const allTabTitle = (proposals && comments) ? `All (${proposals.length + comments.length})` : 'All';
    const threadsTabTitle = (proposals) ? `Threads (${proposals.length})` : 'Threads';
    const commentsTabTitle = (comments) ? `Comments (${comments.length})` : 'Comments';

    return m('.ProfilePage', [
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
