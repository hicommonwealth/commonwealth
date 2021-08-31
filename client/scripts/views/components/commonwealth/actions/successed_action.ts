import 'components/commonwealth/action_card.scss';

import { Button } from 'construct-ui';
import m from 'mithril';
import BN from 'bn.js';

import app from 'state';
import { CMNProject } from 'models';
import { CWUser } from '../members_card';
import TokenInputField from '../token_input';

const RedeemCTokenAction: m.Component<{
  project: CMNProject,
  project_protocol: any,
  disabled: boolean
}, {
  submitting: boolean,
  error: string,
}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.submitting = false;
  },
  view: (vnode) => {
    const { project, project_protocol } = vnode.attrs;

    // TODO: replace with cTokens:
    const tokens = ['USDT', 'USDC'];

    return [
      m(TokenInputField, {
        tokens,
        buttonLabel: `Redeem${vnode.state.submitting ? 'ing' : ''} CToken`,
        actionDisabled: vnode.state.submitting,
        callback: async (tokenSymbol: string, balance: number) => {
          vnode.state.submitting = true;

          const index = project.acceptedTokens.findIndex((t) => t.symbol === tokenSymbol);
          const token = project.acceptedTokens[index];
          const amount = new BN(balance).mul(new BN(10).pow(new BN(token.decimals)));
          const author = app.user.activeAccount.address;

          const res = await project_protocol.redeemTokens(
            amount,
            false,
            project,
            author,
            token.address
          );

          vnode.state.error = res.error;
          vnode.state.submitting = false;
        }
      }),
      vnode.state.error && vnode.state.error !== '' && m(
        'label',
        { 'color': 'red', 'width': '100%', 'text-align': 'center' },
        vnode.state.error
      ),
    ];
  }
};

const WithdrawAction: m.Component<{
  project: CMNProject,
  project_protocol: any,
  disabled: boolean
}, {
  submitting: boolean,
  error: string,
}> = {
  view: (vnode) => {
    return m('div', [
      m(Button, {
        class: 'contribute-button',
        label: `Withdraw${vnode.state.submitting ? 'ing' : ''}`,
        disabled: vnode.state.submitting || vnode.attrs.disabled,
        rounded: true,
        fluid: true,
        intent: 'primary',
        onclick: async (e) => {
          const author = app.user.activeAccount.address;
          vnode.state.submitting = true;

          // widthdraw logic
          try {
            const res = await vnode.attrs.project_protocol.withdraw(vnode.attrs.project, author);
            console.log('====>withdraw result', res);
          } catch (error) {
            vnode.state.error = error || 'Faild to do withdraw Action';
          }

          vnode.state.submitting = false;
        }
      }),
      vnode.state.error && vnode.state.error !== '' && m(
        'label',
        { 'color': 'red', 'width': '100%', 'text-align': 'center' },
        vnode.state.error
      ),
    ]);
  }
};

const SuccsedActionCard: m.Component<{
  project: CMNProject,
  project_protocol: any,
  curators: CWUser[]
},
{}> = {
  view: (vnode) => {
    const { project, project_protocol, curators } = vnode.attrs;

    let withdrawAble = false;
    let redeemAble = false;
    if (app.user.activeAccount && app.isLoggedIn()) {
      const activeAddress = app.user.activeAccount.address.toLowerCase();
      if (curators.map((item: any) => item.address.toLowerCase()).includes(activeAddress)) {
        redeemAble = true;
      }
      if ((activeAddress === project.beneficiary.toLowerCase()) && (!project.withdrawIsDone)) {
        withdrawAble = true;
      }
    }

    return m('.project-funding-action', [
      m(RedeemCTokenAction, { project, project_protocol, disabled: !redeemAble }),
      m(WithdrawAction, { project, project_protocol, disabled: !withdrawAble })
    ]);
  }
};

export default SuccsedActionCard;
