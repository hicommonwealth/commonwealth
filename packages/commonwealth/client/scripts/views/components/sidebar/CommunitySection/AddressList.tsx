import React, { useState } from 'react';

import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import useUserStore from 'client/scripts/state/ui/user';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import { DeleteAddressModal } from 'client/scripts/views/modals/delete_address_modal';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWModal } from '../../component_kit/new_designs/CWModal';
import AddressCreate from './AddressCreate';
import AddressItem from './AddressItem';
import './AddressList.scss';

interface AddressListProps {
  address?: string;
  addresses: AddressInfo[] | undefined;
  username?: string;
  profile: NewProfile;
  refreshProfiles: (addressInfo: AddressInfo) => void;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
}

export const AddressList = ({
  address,
  addresses,
  username,
  profile,
  refreshProfiles,
  onAuthModalOpen,
}: AddressListProps) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressInfo | null>(
    null,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const user = useUserStore();

  if ((!address && !username) || !addresses) {
    return null;
  }

  const filteredAddresses = Array.from(
    new Map(addresses.map((item) => [item.address, item])).values(),
  );

  return (
    <>
      <div className="AddressList">
        <div className="header">
          <div className="address-left">
            <CWIcon
              iconName={isCollapsed ? 'caretDown' : 'caretUp'}
              iconSize="small"
              className="caret-icon"
              weight="bold"
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
            <CWText fontWeight="medium" type="caption" className="status-text">
              Addresses
            </CWText>
          </div>
          {user.isLoggedIn && (
            <div className="address-right">
              <AddressCreate onAuthModalOpen={() => onAuthModalOpen()} />
            </div>
          )}
        </div>
        {!isCollapsed && (
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
        )}
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
                refreshProfiles(currentAddress);
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
