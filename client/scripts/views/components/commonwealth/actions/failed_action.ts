import 'components/commonwealth/action_card.scss';

import m from 'mithril';
import BN from 'bn.js';

import app from 'state';
import { CMNProject } from 'models';
import { CWUser } from '../members_card';
import TokenInputField from '../token_input';

const RedeemBTokenAction: m.Component<{
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

    // TODO: replace with bTokens:
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
            true,
            project,
            author,
            token.address
          );

          vnode.state.error = res.console.error();
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

const FailedActionCard: m.Component<{
  project: CMNProject,
  project_protocol: any,
  backers: CWUser[]
}, {
}> = {
  view: (vnode) => {
    const { project, project_protocol, backers } = vnode.attrs;

    let redeemAble = false;
    if (app.user.activeAccount && app.isLoggedIn()) {
      const activeAddress = app.user.activeAccount.address.toLowerCase();
      if (backers.map((item: any) => item.address.toLowerCase()).includes(activeAddress)) {
        redeemAble = true;
      }
    }

    return m('.project-funding-action', [
      m(RedeemBTokenAction, { project, project_protocol, disabled: !redeemAble }),
    ]);
  }
};

export default FailedActionCard;
