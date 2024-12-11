import React from 'react';

import { SUPPORTED_LANGUAGES } from 'state/ui/language/constants';
import { languageStore } from 'state/ui/language/language';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { typeToIconAndName } from './utils';

import './NavigationButton.scss';

export interface NavigationButtonProps {
  type: 'home' | 'create' | 'explore' | 'notifications' | 'language';
  selected: boolean;
  onClick: () => void;
}

const NavigationButton = ({
  type,
  selected,
  onClick,
}: NavigationButtonProps) => {
  const [icon, text] = typeToIconAndName(type);
  const currentLanguage = languageStore.getState().currentLanguage;

  return (
    <div className="NavigationButton" onClick={onClick}>
      {type === 'language' ? (
        <span className="language-flag">
          {SUPPORTED_LANGUAGES[currentLanguage].flag}
        </span>
      ) : (
        <CWIcon iconName={icon} {...(selected && { weight: 'fill' })} />
      )}
      <CWText>{text}</CWText>
    </div>
  );
};

export default NavigationButton;
