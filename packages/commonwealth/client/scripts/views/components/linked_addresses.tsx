import React, { useMemo, useState } from 'react';

import './linked_addresses.scss';

import { formatAddressShort } from 'client/scripts/helpers';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import type AddressInfo from '../../models/AddressInfo';
import type NewProfile from '../../models/NewProfile';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWIconButton } from './component_kit/cw_icon_button';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWModal } from './component_kit/new_designs/CWModal';
import { CWTable } from './component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from './component_kit/new_designs/CWTable/CWTable';

/* eslint-disable react/no-multi-comp */

type AddressProps = {
  address: string;
};

type AddressDetailsProps = {
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
  const { address } = props;

  return (
    <div className="AddressContainer">
      <CWTruncatedAddress address={address} />
    </div>
  );
};

const AddressDetails = (props: AddressDetailsProps) => {
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
    <div className="AddressDetails">
      <CWTruncatedAddress
        communityInfo={{
          iconUrl: fetchedCommunity?.icon_url || '',
          name: fetchedCommunity?.name || '',
        }}
        showCommunityname
      />
      <PopoverMenu
        menuItems={[
          {
            label: `Disconnect ${formatAddressShort(address)}`,
            onClick: () => toggleRemoveModal(true, addressInfo),
          },
        ]}
        renderTrigger={(onclick) => (
          <CWIconButton iconName="dotsHorizontal" onClick={onclick} />
        )}
      />
    </div>
  );
};

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

export const LinkedAddresses = (props: LinkedAddressesProps) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressInfo | null>(
    null,
  );

  const { profile, addresses, refreshProfiles } = props;

  const groupedAddresses = useMemo(() => {
    return addresses.reduce((acc: Record<string, AddressInfo[]>, addr) => {
      if (!acc[addr.address]) acc[addr.address] = [];
      acc[addr.address].push(addr);
      return acc;
    }, {});
  }, [addresses]);

  const rowData = Object.entries(groupedAddresses).map(
    ([address, communities]) => ({
      address: <Address address={address} />,
      communities: (
        <div>
          {communities.map((addr, index) => {
            return (
              <AddressDetails
                key={index}
                profile={profile}
                addressInfo={addr}
                toggleRemoveModal={(
                  val: boolean,
                  selectedAddress: AddressInfo,
                ) => {
                  setIsRemoveModalOpen(val);
                  setCurrentAddress(selectedAddress);
                }}
              />
            );
          })}
        </div>
      ),
    }),
  );

  const TableComponent = useMemo(() => {
    return <CWTable columnInfo={columnInfo} rowData={rowData} />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  return (
    <div>
      {TableComponent}
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
    </div>
  );
};
