import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { IOS_APP_STORE_LANDING_URL } from 'views/components/DownloadMobileApp/MobileLandingURLs';
import ShareSection from '../ShareSection';
import './DownloadMobileAppContent.scss';

import AppStoreQRCode from './AppStoreQRCode.png';

export const DownloadMobileAppContent = () => {
  return (
    <div className="DownloadMobileAppContent">
      <div className="Background">
        <img src={AppStoreQRCode} />

        <p>
          <i>Scan QR Code on your device to go to the App Store.</i>
        </p>

        <p>Common now has an app in the App Store!</p>

        <p>Android coming soon!</p>
      </div>

      <div className="Copy">
        <CWTooltip
          placement="top"
          content="Link copied to clipboard!"
          renderTrigger={(handleInteraction) => {
            return (
              <CWTextInput
                fullWidth
                type="text"
                value={IOS_APP_STORE_LANDING_URL}
                readOnly
                onClick={(event) => {
                  handleInteraction(event);
                }}
                iconRight={<CWIcon iconName="linkPhosphor" />}
              />
            );
          }}
        />
      </div>

      <ShareSection permalink="https://common.xyz/download-mobile-app" />
    </div>
  );
};
