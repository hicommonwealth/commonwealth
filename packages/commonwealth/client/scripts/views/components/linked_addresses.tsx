import React, { useMemo, useState } from 'react';

import './linked_addresses.scss';

import { formatAddressShort } from 'shared/utils';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import type AddressInfo from '../../models/AddressInfo';
import type NewProfile from '../../models/NewProfile';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWIconButton } from './component_kit/cw_icon_button';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWIdentificationTag } from './component_kit/new_designs/CWIdentificationTag';
import { CWModal } from './component_kit/new_designs/CWModal';
import { CWTable } from './component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from './component_kit/new_designs/CWTable/CWTable';

/* eslint-disable react/no-multi-comp */

type AddressProps = {
  addressInfo: AddressInfo;
};

type AddressDetailsProps = {
  profile: NewProfile;
  addressInfo: AddressInfo;
  toggleRemoveModal: (
    val: boolean,
    address: AddressInfo,
    isBulkDelete: boolean,
    communityName: string,
  ) => void;
};

type LinkedAddressesProps = {
  profile: NewProfile;
  addresses: AddressInfo[];
  refreshProfiles: (addressInfo: AddressInfo) => void;
};

const Address = ({ addressInfo }: AddressProps) => {
  const { address, walletId, community } = addressInfo;

  return (
    <div className="AddressContainer">
      <div className="address">
        <CWIcon iconName="ethereum" iconSize="small" />
        <CWIdentificationTag
          iconLeft={walletId}
          address={`\u2022 ${formatAddressShort(address)}`}
        />
      </div>
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

  if (!fetchedCommunity) return null;

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
            onClick: () =>
              toggleRemoveModal(
                true,
                addressInfo,
                false,
                fetchedCommunity.name,
              ),
          },
          {
            label: 'Delete All Addresses',
            onClick: () =>
              toggleRemoveModal(true, addressInfo, true, fetchedCommunity.name),
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
  const [isBulkDeleteState, setIsBulkDeleteState] = useState(false);
  const [selectedCommuinty, setSelectedCommunity] = useState<string | null>(
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
    ([address, communities]) => {
      const addressInfo = addresses.find((addr) => addr.address === address);
      return {
        address: addressInfo ? <Address addressInfo={addressInfo} /> : null,
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
                    isBulkDelete: boolean = false,
                    community,
                  ) => {
                    setIsRemoveModalOpen(val);
                    setCurrentAddress(selectedAddress);
                    setIsBulkDeleteState(isBulkDelete);
                    setSelectedCommunity(community);
                  }}
                />
              );
            })}
          </div>
        ),
      };
    },
  );

  // Memoize CWTable to prevent unnecessary re-renders.
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
          currentAddress &&
          selectedCommuinty && (
            <DeleteAddressModal
              addresses={addresses}
              address={currentAddress}
              chain={currentAddress?.community?.id}
              closeModal={() => {
                setIsRemoveModalOpen(false);
                refreshProfiles(currentAddress);
              }}
              isBulkDelete={isBulkDeleteState}
              communityName={selectedCommuinty}
            />
          )
        }
        onClose={() => {
          setIsRemoveModalOpen(false);
          setCurrentAddress(null);
          setSelectedCommunity(null);
        }}
        open={isRemoveModalOpen}
      />
    </div>
  );
};
