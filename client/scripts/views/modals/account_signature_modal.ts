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

const SubstrateAccountSigning: m.Component<{
  account,
  accountVerifiedCallback,
  errorCallback,
  linkNewAddressModalVnode
}, { linking }> = {
  view: (vnode) => {
    const { account, accountVerifiedCallback, errorCallback } = vnode.attrs;
    return m('.SubstrateAccountSigning', [

    ]);
  },
};

const EthereumAccountSigning: m.Component<{
  address,
  accountVerifiedCallback,
  errorCallback,
  linkNewAddressModalVnode
}, { linking }> = {
  view: (vnode) => {
    return m('.EthereumAccountSigning', [

    ]);
  },
};

const AccountSigningModal = {
  view: (vnode) => {
    const account1: Account<any> = vnode.attrs.account1;
    const account2: Account<any> = vnode.attrs.account2;
    const message = `Confirming that I would like to move Commonwealth data from ${account1.address} to ${account2.address}`;
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

const sendSignatureToServer = async (account1: Account<any>, account2: Account<any>, signature, message) => {
  await $.ajax({
    url: `${app.serverUrl()}/mergeAccounts`,
    data: {
      jwt: app.user.jwt,
      oldAddress: account1.address,
      newAddress: account2.address,
      signature,
      message,
    },
    type: 'POST',
    success: (result) => {
      console.dir(result);
      return result;
    },
    error: (err) => {
      console.dir(err);
      return err;
    },
  });
};

export const getSignatureFromAccount = (account1: Account<any>, account2: Account<any>, title?: string,) => {
  return new Promise((resolve, reject) => {
    let complete = false;
    console.log(account1);
    if (account1.chain.id !== 'edgeware') { resolve(); return; }
    app.modals.create({
      modal: AccountSigningModal,
      completeCallback: (data) => { complete = true; },
      exitCallback: (data) => { complete ? resolve(data) : reject(data); },
      data: {
        account1,
        account2,
        title,
      },
    });
    m.redraw();
  });
};
