import React, { useState } from 'react';

import './cw_dropdown.scss';
import { CWText } from './cw_text';
import { CWTextInput } from './cw_text_input';

export type DropdownItemType<T extends string | number = string | number> = {
  label: string | JSX.Element;
  value: T;
  selected?: boolean;
  className?: string;
};

type DropdownProps<T extends string | number = string | number> = {
  initialValue?: DropdownItemType<T>;
  value?: T;
  label?: string | JSX.Element;
  onSelect: (item: DropdownItemType<T>) => void;
  options: Array<DropdownItemType<T>>;
  containerClassName?: string;
  disabled?: boolean;
};

export const CWDropdown = <T extends string | number>({
  label,
  options,
  onSelect,
  containerClassName,
  initialValue,
  value,
  disabled = false,
}: DropdownProps<T>) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValue, setSelectedValue] = useState<DropdownItemType<T>>(
    () => {
      if (value !== undefined) {
        const option = options.find((opt) => opt.value === value);
        return option || initialValue || options[0];
      }
      return initialValue || options[0];
    },
  );

  return (
    <div className="dropdown-wrapper">
      <CWTextInput
        containerClassName={containerClassName}
        iconRight="chevronDown"
        placeholder={
          typeof selectedValue.label === 'string' ? (
            selectedValue.label
          ) : (
            <div className="dropdown-jsx-label">{selectedValue.label}</div>
          )
        }
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
                {typeof item.label === 'string' ? (
                  <CWText className="dropdown-item-text">{item.label}</CWText>
                ) : (
                  <div className="dropdown-item-jsx">{item.label}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
