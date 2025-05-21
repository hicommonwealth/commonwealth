import { formatAddressShort } from 'client/scripts/helpers';
import { getChainIcon } from 'client/scripts/utils/chainUtils';
import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { CWRadioButton } from 'client/scripts/views/components/component_kit/new_designs/cw_radio_button';
import React from 'react';
import './AddressItem.scss';
import { AddressInfo } from './MembersSection';

export type RadioOption = {
  label: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
};

export type CheckboxOption = {
  label: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
};

interface AddressItemProps {
  address: AddressInfo;
  communityBase?: string;
  radioOptions?: RadioOption[];
  checkboxOptions?: CheckboxOption[];
  onChange: (id: number, value: string) => void;
}

export const AddressItem: React.FC<AddressItemProps> = ({
  address,
  communityBase,
  radioOptions = [],
  checkboxOptions = [],
  onChange,
}) => {
  return (
    <div className="AddressItemRow">
      <div className="address-info">
        <CWTag
          label={formatAddressShort(address.address)}
          type="address"
          iconName={getChainIcon(address, communityBase as any)}
        />
      </div>
      <div className="role-selection">
        {radioOptions.map((option) => (
          <CWRadioButton
            key={option.value}
            label={option.label}
            name={`role-${address.id}`}
            value={option.value}
            checked={option.checked}
            disabled={option.disabled}
            onChange={() => onChange(address.id, option.value)}
          />
        ))}
        {checkboxOptions.map((option) => (
          <CWCheckbox
            key={option.value}
            label={option.label}
            value={option.value}
            checked={option.checked}
            disabled={option.disabled}
            onChange={() => onChange(address.id, option.value)}
          />
        ))}
      </div>
    </div>
  );
};
