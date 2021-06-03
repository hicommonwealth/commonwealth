import 'components/commonwealth/action_card.scss';

import { utils } from 'ethers';
import { Input, FormGroup, Button } from 'construct-ui';
import m from 'mithril';
import BN from 'bn.js';

import { CWProject } from 'models/CWProtocol';
import app from 'state';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const ActionModule: m.Component<{callback: (isBack: boolean) => void, actionDisabled: boolean, submitting: number}, {}> = {
  view: (vnode) => {
    const { callback, actionDisabled, submitting } = vnode.attrs;

    return [
      m(Button, {
        class: 'contribute-button',
        label: `Back${submitting === 1 ? 'ing now' : ''}`,
        rounded: true,
        fluid: true,
        intent: 'primary',
        disabled: actionDisabled,
        onclick: async(e) => { await callback(true); }
      }),
      m(Button, {
        class: 'contribute-button',
        label: submitting === 2 ? 'Curating now' : 'Curate to receive success',
        rounded: true,
        fluid: true,
        intent: 'primary',
        disabled: actionDisabled,
        onclick: async(e) => { await callback(false); }
      }),
    ];
  }
}

const InProgressActionCard: m.Component<{project: CWProject, protocol: any}, {amount: any, error: string, submitting: number}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
  },
  view: (vnode) => {
    const { protocol, project } = vnode.attrs;
    const { submitting } = vnode.state; // 0: not in progress, 1: in progress of backing, 2: in progress of curating
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
        callback: async(isBacker) => {
          if (!vnode.state.amount || vnode.state.amount.toString() === new BN(0).toString()) {
            vnode.state.error = 'Please enter the amount';
          } else {
            const author = app.user.activeAccount.address;
            vnode.state.submitting = isBacker ? 1 : 2;
            const res = await protocol.backOrCurate(
              vnode.state.amount,
              project,
              isBacker,
              author
            );
            vnode.state.error = res.error;
            vnode.state.submitting = 0;
          }
          m.redraw();
        },
        submitting,
        actionDisabled
      }),
    ]);
  }
}


export default InProgressActionCard;