import commonUrl from 'assets/img/branding/common.svg';
import { useAnimation } from 'hooks/useAnimation';
import React, { useState } from 'react';
import { CWCheckbox } from '../../component_kit/cw_checkbox';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import { HIDE_PROMPT } from '../constants';
import './AndroidPrompt.scss';

interface AndroidPromptProps {
  hidePromptAction: () => void;
  showPrompt: boolean;
  setShowPrompt: (showPrompt: boolean) => void;
}

export const AndroidPrompt = ({
  hidePromptAction,
  setShowPrompt,
}: AndroidPromptProps) => {
  const { animationStyles } = useAnimation({ transitionDuration: '.5s' });
  let installPromptEvent = null;
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(true);

  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    event.preventDefault();

    // @ts-expect-error StrictNullChecks
    installPromptEvent = event;
  });

  const handleInstallClick = () => {
    if (installPromptEvent) {
      // @ts-expect-error StrictNullChecks
      installPromptEvent.prompt();

      // Wait for the user to respond to the prompt
      // @ts-expect-error StrictNullChecks
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          // Hide after install prompt is accepted
          console.log('User accepted the install prompt');
          sessionStorage.setItem(HIDE_PROMPT, 'true');
          setShowPrompt(false);
        } else {
          // Hide after install prompt is dismissed
          sessionStorage.setItem(HIDE_PROMPT, 'true');
          setShowPrompt(false);
        }
      });
    } else {
      const manualStepsInstructionsEle =
        document.getElementById('manual-install');
      if (manualStepsInstructionsEle) {
        setTimeout(() => {
          manualStepsInstructionsEle.style.display = 'flex';
        }, 500);
      }
      setShowInstallButton(false);
    }
  };

  const handleCancelClick = () => {
    // Hide the prompt for the rest of the session
    sessionStorage.setItem(HIDE_PROMPT, 'true');
    setShowPrompt(false);
    // If the checkbox is checked, hide the prompt for N days
    if (checkboxChecked) {
      hidePromptAction();
    }
  };

  const handleCheckboxChange = (event) => {
    setCheckboxChecked(event.target.checked);
  };

  return (
    <div className="AndroidPrompt" style={animationStyles}>
      <div className="prompt-content">
        <CWText className="title">Install App</CWText>
        <div className="header">
          <div className="icon">
            <img src={commonUrl} alt="Commonwealth" />
          </div>
          <div className="app">
            <CWText className="app-name">Common</CWText>
            <CWText className="app-url">common.xyz</CWText>
          </div>
        </div>
        <CWText className="description">
          For the best mobile experience we recommend installing the Common
          web-app.
        </CWText>
        <CWText className="manual-install" id="manual-install" type="b2">
          Having issues? Try these steps to manually install:
          <CWText type="b2">
            1. Tap the 3 dots icon&nbsp;
            <CWIcon
              className="settings-icon"
              iconName="dotsThreeVertical"
              weight="bold"
            />
            &nbsp;in the top right bar.
          </CWText>
          <CWText type="b2">
            2. Select&nbsp;<span className="highlight">Add to Home Screen</span>{' '}
            or <span className="highlight">Install App</span>
          </CWText>
        </CWText>
        <CWCheckbox
          className="hide-prompt"
          label="Show less often"
          onChange={handleCheckboxChange}
        />
        <div className="button-container">
          <CWButton
            buttonType="tertiary"
            className="prompt-button"
            label="Cancel"
            onClick={handleCancelClick}
          />
          {showInstallButton && (
            <CWButton
              buttonType="tertiary"
              className="prompt-button"
              label="Install"
              onClick={handleInstallClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};
