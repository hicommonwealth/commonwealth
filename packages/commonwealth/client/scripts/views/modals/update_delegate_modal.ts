// Gabe 3/8/22 - Keeping this dead code around for future reference per Zak

// import 'modals/update_delegate_modal.scss';

// import m from 'mithril';
// import $ from 'jquery';
// import { FormLabel, FormGroup, Input, Button } from 'construct-ui';

// import MolochMember from 'controllers/chain/ethereum/moloch/member';
// import { notifyError } from 'controllers/app/notifications';

// interface IAttrs {
//   account: MolochMember;
//   delegateKey: string;
// }

// interface IState {
//   newDelegateKey: string;
// }

// const UpdateDelegateModal: m.Component<IAttrs, IState> = {
//   oninit: (vnode: ResultNode<IAttrs, IState>) => {
//     vnode.state.newDelegateKey = vnode.attrs.delegateKey;
//   },
//   view: (vnode: ResultNode<IAttrs, IState>) => {
//     return render('.UpdateDelegateModal', [
//       render('.header', 'Update Delegate'),
//       render('.compact-modal-body', [
//         render(FormGroup, [
//           render(FormLabel, 'Delegate Key (update your selected delegate)'),
//           render(Input, {
//             value: vnode.state.newDelegateKey,
//             oncreate: (vvnode) => {
//               $(vvnode.dom).focus();
//             },
//             oninput: (e) => {
//               const result = (e.target as any).value;
//               vnode.state.newDelegateKey = result;
//             }
//           }),
//         ]),
//         render(Button, {
//           intent: 'primary',
//           type: 'submit',
//           rounded: true,
//           onclick: (e) => {
//             e.preventDefault();
//             vnode.attrs.account.updateDelegateKeyTx(vnode.state.newDelegateKey)
//               .then((result) => {
//                 $(vnode.dom).trigger('modalforceexit');
//                 redraw();
//               })
//               .catch((err) => notifyError(err.toString()));
//           },
//           label: 'Update Delegate'
//         }),
//       ]),
//     ]);
//   }
// };

// export default UpdateDelegateModal;
