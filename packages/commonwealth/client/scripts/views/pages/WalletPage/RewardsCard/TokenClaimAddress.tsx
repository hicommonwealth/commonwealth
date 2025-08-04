import { ChainBase } from '@hicommonwealth/shared';
import AddressInfo from 'client/scripts/models/AddressInfo';
import React, { useEffect, useState } from 'react';
import useGetClaimAddressQuery from 'state/api/tokenAllocations/getClaimAddress';
import useUpdateClaimAddressMutation from 'state/api/tokenAllocations/updateClamiAddress';
import useUserStore from 'state/ui/user';
import { CWCard } from 'views/components/component_kit/cw_card';
import {
  CWDropdown,
  DropdownItemType,
} from 'views/components/component_kit/cw_dropdown';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './TokenClaimAddress.scss';

const TokenClaimAddress = () => {
  const user = useUserStore();
  const [evmAddresses, setEvmAddresses] = useState<AddressInfo[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<
    AddressInfo | undefined
  >(undefined);
  const { data: claimAddress, isLoading } = useGetClaimAddressQuery({
    enabled: true,
  });
  const { mutate: updateClaimAddress, isPending: isUpdating } =
    useUpdateClaimAddressMutation();

  useEffect(() => {
    const addresses = new Map<string, AddressInfo>();
    user.addresses
      .filter((address) => address.community.base === ChainBase.Ethereum)
      .forEach((address) => {
        addresses.set(address.address, address);
      });
    setEvmAddresses([...addresses.values()]);
  }, [user]);

  const handleUpdate = () => {
    if (selectedAddress) {
      updateClaimAddress({ address_id: selectedAddress.addressId! });
    }
  };

  const dropdownOptions: DropdownItemType[] = evmAddresses.map((account) => ({
    label: account.address || 'Unknown Address',
    value: account.addressId!,
  }));

  return (
    <CWCard className="TokenClaimAddress">
      <CWText>Token Claim Address</CWText>
      {isLoading ? (
        <CWText>Loading...</CWText>
      ) : (
        <div className="claim-address-body">
          <div className="claim-address-row">
            <CWText>{claimAddress?.address || '-'}</CWText>
          </div>
          <div className="claim-address-row">
            <CWDropdown
              options={dropdownOptions}
              onSelect={(item) => {
                const account = evmAddresses.find(
                  (acc) => acc.addressId === item.value,
                );
                setSelectedAddress(account);
              }}
              initialValue={
                dropdownOptions.find(
                  (option) => option.label === claimAddress?.address,
                ) || dropdownOptions[0]
              }
            />
          </div>
          <div className="claim-address-row">
            <CWButton
              label="Update"
              onClick={handleUpdate}
              disabled={
                isUpdating ||
                !!claimAddress?.magna_synced_at ||
                !selectedAddress ||
                selectedAddress.address === claimAddress?.address
              }
            >
              {isUpdating ? 'Updating...' : 'Update Claim Address'}
            </CWButton>
          </div>
        </div>
      )}
    </CWCard>
  );
};

export default TokenClaimAddress;
