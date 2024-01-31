import clsx from 'clsx';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

import { STAKE_ID } from '@hicommonwealth/chains';
import { calculateVoteWeight } from '@hicommonwealth/chains/src/commonProtocol/utils';
import app from 'state';
import { useBuyStakeMutation } from 'state/api/communityStake';
import { useCommunityStake } from 'views/components/CommunityStake';
import { Skeleton } from 'views/components/Skeleton';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleButton from 'views/components/component_kit/new_designs/CWCircleButton';
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
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import { fakeRandomAPICall } from '../ManageCommunityStakeModal';
import {
  ManageCommunityStakeModalMode,
  ManageCommunityStakeModalState,
} from '../types';
import useStakeExchange from '../useStakeExchange';
import { convertEthToUsd, getInitialAccountValue } from '../utils';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from './CustomAddressOption';

import './StakeExchangeForm.scss';

interface StakeExchangeFormProps {
  mode: ManageCommunityStakeModalMode;
  onSetModalState: (modalState: ManageCommunityStakeModalState) => void;
  onSetSuccessTransactionHash: (hash: string) => void;
}

const StakeExchangeForm = ({
  mode,
  onSetModalState,
  onSetSuccessTransactionHash,
}: StakeExchangeFormProps) => {
  const chainRpc = app?.chain?.meta?.ChainNode?.url;
  const activeAccountAddress = app?.user?.activeAccount?.address;
  const addressOptions = app.user.activeAccounts.map(({ address }) => ({
    label: address,
    value: address,
  }));

  const [selectedAddress, setSelectedAddress] = useState(
    getInitialAccountValue(activeAccountAddress, addressOptions),
  );

  const {
    numberOfStakeToExchange,
    setNumberOfStakeToExchange,
    buyPriceData,
    ethUsdRate,
    userEthBalance,
  } = useStakeExchange({ mode, address: selectedAddress.value });

  const { stakeBalance, stakeValue, currentVoteWeight, stakeData } =
    useCommunityStake({ walletAddress: selectedAddress.value });

  const { mutateAsync: buyStake } = useBuyStakeMutation();

  const expectedVoteWeight = calculateVoteWeight(
    String(numberOfStakeToExchange),
    stakeData?.vote_weight,
  );

  const popoverProps = usePopover();

  const isBuyMode = mode === 'buy';

  const handleBuy = async () => {
    try {
      onSetModalState(ManageCommunityStakeModalState.Loading);
      const txReceipt = await buyStake({
        amount: numberOfStakeToExchange,
        stakeId: STAKE_ID,
        namespace: stakeData?.Chain?.namespace,
        chainRpc,
        walletAddress: selectedAddress.value,
      });

      onSetModalState(ManageCommunityStakeModalState.Success);
      onSetSuccessTransactionHash(txReceipt?.transactionHash);
    } catch (err) {
      console.log('Error buying: ', err);
      onSetModalState(ManageCommunityStakeModalState.Failure);
    }
  };

  const handleSell = async () => {
    try {
      onSetModalState(ManageCommunityStakeModalState.Loading);
      await fakeRandomAPICall();
      onSetModalState(ManageCommunityStakeModalState.Success);
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

    setNumberOfStakeToExchange((prevState) => prevState - 1);
  };
  const handlePlus = () => {
    setNumberOfStakeToExchange((prevState) => prevState + 1);
  };

  const insufficientFunds =
    parseFloat(userEthBalance) < parseFloat(buyPriceData?.totalPrice);
  const buyingDisabled =
    isBuyMode && (insufficientFunds || numberOfStakeToExchange === 0);

  const isUsdPriceLoading = !buyPriceData || !ethUsdRate;

  return (
    <div className="StakeExchangeForm">
      <CWModalBody>
        <CWSelectList
          components={{
            // Option item in the dropdown
            Option: (originalProps) =>
              CustomAddressOption({ originalProps, selectedAddress }),
          }}
          value={selectedAddress}
          formatOptionLabel={(option) => (
            // Selected option
            <CustomAddressOptionElement
              value={option.value}
              label={option.label}
              selectedAddressValue={selectedAddress.value}
            />
          )}
          label="Select address"
          isClearable={false}
          isSearchable={false}
          options={addressOptions}
          onChange={setSelectedAddress}
        />

        <div className="current-balance-row">
          <CWText type="caption">Current balance</CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className={clsx({ error: insufficientFunds })}
          >
            {userEthBalance} ETH
          </CWText>
        </div>

        <CWDivider />

        <div className="stake-valued-row">
          <CWText type="caption">You have {stakeBalance} stake</CWText>
          <CWText type="caption" className="valued">
            valued at {stakeValue} ETH
          </CWText>
          <CWText type="caption" className="vote-weight">
            Current vote weight {currentVoteWeight}
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
            <div className="stake-selector">
              <CWCircleButton
                buttonType="secondary"
                iconName="minus"
                onClick={handleMinus}
                disabled={numberOfStakeToExchange === 0}
              />
              <CWText type="h3" fontWeight="bold" className="number">
                {numberOfStakeToExchange}
              </CWText>
              <CWCircleButton
                buttonType="secondary"
                iconName="plus"
                onClick={handlePlus}
              />
            </div>
          </div>
          <div className="price-per-unit-row">
            <CWText type="caption" className="label">
              Price per unit
            </CWText>
            {isUsdPriceLoading ? (
              <Skeleton className="price-skeleton" />
            ) : (
              <CWText type="caption" fontWeight="medium">
                {buyPriceData?.price} ETH • ~$
                {convertEthToUsd(buyPriceData?.price, ethUsdRate)} USD
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
            {expectedVoteWeight}
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
                    When purchasing points, a 5% goes into a community treasury.
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
              {buyPriceData?.fees} ETH • ~$
              {convertEthToUsd(buyPriceData?.fees, ethUsdRate)} USD
            </CWText>
          )}
        </div>

        <div className="total-cost-row">
          <CWText type="caption">{isBuyMode ? 'Total cost' : 'Net'}</CWText>
          {isUsdPriceLoading ? (
            <Skeleton className="price-skeleton" />
          ) : (
            <CWText type="caption" fontWeight="medium">
              {buyPriceData?.totalPrice} ETH • ~$
              {convertEthToUsd(buyPriceData?.totalPrice, ethUsdRate)} USD
            </CWText>
          )}
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          disabled={buyingDisabled}
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
