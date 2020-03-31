import 'modals/waiting_list_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { default as mixpanel } from 'mixpanel-browser';
import app from 'state';

const sampleAddresses = {
  ETH: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  MKR: '0x00DaA9a2D88BEd5a29A6ca93e0B7d860cd1d403F',
  EDG: '5HDmaw2WEziuiCzLqGQrbgUWDhFXcNenwUJFLbML61tS6rVo',
  XTZ: 'tz3RDC3Jdn4j15J7bBHZd29EUee9gVB1CxD9',
  ATOM: 'cosmos1cy7jye9jkg6k4h9wcurdcx7q4ld03m4853my3u',
  DOT: '5DuiZFa184E9iCwbh4WjXYvJ88NHvWJbS8SARY8Ev1YEqrri',
};

const chainIDs = {
  ETH: 'ethereum',
  MKR: 'maker',
  EDG: 'edgeware',
  XTZ: 'tezos',
  ATOM: 'cosmos',
  DOT: 'polkadot',
};

const WaitingListModal = {
  confirmExit: async () => true,
  view: (vnode) => {
    const chain = vnode.attrs.chain;
    const chainName = vnode.attrs.chainName;

    return m('.WaitingListModal', [
      m('h3', `Early access for ${vnode.attrs.chainName}`),
      m('form.login-option', [
        !app.isLoggedIn() && m('input[type="text"]', {
          name: 'email',
          placeholder: 'Email',
          oncreate: (vnode) => {
            $(vnode.dom).focus();
          }
        }),
        m('p.optional', 'Optional: Provide your ' + chainName + ' address for priority access'),
        m('input[type="text"]', {
          name: 'address',
          placeholder: sampleAddresses[chain] || '',
        }),
        m('button', {
          class: vnode.state.disabled ? 'disabled' : '',
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const email = $(vnode.dom).find('[name="email"]').val();
            const address = $(vnode.dom).find('[name="address"]').val();
            if (!email && !app.isLoggedIn()) return;
            vnode.state.disabled = true;
            vnode.state.success = false;
            vnode.state.failure = false;
            $.post(app.serverUrl() + '/registerWaitingList', {
              email: email,
              address: address,
              chain: chainIDs[chain],
            }).then((response) => {
              vnode.state.disabled = false;
              if (response.status === 'Success') {
                if (!app.isLoggedIn()) {
                  mixpanel.track('Waiting List', {
                    'Step No': 1,
                    'Step': 'Add Email',
                    'Scope': chainIDs[chain],
                  });
                }
                vnode.state.success = true;
              } else {
                vnode.state.failure = true;
                vnode.state.error = response.message;
              }
              m.redraw();
            }, (err) => {
              vnode.state.failure = true;
              vnode.state.disabled = false;
              if (err.responseJSON) vnode.state.error = err.responseJSON.error;
              m.redraw();
            });
          }
        }, 'Sign up for access'),
        vnode.state.success && m('.waiting-list-message.success', [
          !app.isLoggedIn() ?
            'Check your email to complete registration' :
            'You\'re all set!'
        ]),
        vnode.state.failure && m('.waiting-list-message.error', [
          vnode.state.error || 'An error occurred'
        ]),
      ]),
    ]);
  }
};

export default WaitingListModal;
