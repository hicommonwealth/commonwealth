import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
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

      <div className="Copy">
        <CWTextInput
          fullWidth
          type="text"
          value="FIXME"
          readOnly
          onClick={() => {}}
          iconRight={<CWIcon iconName="linkPhosphor" />}
        />
      </div>

      <ShareSection permalink="https://common.xyz/download-mobile-app" />
    </div>
  );
};
