import { useAnimation } from 'hooks/useAnimation';
import React from 'react';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './IOSPrompt.scss';

interface IOSPromptProps {
  hidePromptAction: () => void;
  showPrompt: boolean;
  setShowPrompt: (showPrompt: boolean) => void;
}

export const IOSPrompt = ({ hidePromptAction }: IOSPromptProps) => {
  const { animationStyles } = useAnimation({
    transitionDuration: '0.5s',
  });
  return (
    <div className="IOSPrompt">
      <div className="prompt-content" style={animationStyles}>
        <div className="header">
          <div className="icon">
            <img src="/static/img/branding/common.svg" alt="Commonwealth" />
          </div>
          <CWText className="title">Add to Home Screen</CWText>
        </div>
        <CWText className="description">
          For the best mobile experience we recommend installing the Common
          web-app.
        </CWText>
        <div className="instructions">
          <CWText className="instruction">
            1. Tap the share <CWIcon className="share-icon" iconName="export" />{' '}
            icon
          </CWText>
          <CWText className="instruction">
            2. Select <span className="highlight">Add to Home Screen</span>
          </CWText>
        </div>
        <CWButton
          buttonType="tertiary"
          label="Show less often"
          containerClassName="hide-prompt"
          onClick={() => hidePromptAction()}
        />
      </div>
    </div>
  );
};
