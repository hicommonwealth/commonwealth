// import m from 'mithril';
// import app from 'state';
// import 'modals/delegate_modal.scss';

// import { notifyError } from 'controllers/app/notifications';
// import Compound from 'controllers/chain/ethereum/compound/adapter';
// import { formatAddressShort } from '../../../../shared/utils';
// import { ButtonIntent, FaceliftButton } from '../components/component_kit/buttons';
// import { TextInput, TextInputStatus } from '../components/component_kit/forms';

// const DelegateModal: m.Component<
//   {
//     address: string;
//     name: string;
//     symbol: string;
//     chainController: Compound;
//   },
//   {
//     allowSubmission: boolean;
//     delegateAmount: number;
//   }
// > = {
//   view: (vnode) => {
//     const { address, name, symbol, chainController } = vnode.attrs;
//     return m('.DelegateModal', [
//       m('.compact-modal-title', [
//         m(
//           'h3',
//           `Delegate to ${name
//             ? `${name} at Address: ${formatAddressShort(address)}`
//             : `Anonymous at Address: ${formatAddressShort(address)}`
//           }`
//         ),
//       ]),
//       m('.compact-modal-body', [
//         m(TextInput, {
//           name: 'delegate-amount',
//           label: `Amount ${symbol} to delegate`,
//           inputValidationFn: (val) => {
//             if (Number.isNaN(parseInt(val, 10))) {
//               vnode.state.allowSubmission = false;
//               return [TextInputStatus.Error, 'Must input number'];
//             } else {
//               vnode.state.allowSubmission = true;
//               return [TextInputStatus.Validate, 'Input validated'];
//             }
//           },
//           oninput: (e) => {
//             vnode.state.delegateAmount = (e.target as any).value;
//           },
//         }),
//         m(FaceliftButton, {
//           label: 'Delegate',
//           intent: ButtonIntent.Primary,
//           disabled:
//             !app.user.activeAccount ||
//             !app.user.isMember({ account: app.user.activeAccount, chain: app.activeChainId() }),
//           onclick: async (e) => {
//             e.preventDefault();
//             e.stopPropagation();
//             if (vnode.state.allowSubmission) {
              // chainController?.chain
              // // TODO: reconcile against original
              //   .setDelegate(vnode.attrs.address, vnode.state.delegateAmount)
              //   .catch((err) => {
              //     if (err.message.indexOf('delegates underflow') > -1) {
              //       err.message =
              //         'You do not have the requested number of votes to delegate';
              //     }
              //     notifyError(err.message);
              //   });
//             }
//           },
//         }),
//       ]),
//     ]);
//   },
// };

// export default DelegateModal;