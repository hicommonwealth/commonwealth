import React, { useEffect, useState } from 'react';
import { CWShareIcon } from '../component_kit/cw_icons/cw_custom_icons';
import './AddToHomeScreenPrompt.scss';

interface AddToHomeScreenPromptProps {
  isIOS: boolean;
  isAndroid: boolean;
}

const AddToHomeScreenPrompt: React.FC<AddToHomeScreenPromptProps> = ({
  isIOS = false,
  isAndroid = false,
}) => {
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    const hidePromptTime = localStorage.getItem('hidePromptTime');
    if (hidePromptTime && new Date().getTime() < Number(hidePromptTime)) {
      setShowPrompt(false);
    }
  }, []);

  const hidePromptForNDays = () => {
    const maxDays = 30; // Maximum number of days to hide the prompt
    let n = Number(localStorage.getItem('hidePromptDays')) || 1; // Get the current number of days from local storage, default to 1 if not set
    n = n * 2 > maxDays ? maxDays : n * 2; // Double the number of days, but cap at maxDays
    const hideUntil = new Date().getTime() + n * 24 * 60 * 60 * 1000;
    localStorage.setItem('hidePromptTime', hideUntil.toString());
    localStorage.setItem('hidePromptDays', n.toString()); // Store the new number of days in local storage
    setShowPrompt(false);
  };

  const iosPrompt = () => {
    return (
      <div className="home-screen-prompt">
        <div className="prompt-content">
          <div className="header">
            <div className="icon">
              <img src="/static/brand_assets/32x32.png" alt="Commonwealth" />
            </div>
            <p className="title">Add to Home Screen</p>
          </div>
          <p className="description">
            For the best mobile experience we recommend installing the Common
            web-app.
          </p>
          <ol className="instructions">
            <li>
              1. Tap the share <CWShareIcon /> icon below
            </li>
            <li>
              2. Select <span className="highlight">Add to Home Screen</span>
            </li>
          </ol>
          <a className="hide-prompt" /*onClick={() => hidePromptForNDays()}*/>
            Show less often
          </a>
        </div>
      </div>
    );
  };

  const androidPrompt = () => {
    return (
      <div className="android-home-screen-prompt">
        <div className="prompt-content">
          <p className="title">Add to Home Screen</p>
          <div className="header">
            <div className="icon">
              <img src="/static/brand_assets/32x32.png" alt="Commonwealth" />
            </div>
            <div className="app">
              <p className="app-name">Common</p>
              <p className="app-url">common.xyz</p>
            </div>
          </div>
          <p className="description">
            For the best mobile experience we recommend installing the Common
            web-app.
          </p>
          <ol className="instructions">
            <li>
              1. Tap the share <CWShareIcon /> icon below
            </li>
            <li>
              2. Select <span className="highlight">Add to Home Screen</span>
            </li>
          </ol>
          <a className="hide-prompt" /*onClick={() => hidePromptForNDays()}*/>
            Show less often
          </a>
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

export default AddToHomeScreenPrompt;
