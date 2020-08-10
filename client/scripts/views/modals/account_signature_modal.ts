import 'modals/message_signing_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import CodeBlock from 'views/components/widgets/code_block';
import HorizontalTabs from 'views/components/widgets/horizontal_tabs';
import SubkeyInstructions from 'views/components/subkey_instructions';
import { Account, ChainBase } from 'models';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import { SignerPayloadRaw } from '@polkadot/types/types/extrinsic';
import { isU8a, isHex, stringToHex } from '@polkadot/util';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

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

const sendSignatureToServer = async (
  account1: Account<any>,
  account2: Account<any>,
  signature: string,
  message: string
) => {
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

const SubstrateAccountSigning: m.Component<{
  account: Account<any>,
  message: string,
  accountVerifiedCallback: Function,
  errorCallback: Function,
}, { signing }> = {
  view: (vnode) => {
    const { account, accountVerifiedCallback, errorCallback } = vnode.attrs;
    return m('.SubstrateAccountSigning', {
      onclick: async (e) => {
        e.preventDefault();

        try {
          const signer = await (app.chain as Substrate).webWallet.getSigner(account.address);
          vnode.state.signing = true;
          m.redraw();

          const token = account.validationToken;
          const payload: SignerPayloadRaw = {
            address: account.address,
            data: stringToHex(token),
            type: 'bytes',
          };
          const signature = (await signer.signRaw(payload)).signature;
          const verified = await account.isValidSignature(token, signature);

          if (!verified) {
            vnode.state.signing = false;
            errorCallback('Verification failed.');
          }
          account.validate(signature).then(() => {
            vnode.state.signing = false;
            accountVerifiedCallback(signature);
          }, (err) => {
            vnode.state.signing = false;
            errorCallback('Verification failed.');
          }).then(() => {
            m.redraw();
          }).catch((err) => {
            vnode.state.signing = false;
            errorCallback('Verification failed.');
          });
        } catch (err) {
          // catch when the user rejects the sign message prompt
          vnode.state.signing = false;
          errorCallback('Verification failed.');
        }
      }
    });
  },
};

// const EthereumAccountSigning: m.Component<{
//   address,
//   accountVerifiedCallback,
//   errorCallback,
//   linkNewAddressModalVnode
// }, { linking }> = {
//   view: (vnode) => {
//     return m('.EthereumAccountSigning', [

//     ]);
//   },
// };

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
        (account1.chain.id === 'edgeware')
          && m(SubstrateAccountSigning, {
            account: account1,
            message,
            accountVerifiedCallback: async (signature) => {
              await sendSignatureToServer(account1, account2, signature, message);
            },
            errorCallback: (err: string) => { console.log(err); },
          })
      ]),
    ]);
  }
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
