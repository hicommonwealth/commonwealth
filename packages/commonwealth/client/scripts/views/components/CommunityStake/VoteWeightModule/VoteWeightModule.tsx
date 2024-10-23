import { findDenominationIcon } from 'helpers/findDenomination';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
import { capDecimals } from 'views/modals/ManageCommunityStakeModal/utils';

import { disabledStakeButtonTooltipText } from 'helpers/tooltipTexts';
import app from 'state';
import useUserStore from 'state/ui/user';
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import './VoteWeightModule.scss';

type VoteWeightModuleProps = {
  voteWeight: string;
  stakeNumber: number;
  stakeValue: number;
  denomination: string;
  onOpenStakeModal: (modalMode: ManageCommunityStakeModalMode) => void;
};

export const VoteWeightModule = ({
  voteWeight,
  stakeNumber,
  stakeValue,
  denomination,
  onOpenStakeModal,
}: VoteWeightModuleProps) => {
  const user = useUserStore();

  // allow user to buy stake if they have a connected address that matches active community base chain
  const canBuyStake = !!user.addresses.find?.(
    (address) => address?.community?.base === app?.chain?.base,
  );

  const popoverProps = usePopover();

  const handleBuyStakeClick = async () => {
    onOpenStakeModal('buy');
  };

  const buyButton = (
    <CWButton
      label="Buy stake"
      buttonType="secondary"
      buttonAlt="green"
      buttonHeight="sm"
      buttonWidth="full"
      disabled={!canBuyStake}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={handleBuyStakeClick}
    />
  );

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
              You have {stakeNumber || 0} stake
            </CWText>
            <CWText type="caption" className="stake-value">
              valued at
              <span className="denominationIcon">
                {findDenominationIcon(denomination)}
              </span>
              {capDecimals(String(stakeValue))} {denomination}
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
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleBuyStakeClick}
              />
              <CWButton
                label="Sell stake"
                buttonType="secondary"
                buttonAlt="rorange"
                buttonHeight="sm"
                buttonWidth="full"
                onClick={() => onOpenStakeModal('sell')}
              />
            </div>
          ) : (
            <div className="action">
              {canBuyStake ? (
                buyButton
              ) : (
                <CWTooltip
                  placement="right"
                  content={disabledStakeButtonTooltipText({
                    connectBaseChainToBuy: app?.chain?.base,
                  })}
                  renderTrigger={(handleInteraction) => (
                    <span
                      className="w-full"
                      onMouseEnter={handleInteraction}
                      onMouseLeave={handleInteraction}
                    >
                      {buyButton}
                    </span>
                  )}
                />
              )}
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
