import React, { useMemo, useState } from 'react';

import 'components/linked_addresses.scss';

import { useGetCommunityByIdQuery } from 'state/api/communities';
import type AddressInfo from '../../models/AddressInfo';
import type NewProfile from '../../models/NewProfile';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { PopoverMenu } from './component_kit/CWPopoverMenu';
import { CWIconButton } from './component_kit/cw_icon_button';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import CWCommunityInfo from './component_kit/new_designs/CWCommunityInfo';
import { CWModal } from './component_kit/new_designs/CWModal';
import { CWTable } from './component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from './component_kit/new_designs/CWTable/CWTable';
/* eslint-disable react/no-multi-comp */

type AddressDetailsProps = {
  profile: NewProfile;
  addressInfo: AddressInfo;
  addresses: AddressInfo[];
  toggleRemoveModal: (val: boolean, address: AddressInfo) => void;
  refreshProfiles: (addressInfo: AddressInfo) => void;
};

type LinkedAddressesProps = {
  profile: NewProfile;
  addresses: AddressInfo[];
  refreshProfiles: (addressInfo: AddressInfo) => void;
};

const Address = React.memo((props: any) => {
  const { address, community } = props;

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
    </div>
  );
});

const AddressDetails = React.memo((props: AddressDetailsProps) => {
  const {
    addressInfo,
    toggleRemoveModal,
    profile,
    addresses,
    refreshProfiles,
  } = props;
  const { address, community } = addressInfo;

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const { data: fetchedCommunity } = useGetCommunityByIdQuery({
    id: community.id,
    enabled: !!community.id,
  });

  const handleRemoveModalToggle = () => {
    setIsRemoveModalOpen(!isRemoveModalOpen);
  };

  return (
    <div
      className="AddressContainer"
      style={{ display: 'flex', justifyContent: 'space-between' }}
    >
      <CWCommunityInfo
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
            onClick: () => handleRemoveModalToggle(),
          },
        ]}
        renderTrigger={(onclick) => (
          <CWIconButton iconName="dotsVertical" onClick={onclick} />
        )}
      />
      <CWModal
        size="small"
        content={
          <DeleteAddressModal
            profile={profile}
            addresses={addresses}
            address={addressInfo}
            chain={addressInfo?.community?.id}
            closeModal={() => {
              setIsRemoveModalOpen(false);
              refreshProfiles(addressInfo);
            }}
          />
        }
        onClose={() => {
          setIsRemoveModalOpen(false);
        }}
        open={isRemoveModalOpen}
      />
    </div>
  );
});

export const LinkedAddresses = React.memo((props: LinkedAddressesProps) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressInfo | null>(
    null,
  );

  const { profile, addresses, refreshProfiles } = props;

  // Group addresses by the `address` field
  const groupedAddresses = useMemo(
    () =>
      addresses.reduce((acc: Record<string, AddressInfo[]>, addr) => {
        if (!acc[addr.address]) acc[addr.address] = [];
        acc[addr.address].push(addr);
        return acc;
      }, {}),
    [addresses],
  );

  const rowData = useMemo(
    () =>
      Object.entries(groupedAddresses).map(([address, communities]) => ({
        address: <Address address={address} community={communities} />,
        communities: (
          <div>
            {communities.map((item, index) => (
              <AddressDetails
                key={index}
                profile={profile}
                addressInfo={item}
                addresses={addresses}
                toggleRemoveModal={(val: boolean, address: AddressInfo) => {
                  setIsRemoveModalOpen(val);
                  setCurrentAddress(address);
                }}
                refreshProfiles={refreshProfiles}
              />
            ))}
          </div>
        ),
      })),
    [groupedAddresses, profile],
  );

  const columnInfo: CWTableColumnInfo[] = [
    {
      key: 'address',
      header: 'Address',
      numeric: false,
      sortable: false,
    },
    {
      key: 'communities',
      header: 'Communities',
      numeric: false,
      sortable: false,
    },
  ];

  return (
    <div>
      <CWTable columnInfo={columnInfo} rowData={rowData} />
    </div>
  );
});
