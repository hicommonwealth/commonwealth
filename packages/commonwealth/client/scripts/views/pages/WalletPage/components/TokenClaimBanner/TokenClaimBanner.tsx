import { ChainBase } from '@hicommonwealth/shared';
import { formatAddressShort } from 'client/scripts/helpers';
import AddressInfo from 'client/scripts/models/AddressInfo';
import {
  useGetClaimAddressQuery,
  useUpdateClaimAddressMutation,
} from 'client/scripts/state/api/tokenAllocations';
import CWBanner from 'client/scripts/views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './TokenClaimBanner.scss';

interface TokenClaimBannerProps {
  onConnectNewAddress?: () => void;
}

// Format token balance with locale separators and 4 decimal places
const formatTokenBalance = (balance: string | number): string => {
  const numBalance = Number(balance);
  return numBalance.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
};

const TokenClaimBanner = ({ onConnectNewAddress }: TokenClaimBannerProps) => {
  const user = useUserStore();

  // token claim address
  const [evmAddresses, setEvmAddresses] = useState<AddressInfo[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<
    AddressInfo | undefined
  >(undefined);
  const { data: claimAddress, isLoading: isLoadingClaimAddress } =
    useGetClaimAddressQuery({
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

  const handleClaimAddressUpdate = () => {
    if (selectedAddress) {
      updateClaimAddress({
        address: selectedAddress.address! as `0x${string}`,
      });
    }
  };

  // Prepare options for the dropdown
  const addressOptions = [
    ...(evmAddresses || []).map((account) =>
      convertAddressToDropdownOption(account.address!),
    ),
  ];

  // Add "Connect a new address" option
  if (onConnectNewAddress) {
    addressOptions.push({
      label: 'Connect a new address',
      value: '__connect_new__',
    });
  }

  const handleAddressChange = (
    option: { label: string; value: string } | null,
  ) => {
    if (option?.value === '__connect_new__') {
      onConnectNewAddress?.();
    } else {
      const account = evmAddresses.find((acc) => acc.address === option?.value);
      setSelectedAddress(account);
    }
  };

  if (!claimAddress?.tokens || isLoadingClaimAddress) {
    return null;
  }

  // Create the address form content to include in actions
  const addressFormContent = !claimAddress?.magna_synced_at ? (
    <div className="claim-address-body">
      <div className="claim-address-row">
        <div className="address-input-row">
          <CWSelectList
            components={{
              Option: (originalProps) =>
                CustomAddressOption({
                  originalProps,
                  selectedAddressValue: selectedAddress?.address || '',
                }),
            }}
            noOptionsMessage={() => 'No available addresses'}
            placeholder="Select or paste your EVM address"
            value={
              selectedAddress?.address
                ? convertAddressToDropdownOption(selectedAddress.address)
                : null
            }
            defaultValue={
              claimAddress?.address
                ? convertAddressToDropdownOption(claimAddress.address)
                : null
            }
            formatOptionLabel={(option) => (
              <CustomAddressOptionElement
                value={option.value}
                label={option.label}
                selectedAddressValue={selectedAddress?.address || ''}
              />
            )}
            label="Token Claim Address"
            isClearable={false}
            isSearchable={true}
            options={addressOptions}
            onChange={handleAddressChange}
            aria-label="Select or enter your EVM address for token claiming"
          />
          {selectedAddress?.address && (
            <CWIcon
              iconName="copy"
              iconSize="medium"
              className="copy-icon"
              onClick={() => {
                void navigator.clipboard.writeText(selectedAddress.address);
                // TODO: Add success toast
              }}
            />
          )}
        </div>
      </div>
    </div>
  ) : null;

  const formattedBalance = formatTokenBalance(claimAddress.tokens || 0);

  return (
    <div className="TokenClaimBanner">
      {claimAddress?.address ? (
        <CWBanner
          type="success"
          body={
            <div className="banner-content">
              <h2 className="token-balance">
                You have {formattedBalance} C tokens!
              </h2>
              <div className="notice-section">
                <div className="notice-text">
                  <p className="base-notice">
                    We are going live on Base. You must set an EVM address to
                    claim your allocation.
                    <CWTooltip
                      content={
                        'Commonwealth tokens will be launched on Base network. ' +
                        'Ensure your address is compatible with Base/Ethereum.'
                      }
                      renderTrigger={(handleInteraction) => (
                        <CWIcon
                          iconName="infoFilled"
                          iconSize="small"
                          className="info-icon"
                          onMouseEnter={handleInteraction}
                          onMouseLeave={handleInteraction}
                        />
                      )}
                    />
                  </p>
                  <p className="security-notice">
                    <strong>Before claiming, verify:</strong> check that you are
                    on the main: common.xyz domain, verify your wallet is
                    connected to the correct network, and never approve
                    unlimited token allowances.
                  </p>
                </div>
              </div>
              {addressFormContent}
              <div className="banner-actions">
                {!claimAddress?.magna_synced_at && (
                  <CWButton
                    label={isUpdating ? 'Saving...' : 'Save address'}
                    onClick={handleClaimAddressUpdate}
                    disabled={
                      isUpdating ||
                      !selectedAddress ||
                      selectedAddress.address === claimAddress?.address
                    }
                    buttonType="secondary"
                    buttonHeight="sm"
                    aria-label="Save the selected address for token claiming"
                  />
                )}
                <CWButton
                  label={`Claim to ${formatAddressShort(claimAddress?.address, 6)}`}
                  buttonType="primary"
                  disabled={!claimAddress.magna_allocation_id}
                  onClick={() => {
                    // handleClaim(claimAddress.magna_allocation_id);
                    alert(
                      `TODO: claim from magna using id: ${claimAddress.magna_allocation_id}`,
                    );
                  }}
                  buttonHeight="sm"
                  aria-label={`Claim ${formattedBalance} tokens to address ${claimAddress?.address}`}
                />
              </div>
            </div>
          }
        />
      ) : (
        <CWBanner
          type="warning"
          body={
            <div className="banner-content">
              <h2 className="token-balance">
                You have {formattedBalance} C tokens!
              </h2>
              <div className="notice-section">
                <div className="notice-text">
                  <p className="base-notice">
                    We are going live on Base. You must set an EVM address to
                    claim your allocation.
                    <CWTooltip
                      content={
                        'Commonwealth tokens will be launched on Base network. ' +
                        'Ensure your address is compatible with Base/Ethereum.'
                      }
                      renderTrigger={(handleInteraction) => (
                        <CWIcon
                          iconName="infoFilled"
                          iconSize="small"
                          className="info-icon"
                          onMouseEnter={handleInteraction}
                          onMouseLeave={handleInteraction}
                        />
                      )}
                    />
                  </p>
                  <p className="security-notice">
                    <strong>Before claiming, verify:</strong> Check the official
                    project website and social media, ensure you&apos;re on the
                    correct domain (check URL carefully), verify your wallet is
                    connected to the correct network, and never approve
                    unlimited token allowances.
                  </p>
                </div>
              </div>
              {addressFormContent}
              <div className="banner-actions">
                {!claimAddress?.magna_synced_at && (
                  <CWButton
                    label={isUpdating ? 'Saving...' : 'Save address'}
                    onClick={handleClaimAddressUpdate}
                    disabled={
                      isUpdating ||
                      !selectedAddress ||
                      selectedAddress.address === claimAddress?.address
                    }
                    buttonType="primary"
                    buttonHeight="sm"
                    aria-label="Save the selected address for token claiming"
                  />
                )}
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default TokenClaimBanner;
