import React from 'react';

import tokenCommunityIsLiveImg from 'assets/img/tokenCommunityIsLive.png';
import { useAnimation } from 'hooks/useAnimation';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import './SuccessStep.scss';

interface SuccessStepProps {
  communityId: string;
  withToken: boolean;
}

const SuccessStep = ({ communityId, withToken }: SuccessStepProps) => {
  const navigate = useCommonNavigate();
  const { animationStyles } = useAnimation();

  return (
    <div className="SuccessStep" style={animationStyles}>
      <img src={tokenCommunityIsLiveImg} alt="" className="img" />
      <CWText type="h2">
        Your {withToken ? 'token and' : ''} community is live!
      </CWText>
      <div className="container" style={animationStyles}>
        <CWText type="b1" className="description">
          Your {withToken ? 'token and' : ''} community is now live and
          discoverable on Common. You can now use the admin panel to change
          settings and create topics for discussion.
        </CWText>
        <CWButton
          buttonWidth="wide"
          label="Go to community"
          containerClassName="cta-btn"
          className="w-full"
          onClick={() => {
            navigateToCommunity({ navigate, path: '', chain: communityId });
          }}
        />
      </div>
    </div>
  );
};

export default SuccessStep;
