import 'components/commonwealth/action_card.scss';

import m from 'mithril';
import { BigNumber } from 'ethers';
import BN from 'bn.js';

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
    console.log('====>project', project);

    let redeemAble = false;
    if (app.user.activeAccount && app.isLoggedIn()) {
      redeemAble = true;
      const activeAddress = app.user.activeAccount.address.toLowerCase();
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

          if (index > -1) {
            const acceptedToken = acceptedTokens[index];
            const amount = new BN(balance).mul(new BN(10).pow(new BN(acceptedToken.decimals)));

            const res = await project_protocol.redeemTokens(
              amount,
              true,
              project,
              app.user.activeAccount.address,
              bTokens[acceptedToken.address],
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
    ]);
  }
};

export default FailedActionCard;
