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
  showDescription = true,
  rounded = false,
  variant = 'light',
}: AuthButtonProps) => {
  const auth = AUTH_TYPES[type];
  const IconComp = auth.icon.isCustom ? CWCustomIcon : CWIcon;

  return (
    <button
      disabled={disabled}
      // @ts-expect-error StrictNullChecks
      onClick={disabled ? null : onClick}
      className={clsx('AuthButton', variant, className, { rounded })}
    >
      <IconComp className="icon" iconName={auth.icon.name as any} />

      <div className="info">
        <CWText type="h5" className="label">
          {auth.label}
        </CWText>

        {auth?.description && showDescription && (
          <CWTag
            type="stage"
            label={auth.description.text}
            classNames={clsx('description', {
              'no-bg': !auth.description.hasBackground,
            })}
          />
        )}
      </div>
    </button>
  );
};

export default AuthButton;
