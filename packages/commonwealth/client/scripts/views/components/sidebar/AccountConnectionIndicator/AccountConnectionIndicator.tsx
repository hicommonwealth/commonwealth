import { CWText } from 'views/components/component_kit/cw_text';
import clsx from 'clsx';
import React from 'react';
import { CWIdentificationTag } from 'views/components/component_kit/new_designs/CWIdentificationTag';

import './AccountConnectionIndicator.scss';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

interface AccountConnectionIndicatorProps {
  connected: boolean;
}

const AccountConnectionIndicator = ({
  connected,
}: AccountConnectionIndicatorProps) => {
  const handleJoinCommunity = () => {
    console.log('join community click!');
  };

  return (
    <div className="AccountConnectionIndicator">
      <CWText fontWeight="medium" type="caption" className="status-text">
        {connected ? 'Connected' : 'Not connected'}
      </CWText>
      <div className="status-row">
        <div className={clsx('status-light', { connected })} />
        <CWIdentificationTag
          iconLeft="twitterIcon"
          address="0xc4ED43a303E3ADFA0aa9711f12285C910a1D3499"
        />
      </div>
      <div className="status-button">
        <CWButton
          {...(connected ? { iconLeft: 'checkCircleFilled' } : {})}
          buttonHeight="sm"
          buttonWidth="full"
          label={connected ? 'Joined' : 'Join community'}
          disabled={connected}
          onClick={handleJoinCommunity}
        />
      </div>
    </div>
  );
};

export default AccountConnectionIndicator;
