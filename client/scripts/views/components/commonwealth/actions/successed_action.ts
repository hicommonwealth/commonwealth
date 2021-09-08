import 'components/commonwealth/action_card.scss';

import { Button } from 'construct-ui';
import m from 'mithril';
import { BigNumber } from 'ethers';
import BN from 'bn.js';

import app from 'state';
import { CMNProject } from 'models';
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
    const { acceptedTokens, cTokens } = project;

    return [
      m(TokenInputField, {
        tokens: acceptedTokens.map((token) => token.symbol),
        buttonLabel: `Redeem${vnode.state.submitting ? 'ing' : ''} CToken`,
        actionDisabled: vnode.state.submitting,
        callback: async (tokenSymbol: string, balance: number) => {
          vnode.state.submitting = true;

          const index = project.acceptedTokens.findIndex((t) => t.symbol === tokenSymbol);
          if (index > -1) {
            const acceptedToken = acceptedTokens[index];
            const author = app.user.activeAccount.address;
            const amount = new BN(balance).mul(new BN(10).pow(new BN(acceptedToken.decimals)));

            const res = await project_protocol.redeemTokens(
              amount,
              false,
              project,
              author,
              cTokens[acceptedToken.address],
              acceptedToken.address,
              acceptedToken.decimals
            );

            vnode.state.error = res.error;
          } else {
            vnode.state.error = 'Failed to retrive selected AcceptedToken info';
          }
          vnode.state.submitting = false;
          m.redraw();
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
    const { project, project_protocol } = vnode.attrs;
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

          const res = await project_protocol.withdraw(project, author);
          vnode.state.error = res.error;
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
  curators: any
},
{}> = {
  view: (vnode) => {
    const { project, project_protocol, curators } = vnode.attrs;

    let withdrawAble = false;
    const redeemAble = true;
    if (app.user.activeAccount && app.isLoggedIn()) {
      const activeAddress = app.user.activeAccount.address.toLowerCase();
      // if (!curators.map((c) => c.address.toLowerCase()).includes(activeAddress)) {
      //   redeemAble = false;
      // }
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
