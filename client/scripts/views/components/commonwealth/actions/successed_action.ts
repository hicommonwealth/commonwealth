import 'components/commonwealth/action_card.scss';

import { utils } from 'ethers';
import { Input, FormGroup, Button } from 'construct-ui';
import m from 'mithril';

import app from 'state';
import { CWProject } from 'models/CWProtocol';
import BN from 'bn.js';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const ActionModule: m.Component<{callback: (isWithdraw: boolean) => void, submitting: number, isBeneficiary: boolean}, {}> = {
  view: (vnode) => {
    const { callback, submitting, isBeneficiary } = vnode.attrs;
    const actionDisabled = !app.user.activeAccount || !app.isLoggedIn() || submitting > 0;

    return [
      m(Button, {
        class: 'contribute-button',
        label: `Redeem${submitting === 2 ? 'ing' : ''} CToken`,
        rounded: true,
        fluid: true,
        intent: 'primary',
        disabled: actionDisabled,
        onclick: async(e) => { await callback(false) }
      }),
      m(Button, {
        class: 'contribute-button',
        label: `Withdraw${submitting === 1 ? 'ing' : ''}`,
        disabled: !isBeneficiary || actionDisabled,
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: async(e) => { await callback(true) }
      }),
    ];
  }
}

const SuccsedActionCard: m.Component<{project: CWProject, protocol: any}, {amount: any, error: string, submitting: number}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
    vnode.state.submitting = 0;
  },
  view: (vnode) => {
    const { project, protocol } = vnode.attrs;
    const isBeneficiary = app.user.activeAccount.address === project.beneficiary;
    const { submitting } = vnode.state; // 0: not in progress, 1: in progress of withdrawing, 2: in progress of redeeming cTokens
    const actionDisabled = !app.user.activeAccount || !app.isLoggedIn() || submitting > 0;

    return m('.project-funding-action', [
      m(FormGroup, [
        m(Input, {
          style: {
            width: '100%'
          },
          options: {
            name: 'amount',
            placeholder: 'Enter the amount in ETH',
            autofocus: true,
          },
          disabled: actionDisabled,
          oninput: (e) => {
            const result = (e.target as any).value;
            if (floatRegex.test(result)) {
              vnode.state.amount = utils.parseEther(result);
              vnode.state.error = undefined;
            } else {
              vnode.state.amount = undefined;
              vnode.state.error = 'Invalid amount value';
            }
            m.redraw();
          },
        }),
      ]),
      vnode.state.error && vnode.state.error !== '' && m('p.error', vnode.state.error),
      m(ActionModule, {
        callback: async(isWithdraw: boolean) => {
          if (!vnode.state.amount || vnode.state.amount.toString() === new BN(0).toString()) {
            vnode.state.error = 'Please enter the amount';
          } else {
            const author = app.user.activeAccount.address;
            vnode.state.submitting = isWithdraw ? 1 : 2;

            let txSuccessed = false;
            try {
              if (isWithdraw) {
                txSuccessed = await protocol.redeemTokens(vnode.state.amount, project.projectHash, false, author);
              } else {
                txSuccessed = await protocol.withdraw(project.projectHash, author);
              }
            } catch {
              txSuccessed = false;
            }

            vnode.state.error = txSuccessed ? '' : 'Failed to do this action';
            vnode.state.submitting = 0;
          }
          m.redraw();
        },
        submitting,
        isBeneficiary,
      })
    ]);
  }
}


export default SuccsedActionCard;