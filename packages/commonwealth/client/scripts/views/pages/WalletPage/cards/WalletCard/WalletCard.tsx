import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { formatAddressShort } from 'client/scripts/helpers';
import AddressInfo from 'client/scripts/models/AddressInfo';
import {
  useGetClaimAddressQuery,
  useUpdateClaimAddressMutation,
} from 'client/scripts/state/api/tokenAllocations';
import CWBanner from 'client/scripts/views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { notifySuccess } from 'controllers/app/notifications';
import { getUniqueUserAddresses } from 'helpers/user';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import FractionalValue from 'views/components/FractionalValue';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWIconButton } from 'views/components/component_kit/new_designs/CWIconButton/CWIconButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import useAuthentication from 'views/modals/AuthModal/useAuthentication';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import RewardsCard from '../../RewardsCard';
import './WalletCard.scss';
import useUserWalletHoldings from './useUserWalletHoldings';

enum WalletBalanceTabs {
  Tokens = 'Tokens',
  Stake = 'Stake',
}

const WalletCard = () => {
  const [activeTab, setActiveTab] = useState<WalletBalanceTabs>(
    WalletBalanceTabs.Tokens,
  );

  const user = useUserStore();

  const { openMagicWallet } = useAuthentication({});

  const uniqueAddresses = getUniqueUserAddresses({
    forChain: ChainBase.Ethereum,
  });

  const [userSelectedAddress, setUserSelectedAddress] = useState<string>(
    uniqueAddresses[0],
  );

  const isSelectedAddressMagic =
    user.addresses.find((a) => a.address === userSelectedAddress)?.walletId ===
    WalletId.Magic;

  const { isLoadingTokensInfo, userCombinedUSDBalance, userTokens, refetch } =
    useUserWalletHoldings({
      userSelectedAddress,
    });

  const handleRefresh = async () => {
    await refetch();
    notifySuccess('Wallet balances refreshed successfully');
  };

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

  return (
    <RewardsCard
      title="Wallet Balance"
      icon="cardholder"
      customAction={
        <div style={{ marginLeft: 'auto' }}>
          <CWIconButton
            iconName="arrowClockwise"
            onClick={() => {
              handleRefresh().catch(console.error);
            }}
            disabled={isLoadingTokensInfo}
          />
        </div>
      }
    >
      <>
        <div className="WalletCard">
          <CWSelectList
            components={{
              Option: (originalProps) =>
                CustomAddressOption({
                  originalProps,
                  selectedAddressValue: userSelectedAddress || '',
                }),
            }}
            noOptionsMessage={() => 'No available Metamask address'}
            value={convertAddressToDropdownOption(userSelectedAddress || '')}
            defaultValue={convertAddressToDropdownOption(
              userSelectedAddress || '',
            )}
            formatOptionLabel={(option) => (
              <CustomAddressOptionElement
                value={option.value}
                label={option.label}
                selectedAddressValue={userSelectedAddress || ''}
              />
            )}
            label="Select address"
            isClearable={false}
            isSearchable={false}
            options={(uniqueAddresses || [])?.map(
              convertAddressToDropdownOption,
            )}
            onChange={(option) =>
              option?.value && setUserSelectedAddress(option.value)
            }
          />
          <CWText type="caption">
            Showing balance for Ethereum on Base (EVM)
          </CWText>
          <CWText type="h4">
            $&nbsp;
            <FractionalValue type="h4" value={userCombinedUSDBalance} />
          </CWText>
          <CWDivider />
          {isSelectedAddressMagic && (
            <button
              type="button"
              className="add-funds-btn"
              onClick={() => {
                openMagicWallet().catch(console.error);
              }}
            >
              <CWIcon iconName="plus" iconSize="small" />
              <CWText type="caption">Add Funds</CWText>
            </button>
          )}
          <CWTabsRow>
            {Object.values(WalletBalanceTabs).map((tab) => (
              <CWTab
                key={tab}
                label={tab}
                isSelected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </CWTabsRow>
          <div className="list">
            {activeTab === WalletBalanceTabs.Tokens ? (
              isLoadingTokensInfo ? (
                <CWCircleMultiplySpinner />
              ) : (
                userTokens.map((token) => (
                  <div className="balance-row" key={token.name}>
                    {withTooltip(
                      <CWText className="cursor-pointer">{token.name}</CWText>,
                      token.symbol,
                      true,
                    )}
                    <FractionalValue value={token.balance} />
                  </div>
                ))
              )
            ) : (
              <CWText isCentered>🚧 Coming Soon, Hang tight!</CWText>
            )}
          </div>

          {claimAddress?.tokens && !isLoadingClaimAddress && (
            <>
              {claimAddress?.address ? (
                <CWBanner
                  type="success"
                  body={`You have ${claimAddress.tokens} C tokens!`}
                  buttons={[
                    {
                      label: `Claim to ${formatAddressShort(claimAddress?.address, 6)}`,
                      buttonType: 'primary',
                      onClick: () => {
                        // handleClaim();
                        alert('TODO handle claim');
                      },
                    },
                  ]}
                />
              ) : (
                <CWBanner
                  type="warning"
                  body={`You have ${claimAddress.tokens} C tokens!
                    Please select an ethereum address to claim to.`}
                />
              )}
              <div className="claim-address-body">
                {!claimAddress?.magna_synced_at && (
                  <>
                    <div className="claim-address-row">
                      <CWSelectList
                        components={{
                          Option: (originalProps) =>
                            CustomAddressOption({
                              originalProps,
                              selectedAddressValue:
                                selectedAddress?.address || '',
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
                            selectedAddressValue={
                              selectedAddress?.address || ''
                            }
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
                        onClick={handleClaimAddressUpdate}
                        disabled={
                          isUpdating ||
                          !selectedAddress ||
                          selectedAddress.address === claimAddress?.address
                        }
                        buttonWidth="full"
                        buttonHeight="sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </>
    </RewardsCard>
  );
};

export default WalletCard;
