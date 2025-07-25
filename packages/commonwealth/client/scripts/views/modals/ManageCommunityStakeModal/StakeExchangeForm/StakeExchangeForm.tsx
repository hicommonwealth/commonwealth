import { calculateVoteWeight, STAKE_ID } from '@hicommonwealth/evm-protocols';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import clsx from 'clsx';
import { findDenominationIcon } from 'helpers/findDenomination';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import React from 'react';
import { isMobile } from 'react-device-detect';
import {
  BaseMixpanelPayload,
  MixpanelCommunityStakeEvent,
} from 'shared/analytics/types';
import app from 'state';
import {
  useBuyStakeMutation,
  useSellStakeMutation,
} from 'state/api/communityStake';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { useCommunityStake } from 'views/components/CommunityStake';
import NumberSelector from 'views/components/NumberSelector';
import { Skeleton } from 'views/components/Skeleton';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import {
  CWModalBody,
  CWModalFooter,
} from 'views/components/component_kit/new_designs/CWModal';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import useAppStatus from '../../../../hooks/useAppStatus';
import { trpc } from '../../../../utils/trpcClient';
import useAuthentication from '../../../modals/AuthModal/useAuthentication';
import { useStakeExchange } from '../hooks';
import {
  ManageCommunityStakeModalMode,
  ManageCommunityStakeModalState,
} from '../types';
import { capDecimals, convertTokenAmountToUsd } from '../utils';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from './CustomAddressOption';
import './StakeExchangeForm.scss';

type OptionDropdown = {
  value: string;
  label: string;
};

interface StakeExchangeFormProps {
  mode: ManageCommunityStakeModalMode;
  onSetModalState: (modalState: ManageCommunityStakeModalState) => void;
  onSetSuccessTransactionHash: (hash: string) => void;
  selectedAddress: OptionDropdown;
  onSetSelectedAddress: (address: OptionDropdown) => void;
  addressOptions: OptionDropdown[];
  numberOfStakeToExchange: number;
  onSetNumberOfStakeToExchange: React.Dispatch<React.SetStateAction<number>>;
  denomination: string;
}

const StakeExchangeForm = ({
  mode,
  onSetModalState,
  onSetSuccessTransactionHash,
  selectedAddress,
  onSetSelectedAddress,
  addressOptions,
  numberOfStakeToExchange,
  onSetNumberOfStakeToExchange,
  denomination,
}: StakeExchangeFormProps) => {
  const user = useUserStore();

  const { selectedCommunity: community } = useManageCommunityStakeModalStore();

  const chainRpc =
    community?.ChainNode?.url || app?.chain?.meta?.ChainNode?.url || '';
  const ethChainId =
    community?.ChainNode?.ethChainId ||
    app?.chain?.meta?.ChainNode?.eth_chain_id ||
    0;
  // Use the `selectedAddress.value` if buying stake in a non active community (i.e app.activeChainId() != community.id)
  const activeAccountAddress =
    (community ? selectedAddress?.value : user.activeAccount?.address) || '';

  const {
    buyPriceData,
    ethUsdRate,
    userEthBalance,
    userEthBalanceLoading,
    sellPriceData,
  } = useStakeExchange({
    mode,
    address: selectedAddress?.value,
    numberOfStakeToExchange: numberOfStakeToExchange ?? 0,
    community: {
      namespace: community?.namespace,
      ChainNode: community?.ChainNode,
    },
  });

  const { stakeBalance, stakeValue, currentVoteWeight, stakeData } =
    useCommunityStake({ walletAddress: selectedAddress?.value, community });

  const createStakeTransaction =
    trpc.community.createStakeTransaction.useMutation();
  const { mutateAsync: buyStake } = useBuyStakeMutation({
    shouldUpdateActiveAddress: !community, // only update active address if buying stake in an active community
  });
  const { mutateAsync: sellStake } = useSellStakeMutation();
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const expectedVoteWeight = calculateVoteWeight(
    numberOfStakeToExchange ? String(numberOfStakeToExchange) : '0',
    stakeData?.stake?.vote_weight,
  );

  const popoverProps = usePopover();

  const isBuyMode = mode === 'buy';

  const communityId = community?.id || app.activeChainId() || '';

  const { isAddedToHomeScreen } = useAppStatus();

  const userData = useUserStore();

  const hasMagic = userData.hasMagicWallet;

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  const handleBuy = async () => {
    try {
      onSetModalState(ManageCommunityStakeModalState.Loading);

      const txReceipt = await buyStake({
        amount: numberOfStakeToExchange,
        stakeId: STAKE_ID,
        namespace: stakeData!.stake!.Community!.namespace!,
        chainRpc,
        walletAddress: selectedAddress?.value,
        ethChainId,
        ...(community?.ChainNode?.ethChainId && {
          chainId: `${community.ChainNode.ethChainId}`,
        }),
      });

      user.setData({ addressSelectorSelectedAddress: selectedAddress?.value });
      await createStakeTransaction.mutateAsync({
        transaction_hash: txReceipt.transactionHash,
        community_id: communityId,
      });
      user.setData({ addressSelectorSelectedAddress: undefined });

      onSetSuccessTransactionHash(txReceipt?.transactionHash);
      onSetModalState(ManageCommunityStakeModalState.Success);

      // join user to community if not already a member
      const isMemberOfCommunity = user.addresses.find(
        (x) => x.community.id === communityId,
      );
      if (!isMemberOfCommunity) {
        await linkSpecificAddressToSpecificCommunity({
          address: selectedAddress?.value,
          community: {
            id: communityId,
            name: community?.name || app?.chain?.meta?.name,
            base: community?.base || app?.chain?.base,
            iconUrl: community?.iconUrl || app?.chain?.meta?.icon_url || '',
          },
          ...(app.activeChainId() && { activeChainId: app.activeChainId() }),
        });
      }

      trackAnalytics({
        event: MixpanelCommunityStakeEvent.STAKE_BOUGHT,
        community: communityId,
        userId: user.activeAccount?.profile?.userId || 0,
        userAddress: selectedAddress?.value,
        isPWA: isAddedToHomeScreen,
      });
    } catch (err) {
      console.log('Error buying: ', err);
      onSetModalState(ManageCommunityStakeModalState.Failure);
    }
  };

  const handleSell = async () => {
    try {
      onSetModalState(ManageCommunityStakeModalState.Loading);

      const txReceipt = await sellStake({
        amount: numberOfStakeToExchange,
        stakeId: STAKE_ID,
        namespace: stakeData!.stake!.Community!.namespace!,
        chainRpc,
        walletAddress: selectedAddress?.value,
        ethChainId,
      });

      await createStakeTransaction.mutateAsync({
        transaction_hash: txReceipt.transactionHash,
        community_id: communityId,
      });

      onSetSuccessTransactionHash(txReceipt?.transactionHash);
      onSetModalState(ManageCommunityStakeModalState.Success);

      trackAnalytics({
        event: MixpanelCommunityStakeEvent.STAKE_SOLD,
        community: communityId,
        userId: user.activeAccount?.profile?.userId || 0,
        userAddress: selectedAddress?.value,
        isPWA: isAddedToHomeScreen,
      });
    } catch (err) {
      console.log('Error selling: ', err);
      onSetModalState(ManageCommunityStakeModalState.Failure);
    }
  };

  const handleClick = () => {
    isBuyMode ? handleBuy() : handleSell();
  };

  const handleMinus = () => {
    if (numberOfStakeToExchange === 0) {
      return;
    }

    onSetNumberOfStakeToExchange((prevState) => prevState - 1);
  };
  const handlePlus = () => {
    onSetNumberOfStakeToExchange((prevState) => prevState + 1);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericValue);
    if (parsed < 1000000) {
      onSetNumberOfStakeToExchange(parsed);
    } else if (inputValue === '') {
      onSetNumberOfStakeToExchange(0);
    }
  };

  const { openMagicWallet } = useAuthentication({});

  const insufficientFunds = isBuyMode
    ? // @ts-expect-error <StrictNullChecks/>
      parseFloat(userEthBalance) < parseFloat(buyPriceData?.totalPrice)
    : numberOfStakeToExchange > stakeBalance;

  const ctaDisabled = isBuyMode
    ? insufficientFunds || numberOfStakeToExchange <= 0 || !selectedAddress
    : numberOfStakeToExchange > stakeBalance;

  const isUsdPriceLoading = isBuyMode
    ? !buyPriceData || !ethUsdRate
    : !sellPriceData || !ethUsdRate;

  const pricePerUnitEth = isBuyMode
    ? buyPriceData?.price
    : sellPriceData?.price;

  const pricePerUnitUsd = isBuyMode
    ? // @ts-expect-error <StrictNullChecks/>
      convertTokenAmountToUsd(buyPriceData?.price, ethUsdRate)
    : // @ts-expect-error <StrictNullChecks/>
      convertTokenAmountToUsd(sellPriceData?.price, ethUsdRate);

  const feesPriceEth = isBuyMode
    ? buyPriceData?.fees
    : // @ts-expect-error <StrictNullChecks/>
      String(Math.abs(parseFloat(sellPriceData?.fees)));

  const feesPriceUsd = isBuyMode
    ? // @ts-expect-error <StrictNullChecks/>
      convertTokenAmountToUsd(buyPriceData?.fees, ethUsdRate)
    : convertTokenAmountToUsd(
        Math.abs(parseFloat(sellPriceData?.fees || '')),
        ethUsdRate || '',
      );

  const totalPriceEth = isBuyMode
    ? buyPriceData?.totalPrice
    : sellPriceData?.totalPrice;

  const totalPriceUsd = isBuyMode
    ? // @ts-expect-error <StrictNullChecks/>
      convertTokenAmountToUsd(buyPriceData?.totalPrice, ethUsdRate)
    : // @ts-expect-error <StrictNullChecks/>
      convertTokenAmountToUsd(sellPriceData?.totalPrice, ethUsdRate);

  const minusDisabled = numberOfStakeToExchange <= 1;

  const plusDisabled = isBuyMode
    ? false
    : numberOfStakeToExchange >= stakeBalance;

  return (
    <div className="StakeExchangeForm">
      <CWModalBody>
        <CWSelectList
          components={{
            // Option item in the dropdown
            Option: (originalProps) =>
              CustomAddressOption({
                originalProps,
                selectedAddressValue: activeAccountAddress,
              }),
          }}
          noOptionsMessage={() => 'No available Metamask address'}
          value={selectedAddress}
          formatOptionLabel={(option) => (
            // Selected option
            <CustomAddressOptionElement
              value={option.value}
              label={option.label}
              selectedAddressValue={activeAccountAddress}
            />
          )}
          label="Select address"
          isClearable={false}
          isSearchable={false}
          options={addressOptions}
          onChange={onSetSelectedAddress}
          saveToClipboard={saveToClipboard}
          showCopyIcon={true}
        />
        <div className="current-balance-row">
          <CWText type="caption">Current balance</CWText>
          <div className="balance-and-magic">
            {userEthBalanceLoading ? (
              <Skeleton className="price-skeleton" />
            ) : (
              <CWText
                type="caption"
                fontWeight="medium"
                className={clsx({ error: insufficientFunds })}
              >
                {/* @ts-expect-error StrictNullChecks*/}
                {capDecimals(userEthBalance)} {denomination}
              </CWText>
            )}
            {hasMagic && (
              <CWText
                className="wallet-btn"
                type="caption"
                onClick={() => {
                  openMagicWallet().catch(console.error);
                }}
              >
                Add Funds
              </CWText>
            )}
          </div>
        </div>
        <CWDivider />

        <div className="stake-valued-row">
          <div className="container">
            <CWText type="caption">You have {stakeBalance} stake</CWText>
            <CWText type="caption" className="valued">
              valued at
              <span className="denominationIcon">
                {findDenominationIcon(denomination)}
              </span>
              {capDecimals(String(stakeValue))} {denomination}
            </CWText>
          </div>
          <CWText type="caption" className="vote-weight">
            Current vote weight {currentVoteWeight?.toString()}
          </CWText>
        </div>

        <div className="exchange-stake-number-selector">
          <CWText type="caption" fontWeight="medium" className="header">
            You {mode}
          </CWText>
          <div className="stake-selector-row">
            <CWText type="b1" fontWeight="bold">
              Stake
            </CWText>

            <NumberSelector
              onMinusClick={handleMinus}
              minusDisabled={minusDisabled}
              onPlusClick={handlePlus}
              plusDisabled={plusDisabled}
              onInput={handleInput}
              value={numberOfStakeToExchange}
              inputClassName={clsx('number', {
                expanded: numberOfStakeToExchange?.toString?.()?.length > 3,
              })}
            />
          </div>
          <div className="price-per-unit-row">
            <CWText type="caption" className="label">
              Price per unit
            </CWText>
            {isUsdPriceLoading ? (
              <Skeleton className="price-skeleton" />
            ) : (
              <CWText type="caption" fontWeight="medium">
                {/* @ts-expect-error StrictNullChecks*/}
                {capDecimals(pricePerUnitEth)} {denomination}• ~$
                {pricePerUnitUsd} USD
              </CWText>
            )}
          </div>
        </div>

        {insufficientFunds && (
          <MessageRow
            statusMessage="Insufficient funds. Select an address with sufficient
            funds or add more funds to your wallet."
            validationStatus="failure"
            hasFeedback
          />
        )}

        <div className="total-weight-summary">
          <CWText type="b1" fontWeight="bold">
            Total weight
          </CWText>
          <CWText type="h3" fontWeight="bold" className="number">
            {expectedVoteWeight?.toString()}
          </CWText>
        </div>

        <div className="fees-row">
          <div className="left-side">
            <CWIconButton
              iconName="infoEmpty"
              buttonSize="sm"
              onMouseEnter={popoverProps.handleInteraction}
              onMouseLeave={popoverProps.handleInteraction}
            />
            <CWPopover
              placement={isMobile ? 'top' : 'left'}
              title={
                <>
                  Fees Explainer
                  {isMobile && (
                    <div className="close">
                      <CWIconButton
                        iconName="close"
                        buttonSize="sm"
                        onClick={popoverProps.handleInteraction}
                      />
                    </div>
                  )}
                </>
              }
              body={
                <div className="explanation-container">
                  <CWText type="b2">
                    {isBuyMode
                      ? 'When purchasing points, a 5% goes into a community treasury.'
                      : 'When transacting with Stake, a 5% fee goes into the community treasury'}
                  </CWText>
                  <CWText type="b2">
                    This treasury is used for various purposes, such as funding
                    community initiatives, projects, or rewarding top
                    contributors.
                  </CWText>
                  <CWText type="b2">Another 5% fee goes to Common.</CWText>
                  <CWText type="b2">Gas fees are also included here.</CWText>
                </div>
              }
              {...popoverProps}
            />
            <CWText type="caption">Fees</CWText>
          </div>
          {isUsdPriceLoading ? (
            <Skeleton className="price-skeleton" />
          ) : (
            <CWText type="caption" fontWeight="medium">
              {/* @ts-expect-error StrictNullChecks*/}
              {capDecimals(feesPriceEth)} {denomination}• ~$
              {feesPriceUsd} USD
            </CWText>
          )}
        </div>

        <div className="total-cost-row">
          <div className="left-side">
            <CWText type="caption">{isBuyMode ? 'Total cost' : 'Net'}</CWText>
          </div>
          {isUsdPriceLoading ? (
            <Skeleton className="price-skeleton" />
          ) : (
            <CWText type="caption" fontWeight="medium">
              {/* @ts-expect-error StrictNullChecks*/}
              {capDecimals(totalPriceEth)} {denomination}• ~$
              {totalPriceUsd} USD
            </CWText>
          )}
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          disabled={ctaDisabled}
          label={isBuyMode ? 'Buy stake' : 'Sell stake'}
          buttonType="secondary"
          buttonAlt={isBuyMode ? 'green' : 'rorange'}
          buttonWidth="full"
          onClick={handleClick}
        />
      </CWModalFooter>
    </div>
  );
};

export default StakeExchangeForm;
