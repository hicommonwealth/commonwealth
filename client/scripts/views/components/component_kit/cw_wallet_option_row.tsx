/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_wallet_option_row.scss';

import { WalletId } from 'types';

import { WalletIcon } from '../chain_icon';
import { ComponentType } from './types';
import { CWText } from './cw_text';

type WalletOptionRowAttrs = {
  onclick: () => void;
  walletName: WalletId;
};

const getWalletKeyFromValue = (value: string) => {
  return Object.entries(WalletId).find(([_, val]) => val === value)?.[0];
};

export class CWWalletOptionRow
  implements m.ClassComponent<WalletOptionRowAttrs>
{
  view(vnode) {
    const { onclick, walletName } = vnode.attrs;
    return (
      <div class={ComponentType.WalletOptionRow} onclick={onclick}>
        <WalletIcon size={32} walletName={walletName} />
        <CWText type="h5" fontWeight="semiBold">
          {getWalletKeyFromValue(walletName)}
        </CWText>
      </div>
    );
  }
}
