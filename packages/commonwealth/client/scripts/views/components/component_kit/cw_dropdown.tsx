/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput } from './cw_text_input';
import { CWText } from './cw_text';

export type DropdownItemType = {
  label: string;
  value: string;
};

type DropdownProps = {
  initialValue?: DropdownItemType;
  label: string;
  onSelect?: (item: DropdownItemType) => void;
  options: Array<DropdownItemType>;
};

export const CWDropdown = (props: DropdownProps) => {
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const [selectedValue, setSelectedValue] = React.useState<DropdownItemType>(
    props.initialValue ?? props.options[0]
  );

  const { label, options, onSelect } = props;

  return (
    <div className="dropdown-wrapper">
      <CWTextInput
        iconRight="chevronDown"
        placeholder={selectedValue.label}
        displayOnly
        iconRightonClick={() => {
          // Only here because it makes TextInput display correctly
        }}
        label={label}
        onClick={() => {
          setShowDropdown(!showDropdown);
        }}
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
