import React, { useState } from 'react';

import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import { DeleteAddressModal } from 'client/scripts/views/modals/delete_address_modal';
import { CWModal } from '../../component_kit/new_designs/CWModal';
import AddressItem from './AddressItem';
import './AddressList.scss';

interface AddressListProps {
  address?: string;
  addresses: AddressInfo[] | undefined;
  username?: string;
  profile: NewProfile;
  refreshProfiles: () => void;
}

export const AddressList = ({
  address,
  addresses,
  username,
  profile,
  refreshProfiles,
}: AddressListProps) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressInfo | null>(
    null,
  );

  if ((!address && !username) || !addresses) {
    return null;
  }

  const filteredAddresses = Array.from(
    new Map(addresses.map((item) => [item.address, item])).values(),
  );

  return (
    <>
      <div className="AddressList">
        <div className="content-container">
          {filteredAddresses &&
            filteredAddresses.map((addr, index) => (
              <AddressItem
                key={index}
                addressInfo={addr}
                profile={profile}
                toggleRemoveModal={(
                  val: boolean,
                  selectedAddress: AddressInfo,
                ) => {
                  setIsRemoveModalOpen(val);
                  setCurrentAddress(selectedAddress);
                }}
                isSelected={addr.address === address}
              />
            ))}
        </div>
      </div>
      <CWModal
        size="small"
        content={
          currentAddress && (
            <DeleteAddressModal
              addresses={addresses}
              address={currentAddress}
              chain={currentAddress?.community?.id}
              closeModal={() => {
                setIsRemoveModalOpen(false);
                refreshProfiles();
              }}
            />
          )
        }
        onClose={() => {
          setIsRemoveModalOpen(false);
          setCurrentAddress(null);
        }}
        open={isRemoveModalOpen}
      />
    </>
  );
};
