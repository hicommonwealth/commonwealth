import React, { useState } from 'react';

import './linked_addresses.scss';

import { useGetCommunityByIdQuery } from 'state/api/communities';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import type AddressInfo from '../../models/AddressInfo';
import type NewProfile from '../../models/NewProfile';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWIconButton } from './component_kit/cw_icon_button';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWModal } from './component_kit/new_designs/CWModal';
/* eslint-disable react/no-multi-comp */

type AddressProps = {
  profile: NewProfile;
  addressInfo: AddressInfo;
  toggleRemoveModal: (val: boolean, address: AddressInfo) => void;
};

type LinkedAddressesProps = {
  profile: NewProfile;
  addresses: AddressInfo[];
  refreshProfiles: (addressInfo: AddressInfo) => void;
};

const Address = (props: AddressProps) => {
  const { addressInfo, toggleRemoveModal } = props;
  const { address, community } = addressInfo;

  // user.addresses.community from user store don't have icon_url
  // and name, we make a new query to get them, ideally this should be returned
  // from api
  const { data: fetchedCommunity } = useGetCommunityByIdQuery({
    id: community.id,
    enabled: !!community.id,
  });

  return (
    <div className="AddressContainer">
      <CWTruncatedAddress
        address={address}
        communityInfo={{
          iconUrl: fetchedCommunity?.icon_url || '',
          name: fetchedCommunity?.name || '',
        }}
      />
      <PopoverMenu
        menuItems={[
          {
            label: 'Remove',
            iconLeft: 'trash',
            onClick: () => toggleRemoveModal(true, addressInfo),
          },
        ]}
        renderTrigger={(onclick) => (
          <CWIconButton iconName="dotsVertical" onClick={onclick} />
        )}
      />
    </div>
  );
};

export const LinkedAddresses = (props: LinkedAddressesProps) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressInfo | null>(
    null,
  );

  const { profile, addresses, refreshProfiles } = props;

  return (
    <div className="LinkedAddresses">
      {addresses?.map((addr, i) => {
        return (
          <Address
            key={i}
            profile={profile}
            addressInfo={addr}
            toggleRemoveModal={(val: boolean, address: AddressInfo) => {
              setIsRemoveModalOpen(val);
              setCurrentAddress(address);
            }}
          />
        );
      })}
      <CWModal
        size="small"
        content={
          currentAddress && (
            <DeleteAddressModal
              profile={profile}
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
    </div>
  );
};
