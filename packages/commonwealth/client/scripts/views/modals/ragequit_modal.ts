// Gabe 3/8/22 - Keeping this dead code around for future reference per Zak

// import 'modals/ragequit_modal.scss';

// import m from 'mithril';
// import $ from 'jquery';
// import { Button, Input, FormLabel, FormGroup } from 'construct-ui';

// import MolochMember from 'controllers/chain/ethereum/moloch/member';
// import { notifyError } from 'controllers/app/notifications';
// import BN from 'bn.js';

// interface IAttrs {
//   account: MolochMember;
// }

// interface IState {
//   sharesToBurn: string;
// }

// const RagequitModal: m.Component<IAttrs, IState> = {
//   view: (vnode: ResultNode<IAttrs, IState>) => {
//     const acct = vnode.attrs.account;
//     return render('.RagequitModal', [
//       render('.header', 'Ragequit'),
//       render('.compact-modal-body', [
//         render('.data-label', [`Share holdings: ${acct?.shares?.format() ?? '--'}`]),
//         render(FormGroup, [
//           render(FormLabel, 'Shares to burn (to exchange for ETH)'),
//           render(Input, {
//             value: vnode.state.sharesToBurn,
//             oncreate: (vvnode) => {
//               $(vvnode.dom).focus();
//             },
//             oninput: (e) => {
//               const result = (e.target as any).value;
//               vnode.state.sharesToBurn = result.toString();
//             },
//           }),
//         ]),
//         render(Button, {
//           type: 'submit',
//           intent: 'primary',
//           rounded: true,
//           onclick: (e) => {
//             e.preventDefault();
//             const toBurn = new BN(vnode.state.sharesToBurn);
//             vnode.attrs.account
//               .ragequitTx(toBurn)
//               .then((result) => {
//                 $(vnode.dom).trigger('modalforceexit');
//                 m.redraw();
//               })
//               .catch((err) => notifyError(err));
//           },
//           label: 'Ragequit',
//         }),
//       ]),
//     ]);
//   },
// };

// export default RagequitModal;
