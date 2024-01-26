import React from 'react';
import { isMobile } from 'react-device-detect';

import { CWText } from '../../cw_text';
import { ComponentType } from '../../types';
import CWIconButton from '../CWIconButton';
import CWPopover, { usePopover } from '../CWPopover';
import { CWButton } from '../cw_button';

import './CWVoteWeightModule.scss';

type VoteWeightModuleProps = {
  voteWeight: number;
  stakeNumber: number;
  stakeValue: number;
  denomination: string;
};

export const CWVoteWeightModule = ({
  voteWeight,
  stakeNumber,
  stakeValue,
  denomination,
}: VoteWeightModuleProps) => {
  const popoverProps = usePopover();

  return (
    <div className={ComponentType.VoteWeightModule}>
      <div className="content">
        <div className="title-container">
          <CWText type="caption" fontWeight="uppercase">
            Vote Weight
          </CWText>
          <CWIconButton
            iconName="infoEmpty"
            buttonSize="sm"
            onMouseEnter={popoverProps.handleInteraction}
            onMouseLeave={popoverProps.handleInteraction}
          />
        </div>
        <CWText className="vote-weight" type="h3" fontWeight="bold">
          {voteWeight}
        </CWText>
        <div className="info-and-actions">
          <div className="info">
            <CWText type="caption" className="stake-num">
              You have {stakeNumber} stake
            </CWText>
            <CWText type="caption" className="stake-value">
              valued at {stakeValue} {denomination}
            </CWText>
          </div>
          {stakeNumber >= 1 ? (
            <div className="actions">
              <CWButton
                label="Buy stake"
                buttonType="secondary"
                buttonAlt="green"
                buttonHeight="sm"
                buttonWidth="full"
              />
              <CWButton
                label="Sell stake"
                buttonType="secondary"
                buttonAlt="rorange"
                buttonHeight="sm"
                buttonWidth="full"
              />
            </div>
          ) : (
            <div className="action">
              <CWButton
                label="Buy stake"
                buttonType="secondary"
                buttonAlt="green"
                buttonHeight="sm"
                buttonWidth="full"
              />
            </div>
          )}
        </div>
      </div>

      <CWPopover
        title={
          <>
            Vote Weight Explainer
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
              egestas sem non laoreet suscipit.
            </CWText>

            <CWText type="b2">
              Aenean commodo id nisi vitae elementum. Ut imperdiet nibh id elit
              facilisis hendrerit.
            </CWText>

            <CWText type="b2">
              Donec a sagittis arcu. Phasellus at auctor arcu.
            </CWText>
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};
