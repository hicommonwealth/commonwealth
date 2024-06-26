import React from 'react';
import { isMobile } from 'react-device-detect';

import useGetFeeManagerBalanceQuery from 'state/api/communityStake/getFeeManagerBalance';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { Skeleton } from 'views/components/Skeleton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import './FeeManagerBanner.scss';

interface FeeManagerBannerProps {
  ethChainId: number;
  namespace: string;
}

const FeeManagerBanner = ({ ethChainId, namespace }: FeeManagerBannerProps) => {
  const { setModeOfManageCommunityStakeModal } =
    useManageCommunityStakeModalStore();

  const { data: feeManagerBalance, isLoading: isFeeManagerBalanceLoading } =
    useGetFeeManagerBalanceQuery({
      ethChainId: ethChainId,
      namespace,
      apiEnabled: !!ethChainId,
    });

  const popoverProps = usePopover();

  const handleBuyStakeClick = async () => {
    setModeOfManageCommunityStakeModal('buy');
  };

  if (isFeeManagerBalanceLoading) {
    return <Skeleton className="FeeManagerBannerSkeleton" />;
  }

  return (
    <div className="FeeManagerBanner">
      <div className="left-side">
        <div className="header">
          <CWIcon iconName="trophy" iconSize="regular" />
          <CWText type="caption">Buy stake to fund contests!</CWText>
        </div>
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
