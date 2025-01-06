import React, { useState } from 'react';

import { useAnimation } from 'hooks/useAnimation';
import { useCommonNavigate } from 'navigation/helpers';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import CopyAddressInput from '../../../CopyAddressInput';
import FundContestDrawer from '../../../FundContestDrawer';

import contestSuccess from 'assets/img/contestSuccess.png';
import { copyFarcasterContestFrameUrl } from '../../../utils';
import './ContestLiveStep.scss';

interface ContestLiveStepProps {
  createdContestAddress: string;
  isFarcasterContest: boolean;
  fundingTokenTicker: string;
  fundingTokenAddress: string;
}

const ContestLiveStep = ({
  createdContestAddress,
  isFarcasterContest,
  fundingTokenTicker,
  fundingTokenAddress,
}: ContestLiveStepProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigate = useCommonNavigate();
  const { animationStyles } = useAnimation();

  return (
    <>
      <CWPageLayout>
        <div className="ContestLiveStep" style={animationStyles}>
          <img src={contestSuccess} alt="" className="img" />
          <CWText type="h4">Your contest is live!</CWText>
          <div className="content-container" style={animationStyles}>
            <CWText type="b1" className="description">
              Your contest is now active at the address below. You can now add
              funds to the contest at any time.
            </CWText>

            <CopyAddressInput address={createdContestAddress} />

            <div className="buttons">
              <CWButton
                containerClassName="cta-btn"
                label="Add funds to contest"
                buttonType="secondary"
                onClick={() => setIsDrawerOpen(true)}
              />
              {isFarcasterContest && (
                <CWButton
                  containerClassName="cta-btn"
                  label="Copy Farcaster Frame"
                  onClick={() => {
                    copyFarcasterContestFrameUrl(createdContestAddress).catch(
                      console.log,
                    );
                  }}
                />
              )}
              <CWButton
                buttonType={isFarcasterContest ? 'tertiary' : 'primary'}
                containerClassName="cta-btn"
                label="Go to contests list"
                onClick={() => navigate('/manage/contests')}
              />
            </div>
          </div>
        </div>
      </CWPageLayout>
      <FundContestDrawer
        onClose={() => setIsDrawerOpen(false)}
        isOpen={isDrawerOpen}
        contestAddress={createdContestAddress}
        fundingTokenTicker={fundingTokenTicker}
        fundingTokenAddress={fundingTokenAddress}
      />
    </>
  );
};

export default ContestLiveStep;
