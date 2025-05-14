import { formatAddressShort } from 'client/scripts/helpers';
import { getChainIcon } from 'client/scripts/utils/chainUtils';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { CWRadioButton } from 'client/scripts/views/components/component_kit/new_designs/cw_radio_button';
import React from 'react';
import './AddressItem.scss';
import { AddressInfo } from './MembersSection';

export type RadioOption = {
  label: string;
  value: string;
  checked: boolean;
};

interface AddressItemProps {
  address: AddressInfo;
  communityBase?: string;
  radioOptions?: RadioOption[];
  onRoleChange: (id: number, role: string) => void;
}

export const AddressItem: React.FC<AddressItemProps> = ({
  address,
  communityBase,
  radioOptions = [
    { label: 'Admin', value: 'admin', checked: address.role === 'admin' },
    { label: 'Member', value: 'member', checked: address.role === 'member' },
  ],
  onRoleChange,
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
            onChange={() => onRoleChange(address.id, option.value)}
          />
        ))}
      </div>
    </div>
  );
};
