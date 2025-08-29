import React from 'react';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './AddressSelector.scss';
import { AddressSelectorProps } from './types';

const AddressSelector = ({
  address,
  onAddressSelected,
  addressList,
}: AddressSelectorProps) => {
  return (
    <CWSelectList
      containerClassname="AddressSelector"
      components={{
        Option: (originalProps) =>
          CustomAddressOption({
            originalProps,
            selectedAddressValue: address,
          }),
      }}
      noOptionsMessage={() => 'No available Metamask address'}
      value={convertAddressToDropdownOption(address)}
      defaultValue={convertAddressToDropdownOption(address)}
      formatOptionLabel={(option) => (
        <CustomAddressOptionElement
          value={option.value}
          label={option.label}
          selectedAddressValue={address}
        />
      )}
      isClearable={false}
      isSearchable={false}
      options={addressList.map(convertAddressToDropdownOption)}
      onChange={(option) => option?.value && onAddressSelected(option.value)}
    />
  );
};

export default AddressSelector;
