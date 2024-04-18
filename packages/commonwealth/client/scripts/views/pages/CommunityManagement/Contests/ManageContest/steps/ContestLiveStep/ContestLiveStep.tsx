import React from 'react';

import { useAnimation } from 'hooks/useAnimation';
import { useCommonNavigate } from 'navigation/helpers';
import { saveToClipboard } from 'utils/clipboard';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import './ContestLiveStep.scss';

const ContestLiveStep = () => {
  const navigate = useCommonNavigate();
  const { animationStyles } = useAnimation();

  const createdContestAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';

  const handleCopyLink = async () => {
    await saveToClipboard(createdContestAddress, true);
  };

  return (
    <CWPageLayout>
      <div className="ContestLiveStep" style={animationStyles}>
        <img src="/static/img/contestSuccess.png" alt="" className="img" />
        <CWText type="h4">Your contest is live!</CWText>
        <div className="content-container" style={animationStyles}>
          <CWText type="b1" className="description">
            Your contest is now active at the address below. You can now add
            funds to the contest at any time.
          </CWText>
          <div className="copy-address-input">
            <CWText type="b2" className="address" fontWeight="medium">
              {createdContestAddress}
            </CWText>
            <CWIconButton
              iconName="copyNew"
              buttonSize="med"
              onClick={handleCopyLink}
            />
          </div>
          <div className="buttons">
            <CWButton
              containerClassName="cta-btn"
              label="Add funds to contest"
              buttonType="secondary"
              onClick={() => {
                console.log('open drawer');
              }}
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
  );
};

export default ContestLiveStep;
