import React from 'react';
import { isMobile } from 'react-device-detect';

import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import './FeeManagerBanner.scss';

interface FeeManagerBannerProps {
  feeManagerBalance?: string;
  isLoading: boolean;
}

const FeeManagerBanner = ({
  feeManagerBalance,
  isLoading,
}: FeeManagerBannerProps) => {
  const { setModeOfManageCommunityStakeModal } =
    useManageCommunityStakeModalStore();

  const popoverProps = usePopover();

  const handleBuyStakeClick = () => {
    setModeOfManageCommunityStakeModal('buy');
  };

  if (isLoading) {
    return <Skeleton className="FeeManagerBannerSkeleton" />;
  }

  return (
    <div className="FeeManagerBanner">
      <div className="left-side">
        <div className="popover-row">
          <CWText className="info-stake">
            Stake fee manager total balance
            <CWIconButton
              iconName="infoEmpty"
              buttonSize="sm"
              onMouseEnter={popoverProps.handleInteraction}
              onMouseLeave={popoverProps.handleInteraction}
            />
          </CWText>

          <CWPopover
            title={
              <>
                Stake fee explainer
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
              <CWText type="b2">
                This balance is derived from the fees associated with Community
                Stake purchases. When a community member purchases Stake, a
                portion of the proceeds are added to the Fee Manager which is
                used to fund contests.
              </CWText>
            }
            {...popoverProps}
          />
        </div>
        <CWText fontWeight="bold">{feeManagerBalance} ETH</CWText>
      </div>
      <div className="right-side">
        <CWButton
          label="Buy stake"
          buttonHeight="sm"
          onClick={handleBuyStakeClick}
          buttonType="secondary"
          buttonAlt="green"
        />
      </div>
    </div>
  );
};

export default FeeManagerBanner;
