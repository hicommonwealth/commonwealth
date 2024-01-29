import React from 'react';
import { isMobile } from 'react-device-detect';

import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import './VoteWeightModule.scss';

type VoteWeightModuleProps = {
  voteWeight: number;
  stakeNumber: number;
  stakeValue: number;
  denomination: string;
};

export const VoteWeightModule = ({
  voteWeight,
  stakeNumber,
  stakeValue,
  denomination,
}: VoteWeightModuleProps) => {
  const popoverProps = usePopover();

  return (
    <div className="VoteWeightModule">
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
              Your vote weight is based on membership and the amount of Stake
              you have in your wallet.
            </CWText>

            <CWText type="b2">
              Each member of this community gets 1 vote for joining.
            </CWText>

            <CWText type="b2">
              All other vote weight is provided by the amount of stake in your
              wallet, and the vote weight provided per stake by the
              community&apos;s stake contract.
            </CWText>
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};
