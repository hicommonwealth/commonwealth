/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import 'components/tx_signing/tx_signing_web_wallet_option.scss';

import app from 'state';
import { link } from 'helpers';
import { ITXModalData, IWebWallet } from 'models';
import { addressSwapper } from 'commonwealth/shared/utils';
import PolkadotWebWalletController from 'controllers/app/webWallets/polkadot_web_wallet';
import Substrate from 'controllers/chain/substrate/main';
import { NextFn } from './types';
import { setupEventListeners } from './helpers';
import { CWButton } from '../component_kit/cw_button';

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
      <div class="TXSigningWebWalletOption">
        <div>
          Use a{' '}
          {link('a', 'https://polkadot.js.org/extension/', 'polkadot-js', {
            target: '_blank',
          })}{' '}
          compatible wallet to sign the transaction:
        </div>
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
          oncreate={(vvnode) => $(vvnode.dom).focus()}
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
      </div>
    );
  }
}
