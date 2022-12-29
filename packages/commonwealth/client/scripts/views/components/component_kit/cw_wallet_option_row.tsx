/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_wallet_option_row.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import { getClasses } from './helpers';
import { CustomIconName } from './cw_icons/cw_icon_lookup';

type WalletOptionRowStyleAttrs = {
  disabled?: boolean;
  darkMode?: boolean;
};

type WalletOptionRowAttrs = {
  onClick?: () => void;
  walletName: CustomIconName;
  walletLabel?: string;
} & WalletOptionRowStyleAttrs;

export class CWWalletOptionRow extends ClassComponent<WalletOptionRowAttrs> {
  view(vnode: ResultNode<WalletOptionRowAttrs>) {
    const {
      disabled = false,
      darkMode,
      onClick,
      walletName,
      walletLabel,
    } = vnode.attrs;
    return (
      <div
        className={getClasses<WalletOptionRowStyleAttrs>(
          {
            disabled,
            darkMode,
          },
          ComponentType.WalletOptionRow
        )}
        onClick={onClick}
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
