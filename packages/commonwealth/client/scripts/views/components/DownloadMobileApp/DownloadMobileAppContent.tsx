import React from 'react';
import ShareSection from '../ShareSection';
import './DownloadMobileAppContent.scss';

export const DownloadMobileAppContent = () => {
  return (
    <div className="DownloadMobileAppContent">
      <div className="Background">
        <p>
          <i>Scan QR Code on your device to go to the App Store.</i>
        </p>

        <p>Common now has an app in the App Store!</p>

        <p>Android coming soon!</p>
      </div>

      <ShareSection permalink="https://common.xyz/download-mobile-app" />
    </div>
  );
};
