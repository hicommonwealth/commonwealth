import { formatAddressShort } from 'helpers';
import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

interface SelectWalletContentProps {
  onModalClose: () => void;
  availableAddresses: AddressInfo[];
  handleClickConnectNewWallet: () => void;
  handleClickContinue: (selectedAddress: string) => void;
}

const SelectWalletContent = ({
  onModalClose,
  availableAddresses,
  handleClickConnectNewWallet,
  handleClickContinue,
}: SelectWalletContentProps) => {
  const addressOptions = availableAddresses.map((addressInfo) => ({
    value: String(addressInfo.addressId),
    label: formatAddressShort(addressInfo.address, 6),
  }));

  const [tempAddress, setTempAddress] = useState(addressOptions[0]);
  const walletsAvailable = availableAddresses?.length > 0;

  return (
    <>
      <CWModalHeader label="New community admin" onModalClose={onModalClose} />
      <CWModalBody>
        <CWText type="b1" className="description">
          {walletsAvailable
            ? 'Community admins are associated with a wallet. Which wallet would you like to serve as the admin of the new community?'
            : 'In order to launch a community within an ecosystem you must have a compatible wallet connected. How would you like to create your community?'}
        </CWText>
        {walletsAvailable && (
          <CWSelectList
            label="Select Wallet"
            placeholder="Add or select a chain"
            isClearable={false}
            isSearchable={false}
            value={tempAddress}
            defaultValue={addressOptions[0]}
            options={addressOptions}
            onChange={(newValue) => {
              setTempAddress(newValue);
              console.log('selected value is: ', newValue.label);
            }}
          />
        )}
      </CWModalBody>
      <CWModalFooter>
        {walletsAvailable ? (
          <>
            <CWButton
              label="Connect New Wallet"
              buttonType="secondary"
              onClick={handleClickConnectNewWallet}
            />
            <CWButton
              label="Continue"
              onClick={() => handleClickContinue(tempAddress.value)}
            />
          </>
        ) : (
          <div>
            <CWButton
              label="Connect Wallet"
              onClick={handleClickConnectNewWallet}
            />
          </div>
        )}
      </CWModalFooter>
    </>
  );
};

export default SelectWalletContent;
