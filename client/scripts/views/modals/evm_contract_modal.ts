import 'modals/new_proposal_modal.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import { CompactModalExitButton } from 'views/modal';
import CharacterLimitedTextInput from '../components/widgets/character_limited_text_input';
import ResizableTextarea from '../components/widgets/resizable_textarea';
import { createTXModal } from './tx_signing_modal';
import Substrate from 'client/scripts/controllers/chain/substrate/main';
import { SubstrateAccount } from 'client/scripts/controllers/chain/substrate/account';

const NewEVMContractModal = {
  oncreate: (vnode) => {
  },
  // confirmExit: confirmationModalWithText('Are you sure you want to exit?'),
  view: (vnode) => {
    const account = app.vm.activeAccount;
    return m('.EditProfileModal', [
      m('.compact-modal-title', [
        m('h3', 'Deploy a new Substrate EVM contract'),
        m(CompactModalExitButton),
      ]),
      m('.form', [
        m('.text-input-wrapper', [
          m(CharacterLimitedTextInput, {
            name: 'initialBalance',
            placeholder: 'Initial contract balance',
            oncreate: (vnode) => {
              $(vnode.dom).focus();
            },
            limit: 40,
          }),
          m(CharacterLimitedTextInput, {
            name: 'gasLimit',
            placeholder: 'Gas limit',
            oncreate: (vnode) => {},
            limit: 80,
          }),
          m(CharacterLimitedTextInput, {
            name: 'gasPrice',
            placeholder: 'Gas price',
            oncreate: (vnode) => {},
            limit: 80,
          }),
          m(ResizableTextarea, {
            name: 'bytecode',
            placeholder: 'EVM contract bytecode ',
            oncreate: (vnode) => {},
            // TODO: character limit
          }),
        ]),
        m('.form-bottom', [
          m('.buttons', [
            m('button.btn.formular-button-primary', {
              class: vnode.state.saving || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
              onclick: async (e) => {
                e.preventDefault();
                const data = {
                  bytecode: `${$(vnode.dom).find('textarea[name=bytecode]').val()}`,
                  initialBalance: `${$(vnode.dom).find('input[name=initialBalance]').val()}`,
                  gasLimit: `${$(vnode.dom).find('input[name=gasLimit]').val()}`,
                  gasPrice: `${$(vnode.dom).find('input[name=gasPrice]').val()}`,
                };

                try {
                  console.log(data);
                  if ((app.chain as Substrate).chain.hasEVM) {
                    await createTXModal((account as SubstrateAccount).createEVMTx(
                      data.bytecode,
                      data.initialBalance,
                      data.gasLimit,
                      data.gasPrice,
                    ));
                  }
                } catch (error) {
                  if (typeof error === 'string') {
                    vnode.state.error = error.toString();
                  } else if (error.txType === 'setIdentity') {
                    vnode.state.error = 'Sending transaction failed';
                  } else {
                    vnode.state.error = 'Unknown error';
                  }
                }
                vnode.state.saving = false;
                if (!vnode.state.error) $(vnode.dom).trigger('modalexit');
                vnode.state.saving = false;
              }
            }, 'Deploy'),
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

export default NewEVMContractModal;
