import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';

import './ContestAlert.scss';

interface ContestAlertProps {
  title: string;
  description: string;
  iconName: IconName;
}

const ContestAlert = ({ title, description, iconName }: ContestAlertProps) => {
  return (
    <div className="ContestAlert">
      <CWIcon iconName={iconName} iconSize="large" />
      <div className="right-side">
        <CWText fontWeight="bold">{title}</CWText>
        <CWText>{description}</CWText>
      </div>
    </div>
  );
};

export default ContestAlert;
