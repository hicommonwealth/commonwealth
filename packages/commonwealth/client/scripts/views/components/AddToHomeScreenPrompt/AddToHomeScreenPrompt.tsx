import React, { useEffect, useState } from 'react';
import { CWCheckbox } from '../component_kit/cw_checkbox';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/cw_button';
import './AddToHomeScreenPrompt.scss';

interface AddToHomeScreenPromptProps {
  isIOS: boolean;
  isAndroid: boolean;
}

export const AddToHomeScreenPrompt = ({
  isIOS,
  isAndroid,
}: AddToHomeScreenPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  useEffect(() => {
    const hidePromptTime = localStorage.getItem('hidePromptTime');
    if (hidePromptTime && new Date().getTime() < Number(hidePromptTime)) {
      setShowPrompt(false);
    }

    if (sessionStorage.getItem('hidePrompt')) {
      setShowPrompt(false);
    }
  }, []);

  const hidePromptForNDays = () => {
    const maxDays = 30;

    let n = Number(localStorage.getItem('hidePromptDays')) || 1;
    n = n * 2 > maxDays ? maxDays : n * 2;
    const hideUntil = new Date().getTime() + n * 24 * 60 * 60 * 1000;
    localStorage.setItem('hidePromptTime', hideUntil.toString());
    localStorage.setItem('hidePromptDays', n.toString());
    setShowPrompt(false);
  };

  const iosPrompt = () => {
    return (
      <div className="ios-home-screen-prompt">
        <div className="prompt-content">
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
              1. Tap the share{' '}
              <CWIcon className="share-icon" iconName="export" /> icon below
            </CWText>
            <CWText className="instruction">
              2. Select <span className="highlight">Add to Home Screen</span>
            </CWText>
          </div>
          <CWButton
            buttonType="tertiary"
            label="Show less often"
            containerClassName="hide-prompt"
            onClick={() => hidePromptForNDays()}
          />
        </div>
      </div>
    );
  };

  const androidPrompt = () => {
    let installPromptEvent = null;

    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      event.preventDefault();

      installPromptEvent = event;
    });

    const handleInstallClick = () => {
      installPromptEvent.prompt();

      // Wait for the user to respond to the prompt
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
      });
    };

    const handleCancelClick = () => {
      // Hide the prompt for the rest of the session
      sessionStorage.setItem('hidePrompt', 'true');
      setShowPrompt(false);
      // If the checkbox is checked, hide the prompt for N days
      if (checkboxChecked) {
        hidePromptForNDays();
      }
    };

    const handleCheckboxChange = (event) => {
      setCheckboxChecked(event.target.checked);
    };

    return (
      <div className="android-home-screen-prompt">
        <div className="prompt-content">
          <CWText className="title">Install App</CWText>
          <div className="header">
            <div className="icon">
              <img src="/static/img/branding/common.svg" alt="Commonwealth" />
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
            <CWButton
              buttonType="tertiary"
              className="prompt-button"
              label="Install"
              onClick={handleInstallClick}
            />
          </div>
        </div>
      </div>
    );
  };

  return showPrompt
    ? isIOS
      ? iosPrompt()
      : isAndroid
      ? androidPrompt()
      : null
    : null;
};
