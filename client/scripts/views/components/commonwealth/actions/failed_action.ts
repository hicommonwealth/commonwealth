import 'components/commonwealth/action_card.scss';

import m from 'mithril';
import { BigNumber } from 'ethers';

import app from 'state';
import { CMNProject } from 'models';
import TokenInputField from '../token_input';

const FailedActionCard: m.Component<{
  project: CMNProject,
  project_protocol: any,
  backers: any
}, {
  submitting: boolean,
  error: string,
}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.submitting = false;
  },
  view: (vnode) => {
    const { project, project_protocol, backers } = vnode.attrs;
    const { bTokens, acceptedTokens } = project;

    let redeemAble = false;
    if (app.user.activeAccount && app.isLoggedIn()) {
      redeemAble = true;
      // const activeAddress = app.user.activeAccount.address.toLowerCase();
      // if (backers.map((item: any) => item.address.toLowerCase()).includes(activeAddress)) {
      //   redeemAble = true;
      // }
    }

    return m('.project-funding-action', [
      m(TokenInputField, {
        tokens: acceptedTokens.map((token) => token.symbol),
        buttonLabel: `Redeem${vnode.state.submitting ? 'ing' : ''} BToken`,
        actionDisabled: vnode.state.submitting,
        callback: async (tokenSymbol: string, balance: number) => {
          vnode.state.submitting = true;

          const index = project.acceptedTokens.findIndex((t) => t.symbol === tokenSymbol);
          const acceptedToken = acceptedTokens[index];
          const amount = BigNumber.from(balance).mul(BigNumber.from(10).pow(acceptedToken.decimals));

          const res = await project_protocol.redeemTokens(
            amount,
            true,
            project,
            app.user.activeAccount.address,
            bTokens[acceptedToken.address],
            acceptedToken.address
          );

          vnode.state.error = res.error;
          vnode.state.submitting = false;
          m.redraw();
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

export default FailedActionCard;
