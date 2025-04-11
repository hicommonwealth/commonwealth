import { ChainBase, WalletId } from '@hicommonwealth/shared';
import { getUniqueUserAddresses } from 'helpers/user';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import FractionalValue from 'views/components/FractionalValue';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
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
import { DepositModal, WithdrawModal } from 'views/modals/WalletModals';
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
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

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

  const { isLoadingTokensInfo, userCombinedUSDBalance, userTokens } =
    useUserWalletHoldings({
      userSelectedAddress,
    });

  const handleDeposit = async (amount: string) => {
    // TODO: Implement deposit logic
    console.log('Depositing:', amount);
  };

  const handleWithdraw = async (amount: string) => {
    // TODO: Implement withdraw logic
    console.log('Withdrawing:', amount);
  };

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
          label="Select address"
          isClearable={false}
          isSearchable={false}
          options={(uniqueAddresses || [])?.map(convertAddressToDropdownOption)}
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

        <div className="wallet-actions">
          <CWButton
            label="Deposit Funds"
            buttonWidth="full"
            onClick={() => setIsDepositModalOpen(true)}
          />
          <CWButton
            label="Withdraw Funds"
            buttonWidth="full"
            onClick={() => setIsWithdrawModalOpen(true)}
          />
        </div>

        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          currentBalance={
            userTokens.find((t) => t.symbol === 'ETH')?.balance.toString() ||
            '0'
          }
          onDeposit={handleDeposit}
        />

        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          currentBalance={
            userTokens.find((t) => t.symbol === 'ETH')?.balance.toString() ||
            '0'
          }
          onWithdraw={handleWithdraw}
        />
      </div>
    </RewardsCard>
  );
};

export default WalletCard;
