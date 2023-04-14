import 'components/component_kit/cw_wallet_option_row.scss';
import React from 'react';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import type { CustomIconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type WalletOptionRowStyleProps = {
  disabled?: boolean;
  darkMode?: boolean;
};

type WalletOptionRowProps = {
  onClick?: () => void;
  walletName: CustomIconName;
  walletLabel?: string;
} & WalletOptionRowStyleProps;

export const CWWalletOptionRow = (props: WalletOptionRowProps) => {
  const {
    disabled = false,
    darkMode,
    onClick,
    walletName,
    walletLabel,
  } = props;

  return (
    <div
      className={getClasses<WalletOptionRowStyleProps>(
        {
          disabled,
          darkMode,
        },
        ComponentType.WalletOptionRow
      )}
      onClick={onClick}
    >
      <CWCustomIcon iconSize="large" iconName={walletName} />
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
};

export const CWWalletMissingOptionRow = (props: { darkMode?: boolean }) => {
  return (
    <div
      className={getClasses<WalletOptionRowStyleProps>(
        {
          disabled: true,
          darkMode: props.darkMode,
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
};
