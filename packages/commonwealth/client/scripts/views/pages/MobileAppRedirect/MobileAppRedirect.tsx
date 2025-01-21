import React, { useEffect } from 'react';

const TARGET_URL = 'commonxyz://' + window.location.host;

/**
 * Test redirecting to the mobile app and that it loads and switches to
 * this URL.
 *
 * This is needed to debug iOS/Android app links because normal typing a URL
 * into the browser bar manually does not trigger native URL navigation
 * behavior.
 */
export const MobileAppRedirect = () => {
  useEffect(() => {
    setTimeout(() => {
      console.log('Redirecting to mobile app: ' + TARGET_URL);
      document.location.href = TARGET_URL;
    }, 5000);
  });

  return <div>Redirecting to mobile app in 5 seconds via {TARGET_URL}</div>;
};
