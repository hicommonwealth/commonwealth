// Gabe 3/8/22 - Keeping this dead code around for future reference per Zak

// import 'modals/view_voters_modal.scss';

// import $ from 'jquery';
// import m from 'mithril';

// import { navigateToSubpage } from 'app';

// import { SubstrateAccount } from 'controllers/chain/substrate/account';
// import { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';
// import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';
// import User from 'views/components/widgets/user';
// import { formatAddressShort } from '../../../../shared/utils';

// interface IVoterRowAttrs {
//   vote: PhragmenElectionVote;
// }

// const VoterRow: m.Component<IVoterRowAttrs> = {
//   view: (vnode: ResultNode<IVoterRowAttrs>) => {
//     const { account, stake } = vnode.attrs.vote;

//     return render(
//       '.VoterRow',
//       {
//         onclick: (e) => {
//           e.preventDefault();
//           navigateToSubpage(`/account/${account.address}`);
//           $(vnode.dom).trigger('modalexit');
//         },
//       },
//       [
//         render('.proposal-row-left', [
//           render('.proposal-pre', [
//             render(User, {
//               user: account,
//               avatarOnly: true,
//               avatarSize: 36,
//               popover: true,
//             }),
//           ]),
//           render('.proposal-pre-mobile', [
//             render(User, {
//               user: account,
//               avatarOnly: true,
//               avatarSize: 16,
//               popover: true,
//             }),
//           ]),
//         ]),
//         render('.proposal-row-main.container', [
//           render('.proposal-row-main.item', [
//             render('.proposal-row-subheading', 'Voter'),
//             render('.proposal-row-metadata', [
//               render('.proposal-user', [
//                 render(User, {
//                   user: account,
//                   hideAvatar: true,
//                   popover: true,
//                 }),
//               ]),
//               render('.proposal-user-mobile', [
//                 render(User, {
//                   user: account,
//                   hideAvatar: true,
//                   popover: true,
//                 }),
//               ]),
//             ]),
//           ]),
//           // Hiding this for now because it looks like the API Query for Stakes of is returning the incorrect value
//           // on both Polkadot Apps and CW
//           render('.proposal-row-main.item', [
//             render('.proposal-row-subheading', 'Locked'),
//             render('.proposal-row-metadata', stake.format(true)),
//           ]),
//         ]),
//       ]
//     );
//   },
// };

// interface IViewVotersModalAttrs {
//   account: SubstrateAccount;
//   votes: PhragmenElectionVote[];
// }

// const ViewVotersModal: m.Component<IViewVotersModalAttrs> = {
//   view: (vnode) => {
//     const { address, chain } = vnode.attrs.account;

//     return render('.ViewVotersModal', [
//       render('.compact-modal-title', [
//         render('h3', `Voters for ${formatAddressShort(address, chain.id, true)}`),
//         render(CompactModalExitButton),
//       ]),
//       render('.compact-modal-body', [
//         vnode.attrs.votes.map((vote) => render(VoterRow, { vote })),
//         render('.clear'),
//       ]),
//     ]);
//   },
// };

// export default ViewVotersModal;
