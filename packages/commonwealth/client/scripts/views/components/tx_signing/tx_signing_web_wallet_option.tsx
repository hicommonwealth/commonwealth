/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import app from 'state';
import { ITXModalData, IWebWallet } from 'models';
import { addressSwapper } from 'commonwealth/shared/utils';
import PolkadotWebWalletController from 'controllers/app/webWallets/polkadot_web_wallet';
import Substrate from 'controllers/chain/substrate/adapter';
import { NextFn } from './types';
import { setupEventListeners } from './helpers';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';

type TXSigningWebWalletOptionAttrs = {
  next: NextFn;
  wallet?: IWebWallet<any>;
} & ITXModalData;

export class TXSigningWebWalletOption
  implements m.ClassComponent<TXSigningWebWalletOptionAttrs>
{
  oncreate(vnode) {
    // try to enable web wallet
    if (vnode.attrs.wallet && !vnode.attrs.wallet.enabled) {
      vnode.attrs.wallet.enable().then(() => m.redraw());
    }
  }

  view(vnode) {
    const { author, wallet } = vnode.attrs;

    const webWallet = wallet as PolkadotWebWalletController;

    const transact = async () => {
      try {
        if (!webWallet.enabling && !webWallet.enabled) {
          await webWallet.enable();
        }

        const signer = await webWallet.getSigner(author.address);

        setupEventListeners(vnode);

        vnode.attrs.txData.transact(author.address, signer);
      } catch (e) {
        console.error(e);
      }
    };

    const foundAuthorInWebWallet =
      webWallet &&
      !!webWallet.accounts.find((v) => {
        return (
          addressSwapper({
            address: v.address,
            currentPrefix: (app.chain as Substrate).chain.ss58Format,
          }) === author.address
        );
      });

    return (
      <>
        <CWText>
          {/* extra div is for the link to flow with the text */}
          <div>
            Use a{' '}
            <a href="https://polkadot.js.org/extension" target="_blank">
              polkadot-js
            </a>{' '}
            compatible wallet to sign the transaction:
          </div>
        </CWText>
        <CWButton
          disabled={
            !webWallet || (webWallet?.enabled && !foundAuthorInWebWallet)
          }
          onclick={async () => {
            if (webWallet && !webWallet.available) {
              await vnode.attrs.wallet.enable();
              m.redraw();
            }

            await transact();
          }}
          label={
            !webWallet
              ? 'No extension detected'
              : !webWallet.enabled
              ? 'Connect to extension'
              : !foundAuthorInWebWallet
              ? 'Current address not in wallet'
              : 'Sign and send transaction'
          }
        />
      </>
    );
  }
}
