import clsx from 'clsx';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWCustomIcon } from '../component_kit/cw_icons/cw_custom_icon';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWTag } from '../component_kit/new_designs/CWTag';
import './AuthButton.scss';
import { AUTH_TYPES } from './constants';
import { AuthButtonProps } from './types';

const AuthButton = ({
  type,
  onClick,
  className = '',
  disabled = false,
}: AuthButtonProps) => {
  const auth = AUTH_TYPES[type];
  const IconComp = auth.icon.isCustom ? CWCustomIcon : CWIcon;

  return (
    <button
      disabled={disabled}
      onClick={disabled ? null : onClick}
      className={clsx('AuthButton', className)}
    >
      <IconComp className="icon" iconName={auth.icon.name as any} />

      <CWText type="h5" className="label">
        {auth.label}
      </CWText>

      {auth?.description && (
        <CWTag
          type="stage"
          label={auth.description.text}
          classNames={`description ${
            !auth.description.hasBackground ? 'no-bg' : ''
          }`}
        />
      )}
    </button>
  );
};

export default AuthButton;
