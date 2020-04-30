import 'pages/supernova/lock_btc.scss';

import { default as $ } from 'jquery';
import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';

import { TextInputFormField } from '../../components/forms';
import CodeBlock from '../../components/widgets/code_block';
import SupernovaPreheader from './supernova_preheader';
import BTCInstructions from './btc_instructions';

interface IState {
  supernovaAddress: string;
  lockAmount: number;
  error: string;
  success: string;
  // display instruction steps
  instructional: boolean;
}

const SupernovaLockBTCPage: m.Component<{}, IState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Supernova Lock BTC Page',
    });
  },
  view: (vnode: m.VnodeDOM<{}, IState>) => {
    const validateInputs = () => {
      if (isNaN(+vnode.state.lockAmount) || +vnode.state.lockAmount < 0) {
        // Do we want this to be <= 0?
        vnode.state.error = 'Invalid lock amount.';
        m.redraw();
        return false;
      }
      if (typeof vnode.state.supernovaAddress !== 'string' || vnode.state.supernovaAddress.length !== 45) {
        vnode.state.error = 'Invalid Supernova address.';
        m.redraw();
        return false;
      }
      if (typeof vnode.state.lockAmount !== 'string') {
        vnode.state.error = 'Invalid lock amount.';
        m.redraw();
        return false;
      }
      return true;
    };

    return m('.SupernovaLockBTCPage', [
      m('.forum-container.lockBTC-layout', [
        m(SupernovaPreheader),
        m('h2.page-title', 'Lock Bitcoin'),
        m('a.supernova-back', {
          href: '/supernova',
          onclick: (e) => {
            e.preventDefault();
            m.route.set('/supernova');
          }
        }, '« Back'),
        m('.form-container', [
          m('.form', [
            m('.form-left', [
              m('.caption', 'Lock Amount'),
              m(TextInputFormField, {
                options: {
                  name: 'lock amount',
                  placeholder: 'Enter amount'
                },
                callback: (result) => { vnode.state.lockAmount = result; }
              })]),
            m('span.explanation', [
              'The amount of Bitcoin to lock. Note that locking Bitcoin requires using the command line.'
            ]),
          ]),
          m('.form', [
            m('.form-left', [
              m('.caption', 'Supernova Address'),
              m(TextInputFormField, {
                options: {
                  name: 'supernova address',
                  placeholder: 'Enter address here: cosmos123...'
                },
                style: 'margin-bottom: 0px;',
                callback: (result) => { vnode.state.supernovaAddress = result; }
              })
            ]),
            m('span.explanation', [
              'Your DUST will go to this address. You can generate a key ',
              m('a', {
                href: '/supernova/keygen',
                target: '_blank',
              }, 'here'),
              '.',
            ])
          ]),
          m('.wallets', [
            m('.buttons', [
              m('a.btn', {
                href: '#',
                onclick: (e) => {
                  e.preventDefault();
                  if (!validateInputs()) return;
                  vnode.state.instructional = true;
                  vnode.state.error = '';
                }
              }, 'Get instructions'),
            ]),
          ]),
        ]),
        !vnode.state.error && vnode.state.instructional && m(BTCInstructions),
        vnode.state.error && m('.lock-error', vnode.state.error)
      ])
    ]);
  }
};

export default SupernovaLockBTCPage;
