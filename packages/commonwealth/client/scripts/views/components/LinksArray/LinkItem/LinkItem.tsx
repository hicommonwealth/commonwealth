import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { LinkItemProps } from '../types';
import './LinkItem.scss';

const LinkItem = ({
  placeholder = 'https://example.com',
  canUpdate = true,
  canDelete = true,
  onDelete = () => {},
  showDeleteButton = true,
  canConfigure = false,
  onConfgure = () => {},
  showConfigureButton = false,
  error = '',
  value = '',
  onUpdate = () => {},
  customElementAfterLink = '',
}: LinkItemProps) => {
  return (
    <div className="LinkItem">
      <CWTextInput
        fullWidth
        containerClassName="w-full"
        placeholder={placeholder}
        value={value}
        customError={error}
        disabled={!canUpdate}
        onInput={async (e) => await onUpdate?.(e.target.value.trim())}
      />
      {customElementAfterLink}
      {showConfigureButton && (
        <CWIconButton
          iconButtonTheme="neutral"
          iconName="gear"
          iconSize="large"
          onClick={onConfgure}
          disabled={!canConfigure}
        />
      )}
      {showDeleteButton && (
        <CWIconButton
          iconButtonTheme="neutral"
          iconName="trash"
          iconSize="large"
          onClick={onDelete}
          disabled={!canDelete}
        />
      )}
    </div>
  );
};

export default LinkItem;
