import React, { useState } from 'react';

import { useAnimation } from 'hooks/useAnimation';
import { useCommonNavigate } from 'navigation/helpers';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import CopyAddressInput from '../../../CopyAddressInput';
import FundContestDrawer from '../../../FundContestDrawer';

import './ContestLiveStep.scss';

const ContestLiveStep = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigate = useCommonNavigate();
  const { animationStyles } = useAnimation();

  const createdContestAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';

  return (
    <>
      <CWPageLayout>
        <div className="ContestLiveStep" style={animationStyles}>
          <img src="/static/img/contestSuccess.png" alt="" className="img" />
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
              <CWButton
                containerClassName="cta-btn"
                label="Go to contests"
                onClick={() => navigate('/manage/contests')}
              />
            </div>
          </div>
        </div>
      </CWPageLayout>
      <FundContestDrawer
        // TODO reset state on close
        //  this below works but breaks slide animation
        // key={Number(isDrawerOpen)}
        onClose={() => setIsDrawerOpen(false)}
        isOpen={isDrawerOpen}
        contestAddress={createdContestAddress}
      />
    </>
  );
};

export default ContestLiveStep;
