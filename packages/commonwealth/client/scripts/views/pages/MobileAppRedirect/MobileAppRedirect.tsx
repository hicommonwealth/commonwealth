import { useEffect } from 'react';

/**
 * Test redirecting to the mobile app and that it loads and switches to
 * this URL
 */
export const MobileAppRedirect = () => {
  useEffect(() => {
    document.location.href = 'common_xyz://test';
  });

  return null;
};
