import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import './Status.scss';

interface StatusProps {
  isEnabled: boolean;
  communityName: string;
}

const Status = ({ isEnabled, communityName }: StatusProps) => {
  return (
    <section className="Status">
      {isEnabled && <CWIcon iconName="checkCircleFilled" iconSize="large" />}
      <CWText type="b1" fontWeight="semiBold">
        {isEnabled ? 'Stake added' : 'Stake not enabled'}
      </CWText>
      <CWText className="description">
        {isEnabled
          ? `You have successfully integrated stake to ${communityName.trim()}.`
          : `You currently do not have stake in ${communityName.trim()}`}
      </CWText>
    </section>
  );
};

export default Status;
