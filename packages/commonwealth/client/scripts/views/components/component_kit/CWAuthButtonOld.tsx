import 'components/component_kit/CWAuthButtonOld.scss';
import React from 'react';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import { CWIcon } from './cw_icons/cw_icon';
import type { CustomIconName } from './cw_icons/cw_icon_lookup';
import { customIconLookup, iconLookup } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type AuthButtonStylesProps = {
  disabled?: boolean;
  darkMode?: boolean;
};

type AuthButtonProps = {
  onClick?: () => void;
  type: CustomIconName | 'discord' | 'twitter' | 'github' | 'google';
  label?: string;
  className?: string;
} & AuthButtonStylesProps;

export const CWAuthButton = (props: AuthButtonProps) => {
  const { disabled = false, darkMode, onClick, type, label, className } = props;

  return (
    <div
      className={getClasses<AuthButtonStylesProps>(
        {
          disabled,
          darkMode,
        },
        ComponentType.WalletOptionRow,
      )}
      onClick={onClick}
    >
      {iconLookup[type] && (
        <CWIcon
          iconSize="large"
          iconName={type as any}
          {...(className && { className })}
        />
      )}
      {customIconLookup[type] && (
        <CWCustomIcon
          iconSize="large"
          iconName={type as any}
          {...(className && { className })}
        />
      )}
      <CWText
        type="h5"
        fontWeight="semiBold"
        className="wallet-option-text"
        noWrap
      >
        {label}
      </CWText>
    </div>
  );
};

export const CWNoAuthMethodsAvailable = (props: { darkMode?: boolean }) => {
  return (
    <div
      className={getClasses<AuthButtonStylesProps>(
        {
          disabled: true,
          darkMode: props.darkMode,
        },
        ComponentType.WalletOptionRow,
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
