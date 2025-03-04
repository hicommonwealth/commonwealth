import { useReactNativeWebView } from 'hooks/useReactNativeWebView';
import React, { useCallback } from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

/**
 * Create an about section for loading the React native 'about' page.
 */
export const ReactNativeAboutSection = () => {
  const reactNativeWebView = useReactNativeWebView();

  const handleClick = useCallback(() => {
    if (reactNativeWebView) {
      reactNativeWebView.postMessage(JSON.stringify({ type: 'about' }));
    }
  }, [reactNativeWebView]);

  const logoutAndClearSession = useCallback(async () => {
    function clearCookies() {
      document.cookie.split(';').forEach(function (c) {
        document.cookie =
          c.trim().split('=')[0] +
          '=;expires=' +
          new Date(0).toUTCString() +
          ';path=/';
      });
    }

    function clearLocalStorage() {
      localStorage.clear();
    }

    async function clearIndexedDB() {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (!db.name) {
          throw new Error('No database name');
        }
        indexedDB.deleteDatabase(db.name);
      }
    }

    clearCookies();
    clearLocalStorage();
    await clearIndexedDB();

    document.location.href = '/logout';
  }, []);

  if (!reactNativeWebView) {
    return null;
  }

  return (
    <div>
      <CWButton label="About Mobile App" onClick={handleClick} />

      <CWButton
        label="Logout and Clear Session"
        onClick={logoutAndClearSession}
      />
    </div>
  );
};
