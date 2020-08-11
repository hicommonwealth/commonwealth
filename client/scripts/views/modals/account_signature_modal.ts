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
import { Button } from 'construct-ui';

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
      return result;
    },
    error: (err) => {
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
    const { account, message, accountVerifiedCallback, errorCallback } = vnode.attrs;
    console.dir('Substrate Account Siging Component Rendered');
    return m('.SubstrateAccountSigning', [
      m('p', `Please that you would like to merge the contents from ${account.address}.`),
      m(Button, {
        label: 'Open Polkadot.js to confirm',
        onclick: async (e) => {
          e.preventDefault();
          try {
            await (app.chain as Substrate).webWallet.enable();
            const signer = await (app.chain as Substrate).webWallet.getSigner(account.address);
            vnode.state.signing = true;
            m.redraw();

            const payload: SignerPayloadRaw = {
              address: account.address,
              data: stringToHex(message),
              type: 'bytes',
            };
            const signature = (await signer.signRaw(payload)).signature;
            const verified = await account.isValidSignature(message, signature);

            if (!verified) {
              vnode.state.signing = false;
              errorCallback('Verification failed.');
            }
            accountVerifiedCallback(signature);
          } catch (err) {
            // catch when the user rejects the sign message prompt
            vnode.state.signing = false;
            console.dir(err);
            errorCallback('Verification failed.');
          }
        }
      }),
    ]);
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
