import 'pages/supernova/lock_atom.scss';

import app from 'state';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Cosmos from 'controllers/chain/cosmos/main';
import { ChainBase } from 'models';
import { TextInputFormField, DropdownFormField } from '../../components/forms';
import SupernovaPreheader from './supernova_preheader';
import ATOMInstructions from './atom_instructions';


interface IState {
  supernovaAddress: string;
  lockAmount: number;
  delegate: string;
  error: string;
  success: string;
  // display instruction steps
  instructional: boolean;
  keyGen: boolean;
}

const SupernovaLockAtomPage: m.Component<{}, IState> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Supernova Lock ATOM Page',
    });
  },
  view: (vnode: m.VnodeDOM<{}, IState>) => {
    const loading = (error?) => {
      return m('.SupernovaLockATOMPage', [
        m('.forum-container.lockATOM-layout', [
          m(SupernovaPreheader),
          m('h2.page-title', 'Lock ATOM'),
          m('.app-loading', [
            !error && m('span.icon-spinner2.animate-spin'),
            !error && m('p', 'Loading...'),
            error && m('p', `ERROR: ${error}`)
          ])
        ])
      ]);
    };
    if (!app.chain) {
      // loading
      return loading();
    }
    if (app.chain.base !== ChainBase.CosmosSDK) {
      // wrong chain for page
      return loading('Must select Cosmos chain to lock ATOMs.');
    }
    if (!(app.chain as Cosmos).accounts.initialized) {
      // loading
      return loading();
    }
    const validators = (app.chain as Cosmos).accounts.validators;
    if (!validators) {
      // no validatos -- error?
      return loading();
    }

    const validateInputs = () => {
      if (isNaN(vnode.state.lockAmount) || vnode.state.lockAmount < 0) {
        vnode.state.error = 'Invalid lock amount.';
        m.redraw();
        return false;
      }
      if (typeof vnode.state.supernovaAddress !== 'string' || vnode.state.supernovaAddress.length !== 45) {
        vnode.state.error = 'Invalid Supernova address.';
        m.redraw();
        return false;
      }
      if (typeof vnode.state.delegate !== 'string') {
        vnode.state.error = 'Invalid delegate.';
        m.redraw();
        return false;
      }
      return true;
    };

    const validatorChoices = Object.keys(validators).map((key) => {
      return ({
        name: 'validator_choices',
        value: validators[key].operator,
        label: validators[key].operator
      });
    });
    vnode.state.delegate = validatorChoices[0].name;

    // default to current cosmos address
    const loggedInAddress = app.vm.activeAccount ? app.vm.activeAccount.address : '';
    vnode.state.supernovaAddress = loggedInAddress;

    return m('.SupernovaLockATOMPage', [
      m('.forum-container.lockATOM-layout', [
        m(SupernovaPreheader),
        m('h2.page-title', 'Lock ATOM'),
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
                  name: 'lockAmount',
                  placeholder: 'Enter amount'
                },
                callback: (result) => { vnode.state.lockAmount = +result; }
              })
            ]),
            m('span.explanation', 'The amount of ATOM to lock.')
          ]),
          m('.form', [
            m('.form-left', [
              m('.caption', 'Supernova Address'),
              m(TextInputFormField, {
                options: {
                  name: 'supernovaAddress',
                  placeholder: 'Enter address here: cosmos123...',
                  value: loggedInAddress,
                },
                style: 'margin-bottom: 0px;',
                callback: (result) => { vnode.state.supernovaAddress = result; }
              })]),
            m('span.explanation', [
              'Your DUST will go to this address. You can generate a key ',
              m('a', {
                href: '/supernova/keygen',
                target: '_blank',
              }, 'here'),
              '.',
            ])
          ]),
          m('.form', [
            m('.form-left', [
              m('.caption', 'Choose a validator'),
              m(DropdownFormField, {
                name: 'alt-del',
                options: { style: 'padding: 5px' },
                choices: validatorChoices,
                callback: (result) => { vnode.state.delegate = result; }
              })
            ]),
            m('.explanation', [
              m('span', [
                'This list contains all active Cosmos ',
                'validators. Choose one to delegate to. ',
              ])
            ])
          ]),
          m('.wallets', [
            m('.buttons', [
              m('a.btn.cw-lock-button', {
                href: '#',
                onclick: async (e) => {
                  e.preventDefault();
                  if (!validateInputs()) return;
                  const lockAmount = vnode.state.lockAmount;
                  const delegate = vnode.state.delegate;
                  if (app.vm.activeAccount) {
                    createTXModal((app.vm.activeAccount as CosmosAccount).delegateTx(
                      delegate,
                      app.chain.chain.coins(lockAmount),
                      JSON.stringify({ supernovaAddress: vnode.state.supernovaAddress }),
                    ));
                  } else {
                    vnode.state.error = 'You must link an ATOM account to Commonwealth.';
                    m.redraw();
                  }
                }
              }, 'Lock using Commonwealth UI'),
              m('a.btn.cli-button', {
                href: '#',
                onclick: (e) => {
                  e.preventDefault();
                  console.log(vnode.state.instructional);
                  vnode.state.instructional = !vnode.state.instructional;
                  vnode.state.error = '';
                }
              }, 'Get lockdrop-cli instructions'),
            ]),
            m('.wallet-disclaimer', [
              m('p', [
                'This will send a transaction bonding your stake to the ',
                'Cosmos validator, which also signals your Supernova address.',
              ]),
            ]),
          ]),
        ]),
        vnode.state.error && m('.lock-error', vnode.state.error),
        vnode.state.instructional && m(ATOMInstructions)
      ]),
    ]);
  }
};

export default SupernovaLockAtomPage;
