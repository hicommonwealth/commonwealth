import 'modals/new_proposal_modal.scss';

import $ from 'jquery';
import m from 'mithril';
import app from 'state';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { CompactModalExitButton } from 'views/modal';
import CharacterLimitedTextInput from '../components/widgets/character_limited_text_input';
import { createTXModal } from './tx_signing_modal';

const DepositeEVMBalanceModal = {
  // confirmExit: confirmationModalWithText('Are you sure you want to exit?'),
  view: (vnode) => {
    const account = vnode.attrs.account;
    return m('.EditProfileModal', [
      m('.compact-modal-title', [
        m('h3', 'Deploy a new Substrate EVM contract'),
        m(CompactModalExitButton),
      ]),
      m('.form', [
        m('.text-input-wrapper', [
          m(CharacterLimitedTextInput, {
            name: 'deposit',
            placeholder: 'Deposit amount',
            oncreate: (vnode) => {
              $(vnode.dom).focus();
            },
            limit: 40,
          }),
        ]),
        m('.form-bottom', [
          m('.buttons', [
            m('button.btn.formular-button-primary', {
              class: vnode.state.saving || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
              onclick: async (e) => {
                e.preventDefault();
                const data = {
                  deposit: `${$(vnode.dom).find('input[name=deposit]').val()}`,
                };

                try {
                  if ((app.chain as Substrate).chain.hasEVM) {
                    await createTXModal((account as SubstrateAccount).depositEVMBalanceTx(data.deposit));
                  } else {
                    console.log('No EVM module found');
                  }
                } catch (error) {
                  if (typeof error === 'string') {
                    vnode.state.error = error.toString();
                  } else {
                    vnode.state.error = 'Unknown error';
                  }
                }
                vnode.state.saving = false;
                if (!vnode.state.error) $(vnode.dom).trigger('modalexit');
                vnode.state.saving = false;
              }
            }, 'Deposit'),
            m('button', {
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              }
            }, 'Cancel'),
          ]),
          vnode.state.error && m('.error-message', vnode.state.error),
        ])
      ]),
    ]);
  },
};

export default DepositeEVMBalanceModal;
