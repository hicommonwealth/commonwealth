import { WalletId } from '@hicommonwealth/shared';
import { notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import FractionalValue from 'views/components/FractionalValue';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWIconButton } from 'views/components/component_kit/new_designs/CWIconButton/CWIconButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
// eslint-disable-next-line max-len
import { WalletFundsModal } from 'views/modals/WalletFundsModal/WalletFundsModal';
import RewardsCard from '../../RewardsCard';
// import MagicWalletButton from './MagicWalletButton/MagicWalletButton';
import AddressSelector from './AddressSelector/AddressSelector';
import useAddressSelector from './AddressSelector/useAddressSelector';
import NetworkSelector from './NetworkSelector/NetworkSelector';
import useNetworkSelector from './NetworkSelector/useNetworkSelector';
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
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const user = useUserStore();
  const { selectedNetwork, setSelectedNetwork } = useNetworkSelector({});
  const { selectedAddress, setSelectedAddress, uniqueAddresses } =
    useAddressSelector();

  const isSelectedAddressMagic =
    user.addresses.find((a) => a.address === selectedAddress)?.walletId ===
    WalletId.Magic;

  const { isLoadingTokensInfo, userCombinedUSDBalance, userTokens, refetch } =
    useUserWalletHoldings({
      userSelectedAddress: selectedAddress,
      selectedNetworkChainId: selectedNetwork.value,
    });

  const handleRefresh = async () => {
    await refetch();
    notifySuccess('Wallet balances refreshed successfully');
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
      <div className="WalletCard">
        <div className="network-address-selector">
          <AddressSelector
            address={selectedAddress}
            addressList={uniqueAddresses}
            onAddressSelected={(address) => {
              setSelectedAddress(address);
              handleRefresh().catch(console.error);
            }}
          />
          <NetworkSelector
            network={selectedNetwork}
            onNetworkSelected={(network) => {
              setSelectedNetwork(network);
              handleRefresh().catch(console.error);
            }}
          />
        </div>
        <CWText type="caption">
          Showing total token balance for {selectedNetwork.label}
        </CWText>
        {isLoadingTokensInfo ? (
          <CWCircleMultiplySpinner />
        ) : (
          <CWText type="h4">
            $&nbsp;
            <FractionalValue type="h4" value={userCombinedUSDBalance} />
          </CWText>
        )}
        {/* <MagicWalletButton userSelectedAddress={userSelectedAddress} /> */}
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
        {isSelectedAddressMagic && (
          <CWButton
            label="Deposit Funds"
            buttonWidth="full"
            type="submit"
            buttonHeight="sm"
            onClick={() => setIsFundsModalOpen(true)}
          />
        )}
      </div>
      <CWModal
        size="medium"
        open={isFundsModalOpen}
        onClose={() => setIsFundsModalOpen(false)}
        content={
          <WalletFundsModal onClose={() => setIsFundsModalOpen(false)} />
        }
      />
    </RewardsCard>
  );
};

export default WalletCard;
