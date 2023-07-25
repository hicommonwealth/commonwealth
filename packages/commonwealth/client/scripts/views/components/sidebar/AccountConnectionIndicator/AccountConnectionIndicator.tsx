import { CWText } from 'views/components/component_kit/cw_text';
import clsx from 'clsx';
import React from 'react';
import { CWIdentificationTag } from 'views/components/component_kit/new_designs/CWIdentificationTag';

import './AccountConnectionIndicator.scss';

interface AccountConnectionIndicatorProps {
  connected: boolean;
}

const AccountConnectionIndicator = ({
  connected,
}: AccountConnectionIndicatorProps) => {
  return (
    <div className="AccountConnectionIndicator">
      <CWText fontWeight="medium" type="caption" className="status-text">
        {connected ? 'Connected' : 'Not connected'}
      </CWText>
      <div className="status-row">
        <div className={clsx('status-light', { connected })} />
        <div className="status-address">
          <CWIdentificationTag
            iconLeft="twitter"
            iconRight
            username="twitterHandlerName"
            address="0xc4ED43a303E3ADFA0aa9711f12285C910a1D3499"
          />
        </div>
      </div>
    </div>
  );
};

export default AccountConnectionIndicator;
