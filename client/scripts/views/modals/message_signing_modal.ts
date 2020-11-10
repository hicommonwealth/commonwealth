import 'modals/message_signing_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button } from 'construct-ui';

import CodeBlock from 'views/components/widgets/code_block';
import HorizontalTabs from 'views/components/widgets/horizontal_tabs';
import { Account, ChainBase } from 'models';
import { SubstrateAccount } from 'client/scripts/controllers/chain/substrate/account';

const MessageSigningSeedOrMnemonicOption = {
  view: (vnode) => {
    const account: Account<any> = vnode.attrs.account;
    return m('.MessageSigningSeedOrMnemonicOption', [
      m('form', [
        m('.instructions', 'Enter your key phrase to sign this message:'),
        m('.warn', 'This is insecure. Only use key phrases for testnets or throwaway accounts.'),
        m('textarea', {
          class: 'mnemonic',
          placeholder: 'Key phrase or seed',
        }),
        m(Button, {
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            vnode.state.error = null;
            const $parent = $(vnode.dom);
            const mnemonic = $parent.find('textarea.mnemonic').val().toString().trim();
            account.setMnemonic(mnemonic);
            account.validate().then(() => {
              $parent.trigger('modalcomplete');
              setTimeout(() => {
                $(vnode.dom).trigger('modalexit');
              }, 0);
            }, (err) => {
              vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Signature check failed.';
              m.redraw();
            });
          },
          label: 'Sign message'
        }),
        vnode.state.error && m('.error-message', vnode.state.error),
      ]),
    ]);
  }
};

const MessageSigningCLIOption = {
  view: (vnode) => {
    const account: Account<any> = vnode.attrs.account;
    return m('.MessageSigningCLIOption', [
      app.chain && app.chain.base === ChainBase.Substrate && m('.instructions', [
        'Use subkey to sign this message:'
      ]),
      // TODO: Message signing isn't supported by gaiacli yet. We
      // should change this to a valid gaiacli command when it's available.
      app.chain && app.chain.base === ChainBase.CosmosSDK && m('.instructions', [
        'Use the cosmos-signer utility to sign this message:'
      ]),
      app.chain && app.chain.base === ChainBase.Substrate
        && m(CodeBlock, { clickToSelect: true }, [
          `echo "${account.validationToken}" | subkey ${(account as SubstrateAccount).isEd25519 ? '-e ' : ''}sign "`,
          m('span.no-select', 'secret phrase'),
          '"',
        ]),
      app.chain && app.chain.base === ChainBase.CosmosSDK
        && m(CodeBlock, { clickToSelect: true }, [
          `${account.validationToken}`
        ]),
      // action
      m('p', 'Enter the signature here:'),
      m('textarea.signature', {
        placeholder: 'Signature',
      }),
      vnode.state.error && m('.error-message', vnode.state.error),
      m('br'),
      m(Button, {
        type: 'submit',
        onclick: (e) => {
          vnode.state.error = null;
          const $parent = $(vnode.dom);
          const signature = $parent.find('textarea.signature').val().toString().trim();
          try {
            account.validate(signature).then(() => {
              $parent.trigger('modalcomplete');
              setTimeout(() => {
                $(vnode.dom).trigger('modalexit');
              }, 0);
            }, (err) => {
              vnode.state.error = err.responseJSON ? err.responseJSON.error : 'Signature check failed.';
              m.redraw();
            });
          } catch (error) {
            vnode.state.error = 'Invalid signature';
          }
        },
        label: 'Submit signature'
      }),
    ]);
  }
};

const MessageSigningModal = {
  view: (vnode) => {
    const account: Account<any> = vnode.attrs.account;
    return m('.MessageSigningModal', [
      m('.compact-modal-title', [
        m('h3', vnode.attrs.title || 'Signature requested'),
      ]),
      m('.compact-modal-body', [
        // message
        m('p', 'Sign this message to continue:'),
        m(CodeBlock, account.validationToken),
        // instructions
        m('p', 'Select an option:'),
        m(HorizontalTabs, [{
          name: 'Command line',
          content: m(MessageSigningCLIOption, { account }),
        }, {
          name: 'Key phrase',
          content: m(MessageSigningSeedOrMnemonicOption, { account }),
          selected: (account.getSeed() || account.getMnemonic()),
        }]),
      ]),
    ]);
  }
};

export const getSignatureForMessage = (account: Account<any>, title?: string, method?: string) => {
  return new Promise((resolve, reject) => {
    let complete = false;
    app.modals.create({
      modal: MessageSigningModal,
      completeCallback: (data) => { complete = true; },
      exitCallback: (data) => { complete ? resolve(data) : reject(data); },
      data: {
        account,
        title,
        defaultMethod: method,
      },
    });
    m.redraw();
  });
};
