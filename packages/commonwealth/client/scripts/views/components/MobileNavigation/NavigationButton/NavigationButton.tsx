import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { typeToIconAndName } from './utils';

import './NavigationButton.scss';

export interface NavigationButtonProps {
  type: 'home' | 'create' | 'explore' | 'notifications';
  selected: boolean;
  onClick: () => void;
}

const NavigationButton = ({
  type,
  selected,
  onClick,
}: NavigationButtonProps) => {
  const [icon, text] = typeToIconAndName(type);

  return (
    <div className="NavigationButton" onClick={onClick}>
      <CWIcon iconName={icon} {...(selected && { weight: 'fill' })} />
      <CWText>{text}</CWText>
    </div>
  );
};

export default NavigationButton;
