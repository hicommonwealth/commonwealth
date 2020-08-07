import 'modals/message_signing_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import CodeBlock from 'views/components/widgets/code_block';
import HorizontalTabs from 'views/components/widgets/horizontal_tabs';
import SubkeyInstructions from 'views/components/subkey_instructions';
import { Account, ChainBase } from 'models';
import { SubstrateAccount } from 'client/scripts/controllers/chain/substrate/account';

enum SignForAccountSteps {
  Step1SelectWallet,
  Step2VerifyWithCLI,
  Step2VerifyWithWebWallet,
  Step3SubmitQuery,
}

enum LinkNewAddressWallets {
  Metamask,
  PolkadotJS,
  // NEARWallet,
  CLIWallet,
  // Hedgehog,
}

const AccountSigningModal = {
  view: (vnode) => {
    const account: Account<any> = vnode.attrs.account;
    return m('.AccountSigningModal', [
      m('.compact-modal-title', [
        m('h3', vnode.attrs.title || 'Signature requested'),
      ]),
      m('.compact-modal-body', [
        // // message
        // m('p', 'Sign this message to continue:'),
        // m(CodeBlock, account.validationToken),
        // // instructions
        // m('p', 'Select an option:'),
        // m(HorizontalTabs, [{
        //   name: 'Command line',
        //   content: m(MessageSigningCLIOption, { account }),
        // }, {
        //   name: 'Key phrase',
        //   content: m(MessageSigningSeedOrMnemonicOption, { account }),
        //   selected: (account.getSeed() || account.getMnemonic()),
        // }]),
      ]),
    ]);
  }
};

export const getSignatureFromAccount = (account: Account<any>, title?: string,) => {
  return new Promise((resolve, reject) => {
    let complete = false;
    console.log(account);
    if (account.chain.id !== 'edgeware') { resolve(); return; }
    app.modals.create({
      modal: AccountSigningModal,
      completeCallback: (data) => { complete = true; },
      exitCallback: (data) => { complete ? resolve(data) : reject(data); },
      data: {
        account,
        title,
      },
    });
    m.redraw();
  });
};
