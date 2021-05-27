import 'components/commonwealth/action_card.scss';

import { utils } from 'ethers';
import { Input, FormGroup, Button } from 'construct-ui';
import m from 'mithril';

import app from 'state';
import { CWProject } from 'models/CWProtocol';

const floatRegex = /^[0-9]*\.?[0-9]*$/;

const FailedActionCard: m.Component<{project: CWProject, protocol: any}, {amount: any, error: string, submitting: boolean}> = {
  oncreate: (vnode) => {
    vnode.state.error = '';
    vnode.state.amount = 0;
  },
  view: (vnode) => {
    const { project, protocol } = vnode.attrs;
    const { submitting } = vnode.state;
    const actionDisabled = !app.user.activeAccount || !app.isLoggedIn() || submitting;

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
      [
        m(Button, {
          class: 'contribute-button',
          label: 'Redeem BTokens',
          rounded: true,
          fluid: true,
          intent: 'primary',
          disabled: actionDisabled,
          onclick: async () => {
            if (!vnode.state.amount || vnode.state.amount === 0) {
              vnode.state.error = 'Please enter the amount';
            } else {
              const author = app.user.activeAccount.address;
              vnode.state.submitting = true;

              let txSuccessed = false;
              try {
                txSuccessed = await protocol.redeemTokens(vnode.state.amount, project.projectHash, true, author);
              } catch {
                txSuccessed = false;
              }

              vnode.state.error = txSuccessed ? '' : 'Failed to do this action';
              vnode.state.submitting = false;
            }
            m.redraw();
          }
        }),
      ]
    ]);
  }
}


export default FailedActionCard;