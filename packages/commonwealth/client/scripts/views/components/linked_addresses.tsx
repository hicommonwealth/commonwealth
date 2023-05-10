import React, { useState } from 'react';

import 'components/linked_addresses.scss';

import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { Modal } from './component_kit/cw_modal';
import { CWIconButton } from './component_kit/cw_icon_button';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWAddressTooltip } from './component_kit/cw_popover/cw_address_tooltip';
import type AddressInfo from '../../models/AddressInfo';
import type NewProfile from '../../models/NewProfile';

type AddressProps = {
  profile: NewProfile;
  addressInfo: AddressInfo;
  refreshProfiles: (address: string) => void;
  toggleRemoveModal: (val: boolean, address: AddressInfo) => void;
};

type LinkedAddressesProps = {
  profile: NewProfile;
  addresses: AddressInfo[];
  refreshProfiles: (address: string) => void;
};

const Address = (props: AddressProps) => {
  const { addressInfo, toggleRemoveModal } = props;
  const { address, chain } = addressInfo;

  return (
    <div className="AddressContainer">
      <CWAddressTooltip
        address={address}
        renderTrigger={() => (
          <CWTruncatedAddress address={address} communityInfo={chain} />
        )}
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
  const [currentAddress, setCurrentAddress] = useState<AddressInfo>();

  const { profile, addresses, refreshProfiles } = props;

  return (
    <div className="LinkedAddresses">
      {addresses.map((addr, i) => {
        return (
          <Address
            key={i}
            profile={profile}
            addressInfo={addr}
            refreshProfiles={refreshProfiles}
            toggleRemoveModal={(val: boolean, address: AddressInfo) => {
              setIsRemoveModalOpen(val);
              setCurrentAddress(address);
            }}
          />
        );
      })}
      <Modal
        content={
          <DeleteAddressModal
            profile={profile}
            addresses={addresses}
            address={currentAddress?.address}
            chain={currentAddress?.chain.id}
            closeModal={() => {
              setIsRemoveModalOpen(false);
              refreshProfiles(currentAddress.address);
            }}
          />
        }
        onClose={() => setCurrentAddress(null)}
        open={isRemoveModalOpen}
      />
    </div>
  );
};
