import React, { useState } from 'react';

import 'components/component_kit/cw_dropdown.scss';
import { CWText } from './cw_text';

import { CWTextInput } from './cw_text_input';
import { CWCheck } from './cw_icons/cw_icons';

export type DropdownItemType = {
  label: string;
  value: string;
};

type DropdownProps = {
  initialValues?: DropdownItemType[];
  label?: string;
  placeholder?: string;
  onSelect?: (items: DropdownItemType[]) => void;
  options: Array<DropdownItemType>;
  containerClassName?: string;
  disabled?: boolean;
};

export const CWMultiSelectDropdown = ({
  label,
  options,
  onSelect,
  containerClassName,
  placeholder,
  initialValues = [],
  disabled = false,
}: DropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValues, setSelectedValues] =
    useState<DropdownItemType[]>(initialValues);

  const toggleSelect = (item: DropdownItemType) => {
    let newSelectedValues: DropdownItemType[];
    if (selectedValues.find((value) => value.value === item.value)) {
      newSelectedValues = selectedValues.filter(
        (value) => value.value !== item.value
      );
    } else {
      newSelectedValues = [...selectedValues, item];
    }

    setSelectedValues(newSelectedValues);
    if (onSelect) {
      onSelect(newSelectedValues);
    }
  };

  return (
    <div className="dropdown-wrapper" style={{ maxWidth: '125px' }}>
      <CWTextInput
        containerClassName={containerClassName}
        iconRight="chevronDown"
        placeholder={placeholder}
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
            const isSelected = !!selectedValues.find(
              (value) => value.value === item.value
            );
            return (
              <div
                className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                key={i}
                onClick={() => {
                  if (disabled) return;
                  toggleSelect(item);
                }}
              >
                <CWText className="dropdown-item-text">{item.label}</CWText>
                <div className="selected">{isSelected && <CWCheck />}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
