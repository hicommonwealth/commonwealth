/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_wallet_option_row.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import { getClasses } from './helpers';
import type { CustomIconName } from './cw_icons/cw_icon_lookup';

type WalletOptionRowStyleAttrs = {
  disabled?: boolean;
  darkMode?: boolean;
};

type WalletOptionRowAttrs = {
  onclick?: () => void;
  walletName: CustomIconName;
  walletLabel?: string;
} & WalletOptionRowStyleAttrs;

export class CWWalletOptionRow extends ClassComponent<WalletOptionRowAttrs> {
  view(vnode: m.Vnode<WalletOptionRowAttrs>) {
    const {
      disabled = false,
      darkMode,
      onclick,
      walletName,
      walletLabel,
    } = vnode.attrs;
    return (
      <div
        class={getClasses<WalletOptionRowStyleAttrs>(
          {
            disabled,
            darkMode,
          },
          ComponentType.WalletOptionRow
        )}
        onclick={onclick}
      >
        <CWCustomIcon size={32} iconName={walletName} iconSize="large" />
        <CWText
          type="h5"
          fontWeight="semiBold"
          className="wallet-option-text"
          noWrap
        >
          {walletLabel}
        </CWText>
      </div>
    );
  }
}
