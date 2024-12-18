import React, { useState } from 'react';

import './cw_dropdown.scss';
import { CWText } from './cw_text';

import { CWTextInput } from './cw_text_input';

export type DropdownItemType = {
  label: string;
  value: string | number;
};

type DropdownProps = {
  initialValue?: DropdownItemType;
  label?: string;
  onSelect?: (item: DropdownItemType) => void;
  options: Array<DropdownItemType>;
  containerClassName?: string;
  disabled?: boolean;
};

export const CWDropdown = ({
  label,
  options,
  onSelect,
  containerClassName,
  initialValue,
  disabled = false,
}: DropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValue, setSelectedValue] = useState<DropdownItemType>(
    initialValue ?? options[0],
  );

  return (
    <div className="dropdown-wrapper">
      <CWTextInput
        containerClassName={containerClassName}
        iconRight="chevronDown"
        placeholder={selectedValue.label}
        displayOnly
        iconRightonClick={() => {
          // Only here because it makes TextInput display correctly
        }}
        label={label}
        onClick={() => {
          if (disabled) return;
          setShowDropdown(!showDropdown);
        }}
        disabled={disabled}
      />
      {showDropdown && (
        <div className="dropdown-options-display">
          {options.map((item, i) => {
            return (
              <div
                className="dropdown-item"
                key={i}
                onClick={() => {
                  setShowDropdown(false);
                  setSelectedValue(item);

                  if (onSelect) {
                    onSelect(item);
                  }
                }}
              >
                <CWText className="dropdown-item-text">{item.label}</CWText>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
