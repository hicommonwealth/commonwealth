import React, { useEffect, useState } from 'react';
import { AndroidPrompt } from './AndroidPrompt';
import { IOSPrompt } from './IOSPrompt';
import { HIDE_PROMPT, HIDE_PROMPT_DAYS, HIDE_PROMPT_TIME } from './constants';

interface AddToHomeScreenPromptProps {
  isIOS: boolean;
  isAndroid: boolean;
}

export const AddToHomeScreenPrompt = ({
  isIOS,
  isAndroid,
}: AddToHomeScreenPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSplashUnloaded, setIsSplashUnloaded] = useState(false);

  useEffect(() => {
    // Delay the unloading of the Splash component
    setTimeout(() => {
      setIsSplashUnloaded(true);
    }, 1000); // Adjust the delay as needed
  }, []);

  useEffect(() => {
    if (isSplashUnloaded) {
      setShowPrompt(true);
    }
  }, [isSplashUnloaded]);

  useEffect(() => {
    const hidePromptTime = localStorage.getItem(HIDE_PROMPT_TIME);
    if (hidePromptTime && new Date().getTime() < Number(hidePromptTime)) {
      setShowPrompt(false);
    }

    if (sessionStorage.getItem(HIDE_PROMPT)) {
      setShowPrompt(false);
    }
  }, [showPrompt]);

  const hidePromptForNDays = () => {
    const maxDays = 30;

    let n = Number(localStorage.getItem(HIDE_PROMPT_DAYS)) || 1;
    n = n * 2 > maxDays ? maxDays : n * 2;
    const hideUntil = new Date().getTime() + n * 24; //* 60 * 60 * 1000;
    localStorage.setItem(HIDE_PROMPT_TIME, hideUntil.toString());
    localStorage.setItem(HIDE_PROMPT_DAYS, n.toString());

    setShowPrompt(false);
  };

  return showPrompt ? (
    isIOS ? (
      <IOSPrompt
        hidePromptAction={hidePromptForNDays}
        showPrompt={showPrompt}
        setShowPrompt={setShowPrompt}
      />
    ) : isAndroid ? (
      <AndroidPrompt
        hidePromptAction={hidePromptForNDays}
        showPrompt={showPrompt}
        setShowPrompt={setShowPrompt}
      />
    ) : null
  ) : null;
};
