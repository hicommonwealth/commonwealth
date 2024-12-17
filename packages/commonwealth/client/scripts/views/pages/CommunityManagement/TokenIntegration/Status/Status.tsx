import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import './Status.scss';

type StatusProps = {
  communityName: string;
  isEnabled: boolean;
  tokenName?: string;
};

const Status = ({ isEnabled, communityName, tokenName }: StatusProps) => {
  return (
    <section className="Status">
      {isEnabled && <CWIcon iconName="checkCircleFilled" iconSize="large" />}
      <CWText type="b1" fontWeight="semiBold">
        {isEnabled ? 'Token connected' : 'No token connected'}
      </CWText>
      <CWText className="description">
        {isEnabled
          ? `You have successfully integrated "${tokenName?.trim()}" token in "${communityName.trim()}".`
          : `You currently do not have token connected in "${communityName.trim()}"`}
      </CWText>
    </section>
  );
};

export default Status;
