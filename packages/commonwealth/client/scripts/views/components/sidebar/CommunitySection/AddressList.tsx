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
  refreshProfiles: () => void;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
  isInsideCommunity?: boolean;
}

export const AddressList = ({
  address,
  addresses,
  profile,
  refreshProfiles,
  onAuthModalOpen,
  isInsideCommunity,
}: AddressListProps) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressInfo | null>(
    null,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCommuinty, setSelectedCommunity] = useState<string | null>(
    null,
  );

  const user = useUserStore();

  if (!addresses) {
    return null;
  }

  const filteredAddresses = Array.from(
    new Map(addresses.map((item) => [item.address, item])).values(),
  );
  const isLastCommunityAddress = filteredAddresses.length === 1;

  return (
    <>
      <div className="AddressList">
        <div className="header">
          <div
            className="address-left"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <CWIcon
              iconName={isCollapsed ? 'caretDown' : 'caretUp'}
              iconSize="small"
              className="caret-icon"
              weight="bold"
            />
            <CWText fontWeight="medium" type="caption" className="status-text">
              Addresses
            </CWText>
          </div>
          {user.isLoggedIn && isInsideCommunity && (
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
                    community,
                  ) => {
                    setIsRemoveModalOpen(val);
                    setCurrentAddress(selectedAddress);
                    setSelectedCommunity(community);
                  }}
                  isSelected={addr.address === address}
                  isInsideCommunity={isInsideCommunity}
                />
              ))}
          </div>
        )}
      </div>
      <CWModal
        size="small"
        content={
          currentAddress &&
          selectedCommuinty && (
            <DeleteAddressModal
              addresses={addresses}
              address={currentAddress}
              chain={currentAddress?.community?.id}
              closeModal={() => {
                setIsRemoveModalOpen(false);
                refreshProfiles();
              }}
              communityName={selectedCommuinty}
              isLastCommunityAddress={isLastCommunityAddress}
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
