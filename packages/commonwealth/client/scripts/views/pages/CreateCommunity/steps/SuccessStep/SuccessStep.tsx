import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './SuccessStep.scss';

const SuccessStep = () => {
  return (
    <div className="SuccessStep">
      <img src="../../static/img/communityIslive.png" alt="" className="img" />
      <CWText type="h2">Your community is live!</CWText>
      <CWText type="b1" className="description">
        Your community is now live and discoverable on Common. You can now use
        the admin panel to change settings and create topics for discussion.
      </CWText>
      <CWButton
        buttonWidth="wide"
        label="Go to community"
        containerClassName="cta-btn"
        className="w-full"
      />
    </div>
  );
};

export default SuccessStep;
