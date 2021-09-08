import 'components/commonwealth/action_card.scss';

import m from 'mithril';
import BN from 'bn.js';
import { utils, BigNumber } from 'ethers';

import { CMNProject } from 'models';
import app from 'state';
import TokenInputField from '../token_input';

const BackAciton: m.Component<
  { project: CMNProject, project_protocol: any, creator: string },
  { backing: boolean, error: string }
> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.backing = false;
  },
  view: (vnode) => {
    const { project, project_protocol } = vnode.attrs;
    const tokens = (project.acceptedTokens || []).map((token) => token.symbol);
    return m('div', [
      m(TokenInputField, {
        tokens,
        buttonLabel: `back${vnode.state.backing ? 'ing' : ''}`,
        actionDisabled: vnode.state.backing,
        callback: async (tokenSymbol: string, balance: number) => {
          vnode.state.backing = true;

          const index = project.acceptedTokens.findIndex((t) => t.symbol === tokenSymbol);
          if (index > -1) {
            const acceptedToken = project.acceptedTokens[index];
            const amount = new BN(balance).mul(new BN(10).pow(new BN(acceptedToken.decimals)));
            console.log('====>balance', balance);

            const res = await project_protocol.backOrCurate(
              amount,
              project,
              true,
              vnode.attrs.creator,
              acceptedToken.address,
              acceptedToken.decimals
            );
            vnode.state.error = res.error;
          } else {
            vnode.state.error = 'Failed to retrive selected AcceptedToken info';
          }
          vnode.state.backing = false;
          m.redraw();
        }
      }),
      vnode.state.error && vnode.state.error !== '' && m(
        'label',
        { style: 'color: red; width: 100%; text-align: center; margin-top: 5px' },
        vnode.state.error
      ),
    ]);
  }
};

const CurateAction: m.Component<
  { project: CMNProject, project_protocol: any, creator: string },
  { curating: boolean, error: string }
> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.curating = false;
  },
  view: (vnode) => {
    const { project, project_protocol } = vnode.attrs;
    const tokens = (project.acceptedTokens || []).map((token) => token.symbol);

    return m('div', [
      m(TokenInputField, {
        tokens,
        buttonLabel: vnode.state.curating ? 'curating' : 'curate',
        actionDisabled: vnode.state.curating,
        callback: async (tokenSymbol: string, balance: number) => {
          vnode.state.curating = true;

          const index = project.acceptedTokens.findIndex((t) => t.symbol === tokenSymbol);

          if (index > -1) {
            const acceptedToken = project.acceptedTokens[index];
            const amount = new BN(balance).mul(new BN(10).pow(new BN(acceptedToken.decimals)));

            const res = await project_protocol.backOrCurate(
              amount,
              project,
              false,
              vnode.attrs.creator,
              acceptedToken.address,
              acceptedToken.decimals
            );
            vnode.state.error = res.error;
          } else {
            vnode.state.error = 'Failed to retrive selected AcceptedToken info';
          }

          vnode.state.curating = false;
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

const InProgressActionCard: m.Component<
  { project: CMNProject, project_protocol: any },
  {}
> = {
  view: (vnode) => {
    const { project_protocol, project } = vnode.attrs;

    return m('div', [
      m(BackAciton, { project, project_protocol, creator: app.user.activeAccount.address }),
      m(CurateAction, { project, project_protocol, creator: app.user.activeAccount.address }),
    ]);
  }
};

export default InProgressActionCard;
