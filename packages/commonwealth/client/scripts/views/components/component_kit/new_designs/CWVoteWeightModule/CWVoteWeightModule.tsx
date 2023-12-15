import React from 'react';
// import { CWIcon } from '../../cw_icons/cw_icon';
import useBrowserWindow from '../../../../../hooks/useBrowserWindow';
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
  const { isWindowSmallInclusive } = useBrowserWindow({});

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
            onClick={popoverProps.handleInteraction}
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
          {stakeNumber > 1 ? (
            <div className="actions">
              <CWButton
                label="Buy stake"
                buttonType="secondary"
                buttonAlt="green"
                buttonHeight="sm"
                buttonWidth="narrow"
              />
              <CWButton
                label="Sell stake"
                buttonType="secondary"
                buttonAlt="rorange"
                buttonHeight="sm"
                buttonWidth="narrow"
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
        content={
          <div>
            {' '}
            <CWText type="caption" fontWeight="uppercase">
              Vote Weight Explainer
            </CWText>
            {isWindowSmallInclusive && (
              <div className="close">
                <CWIconButton
                  iconName="close"
                  buttonSize="sm"
                  onClick={() => {
                    console.log('hello!');
                  }}
                />
              </div>
            )}
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};
