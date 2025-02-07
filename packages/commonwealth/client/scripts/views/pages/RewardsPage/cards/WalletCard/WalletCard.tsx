import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { getUniqueUserAddresses } from 'helpers/user';
import React, { useState } from 'react';
import { useTokenBalanceQuery, useTokensMetadataQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import FractionalValue from 'views/components/FractionalValue';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import RewardsCard from '../../RewardsCard';
import './WalletCard.scss';

enum WalletBalanceTabs {
  Tokens = 'Tokens',
  Staked = 'Staked',
}

const WalletCard = () => {
  const [activeTab, setActiveTab] = useState<WalletBalanceTabs>(
    WalletBalanceTabs.Tokens,
  );
  const user = useUserStore();
  const uniqueAddresses = getUniqueUserAddresses({
    forChain: ChainBase.Ethereum,
  });
  const [userSelectedAddress, setUserSelectedAddress] = useState<string>(
    uniqueAddresses[0],
  );
  const isSelectedAddressMagic =
    user.addresses.find((a) => a.address === userSelectedAddress)?.walletId ===
    WalletId.Magic;

  const { data: tokenBalances, isLoading: isLoadingTokenBalances } =
    useTokenBalanceQuery({
      chainId: 1358,
      tokenId: userSelectedAddress,
    });
  const tokenAddresses = tokenBalances?.tokenBalances.map(
    (b) => b.contractAddress,
  );
  const { data: tokenMetadatas, isLoading: isLoadingTokensMetadata } =
    useTokensMetadataQuery({
      nodeEthChainId: 8453,
      tokenIds: tokenAddresses || [],
      apiEnabled: !!tokenAddresses,
    });

  const userTokens = [...(tokenMetadatas || [])]
    .map((t) => {
      return {
        ...t,
        balance: parseFloat(
          tokenBalances?.tokenBalances.find(
            (b) => b.contractAddress === t.tokenId,
          )?.tokenBalance || '0.',
        ),
      };
    })
    .filter((t) => t.name);

  const isLoadingTokensInfo = isLoadingTokenBalances || isLoadingTokensMetadata;

  return (
    <RewardsCard title="Wallet Balance" icon="cardholder">
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
          label="Select address (Ethereum)"
          isClearable={false}
          isSearchable={false}
          options={(uniqueAddresses || [])?.map(convertAddressToDropdownOption)}
          onChange={(option) =>
            option?.value && setUserSelectedAddress(option.value)
          }
        />
        {isSelectedAddressMagic && (
          <CWButton
            label="Add Funds"
            iconLeft="plus"
            buttonWidth="narrow"
            buttonHeight="sm"
            buttonAlt="green"
            buttonType="secondary"
          />
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
      </div>
    </RewardsCard>
  );
};

export default WalletCard;
