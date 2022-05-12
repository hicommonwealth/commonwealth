/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_wallet_row_card.scss';

import { WalletId } from 'types';

import { WalletIcon } from '../chain_icon';
import { ComponentType } from './types';
import { CWText } from './cw_text';

type WalletRowCardAttrs = {
  onclick: () => void;
  walletName: WalletId;
};

const getWalletKeyFromValue = (value: string) => {
  return Object.entries(WalletId).find(([_, val]) => val === value)?.[0];
};

export class CWWalletRowCard implements m.ClassComponent<WalletRowCardAttrs> {
  view(vnode) {
    const { onclick, walletName } = vnode.attrs;
    return (
      <div class={ComponentType.WalletRowCard} onclick={onclick}>
        <WalletIcon size={32} walletName={walletName} />
        <CWText type="h5" fontWeight="semiBold">
          {getWalletKeyFromValue(walletName)}
        </CWText>
      </div>
    );
  }
}
