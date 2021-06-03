import 'components/commonwealth/action_card.scss';

import { utils } from 'ethers';
import { Input, FormGroup, Button } from 'construct-ui';
import m from 'mithril';
import BN from 'bn.js';

import app from 'state';
import { CWProject } from 'models/CWProtocol';
import { CWUser } from '../members_card';


const floatRegex = /^[0-9]*\.?[0-9]*$/;

const ActionModule: m.Component<{
  callback: (isWithdraw: boolean) => void,
  submitting: number,
  withdrawAble: boolean,
  redeemAble: boolean,
}, {}> = {
  view: (vnode) => {
    const { callback, submitting, withdrawAble, redeemAble } = vnode.attrs;
    return [
      m(Button, {
        class: 'contribute-button',
        label: `Redeem${submitting === 2 ? 'ing' : ''} CToken`,
        rounded: true,
        fluid: true,
        intent: 'primary',
        disabled: !redeemAble,
        onclick: async(e) => { await callback(false) }
      }),
      m(Button, {
        class: 'contribute-button',
        label: `Withdraw${submitting === 1 ? 'ing' : ''}`,
        disabled: !withdrawAble,
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: async(e) => { await callback(true) }
      }),
    ];
  }
}

const SuccsedActionCard: m.Component<{
  project: CWProject,
  protocol: any,
  curators: CWUser[]
},
{
  amount: any,
  error: string,
  submitting: number
}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
    vnode.state.submitting = 0;
  },
  view: (vnode) => {
    const { project, protocol, curators } = vnode.attrs;
    const { submitting } = vnode.state; // 0: not in progress, 1: in progress of withdrawing, 2: in progress of redeeming cTokens

    let withdrawAble = false;
    let redeemAble = false;
    if (app.user.activeAccount && app.isLoggedIn() && submitting === 0) {
      const activeAddress = app.user.activeAccount.address.toLowerCase();
      if (activeAddress === project.beneficiary.toLowerCase()) {
        withdrawAble = true;
      }
      if (curators.map((item: any) => item.address.toLowerCase()).includes(activeAddress)) {
        redeemAble = true;
      }
    }

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
          // disabled: actionDisabled,
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
          if (!app.user.activeAccount) return;
          const author = app.user.activeAccount.address;
          vnode.state.submitting = isWithdraw ? 1 : 2;
          let res;
          if (isWithdraw) {
            res = await protocol.withdraw(project, author);
          } else if (!vnode.state.amount || vnode.state.amount.toString() === new BN(0).toString()) {
            vnode.state.error = 'Please enter the amount';
          } else {
            res = await protocol.redeemTokens(
              vnode.state.amount,
              false,
              project,
              author
            );
          }
          vnode.state.error = res.error;
          vnode.state.submitting = 0;
          m.redraw();
        },
        submitting,
        withdrawAble,
        redeemAble,
      })
    ]);
  }
}


export default SuccsedActionCard;