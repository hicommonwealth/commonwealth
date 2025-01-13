import { useReactNativeWebView } from 'hooks/useReactNativeWebView';
import React from 'react';
import useUserStore from 'state/ui/user';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

/**
 * Create an about section for loading the React native 'about' page.
 */
export const ReactNativeAboutSection = () => {
  const reactNativeWebView = useReactNativeWebView();
  const user = useUserStore();

  function handleClick() {
    if (reactNativeWebView) {
      reactNativeWebView.postMessage(JSON.stringify({ type: 'about' }));
    }
  }

  if (!user.email.endsWith('@common.xyz')) {
    return null;
  }

  if (!reactNativeWebView) {
    return null;
  }

  return (
    <div>
      <CWButton label="About Mobile App" onClick={handleClick} />
    </div>
  );
};
