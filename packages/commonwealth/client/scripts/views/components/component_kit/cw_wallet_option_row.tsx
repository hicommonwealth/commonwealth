/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_wallet_option_row.scss';
import m from 'mithril';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import type { CustomIconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

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

export class CWWalletMissingOptionRow extends ClassComponent<{
  darkMode?: boolean;
}> {
  view(vnode: m.Vnode<{ darkMode }>) {
    return (
      <div
        class={getClasses<WalletOptionRowStyleAttrs>(
          {
            disabled: true,
            darkMode: vnode.attrs.darkMode,
          },
          ComponentType.WalletOptionRow
        )}
      >
        <CWText
          type="h5"
          fontWeight="semiBold"
          className="wallet-option-text"
          noWrap
        >
          No wallet found
        </CWText>
      </div>
    );
  }
}
