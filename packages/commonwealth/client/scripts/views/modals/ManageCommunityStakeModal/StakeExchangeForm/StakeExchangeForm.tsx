import clsx from 'clsx';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

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
import { convertEthToUsd } from '../utils';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from './CustomAddressOption';

import './StakeExchangeForm.scss';

interface StakeExchangeFormProps {
  mode: ManageCommunityStakeModalMode;
  setModalState: (modalState: ManageCommunityStakeModalState) => void;
}

const StakeExchangeForm = ({ mode, setModalState }: StakeExchangeFormProps) => {
  const [selectedAddress, setSelectedAddress] = useState({
    value: '0xeRh',
    label: '0xeRh',
  });

  const {
    numberOfStakeToExchange,
    setNumberOfStakeToExchange,
    buyPriceData,
    ethUsdRate,
  } = useStakeExchange({ mode });

  // create new hook rather than using useCommunityStake
  const { stakeBalance, stakeValue, voteWeight } = useCommunityStake();

  const popoverProps = usePopover();

  const isBuyMode = mode === 'buy';

  const handleBuy = async () => {
    try {
      setModalState(ManageCommunityStakeModalState.Loading);
      await fakeRandomAPICall();
      setModalState(ManageCommunityStakeModalState.Success);
    } catch (err) {
      console.log('Error buying: ', err);
      setModalState(ManageCommunityStakeModalState.Failure);
    }
  };

  const handleSell = async () => {
    try {
      setModalState(ManageCommunityStakeModalState.Loading);
      await fakeRandomAPICall();
      setModalState(ManageCommunityStakeModalState.Success);
    } catch (err) {
      console.log('Error selling: ', err);
      setModalState(ManageCommunityStakeModalState.Failure);
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

  // TODO this should be dynamic
  const insufficientFunds = isBuyMode && false;

  const isUsdPriceLoading = !buyPriceData?.price || !ethUsdRate;

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
          options={[
            { value: '0xeRh', label: '0xeRh' },
            { value: '0xaBc', label: '0xaBc' },
            { value: 'eRhWN', label: 'eRhWN' },
          ]}
          onChange={(newValue) => {
            console.log('selected value is: ', newValue.label);
            setSelectedAddress(newValue);
          }}
        />

        <div className="current-balance-row">
          <CWText type="caption">Current balance</CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className={clsx({ error: insufficientFunds })}
          >
            5.642 ETH
          </CWText>
        </div>

        <CWDivider />

        <div className="stake-valued-row">
          <CWText type="caption">You have {stakeBalance} stake</CWText>
          <CWText type="caption" className="valued">
            valued at {stakeValue} ETH
          </CWText>
          <CWText type="caption" className="vote-weight">
            Current vote weight {voteWeight}
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
            50
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
          <CWText type="caption" fontWeight="medium">
            0.001 ETH • ~$1.75 USD
          </CWText>
        </div>

        <div className="total-cost-row">
          <CWText type="caption">{isBuyMode ? 'Total cost' : 'Net'}</CWText>
          <CWText type="caption" fontWeight="medium">
            0.036 ETH • ~$25.00 USD
          </CWText>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          disabled={insufficientFunds}
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
