import React from 'react';

import { useAnimation } from 'hooks/useAnimation';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import './SuccessStep.scss';

interface SuccessStepProps {
  communityId: string;
}

const SuccessStep = ({ communityId }: SuccessStepProps) => {
  const navigate = useCommonNavigate();
  const { animationStyles } = useAnimation();

  return (
    <div className="SuccessStep" style={animationStyles}>
      <img src="/static/img/communityIsLive.png" alt="" className="img" />
      <CWText type="h2">Your community is live!</CWText>
      <div className="container" style={animationStyles}>
        <CWText type="b1" className="description">
          Your community is now live and discoverable on Common. You can now use
          the admin panel to change settings and create topics for discussion.
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
