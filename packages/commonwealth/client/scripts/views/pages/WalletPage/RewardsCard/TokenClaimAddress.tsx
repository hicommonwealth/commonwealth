import { ChainBase } from '@hicommonwealth/shared';
import AddressInfo from 'client/scripts/models/AddressInfo';
import CWBanner from 'client/scripts/views/components/component_kit/new_designs/CWBanner';
import React, { useEffect, useState } from 'react';
import useGetClaimAddressQuery from 'state/api/tokenAllocations/getClaimAddress';
import useUpdateClaimAddressMutation from 'state/api/tokenAllocations/updateClamiAddress';
import useUserStore from 'state/ui/user';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
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

  useEffect(() => {
    if (claimAddress?.address) {
      setSelectedAddress(
        evmAddresses.find((a) => a.address === claimAddress?.address),
      );
    }
  }, [claimAddress?.address, evmAddresses]);

  const handleUpdate = () => {
    if (selectedAddress) {
      updateClaimAddress({
        address: selectedAddress.address! as `0x${string}`,
      });
    }
  };

  return (
    <CWCard className="TokenClaimAddress">
      {isLoading ? (
        <CWText>Loading...</CWText>
      ) : (
        <div className="claim-address-body">
          <div className="claim-address-row">
            <CWBanner
              type="info"
              body="TODO: Read from claims and show: You have 1000 C tokens available
              to claim"
            />
          </div>
          <div className="claim-address-row">
            <CWSelectList
              components={{
                Option: (originalProps) =>
                  CustomAddressOption({
                    originalProps,
                    selectedAddressValue: selectedAddress?.address || '',
                  }),
              }}
              noOptionsMessage={() => 'No available addresses'}
              value={convertAddressToDropdownOption(
                selectedAddress?.address || '',
              )}
              defaultValue={convertAddressToDropdownOption(
                claimAddress?.address || '',
              )}
              formatOptionLabel={(option) => (
                <CustomAddressOptionElement
                  value={option.value}
                  label={option.label}
                  selectedAddressValue={selectedAddress?.address || ''}
                />
              )}
              label="Token Claim Address"
              isClearable={false}
              isSearchable={false}
              options={(evmAddresses || []).map((account) =>
                convertAddressToDropdownOption(account.address!),
              )}
              onChange={(option) => {
                const account = evmAddresses.find(
                  (acc) => acc.address === option?.value,
                );
                setSelectedAddress(account);
              }}
            />
          </div>
          <div className="claim-address-row">
            <CWButton
              label={isUpdating ? 'Updating...' : 'Update'}
              onClick={handleUpdate}
              disabled={
                isUpdating ||
                !!claimAddress?.magna_synced_at ||
                !selectedAddress ||
                selectedAddress.address === claimAddress?.address
              }
              buttonWidth="full"
              buttonHeight="sm"
            />
          </div>
        </div>
      )}
    </CWCard>
  );
};

export default TokenClaimAddress;
